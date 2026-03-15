'use client';

import { useState, useMemo } from 'react';
import type { PersonaTraitId } from '@/types';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface TraitOption {
    id: PersonaTraitId;
    emoji: string;
    label: string;
    description: string;
}

const TRAITS: TraitOption[] = [
    { id: 'professional', emoji: '🏢', label: 'Profissional', description: 'Linguagem formal e objetiva' },
    { id: 'informal', emoji: '😄', label: 'Informal', description: 'Tom descontraído e casual' },
    { id: 'welcoming', emoji: '🤗', label: 'Acolhedor', description: 'Caloroso e empático' },
    { id: 'objective', emoji: '⚡', label: 'Objetivo', description: 'Direto ao ponto, sem rodeios' },
    { id: 'consultive', emoji: '🎯', label: 'Consultivo', description: 'Guia e orienta o cliente' },
    { id: 'friendly', emoji: '💬', label: 'Amigável', description: 'Próximo e acessível' },
];

const EXAMPLE_MESSAGES: Record<string, { greeting: string; routing: string; closing: string }> = {
    'professional': {
        greeting: 'Olá. Bem-vindo ao nosso atendimento. Como posso auxiliá-lo?',
        routing: 'Sua solicitação será encaminhada ao setor Financeiro. Aguarde, por favor.',
        closing: 'Caso tenha dúvidas adicionais, estamos à disposição. Boa tarde.',
    },
    'informal': {
        greeting: 'E aí! Tudo bem? 😊 Como posso te ajudar?',
        routing: 'Show! Vou te passar pro Financeiro agora, beleza? 🤙',
        closing: 'Fechou! Se precisar de mais alguma coisa, é só chamar! 👋',
    },
    'welcoming': {
        greeting: 'Olá! Que bom ter você aqui. Estou pronto para ajudar no que precisar.',
        routing: 'Vou encaminhar você para o setor Financeiro. Fique tranquilo, cuidaremos de tudo.',
        closing: 'Foi um prazer ajudar! Saiba que estou sempre aqui caso precise. Um abraço!',
    },
    'objective': {
        greeting: 'Olá. Em que posso ajudar?',
        routing: 'Encaminhando para o Financeiro. Tempo estimado: 2 minutos.',
        closing: 'Resolvido. Precisa de mais algo?',
    },
    'consultive': {
        greeting: 'Olá! Vou entender sua necessidade para direcionar da melhor forma. Pode me contar mais?',
        routing: 'Analisando sua solicitação, o ideal é o setor Financeiro. Vou conectar você agora.',
        closing: 'Fico feliz em ter ajudado! Se surgir outra dúvida, estou à disposição para orientar.',
    },
    'friendly': {
        greeting: 'Oi! 😊 Como vai? Estou aqui para te ajudar!',
        routing: 'Pode deixar comigo! Vou te conectar com o pessoal do Financeiro agora.',
        closing: 'Adorei ajudar! Se precisar, é só me chamar. Tenha um ótimo dia! 🌟',
    },
};

function blendMessages(traits: PersonaTraitId[]): { greeting: string; routing: string; closing: string } {
    if (traits.length === 0) {
        return {
            greeting: 'Olá, como posso ajudar?',
            routing: 'Encaminhando sua solicitação.',
            closing: 'Até mais!',
        };
    }
    if (traits.length === 1) {
        return EXAMPLE_MESSAGES[traits[0]];
    }
    // Blend 2 traits: use first for structure, second for flavor
    const primary = EXAMPLE_MESSAGES[traits[0]];
    const secondary = EXAMPLE_MESSAGES[traits[1]];
    return {
        greeting: primary.greeting,
        routing: secondary.routing,
        closing: primary.closing,
    };
}

export function PersonaConfig({
    value = ['professional', 'welcoming'],
    onChange
}: {
    value?: PersonaTraitId[],
    onChange?: (traits: PersonaTraitId[]) => void
}) {
    const selected = value;

    const toggleTrait = (id: PersonaTraitId) => {
        const newSelected = selected.includes(id)
            ? selected.filter((t) => t !== id)
            : selected.length >= 2
                ? [selected[1], id]
                : [...selected, id];

        onChange?.(newSelected as PersonaTraitId[]);
    };

    const messages = useMemo(() => blendMessages(selected), [selected]);

    const selectedLabels = TRAITS.filter((t) => selected.includes(t.id)).map((t) => t.label).join(' + ');

    return (
        <div className="space-y-6">
            {/* Trait Grid */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-300">Selecione até 2 traits</label>
                    <span className="text-[10px] text-slate-600">{selected.length} de 2 selecionado{selected.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {TRAITS.map((trait) => {
                        const isSelected = selected.includes(trait.id);
                        return (
                            <button
                                key={trait.id}
                                onClick={() => toggleTrait(trait.id)}
                                className={cn(
                                    'group relative flex flex-col items-center gap-2 py-5 px-3 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                                    isSelected
                                        ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_24px_-4px_rgba(99,102,241,0.3)]'
                                        : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/50'
                                )}
                                style={{ transform: isSelected ? 'scale(1.02)' : 'scale(1)' }}
                            >
                                <span className="text-3xl transition-transform duration-200 group-hover:scale-110">{trait.emoji}</span>
                                <span className={cn('text-sm font-semibold transition-colors', isSelected ? 'text-blue-300' : 'text-slate-300')}>
                                    {trait.label}
                                </span>
                                <span className="text-[10px] text-slate-500 text-center">{trait.description}</span>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center animate-in zoom-in duration-200">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Preview Messages */}
            {selected.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <label className="text-sm font-medium text-slate-300">Preview de mensagens</label>
                        {selectedLabels && (
                            <span className="px-2 py-0.5 text-[9px] font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                                {selectedLabels}
                            </span>
                        )}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        {[
                            { label: 'Saudação', text: messages.greeting },
                            { label: 'Roteando', text: messages.routing },
                            { label: 'Encerramento', text: messages.closing },
                        ].map((msg, i) => (
                            <div
                                key={msg.label}
                                className="animate-in fade-in slide-in-from-bottom-2 duration-200"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">{msg.label}</span>
                                <div className="mt-1 bg-blue-600/90 text-white px-3.5 py-2.5 rounded-2xl rounded-br-md text-sm max-w-[85%] ml-auto">
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
