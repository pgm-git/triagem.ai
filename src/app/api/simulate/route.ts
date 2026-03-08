import { NextResponse } from 'next/server';
import { routeMessage } from '@/lib/routing/engine';
import type { Rule } from '@/types';

/**
 * POST /api/simulate
 * Test routing without sending an actual WhatsApp message.
 * Body: { message: string, rules?: Rule[], fallbackSectorId?: string, fallbackMessage?: string }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Campo "message" é obrigatório' }, { status: 400 });
        }

        // Use provided rules or default demo rules
        const rules: Rule[] = body.rules || [
            {
                id: 'rule-financeiro',
                organization_id: 'demo',
                sector_id: 'sector-financeiro',
                type: 'keyword',
                name: 'Financeiro',
                keywords: ['boleto', 'pagamento', 'pagar', 'fatura', 'cobrança'],
                response_template: 'Vou encaminhar você para o setor Financeiro. Aguarde um momento.',
                is_active: true,
                priority: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'rule-comercial',
                organization_id: 'demo',
                sector_id: 'sector-comercial',
                type: 'keyword',
                name: 'Comercial',
                keywords: ['preço', 'orçamento', 'cotação', 'proposta', 'comprar', 'contratar'],
                response_template: 'Encaminhando para o setor Comercial. Em breve um consultor irá atendê-lo.',
                is_active: true,
                priority: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'rule-suporte',
                organization_id: 'demo',
                sector_id: 'sector-suporte',
                type: 'keyword',
                name: 'Suporte Técnico',
                keywords: ['erro', 'bug', 'não funciona', 'ajuda', 'suporte', 'problema técnico'],
                response_template: 'Encaminhando para o Suporte Técnico. Aguarde um momento.',
                is_active: true,
                priority: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'rule-ouvidoria',
                organization_id: 'demo',
                sector_id: 'sector-ouvidoria',
                type: 'keyword',
                name: 'Ouvidoria',
                keywords: ['reclamação', 'reclamar', 'insatisfeito', 'cancelar', 'cancelamento', 'denúncia'],
                response_template: 'Sua mensagem será encaminhada para a Ouvidoria. Obrigado pelo contato.',
                is_active: true,
                priority: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        ];

        const fallbackSectorId = body.fallbackSectorId || 'sector-triagem';
        const fallbackMessage = body.fallbackMessage || 'Não identifiquei sua intenção. Vou encaminhar para um atendente humano.';

        const result = routeMessage(message, rules, fallbackSectorId, fallbackMessage);

        // Enrich result with sector name for display
        const sectorNames: Record<string, { name: string; icon: string }> = {
            'sector-financeiro': { name: 'Financeiro', icon: '💰' },
            'sector-comercial': { name: 'Comercial', icon: '🤝' },
            'sector-suporte': { name: 'Suporte Técnico', icon: '🛠️' },
            'sector-ouvidoria': { name: 'Ouvidoria', icon: '📢' },
            'sector-triagem': { name: 'Triagem (Fallback)', icon: '🔄' },
        };

        const matchedRule = rules.find((r) => r.id === result.ruleId);

        return NextResponse.json({
            input: message,
            result: {
                ...result,
                sectorName: sectorNames[result.sectorId || '']?.name || result.sectorId,
                sectorIcon: sectorNames[result.sectorId || '']?.icon || '❓',
                matchedKeyword: matchedRule
                    ? matchedRule.keywords.find((kw) => message.toLowerCase().includes(kw.toLowerCase()))
                    : null,
                ruleName: matchedRule?.name || null,
            },
            availableRules: rules.map((r) => ({
                id: r.id,
                name: r.name,
                keywords: r.keywords,
                priority: r.priority,
                is_active: r.is_active,
            })),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Simulate] Error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
