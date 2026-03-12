import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import { Sector, OrganizationSettings, AIPersona } from '@/types';

// =========================================================================
// AI Router Engine
// Decides the next action for an incoming message using LLM
// =========================================================================

export interface AIRouteResult {
    action: 'route' | 'ask' | 'collect';
    sector_id?: string;
    response: string;
    reasoning: string;
    extracted_data?: Record<string, any>;
}

export async function processMessageWithAI(
    messageText: string,
    organizationId: string,
    sectors: Sector[],
    supabase: SupabaseClient,
    currentSectorId?: string | null,
    currentCollectedData?: Record<string, any>
): Promise<AIRouteResult | null> {
    try {
        // 1. Fetch AI configurations from Supabase
        const [{ data: settings }, { data: personas }] = await Promise.all([
            supabase.from('organization_settings').select('*').eq('organization_id', organizationId).single(),
            supabase.from('ai_personas').select('*').eq('organization_id', organizationId).eq('is_active', true)
        ]);

        const aiSettings = settings as OrganizationSettings | null;
        const activePersona = personas?.[0] as AIPersona | undefined;

        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY not found in environment');
            return null;
        }

        // 2. Localize targeted sector if already set (Collection mode)
        const targetSector = currentSectorId ? sectors.find(s => s.id === currentSectorId) : null;
        const collectionSchema = targetSector?.collection_fields || [];
        const hasFieldsToCollect = collectionSchema.length > 0;

        // 3. Build Persona & Base Context
        const personaContext = activePersona
            ? `Você é: ${activePersona.name}.\n${activePersona.description || ''}\n${activePersona.prompt_instructions || ''}`
            : 'Você é um assistente virtual útil e educado. Tente identificar o que o usuário deseja e encaminhar para o departamento correto.';

        const baseContext = aiSettings?.custom_prompt_base
            ? `Diretrizes da Empresa:\n${aiSettings.custom_prompt_base}`
            : '';

        // 4. Build Sectors List
        const sectorsContext = sectors.map(s => {
            const fieldsInfo = s.collection_fields?.length
                ? ` (Campos obrigatórios: ${s.collection_fields.map(f => f.variable).join(', ')})`
                : '';
            return `- ID: ${s.id} | Nome: ${s.name} | Descrição/Keywords: ${s.keywords?.join(', ')}${fieldsInfo}`;
        }).join('\n');

        // 5. Build State Context (if collecting)
        const collectionContext = hasFieldsToCollect
            ? `
VOCÊ ESTÁ EM MODO DE COLETA DE DADOS para o setor "${targetSector?.name}".
Dados já coletados até agora: ${JSON.stringify(currentCollectedData || {})}
Campos que você DEVE coletar:
${collectionSchema.map(f => `- ${f.variable}: ${f.label} (${f.context}) ${f.required ? '[OBRIGATÓRIO]' : ''}`).join('\n')}

IMPORTANTE:
- Se o cliente fornecer um dado novo nesta mensagem, extraia-o no objeto "extracted_data".
- Verifique se após esta extração, TODOS os campos [OBRIGATÓRIO] estão preenchidos.
- Se faltar algo, escolha action: "collect" e peça educadamente o dado faltante.
- Se tudo estiver preenchido, escolha action: "route" e dê as boas-vindas ao setor.
            `
            : '';

        // 6. Call Vercel AI SDK
        const result = await generateObject({
            model: openai(aiSettings?.ai_model || 'gpt-4o-mini'),
            temperature: aiSettings?.ai_temperature ?? 0.7,
            schema: z.object({
                action: z.enum(['route', 'ask', 'collect']).describe('route: encaminhar; ask: tirar dúvida/triagem; collect: pedir dado específico.'),
                sector_id: z.string().optional().describe('O ID do setor para onde rotear.'),
                response: z.string().describe('A mensagem de voz da Persona para o cliente.'),
                reasoning: z.string().describe('Explicação interna.'),
                extracted_data: z.record(z.string(), z.any()).optional().describe('Dados extraídos da mensagem (campos da collection).')
            }),
            system: `
Você é a inteligência artificial de roteamento e triagem do TriaGO.
Sua missão é classificar o cliente ou coletar dados necessários antes de passar para um humano.

${personaContext}

${baseContext}

SETORES DISPONÍVEIS:
${sectorsContext}

${collectionContext}

DIRETRIZES GERAIS:
- "route": Use apenas quando a intenção for clara E (se houver campos obrigatórios) todos estiverem coletados.
- "collect": Use se você já sabe o setor, mas faltam dados obrigatórios para preencher.
- "ask": Use para triagem inicial quando não sabe o setor.
- Sempre retorne os dados extraídos no campo "extracted_data" se encontrar algo que se encaixe nas variáveis do setor.
            `,
            prompt: `Mensagem Atual do Cliente:\n"${messageText}"`
        });

        return result.object;

    } catch (error) {
        console.error('Error in processMessageWithAI:', error);
        return null;
    }
}
