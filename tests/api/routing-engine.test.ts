import { describe, it, expect } from 'vitest';
import { routeMessage } from '@/lib/routing/engine';
import type { Rule } from '@/types';

// ─── Helpers ────────────────────────────────────────────────

function makeRule(overrides: Partial<Rule> = {}): Rule {
    return {
        id: 'rule-1',
        organization_id: 'org-1',
        sector_id: 'sector-financeiro',
        type: 'keyword',
        name: 'Financeiro',
        keywords: ['boleto', 'pagamento', 'fatura'],
        response_template: 'Encaminhando para Financeiro.',
        is_active: true,
        priority: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

const FALLBACK_SECTOR_ID = 'sector-fallback';
const FALLBACK_MESSAGE = 'Nenhuma regra acionada. Encaminhando para triagem.';

// ─── Tests ──────────────────────────────────────────────────

describe('Routing Engine – routeMessage()', () => {
    // ── 1. Match exato ──────────────────────────────────────
    it('deve fazer match quando a mensagem contém keyword exata', () => {
        const rules = [makeRule()];
        const result = routeMessage('Preciso do boleto', rules, FALLBACK_SECTOR_ID, FALLBACK_MESSAGE);

        expect(result.matched).toBe(true);
        expect(result.sectorId).toBe('sector-financeiro');
        expect(result.method).toBe('auto');
        expect(result.responseTemplate).toBe('Encaminhando para Financeiro.');
    });

    // ── 2. Case-insensitive ─────────────────────────────────
    it('deve ignorar diferença de case (case-insensitive)', () => {
        const rules = [makeRule()];
        const result = routeMessage('QUERO O BOLETO AGORA', rules, FALLBACK_SECTOR_ID, FALLBACK_MESSAGE);

        expect(result.matched).toBe(true);
        expect(result.sectorId).toBe('sector-financeiro');
    });

    // ── 3. Prioridade ───────────────────────────────────────
    it('deve retornar a regra com menor priority quando múltiplas batem', () => {
        const rules = [
            makeRule({
                id: 'rule-ouvidoria',
                sector_id: 'sector-ouvidoria',
                keywords: ['problema'],
                priority: 5,
                name: 'Ouvidoria',
            }),
            makeRule({
                id: 'rule-suporte',
                sector_id: 'sector-suporte',
                keywords: ['problema'],
                priority: 1,
                name: 'Suporte',
            }),
        ];

        const result = routeMessage('Tenho um problema', rules, FALLBACK_SECTOR_ID, FALLBACK_MESSAGE);

        expect(result.matched).toBe(true);
        expect(result.sectorId).toBe('sector-suporte'); // priority 1 vence
        expect(result.ruleId).toBe('rule-suporte');
    });

    // ── 4. Fallback ─────────────────────────────────────────
    it('deve retornar fallback quando nenhuma keyword bate', () => {
        const rules = [makeRule()];
        const result = routeMessage('Boa tarde, tudo bem?', rules, FALLBACK_SECTOR_ID, FALLBACK_MESSAGE);

        expect(result.matched).toBe(false);
        expect(result.sectorId).toBe(FALLBACK_SECTOR_ID);
        expect(result.method).toBe('fallback');
        expect(result.responseTemplate).toBe(FALLBACK_MESSAGE);
        expect(result.ruleId).toBeNull();
    });

    // ── 5. Regras inativas ──────────────────────────────────
    it('deve ignorar regras com is_active=false', () => {
        const rules = [makeRule({ is_active: false })];
        const result = routeMessage('Preciso do boleto', rules, FALLBACK_SECTOR_ID, FALLBACK_MESSAGE);

        expect(result.matched).toBe(false);
        expect(result.method).toBe('fallback');
    });

    // ── 6. Lista vazia ──────────────────────────────────────
    it('deve retornar fallback quando não há regras', () => {
        const result = routeMessage('Olá', [], FALLBACK_SECTOR_ID, FALLBACK_MESSAGE);

        expect(result.matched).toBe(false);
        expect(result.sectorId).toBe(FALLBACK_SECTOR_ID);
        expect(result.method).toBe('fallback');
    });

    // ── 7. Keyword como substring ───────────────────────────
    it('deve fazer match quando keyword aparece como substring na mensagem', () => {
        const rules = [
            makeRule({
                keywords: ['pagar'],
                sector_id: 'sector-financeiro',
            }),
        ];

        const result = routeMessage('quero pagar a conta do mês', rules, FALLBACK_SECTOR_ID, FALLBACK_MESSAGE);

        expect(result.matched).toBe(true);
        expect(result.sectorId).toBe('sector-financeiro');
    });
});
