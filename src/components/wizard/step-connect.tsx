'use client';

import { useSetupStore } from '@/stores/setup';
import { useUser } from '@/contexts/user-context';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    Smartphone,
    Send,
    Zap,
    Loader2,
    MessageSquareMore,
} from 'lucide-react';

export function StepConnect() {
    const { data } = useSetupStore();
    const { organization } = useUser();
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const sectorsCount = data.sectors?.filter((s) => s.is_active && s.destination).length || 0;
    const hasPersona = (data.persona?.selectedTraits?.length || 0) >= 1;
    const hasFallback = !!data.fallback?.sectorId && !!data.fallback?.message;

    const checklist = [
        { label: 'Personalidade IA definida', ok: hasPersona },
        { label: `${sectorsCount} setor${sectorsCount !== 1 ? 'es' : ''} mapeado${sectorsCount !== 1 ? 's' : ''}`, ok: sectorsCount >= 1 },
        { label: 'Fallback de contingência', ok: hasFallback },
    ];

    const allOk = checklist.every((item) => item.ok);

    const simulateTest = () => {
        setTestStatus('testing');
        setTimeout(() => {
            setTestStatus('success');
        }, 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-xl shadow-emerald-500/10 mb-2">
                    <Zap className="w-8 h-8 text-emerald-400 fill-emerald-400/20" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Estamos prontos!</h2>
                <p className="text-slate-400 max-w-sm mx-auto">
                    Sua estrutura de atendimento foi configurada com sucesso para a
                    <span className="text-white font-bold mx-1">{organization?.name || 'sua empresa'}</span>.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pre-checklist */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resumo da Configuração</h3>
                    <div className="space-y-3">
                        {checklist.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                    item.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-600"
                                )}>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                                <span className={cn('text-sm', item.ok ? 'text-slate-300' : 'text-slate-500 font-medium')}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Brand Preview */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest w-full text-left mb-2">Visual da Marca</p>
                    <div
                        className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center mb-1"
                        style={{ backgroundColor: organization?.primary_color || '#3b82f6' }}
                    >
                        {organization?.logo_url ? (
                            <img src={organization.logo_url} alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
                        ) : (
                            <MessageSquareMore className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-white">{organization?.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Cor: {organization?.primary_color?.toUpperCase()}</p>
                    </div>
                </div>
            </div>

            {/* Warning if no channels */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3">
                <Smartphone className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-500/80 leading-relaxed">
                    <strong>Atenção:</strong> Lembre-se de conectar seu WhatsApp na aba <span className="font-bold">Canais</span> após finalizar o wizard para que as mensagens comecem a ser roteadas.
                </p>
            </div>
        </div>
    );
}
