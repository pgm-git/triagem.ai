'use client';

import { useState, useRef } from 'react';
import { Send, Zap, ShieldAlert, ArrowRight, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulationResult {
    input: string;
    result: {
        matched: boolean;
        ruleId: string | null;
        sectorId: string | null;
        responseTemplate: string | null;
        method: 'auto' | 'fallback';
        sectorName: string;
        sectorIcon: string;
        matchedKeyword: string | null;
        ruleName: string | null;
    };
    availableRules: {
        id: string;
        name: string;
        keywords: string[];
        priority: number;
        is_active: boolean;
    }[];
    timestamp: string;
}

interface HistoryEntry {
    id: string;
    input: string;
    result: SimulationResult['result'];
    timestamp: string;
}

const exampleMessages = [
    'Preciso do boleto desse mês',
    'Qual o preço do plano profissional?',
    'Meu sistema está com erro',
    'Quero cancelar minha assinatura',
    'Bom dia, tudo bem?',
    'Não consigo fazer pagamento',
    'Gostaria de uma cotação',
    'O app não funciona no celular',
];

export default function SimuladorPage() {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [rules, setRules] = useState<SimulationResult['availableRules']>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    async function simulate(text?: string) {
        const msgToSend = text || message;
        if (!msgToSend.trim()) return;

        setLoading(true);
        try {
            const res = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msgToSend }),
            });
            const data: SimulationResult = await res.json();

            setHistory((prev) => [
                {
                    id: crypto.randomUUID(),
                    input: msgToSend,
                    result: data.result,
                    timestamp: data.timestamp,
                },
                ...prev,
            ]);

            if (data.availableRules) {
                setRules(data.availableRules);
            }

            setMessage('');
            inputRef.current?.focus();
        } catch {
            console.error('Erro na simulação');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                    Simulador de Roteamento
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Digite uma mensagem como se fosse um cliente WhatsApp e veja para qual setor ela seria direcionada.
                </p>
            </div>

            {/* Input area */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && simulate()}
                        placeholder="Ex: Preciso do boleto desse mês..."
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        disabled={loading}
                        id="simulator-input"
                    />
                    <button
                        onClick={() => simulate()}
                        disabled={loading || !message.trim()}
                        className={cn(
                            'px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-all cursor-pointer',
                            message.trim() && !loading
                                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        )}
                        id="simulator-send"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Testar
                    </button>
                </div>

                {/* Quick examples */}
                <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">Exemplos rápidos:</p>
                    <div className="flex flex-wrap gap-2">
                        {exampleMessages.map((ex) => (
                            <button
                                key={ex}
                                onClick={() => simulate(ex)}
                                className="px-3 py-1.5 text-xs bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-lg hover:text-white hover:border-slate-600 hover:bg-slate-800 transition-all cursor-pointer"
                                disabled={loading}
                            >
                                &ldquo;{ex}&rdquo;
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results history */}
            {history.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-300">
                            Resultados ({history.length})
                        </h2>
                        <button
                            onClick={() => setHistory([])}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Limpar
                        </button>
                    </div>

                    <div className="space-y-3">
                        {history.map((entry, index) => (
                            <div
                                key={entry.id}
                                className={cn(
                                    'border rounded-xl p-4 transition-all animate-in fade-in slide-in-from-top-2',
                                    entry.result.matched
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : 'bg-amber-500/5 border-amber-500/20'
                                )}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Message */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                        💬
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium">&ldquo;{entry.input}&rdquo;</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            {new Date(entry.timestamp).toLocaleTimeString('pt-BR')}
                                        </p>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="flex items-center gap-2 ml-4 mb-3">
                                    <div className="w-px h-4 bg-slate-700" />
                                    <ArrowRight className="w-3 h-3 text-slate-600" />
                                    {entry.result.matchedKeyword && (
                                        <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-300 rounded-md border border-blue-500/20">
                                            keyword: &ldquo;{entry.result.matchedKeyword}&rdquo;
                                        </span>
                                    )}
                                </div>

                                {/* Result */}
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                        entry.result.matched ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                                    )}>
                                        {entry.result.matched ? (
                                            <Zap className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{entry.result.sectorIcon}</span>
                                            <span className="text-sm font-semibold text-white">
                                                {entry.result.sectorName}
                                            </span>
                                            <span className={cn(
                                                'px-2 py-0.5 text-[10px] font-medium rounded-full',
                                                entry.result.matched
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            )}>
                                                {entry.result.method === 'auto' ? '⚡ Auto' : '🔄 Fallback'}
                                            </span>
                                        </div>
                                        {entry.result.responseTemplate && (
                                            <p className="text-xs text-slate-400 mt-1 italic">
                                                &ldquo;{entry.result.responseTemplate}&rdquo;
                                            </p>
                                        )}
                                        {entry.result.ruleName && (
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Regra: {entry.result.ruleName} (prioridade: {
                                                    rules.find((r) => r.id === entry.result.ruleId)?.priority ?? '?'
                                                })
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active rules reference */}
            {rules.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                        Regras ativas no motor
                    </h3>
                    <div className="space-y-2">
                        {rules.filter((r) => r.is_active).map((rule) => (
                            <div key={rule.id} className="flex items-center gap-3 text-xs">
                                <span className="text-slate-500 font-mono w-4 text-right">{rule.priority}</span>
                                <span className="text-white font-medium w-32 truncate">{rule.name}</span>
                                <div className="flex gap-1 flex-wrap">
                                    {rule.keywords.map((kw) => (
                                        <span key={kw} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
