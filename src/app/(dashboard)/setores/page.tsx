'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectorCard } from '@/components/sectors/sector-card';
import { SectorDrawer } from '@/components/sectors/sector-drawer';
import { Building2, Plus, Search, Loader2 } from 'lucide-react';
import type { Sector } from '@/types';

export default function SetoresPage() {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingSector, setEditingSector] = useState<Sector | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const loadSectors = useCallback(async () => {
        try {
            const res = await fetch('/api/sectors');
            if (res.ok) {
                const data = await res.json();
                setSectors(data.map((s: Record<string, unknown>) => ({
                    ...s,
                    triggers: s.keywords
                        ? [{ keywords: s.keywords as string[], response_template: (s.response_template || '') as string, type: 'keyword' as const, is_active: true }]
                        : [],
                    collection_fields: s.collection_fields || [],
                })));
            }
        } catch (err) {
            console.error('Failed to load sectors:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSectors(); }, [loadSectors]);

    const filtered = sectors.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (sector: Sector) => { setEditingSector(sector); setDrawerOpen(true); };

    const handleToggle = async (id: string, isActive: boolean) => {
        setSectors((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)));
        await fetch('/api/sectors', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: isActive }),
        });
    };

    const handleDelete = async (id: string) => {
        setSectors((prev) => prev.filter((s) => s.id !== id));
        await fetch(`/api/sectors?id=${id}`, { method: 'DELETE' });
    };

    const handleSave = async (data: Partial<Sector>) => {
        const body = {
            ...(editingSector ? { id: editingSector.id } : {}),
            name: data.name,
            icon: data.icon,
            destination: data.destination,
            is_active: data.is_active,
            is_fallback: data.is_fallback,
            fallback_message: data.fallback_message,
            priority: data.priority,
            schedule_start: data.schedule_start,
            schedule_end: data.schedule_end,
            keywords: data.triggers?.[0]?.keywords || [],
            response_template: data.triggers?.[0]?.response_template || '',
            collection_fields: data.collection_fields || [],
        };

        const res = await fetch('/api/sectors', {
            method: editingSector ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            await loadSectors();
        }

        setDrawerOpen(false);
        setEditingSector(null);
    };

    const totalTriggers = sectors.reduce((acc, s) => acc + (s.triggers?.[0]?.keywords?.length || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Setores</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {sectors.filter((s) => s.is_active).length} ativo{sectors.filter((s) => s.is_active).length !== 1 ? 's' : ''} · {totalTriggers} gatilho{totalTriggers !== 1 ? 's' : ''} configurado{totalTriggers !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => { setEditingSector(null); setDrawerOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Novo Setor
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar setores..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((sector) => (
                        <SectorCard key={sector.id} sector={sector} onEdit={handleEdit} onToggle={handleToggle} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                        <Building2 className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-300">{search ? 'Nenhum setor encontrado' : 'Nenhum setor criado'}</h3>
                    <p className="text-sm text-slate-500 mt-1">{search ? 'Tente outra busca.' : 'Crie setores para organizar os destinos.'}</p>
                </div>
            )}

            <SectorDrawer open={drawerOpen} sector={editingSector} onClose={() => { setDrawerOpen(false); setEditingSector(null); }} onSave={handleSave} />
        </div>
    );
}
