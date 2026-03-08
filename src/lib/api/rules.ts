import type { Rule } from '@/types';

const API_URL = '/api/rules';

export async function getRules(): Promise<{ data: Rule[]; error: string | null }> {
    const res = await fetch(API_URL);
    if (!res.ok) return { data: [], error: 'Erro ao buscar regras' };
    return res.json();
}

export async function createRule(
    rule: Partial<Rule>
): Promise<{ data: Rule | null; error: string | null }> {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
    });
    if (!res.ok) return { data: null, error: 'Erro ao criar regra' };
    return res.json();
}

export async function updateRule(
    id: string,
    updates: Partial<Rule>
): Promise<{ data: Rule | null; error: string | null }> {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) return { data: null, error: 'Erro ao atualizar regra' };
    return res.json();
}

export async function deleteRule(
    id: string
): Promise<{ error: string | null }> {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) return { error: 'Erro ao remover regra' };
    return { error: null };
}
