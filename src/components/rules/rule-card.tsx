'use client';

import { cn } from '@/lib/utils';
import type { Rule } from '@/types';
import { ChevronRight, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface RuleCardProps {
    rule: Rule;
    sectorName: string;
    onToggle: (id: string, isActive: boolean) => void;
    onEdit: (rule: Rule) => void;
    onDelete: (id: string) => void;
}

export function RuleCard({ rule, sectorName, onToggle, onEdit, onDelete }: RuleCardProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className={cn(
                'bg-slate-900 border rounded-xl overflow-hidden transition-all',
                rule.is_active ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
            )}
        >
            <div className="flex items-center gap-3 p-4">
                {/* Drag handle */}
                <GripVertical className="w-4 h-4 text-slate-700 shrink-0 cursor-grab" />

                {/* Expand */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="cursor-pointer"
                >
                    <ChevronRight
                        className={cn(
                            'w-4 h-4 text-slate-500 transition-transform',
                            expanded && 'rotate-90'
                        )}
                    />
                </button>

                {/* Type badge */}
                <span
                    className={cn(
                        'px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider shrink-0',
                        rule.type === 'intention' && 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
                        rule.type === 'keyword' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                        rule.type === 'exception' && 'bg-red-500/10 text-red-400 border border-red-500/20'
                    )}
                >
                    {rule.type}
                </span>

                {/* Name + sector */}
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white">{rule.name}</span>
                    <span className="text-xs text-slate-500 ml-2">→ {sectorName}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => onEdit(rule)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(rule.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-slate-800 transition-all cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onToggle(rule.id, !rule.is_active)}
                        className={cn(
                            'w-10 h-6 rounded-full flex items-center px-0.5 transition-all cursor-pointer',
                            rule.is_active ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
                        )}
                    >
                        <div className="w-5 h-5 bg-white rounded-full shadow transition-all" />
                    </button>
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-2">
                    <div>
                        <span className="text-xs text-slate-500">Palavras-chave:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {rule.keywords.map((kw, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-md"
                                >
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                    {rule.response_template && (
                        <div>
                            <span className="text-xs text-slate-500">Resposta automática:</span>
                            <p className="text-xs text-slate-400 mt-0.5 italic">"{rule.response_template}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
