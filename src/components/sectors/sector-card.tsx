'use client';

import { cn } from '@/lib/utils';
import type { Sector } from '@/types';
import { Building2, Clock, MoreVertical, Pencil, Tag, Trash2, ArrowRight, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { useState } from 'react';

interface SectorCardProps {
    sector: Sector;
    onEdit: (sector: Sector) => void;
    onToggle: (id: string, isActive: boolean) => void;
    onDelete: (id: string) => void;
}

const colorByIndex: Record<number, { dot: string; border: string; bg: string; text: string }> = {
    0: { dot: 'bg-blue-500', border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-400' },
    1: { dot: 'bg-emerald-500', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400' },
    2: { dot: 'bg-amber-500', border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-400' },
    3: { dot: 'bg-red-500', border: 'border-red-500/20', bg: 'bg-red-500/5', text: 'text-red-400' },
};

export function SectorCard({ sector, onEdit, onToggle, onDelete }: SectorCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const trigger = sector.triggers?.[0];
    const keywords = trigger?.keywords || [];
    const response = trigger?.response_template || '';
    const colors = colorByIndex[sector.priority % 4] || colorByIndex[0];

    return (
        <div
            className={cn(
                'bg-slate-900 border rounded-xl transition-all hover:scale-[1.005]',
                sector.is_active ? colors.border : 'border-slate-800 opacity-60'
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                        {sector.icon || <Building2 className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{sector.name}</h3>
                        <p className="text-[11px] text-slate-500 truncate">{sector.destination}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button
                        onClick={() => onToggle(sector.id, !sector.is_active)}
                        className={cn(
                            'w-10 h-6 rounded-full flex items-center px-0.5 transition-all cursor-pointer',
                            sector.is_active ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
                        )}
                    >
                        <div className="w-5 h-5 bg-white rounded-full shadow transition-all" />
                    </button>
                    {/* Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-20 min-w-[140px] py-1">
                                    <button onClick={() => { onEdit(sector); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 cursor-pointer">
                                        <Pencil className="w-3.5 h-3.5" /> Editar
                                    </button>
                                    <button onClick={() => { onDelete(sector.id); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-800 cursor-pointer">
                                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Keywords inline */}
            {keywords.length > 0 && (
                <div className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                        {(expanded ? keywords : keywords.slice(0, 4)).map((kw) => (
                            <span key={kw} className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded-md">
                                {kw}
                            </span>
                        ))}
                        {!expanded && keywords.length > 4 && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-500 rounded-md">
                                +{keywords.length - 4}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Response inline */}
            {response && (
                <div className="px-4 pb-3">
                    <div className="flex items-start gap-1.5">
                        <ArrowRight className={cn('w-3 h-3 mt-0.5 shrink-0', colors.text)} />
                        <p className="text-[11px] text-slate-500 italic truncate">"{response}"</p>
                    </div>
                </div>
            )}

            {/* Footer badges */}
            <div className="flex items-center gap-1.5 flex-wrap px-4 pb-4">
                {sector.is_fallback && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                        Fallback
                    </span>
                )}
                {keywords.length > 0 && (
                    <span className={cn('flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border', colors.bg, colors.text, colors.border)}>
                        <Tag className="w-3 h-3" />
                        {keywords.length} gatilho{keywords.length !== 1 ? 's' : ''}
                    </span>
                )}
                {sector.schedule_start && sector.schedule_end && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 rounded-full">
                        <Clock className="w-3 h-3" />
                        {sector.schedule_start} — {sector.schedule_end}
                    </span>
                )}
                {(sector.collection_fields?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                        <ClipboardList className="w-3 h-3" />
                        {sector.collection_fields!.length} campo{sector.collection_fields!.length !== 1 ? 's' : ''}
                    </span>
                )}
                {keywords.length > 4 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                    >
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expanded ? 'menos' : 'ver tudo'}
                    </button>
                )}
            </div>

            {/* Color indicator bar */}
            <div className={cn('h-0.5 rounded-b-xl', colors.dot)} />
        </div>
    );
}
