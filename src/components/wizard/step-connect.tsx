'use client';

import { useSetupStore } from '@/stores/setup';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    Smartphone,
    Send,
    Zap,
    Loader2,
} from 'lucide-react';

export function StepConnect() {
    const { data } = useSetupStore();
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const sectors = data.sectors?.filter((s) => s.is_active) || [];
    const rules = (data.rules as { is_active?: boolean }[])?.filter((r) => r.is_active) || [];
    const hasFallback = !!data.fallback?.sectorId && !!data.fallback?.message;

    const checklist = [
        { label: 'Tipo de roteamento', ok: !!data.routingType },
        { label: `${sectors.length} setor${sectors.length !== 1 ? 'es' : ''} ativo${sectors.length !== 1 ? 's' : ''}`, ok: sectors.length >= 1 },
        { label: `${rules.length} regra${rules.length !== 1 ? 's' : ''} ativa${rules.length !== 1 ? 's' : ''}`, ok: rules.length >= 1 },
        { label: 'Fallback configurado', ok: hasFallback },
    ];

    const allOk = checklist.every((item) => item.ok);

    const simulateTest = () => {
        setTestStatus('testing');
        setTimeout(() => {
            setTestStatus('success');
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white">Tudo pronto!</h2>
                <p className="text-sm text-zinc-400">Revise sua configuração e conecte o WhatsApp</p>
            </div>

            {/* Pre-checklist */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Checklist de configuração</h3>
                {checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <CheckCircle2
                            className={cn('w-5 h-5', item.ok ? 'text-emerald-400' : 'text-zinc-600')}
                        />
                        <span className={cn('text-sm', item.ok ? 'text-zinc-300' : 'text-zinc-500')}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {/* Connect WhatsApp */}
                <button className="w-full flex items-center justify-center gap-3 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 text-emerald-400 font-medium rounded-xl transition-all cursor-pointer">
                    <Smartphone className="w-5 h-5" />
                    Conectar WhatsApp
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-600/30 rounded-full">Em breve</span>
                </button>

                {/* Test */}
                <button
                    onClick={simulateTest}
                    disabled={!allOk || testStatus === 'testing'}
                    className={cn(
                        'w-full flex items-center justify-center gap-2 py-3 border rounded-xl font-medium transition-all cursor-pointer disabled:cursor-not-allowed',
                        testStatus === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50'
                    )}
                >
                    {testStatus === 'testing' ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Testando roteamento...
                        </>
                    ) : testStatus === 'success' ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Teste concluído com sucesso!
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Enviar teste
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
