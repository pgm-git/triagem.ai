'use client';

import { GitBranch, ArrowRight, Tag, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const flowData = [
    {
        sector: 'Financeiro', icon: '💰', color: 'indigo',
        keywords: ['boleto', 'pagamento', 'pagar', 'fatura', 'cobrança'],
        response: 'Vou encaminhar você para o setor Financeiro.',
    },
    {
        sector: 'Comercial', icon: '🤝', color: 'emerald',
        keywords: ['preço', 'orçamento', 'cotação', 'proposta', 'comprar'],
        response: 'Encaminhando para o Comercial.',
    },
    {
        sector: 'Suporte', icon: '🛠️', color: 'amber',
        keywords: ['erro', 'bug', 'não funciona', 'ajuda', 'suporte'],
        response: 'Encaminhando para o Suporte Técnico.',
    },
    {
        sector: 'Ouvidoria', icon: '📢', color: 'red',
        keywords: ['reclamação', 'reclamar', 'insatisfeito', 'cancelar'],
        response: 'Sua mensagem será encaminhada para a Ouvidoria.',
    },
];

const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    indigo: { bg: 'bg-indigo-500/5', border: 'border-indigo-500/20', text: 'text-indigo-400', dot: 'bg-indigo-500' },
    emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
    red: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
};

export default function FluxoPage() {
    const totalKeywords = flowData.reduce((acc, f) => acc + f.keywords.length, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Fluxo de Roteamento</h1>
                <p className="text-sm text-zinc-400 mt-1">
                    Visão consolidada: {flowData.length} setores, {totalKeywords} gatilhos ativos
                </p>
            </div>

            {/* Visual Flow */}
            <div className="space-y-4">
                {/* Entry point */}
                <div className="flex items-center gap-3 py-3 px-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <GitBranch className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Mensagem Recebida</p>
                        <p className="text-xs text-zinc-500">WhatsApp → Motor de Roteamento</p>
                    </div>
                </div>

                {/* Connector */}
                <div className="flex justify-center">
                    <div className="w-px h-6 bg-zinc-700" />
                </div>

                {/* Sectors Flow */}
                <div className="space-y-3">
                    {flowData.map((flow, index) => {
                        const colors = colorMap[flow.color];
                        return (
                            <div
                                key={flow.sector}
                                className={cn(
                                    'border rounded-xl p-5 transition-all hover:scale-[1.01] animate-in fade-in slide-in-from-left-4',
                                    colors.bg, colors.border
                                )}
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{flow.icon}</span>
                                        <div>
                                            <h3 className="font-semibold text-white text-sm">{flow.sector}</h3>
                                            <p className="text-[10px] text-zinc-500 mt-0.5">{flow.keywords.length} gatilhos ativos</p>
                                        </div>
                                    </div>
                                    <div className={cn('w-2.5 h-2.5 rounded-full mt-1', colors.dot)} />
                                </div>

                                {/* Keywords */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {flow.keywords.map((kw) => (
                                        <span key={kw} className="px-2 py-0.5 text-[10px] font-medium bg-zinc-800/80 text-zinc-300 rounded-md">
                                            {kw}
                                        </span>
                                    ))}
                                </div>

                                {/* Response */}
                                <div className="flex items-start gap-2 pt-3 border-t border-zinc-800/50">
                                    <ArrowRight className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', colors.text)} />
                                    <p className="text-xs text-zinc-400 italic">"{flow.response}"</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Connector */}
                <div className="flex justify-center">
                    <div className="w-px h-6 bg-zinc-700" />
                </div>

                {/* Fallback */}
                <div className="flex items-center gap-3 py-3 px-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-300">Fallback → Ouvidoria</p>
                        <p className="text-xs text-zinc-500">Quando nenhum gatilho é identificado</p>
                    </div>
                </div>
            </div>

            <p className="text-center text-xs text-zinc-600">
                Para editar gatilhos, acesse <span className="text-indigo-400">Setores</span> e clique na aba "Gatilhos" do setor desejado.
            </p>
        </div>
    );
}
