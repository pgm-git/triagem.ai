import { useState, useEffect } from 'react';
import { X, Loader2, GitMerge, MessageSquare, AlertTriangle, ArrowRight, Building2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sector, Message } from '@/types';
import { useRouter } from 'next/navigation';

interface FallbackAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string | null;
    onRetrained?: () => void;
}

export function FallbackAnalysisModal({ isOpen, onClose, conversationId, onRetrained }: FallbackAnalysisModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);

    // Form state
    const [selectedSectorId, setSelectedSectorId] = useState<string>('');
    const [keyword, setKeyword] = useState<string>('');
    const [ruleType, setRuleType] = useState<'intention' | 'keyword'>('intention');

    useEffect(() => {
        if (!isOpen || !conversationId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch messages
                const msgRes = await fetch(`/api/conversations/${conversationId}/messages`);
                if (msgRes.ok) {
                    const data = await msgRes.json();
                    setMessages(data);
                }

                // Fetch sectors
                const secRes = await fetch('/api/sectors');
                if (secRes.ok) {
                    const data = await secRes.json();
                    setSectors(data);
                }
            } catch (err) {
                console.error('Failed to load analysis data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Reset form
        setSelectedSectorId('');
        setKeyword('');
    }, [isOpen, conversationId]);

    const handleSave = async () => {
        if (!selectedSectorId || !keyword.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/routing/retrain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    sector_id: selectedSectorId,
                    keyword: keyword.trim().toLowerCase(),
                    type: ruleType
                }),
            });

            if (res.ok) {
                if (onRetrained) onRetrained();
                onClose();
            } else {
                console.error('Failed to retrain');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <GitMerge className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Análise de Fallback</h2>
                            <p className="text-sm text-slate-400">Ensine a IA a rotear esta intenção no futuro</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Chat History */}
                    <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-slate-800">
                        <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-300">Transcrição da Conversa</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <p className="text-center text-slate-500 text-sm py-10">Nenhuma mensagem encontrada.</p>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.sender_type === 'client' ? "self-start" : "self-end items-end")}>
                                        <div className={cn(
                                            "px-4 py-2 rounded-2xl text-sm",
                                            msg.sender_type === 'client'
                                                ? "bg-slate-800 text-slate-200 rounded-tl-sm"
                                                : "bg-blue-600/20 text-blue-100 rounded-tr-sm border border-blue-500/20"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Retrain Form */}
                    <div className="w-full md:w-1/2 flex flex-col bg-slate-900">
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-amber-400">Diagnóstico</h4>
                                    <p className="text-xs text-amber-500/80 mt-1">A IA não encontrou nenhuma Regra ou Setor compatível com as mensagens enviadas e transferiu para o Fallback.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    1. Para onde deveria ter ido?
                                </h3>
                                <div className="grid gap-2">
                                    <select
                                        value={selectedSectorId}
                                        onChange={(e) => setSelectedSectorId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="">Selecione o Setor correto...</option>
                                        {sectors.map(s => (
                                            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                                        ))}
                                    </select>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => { onClose(); router.push('/setores'); }}
                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            Ou criar um novo setor <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    2. Qual foi o Gatilho?
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setRuleType('intention')}
                                            className={cn("flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors",
                                                ruleType === 'intention' ? "bg-purple-500/20 border-purple-500 text-purple-300" : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800")}
                                        >
                                            Intenção (IA)
                                        </button>
                                        <button
                                            onClick={() => setRuleType('keyword')}
                                            className={cn("flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors",
                                                ruleType === 'keyword' ? "bg-purple-500/20 border-purple-500 text-purple-300" : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800")}
                                        >
                                            Palavra exata
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1.5 block">
                                            {ruleType === 'intention' ? 'Descreva a intenção (ex: "preciso de guincho")' : 'Palavras exatas, separadas por vírgula'}
                                        </label>
                                        <input
                                            type="text"
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            placeholder={ruleType === 'intention' ? "Ex: acionando o guincho" : "guincho, reboque"}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!selectedSectorId || !keyword.trim() || submitting}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium transition-all"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Ensinar IA & Salvar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
