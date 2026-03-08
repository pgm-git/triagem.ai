'use client';

import { useSetupStore } from '@/stores/setup';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { Rule } from '@/types';

const defaultTemplates: (Partial<Rule> & { label: string })[] = [
    {
        label: 'Boleto → Financeiro',
        name: 'Boleto / Pagamento',
        type: 'intention',
        keywords: ['boleto', 'pagamento', 'pagar', 'fatura', 'cobrança'],
        response_template: 'Vou encaminhar você para o setor Financeiro. Aguarde um momento.',
        is_active: true,
    },
    {
        label: 'Reclamação → Ouvidoria',
        name: 'Reclamação / Ouvidoria',
        type: 'intention',
        keywords: ['reclamação', 'reclamar', 'insatisfeito', 'problema', 'denúncia'],
        response_template: 'Sua mensagem será encaminhada para a Ouvidoria. Obrigado pelo contato.',
        is_active: true,
    },
    {
        label: 'Preço / Orçamento → Comercial',
        name: 'Interesse Comercial',
        type: 'intention',
        keywords: ['preço', 'orçamento', 'cotação', 'proposta', 'comprar', 'contratar'],
        response_template: 'Vou encaminhar você para o setor Comercial. Em breve um consultor irá atendê-lo.',
        is_active: false,
    },
    {
        label: 'Cancelamento → Ouvidoria',
        name: 'Cancelamento',
        type: 'intention',
        keywords: ['cancelar', 'cancelamento', 'desistir', 'encerrar'],
        response_template: 'Sua solicitação de cancelamento será analisada pela Ouvidoria.',
        is_active: false,
    },
    {
        label: 'Suporte Técnico → Suporte',
        name: 'Suporte Técnico',
        type: 'intention',
        keywords: ['erro', 'bug', 'não funciona', 'ajuda', 'suporte', 'problema técnico'],
        response_template: 'Encaminhando para o Suporte Técnico. Aguarde um momento.',
        is_active: false,
    },
];

export function StepRules() {
    const { data, updateData } = useSetupStore();
    const [templates, setTemplates] = useState(
        (data.rules as typeof defaultTemplates)?.length ? (data.rules as typeof defaultTemplates) : defaultTemplates
    );
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleTemplate = (index: number) => {
        const updated = templates.map((t, i) =>
            i === index ? { ...t, is_active: !t.is_active } : t
        );
        setTemplates(updated);
        updateData({ rules: updated });
    };

    const updateKeywords = (index: number, value: string) => {
        const updated = templates.map((t, i) =>
            i === index ? { ...t, keywords: value.split(',').map((k) => k.trim()) } : t
        );
        setTemplates(updated);
        updateData({ rules: updated });
    };

    const updateResponse = (index: number, value: string) => {
        const updated = templates.map((t, i) =>
            i === index ? { ...t, response_template: value } : t
        );
        setTemplates(updated);
        updateData({ rules: updated });
    };

    const activeCount = templates.filter((t) => t.is_active).length;

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white">Ative regras de roteamento</h2>
                <p className="text-sm text-zinc-400">
                    Templates pré-configurados para começar rapidamente
                </p>
            </div>

            <div className="space-y-2">
                {templates.map((template, index) => (
                    <div
                        key={index}
                        className={cn(
                            'bg-zinc-900 border rounded-xl overflow-hidden transition-all',
                            template.is_active ? 'border-zinc-700' : 'border-zinc-800/50'
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4">
                            <button
                                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                            >
                                <ChevronRight
                                    className={cn(
                                        'w-4 h-4 text-zinc-500 transition-transform',
                                        expandedIndex === index && 'rotate-90'
                                    )}
                                />
                                <span className={cn('text-sm font-medium', template.is_active ? 'text-white' : 'text-zinc-500')}>
                                    {template.label}
                                </span>
                            </button>
                            <button
                                onClick={() => toggleTemplate(index)}
                                className={cn(
                                    'w-10 h-6 rounded-full flex items-center px-0.5 transition-all cursor-pointer',
                                    template.is_active ? 'bg-indigo-600 justify-end' : 'bg-zinc-700 justify-start'
                                )}
                            >
                                <div className="w-5 h-5 bg-white rounded-full shadow transition-all" />
                            </button>
                        </div>

                        {/* Expandable drawer */}
                        {expandedIndex === index && (
                            <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-400">Palavras-chave</label>
                                    <input
                                        type="text"
                                        value={template.keywords?.join(', ') || ''}
                                        onChange={(e) => updateKeywords(index, e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-400">Mensagem de confirmação</label>
                                    <textarea
                                        value={template.response_template || ''}
                                        onChange={(e) => updateResponse(index, e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <p className="text-center text-xs text-zinc-600">
                {activeCount} regra{activeCount !== 1 ? 's' : ''} ativa{activeCount !== 1 ? 's' : ''}
                {activeCount < 1 && ' — ative pelo menos 1 para continuar'}
            </p>
        </div>
    );
}
