'use client';

import { useSetupStore } from '@/stores/setup';
import { Plus, Trash2, Building2, Loader2 } from 'lucide-react';
import type { Sector } from '@/types';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export function StepSectors() {
    const { data, updateData } = useSetupStore();
    const [sectors, setSectors] = useState<Partial<Sector>[]>(data.sectors || []);
    const [channels, setChannels] = useState<{ id: string, phone_number: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (profile?.organization_id) {
                // Fetch Channels
                const { data: chans } = await supabase
                    .from('whatsapp_instances')
                    .select('id, phone_number')
                    .eq('organization_id', profile.organization_id)
                    .eq('status', 'connected');

                if (chans) setChannels(chans);

                // Fetch real Sectors
                const { data: dbSectors } = await supabase
                    .from('sectors')
                    .select('*')
                    .eq('organization_id', profile.organization_id)
                    .eq('is_fallback', false)
                    .order('priority', { ascending: true });

                if (dbSectors && dbSectors.length > 0) {
                    // Map existing data from store if present (like destination)
                    const merged = dbSectors.map(db => {
                        const saved = data.sectors?.find(s => s.id === db.id);
                        return { ...db, destination: saved?.destination || db.destination || '' };
                    });
                    setSectors(merged);
                    updateData({ sectors: merged });
                }
            }
            setIsLoading(false);
        }
        fetchData();
    }, []);

    const updateSectors = (updated: Partial<Sector>[]) => {
        setSectors(updated);
        updateData({ sectors: updated });
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
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p className="text-sm">Buscando seus setores...</p>
                    </div>
                ) : sectors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-900/50 border border-dashed border-slate-700 rounded-xl px-6">
                        <p className="text-sm text-slate-400 mb-2">Nenhum setor encontrado para sua empresa.</p>
                        <p className="text-xs text-slate-500">Crie seus setores primeiro na tela de Setores para configurá-los aqui.</p>
                    </div>
                ) : (
                    sectors.map((sector, index) => (
                        <div
                            key={sector.id || index}
                            className={cn(
                                'bg-slate-900 border rounded-xl p-4 transition-all',
                                sector.is_active ? 'border-slate-800' : 'border-slate-800/50 opacity-50'
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-700">
                                    {sector.icon || '📂'}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">Setor: {sector.name}</h3>
                                        {sector.is_active ? (
                                            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 uppercase">Ativo</span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-800 text-slate-500 rounded-full border border-slate-700 uppercase">Inativo</span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Canal de Destino</label>
                                        <select
                                            value={sector.destination || ''}
                                            onChange={(e) => updateField(index, 'destination', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Selecione um canal para este setor</option>
                                            {channels.map((chan) => (
                                                <option key={chan.id} value={chan.id}>
                                                    WhatsApp: {chan.phone_number}
                                                </option>
                                            ))}
                                            {channels.length === 0 && (
                                                <option value="" disabled>Nenhum canal conectado</option>
                                            )}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {sectors.length > 0 && (
                <p className="text-center text-xs text-slate-600">
                    {activeSectors.length} setor{activeSectors.length !== 1 ? 'es' : ''} ativo{activeSectors.length !== 1 ? 's' : ''} mapeado{activeSectors.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
}
