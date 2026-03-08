import type { Sector } from '@/types';

const API_URL = '/api/sectors';

export async function getSectors(): Promise<{ data: Sector[]; error: string | null }> {
    const res = await fetch(API_URL);
    if (!res.ok) return { data: [], error: 'Erro ao buscar setores' };
    return res.json();
}

export async function createSector(
    sector: Partial<Sector>
): Promise<{ data: Sector | null; error: string | null }> {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sector),
    });
    if (!res.ok) return { data: null, error: 'Erro ao criar setor' };
    return res.json();
}

export async function updateSector(
    id: string,
    updates: Partial<Sector>
): Promise<{ data: Sector | null; error: string | null }> {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) return { data: null, error: 'Erro ao atualizar setor' };
    return res.json();
}

export async function deleteSector(
    id: string
): Promise<{ error: string | null }> {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) return { error: 'Erro ao remover setor' };
    return { error: null };
}
