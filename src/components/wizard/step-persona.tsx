'use client';

import { useSetupStore } from '@/stores/setup';
import { PersonaConfig } from '@/components/shared/persona-config';
import { Bot } from 'lucide-react';

export function StepPersona() {
    const { data, updateData } = useSetupStore();

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <Bot className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Personalidade do Agente IA</h2>
                <p className="text-sm text-slate-400">Defina como o seu assistente virtual deve se comportar com seus clientes</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <PersonaConfig
                    value={data.persona?.selectedTraits}
                    onChange={(traits) => updateData({ persona: { ...data.persona, selectedTraits: traits } })}
                />
            </div>

            <p className="text-center text-[10px] text-slate-500">
                Você poderá ajustar estas configurações detalhadamente depois no painel de controle.
            </p>
        </div>
    );
}
