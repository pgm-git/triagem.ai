'use client';

import { useState } from 'react';
import { SectorCard } from '@/components/sectors/sector-card';
import { SectorDrawer } from '@/components/sectors/sector-drawer';
import { Building2, Plus, Search } from 'lucide-react';
import type { Sector } from '@/types';

const mockSectors: Sector[] = [
    {
        id: '1', organization_id: 'org-1', name: 'Financeiro', icon: '💰',
        destination: '+55 11 99999-0001', is_active: true, is_fallback: false, priority: 0,
        triggers: [{ keywords: ['boleto', 'pagamento', 'pagar', 'fatura', 'cobrança'], response_template: 'Vou encaminhar você para o setor Financeiro. Aguarde um momento.', type: 'keyword', is_active: true }],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
        id: '2', organization_id: 'org-1', name: 'Comercial', icon: '🤝',
        destination: '+55 11 99999-0002', is_active: true, is_fallback: false, priority: 1,
        triggers: [{ keywords: ['preço', 'orçamento', 'cotação', 'proposta', 'comprar'], response_template: 'Encaminhando para o Comercial. Em breve um consultor irá atendê-lo.', type: 'keyword', is_active: true }],
        collection_fields: [
            { id: 'cf-1', variable: 'placa', label: 'Placa do veículo', context: 'Placa no formato ABC-1234 ou ABC1D23', required: true },
            { id: 'cf-2', variable: 'cep', label: 'CEP', context: 'CEP com 8 dígitos, formato 00000-000', required: true },
            { id: 'cf-3', variable: 'modelo', label: 'Modelo do veículo', context: 'Nome, ano e modelo do veículo. Ex: Fiat Uno 2020', required: false },
        ],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
        id: '3', organization_id: 'org-1', name: 'Suporte', icon: '🛠️',
        destination: '+55 11 99999-0003', is_active: true, is_fallback: false, priority: 2,
        triggers: [{ keywords: ['erro', 'bug', 'não funciona', 'ajuda', 'suporte', 'problema'], response_template: 'Encaminhando para o Suporte Técnico. Aguarde!', type: 'keyword', is_active: true }],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
        id: '4', organization_id: 'org-1', name: 'Ouvidoria', icon: '📢',
        destination: '+55 11 99999-0004', is_active: true, is_fallback: true,
        fallback_message: 'Vou te encaminhar para um atendente. Aguarde um momento.', priority: 3,
        triggers: [{ keywords: ['reclamação', 'reclamar', 'insatisfeito', 'denúncia', 'cancelar'], response_template: 'Sua mensagem será encaminhada para a Ouvidoria.', type: 'intention', is_active: true }],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
];

export default function SetoresPage() {
    const [sectors, setSectors] = useState<Sector[]>(mockSectors);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingSector, setEditingSector] = useState<Sector | null>(null);
    const [search, setSearch] = useState('');

    const filtered = sectors.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (sector: Sector) => { setEditingSector(sector); setDrawerOpen(true); };

    const handleToggle = (id: string, isActive: boolean) => {
        setSectors((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)));
    };

    const handleDelete = (id: string) => { setSectors((prev) => prev.filter((s) => s.id !== id)); };

    const handleSave = (data: Partial<Sector>) => {
        if (editingSector) {
            setSectors((prev) => prev.map((s) => (s.id === editingSector.id ? { ...s, ...data } : s)));
        } else {
            const newSector: Sector = {
                id: crypto.randomUUID(), organization_id: 'org-1',
                name: data.name || 'Novo Setor', icon: data.icon, destination: data.destination || '',
                is_active: data.is_active ?? true, is_fallback: data.is_fallback ?? false,
                fallback_message: data.fallback_message, priority: data.priority ?? sectors.length,
                schedule_start: data.schedule_start, schedule_end: data.schedule_end,
                triggers: data.triggers,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            };
            setSectors((prev) => [...prev, newSector]);
        }
        setDrawerOpen(false); setEditingSector(null);
    };

    const totalTriggers = sectors.reduce((acc, s) => acc + (s.triggers?.[0]?.keywords?.length || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Setores</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {sectors.filter((s) => s.is_active).length} ativo{sectors.filter((s) => s.is_active).length !== 1 ? 's' : ''} · {totalTriggers} gatilho{totalTriggers !== 1 ? 's' : ''} configurado{totalTriggers !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => { setEditingSector(null); setDrawerOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Novo Setor
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar setores..."
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
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
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                        <Building2 className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-300">{search ? 'Nenhum setor encontrado' : 'Nenhum setor criado'}</h3>
                    <p className="text-sm text-zinc-500 mt-1">{search ? 'Tente outra busca.' : 'Crie setores para organizar os destinos.'}</p>
                </div>
            )}

            <SectorDrawer open={drawerOpen} sector={editingSector} onClose={() => { setDrawerOpen(false); setEditingSector(null); }} onSave={handleSave} />
        </div>
    );
}
