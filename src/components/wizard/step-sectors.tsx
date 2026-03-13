'use client';

import { useSetupStore } from '@/stores/setup';
import { Plus, Trash2, Building2, Loader2 } from 'lucide-react';
import type { Sector } from '@/types';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const defaultSectors: Partial<Sector>[] = [
    { name: 'Financeiro', destination: '', icon: '💰', is_active: true, priority: 0 },
    { name: 'Comercial', destination: '', icon: '🤝', is_active: true, priority: 1 },
    { name: 'Suporte', destination: '', icon: '🛠️', is_active: true, priority: 2 },
    { name: 'Ouvidoria', destination: '', icon: '📢', is_active: true, priority: 3 },
];

export function StepSectors() {
    const { data, updateData } = useSetupStore();
    const [sectors, setSectors] = useState<Partial<Sector>[]>(
        data.sectors?.length ? data.sectors : defaultSectors
    );
    const [channels, setChannels] = useState<{ id: string, phone_number: string }[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(true);

    useEffect(() => {
        async function fetchChannels() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (profile?.organization_id) {
                const { data: chans } = await supabase
                    .from('channels')
                    .select('id, phone_number')
                    .eq('organization_id', profile.organization_id)
                    .eq('status', 'connected');

                if (chans) setChannels(chans);
            }
            setLoadingChannels(false);
        }
        fetchChannels();
    }, []);

    const updateSectors = (updated: Partial<Sector>[]) => {
        setSectors(updated);
        updateData({ sectors: updated });
    };

    const addSector = () => {
        updateSectors([...sectors, { name: '', destination: '', icon: '📂', is_active: true, priority: sectors.length }]);
    };

    const removeSector = (index: number) => {
        if (sectors.length <= 1) return;
        updateSectors(sectors.filter((_, i) => i !== index));
    };

    const updateField = (index: number, field: string, value: string | boolean) => {
        const updated = sectors.map((s, i) => (i === index ? { ...s, [field]: value } : s));
        updateSectors(updated);
    };

    const activeSectors = sectors.filter((s) => s.is_active);

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white">Configure seus setores</h2>
                <p className="text-sm text-slate-400">Escolha para qual canal conectado as conversas de cada setor serão enviadas</p>
            </div>

            <div className="space-y-3">
                {sectors.map((sector, index) => (
                    <div
                        key={index}
                        className={cn(
                            'bg-slate-900 border rounded-xl p-4 transition-all',
                            sector.is_active ? 'border-slate-800' : 'border-slate-800/50 opacity-50'
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">
                                {sector.icon || '📂'}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={sector.name}
                                        onChange={(e) => updateField(index, 'name', e.target.value)}
                                        placeholder="Nome do setor"
                                        className="flex-1 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    />
                                    <button
                                        onClick={() => updateField(index, 'is_active', !sector.is_active)}
                                        className={cn(
                                            'px-2 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer',
                                            sector.is_active
                                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                        )}
                                    >
                                        {sector.is_active ? 'Ativo' : 'Inativo'}
                                    </button>
                                    {sectors.length > 1 && (
                                        <button
                                            onClick={() => removeSector(index)}
                                            className="p-1.5 text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="relative">
                                    {loadingChannels ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Carregando canais...
                                        </div>
                                    ) : (
                                        <select
                                            value={sector.destination || ''}
                                            onChange={(e) => updateField(index, 'destination', e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        >
                                            <option value="" disabled>Selecione um canal de destino</option>
                                            {channels.map((chan) => (
                                                <option key={chan.id} value={chan.id}>
                                                    WhatsApp: {chan.phone_number}
                                                </option>
                                            ))}
                                            {channels.length === 0 && (
                                                <option value="" disabled>Nenhum canal conectado</option>
                                            )}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={addSector}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-slate-700 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all cursor-pointer"
            >
                <Plus className="w-4 h-4" />
                Adicionar setor
            </button>

            <p className="text-center text-xs text-slate-600">
                {activeSectors.length} setor{activeSectors.length !== 1 ? 'es' : ''} ativo{activeSectors.length !== 1 ? 's' : ''}
                {activeSectors.length < 1 && ' — ative pelo menos 1 para continuar'}
            </p>
        </div>
    );
}
