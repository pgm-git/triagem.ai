'use client';

import { useSetupStore } from '@/stores/setup';
import { Plus, Trash2, Building2 } from 'lucide-react';
import type { Sector } from '@/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
                <p className="text-sm text-slate-400">Defina os destinos para onde as conversas serão encaminhadas</p>
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
                        <div className="flex items-start gap-3">
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
                                <input
                                    type="text"
                                    value={sector.destination || ''}
                                    onChange={(e) => updateField(index, 'destination', e.target.value)}
                                    placeholder="Destino (WhatsApp, email, etc.)"
                                    className="w-full px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                />
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
