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
    action: 'route' | 'ask';
    sector_id?: string;
    response: string;
    reasoning: string;
}

export async function processMessageWithAI(
    messageText: string,
    organizationId: string,
    sectors: Sector[],
    supabase: SupabaseClient
): Promise<AIRouteResult | null> {
    try {
        // 1. Fetch AI configurations from Supabase
        const [{ data: settings }, { data: personas }] = await Promise.all([
            supabase.from('organization_settings').select('*').eq('organization_id', organizationId).single(),
            supabase.from('ai_personas').select('*').eq('organization_id', organizationId).eq('is_active', true)
        ]);

        const aiSettings = settings as OrganizationSettings | null;
        const activePersona = personas?.[0] as AIPersona | undefined;

        // If no API key is provided in env, fallback gracefully
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY not found in environment');
            return null;
        }

        // 2. Build the Persona Instructions
        const personaContext = activePersona
            ? `Você é: ${activePersona.name}.\n${activePersona.description || ''}\n${activePersona.prompt_instructions || ''}`
            : 'Você é um assistente virtual útil e educado. Tente identificar o que o usuário deseja e encaminhar para o departamento correto.';

        const baseContext = aiSettings?.custom_prompt_base
            ? `Diretrizes da Empresa:\n${aiSettings.custom_prompt_base}`
            : '';

        // 3. Build the Sectors List for the LLM
        const sectorsContext = sectors.map(s => `- ID: ${s.id} | Nome: ${s.name} | Descrição/Keywords: ${s.keywords?.join(', ')}`).join('\n');

        // 4. Call Vercel AI SDK with Structured Output
        // Tries to classify the intention and either ROUTE it to a sector, or ASK the user for more clarification.
        const result = await generateObject({
            model: openai(aiSettings?.ai_model || 'gpt-4o-mini'),
            temperature: aiSettings?.ai_temperature ?? 0.7,
            schema: z.object({
                action: z.enum(['route', 'ask']).describe('Se a intenção for clara, escolha "route". Se precisar de mais informações, escolha "ask".'),
                sector_id: z.string().optional().describe('Se a action for "route", retorne o ID exato do setor correspondente. Se for "ask", omitir.'),
                response: z.string().describe('A mensagem que será enviada de volta para o cliente, respondendo com a Persona definida.'),
                reasoning: z.string().describe('Breve raciocínio interno sobre o porquê dessa decisão (para logs)')
            }),
            system: `
Você é a inteligência artificial de roteamento e triagem de atendimento via WhatsApp.
Sua missão final é decidir qual setor da empresa deve atender o cliente ou se você mesmo pode responder para coletar mais dados.

${personaContext}

${baseContext}

SETORES DISPONÍVEIS NA EMPRESA:
${sectorsContext}

COMO RESPONDER:
- Se a mensagem do cliente deixa clara a intenção e encaixa em um dos setores, escolha a action "route" e retorne o "sector_id" exato. Em "response", mande uma mensagem de despedida informando que vai transferir. Exemplo: "Certo! Vou transferir para o Financeiro."
- Se a mensagem for vazia, um simples "Oi", ou for ambígua, escolha a action "ask". Em "response", pergunte como pode ajudar para que possamos classificar depois. Exemplo: "Olá! Como posso ajudar você hoje?"
- Sempre responda respeitando estritamente o tom de voz da Persona e da Empresa. Evite formatações complexas que quebram no WhatsApp.
            `,
            prompt: `Mensagem do Cliente recebida no WhatsApp:\n"${messageText}"`
        });

        return result.object;

    } catch (error) {
        console.error('Error in processMessageWithAI:', error);
        return null;
    }
}
