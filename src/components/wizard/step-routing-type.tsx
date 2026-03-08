'use client';

import { useSetupStore } from '@/stores/setup';
import { cn } from '@/lib/utils';
import { List, MessageSquareText, Shuffle } from 'lucide-react';

const routingOptions = [
    {
        value: 'menu' as const,
        icon: List,
        title: 'Menu (Botões)',
        description: 'O cliente escolhe entre opções pré-definidas com botões interativos.',
    },
    {
        value: 'keywords' as const,
        icon: MessageSquareText,
        title: 'Palavras-chave',
        description: 'O sistema identifica palavras-chave na mensagem e encaminha automaticamente.',
    },
    {
        value: 'hybrid' as const,
        icon: Shuffle,
        title: 'Híbrido',
        description: 'Combina menu com detecção de palavras-chave para máxima cobertura.',
    },
];

export function StepRoutingType() {
    const { data, updateData } = useSetupStore();

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white">Como deseja rotear as conversas?</h2>
                <p className="text-sm text-zinc-400">Escolha o tipo de roteamento para suas mensagens</p>
            </div>

            <div className="space-y-3">
                {routingOptions.map((option) => {
                    const isSelected = data.routingType === option.value;
                    return (
                        <button
                            key={option.value}
                            onClick={() => updateData({ routingType: option.value })}
                            className={cn(
                                'w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer',
                                isSelected
                                    ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/30'
                                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                            )}
                        >
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                                    isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-500'
                                )}
                            >
                                <option.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn('font-semibold text-sm', isSelected ? 'text-indigo-300' : 'text-white')}>
                                    {option.title}
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">{option.description}</p>
                            </div>
                            <div
                                className={cn(
                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                                    isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'
                                )}
                            >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                        </button>
                    );
                })}
            </div>

            <p className="text-center text-xs text-zinc-600">Você pode mudar depois nas configurações.</p>
        </div>
    );
}
