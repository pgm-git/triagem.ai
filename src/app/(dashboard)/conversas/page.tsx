'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    MessageSquare,
    Send,
    Loader2,
    Search,
    Phone,
    Clock,
    ChevronRight,
    Bot,
    User,
    Headphones,
    UserCheck,
    CheckCircle2,
    Inbox
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';

interface Conversation {
    id: string;
    contact_phone: string;
    contact_name: string | null;
    status: string;
    routed_by: string | null;
    matched_keyword: string | null;
    unread_count: number;
    last_message_at: string | null;
    sector_id: string | null;
    agent_id: string | null;
    queued_at: string | null;
    in_progress_at: string | null;
    resolved_at: string | null;
    collected_data: Record<string, any> | null;
    sectors: { id: string; name: string; icon: string } | null;
}

interface Message {
    id: string;
    content: string;
    sender_type: 'client' | 'agent' | 'bot' | 'system';
    status: string;
    created_at: string;
}

export default function ConversasPage() {
    const { user } = useUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'queue' | 'mine' | 'all'>('queue');
    const [sectors, setSectors] = useState<any[]>([]);
    const [transferring, setTransferring] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [resolving, setResolving] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load conversations and sectors
    const loadConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (err) {
            console.error('Failed to load conversations:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadSectors = useCallback(async () => {
        try {
            const res = await fetch('/api/sectors');
            if (res.ok) {
                const data = await res.json();
                setSectors(data.sectors || []);
            }
        } catch (err) {
            console.error('Failed to load sectors:', err);
        }
    }, []);

    useEffect(() => {
        loadConversations();
        loadSectors();
    }, [loadConversations, loadSectors]);

    // Real-time subscription for new messages
    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel('inbox-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, (payload) => {
                const newMsg = payload.new as Message & { conversation_id: string };
                // Add to messages if viewing this conversation
                if (selectedId && newMsg.conversation_id === selectedId) {
                    setMessages(prev => [...prev, newMsg]);
                }
                // Refresh conversation list to update last_message_at and unread
                loadConversations();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
            }, () => {
                loadConversations();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedId, loadConversations]);

    // Load messages for selected conversation
    useEffect(() => {
        if (!selectedId) {
            setMessages([]);
            return;
        }

        const loadMessages = async () => {
            const res = await fetch(`/api/conversations/${selectedId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        };

        loadMessages();
    }, [selectedId]);

    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message
    const handleSend = async () => {
        if (!selectedId || !newMessage.trim() || sending) return;
        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Optimistic update
        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            content,
            sender_type: 'agent',
            status: 'sending',
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const res = await fetch('/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation_id: selectedId, content }),
            });
            const data = await res.json();

            if (data.success) {
                // Replace optimistic message with real one
                setMessages(prev => prev.map(m =>
                    m.id === optimisticMsg.id ? { ...m, id: data.message_id, status: 'sent' } : m
                ));
            } else {
                setMessages(prev => prev.map(m =>
                    m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m
                ));
            }
        } catch {
            setMessages(prev => prev.map(m =>
                m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m
            ));
        }

        setSending(false);
    };

    // Transfer sector
    const handleTransfer = async (newSectorId: string) => {
        if (!selectedId || transferring) return;
        setTransferring(true);

        const sector = sectors.find(s => s.id === newSectorId);

        try {
            const res = await fetch(`/api/conversations/${selectedId}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_sector_id: newSectorId,
                    new_sector_name: sector?.name
                }),
            });

            if (res.ok) {
                // Optimistic UI update
                setConversations(prev => prev.map(c =>
                    c.id === selectedId ? { ...c, sector_id: newSectorId, sectors: { id: sector.id, name: sector.name, icon: sector.icon }, routed_by: 'manual', status: 'waiting_agent' } : c
                ));
            }
        } catch (err) {
            console.error('Failed to transfer conversation', err);
        } finally {
            setTransferring(false);
        }
    };

    // Assumir atendimento (Assign)
    const handleAssign = async () => {
        if (!selectedId || assigning) return;
        setAssigning(true);
        try {
            const res = await fetch(`/api/conversations/${selectedId}/assign`, { method: 'POST' });
            if (res.ok) {
                const { conversation } = await res.json();
                setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, ...conversation } : c));
                setActiveTab('mine');
            }
        } catch (err) {
            console.error('Failed to assign', err);
        } finally {
            setAssigning(false);
        }
    };

    // Finalizar atendimento (Resolve)
    const handleResolve = async () => {
        if (!selectedId || resolving) return;
        setResolving(true);
        try {
            const res = await fetch(`/api/conversations/${selectedId}/resolve`, { method: 'POST' });
            if (res.ok) {
                const { conversation } = await res.json();
                setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, ...conversation } : c));
                setSelectedId(null); // Clear selection since it moved to 'all' or history
            }
        } catch (err) {
            console.error('Failed to resolve', err);
        } finally {
            setResolving(false);
        }
    };

    const selected = conversations.find(c => c.id === selectedId);

    // Filtros por Tab e Busca
    const tabFiltered = conversations.filter(c => {
        if (activeTab === 'queue') return c.status === 'waiting_agent';
        if (activeTab === 'mine') return c.status === 'in_progress' && c.agent_id === user?.id;
        return true; // 'all' - todo: maybe exclude resolved from main view later
    });

    const filteredConversations = tabFiltered.filter(c =>
        (c.contact_name || c.contact_phone).toLowerCase().includes(search.toLowerCase())
    );

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        return isToday
            ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const getSenderIcon = (type: string) => {
        switch (type) {
            case 'client': return <Phone className="w-3 h-3" />;
            case 'agent': return <Headphones className="w-3 h-3" />;
            case 'bot': return <Bot className="w-3 h-3" />;
            default: return <User className="w-3 h-3" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-120px)]">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-120px)] rounded-xl overflow-hidden border border-slate-800">
            <div className="w-[340px] border-r border-slate-800 flex flex-col bg-slate-950">
                <div className="p-3 border-b border-slate-800 space-y-3">
                    <div className="flex bg-slate-900 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('queue')}
                            className={cn('flex-1 py-1.5 text-xs font-medium rounded-md transition-all', activeTab === 'queue' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200')}
                        >
                            Fila de Espera
                        </button>
                        <button
                            onClick={() => setActiveTab('mine')}
                            className={cn('flex-1 py-1.5 text-xs font-medium rounded-md transition-all', activeTab === 'mine' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200')}
                        >
                            Meus Atend.
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn('flex-1 py-1.5 text-xs font-medium rounded-md transition-all', activeTab === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200')}
                        >
                            Todas
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar conversas..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                            <MessageSquare className="w-10 h-10 text-slate-700 mb-3" />
                            <p className="text-sm text-slate-500">Nenhuma conversa ainda</p>
                            <p className="text-xs text-slate-600 mt-1">Aguardando mensagens via WhatsApp</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedId(conv.id)}
                                className={cn(
                                    'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-b border-slate-800/50',
                                    selectedId === conv.id
                                        ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                                        : 'hover:bg-slate-900'
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-lg">
                                    {conv.contact_name ? conv.contact_name[0]?.toUpperCase() : '📱'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-200 truncate">
                                            {conv.contact_name || conv.contact_phone}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {formatTime(conv.last_message_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-xs text-slate-500 truncate">
                                            {conv.sectors ? `${conv.sectors.icon} ${conv.sectors.name}` : 'Sem setor'}
                                        </span>
                                        {conv.unread_count > 0 && (
                                            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* ──── Center: Messages ──── */}
            <div className="flex-1 flex flex-col bg-slate-950/50">
                {!selected ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                            <MessageSquare className="w-10 h-10 text-slate-700" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-400">Selecione uma conversa</h3>
                        <p className="text-sm text-slate-600 mt-1">Clique em uma conversa para ver as mensagens</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950">
                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-base">
                                {selected.contact_name ? selected.contact_name[0]?.toUpperCase() : '📱'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-200 truncate">
                                    {selected.contact_name || selected.contact_phone}
                                </h3>
                                <p className="text-xs text-slate-500">{selected.contact_phone}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                {selected.sectors && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700">
                                        <span className="text-xs">{selected.sectors.icon}</span>
                                        <span className="text-xs text-slate-400">{selected.sectors.name}</span>
                                    </div>
                                )}

                                {selected.status === 'in_progress' && selected.agent_id === user?.id && (
                                    <button
                                        onClick={handleResolve}
                                        disabled={resolving}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {resolving ? 'Encerrando...' : 'Finalizar Atendimento'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                                    Nenhuma mensagem nesta conversa
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            'flex',
                                            msg.sender_type === 'client' ? 'justify-start' : 'justify-end'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'max-w-[70%] px-3 py-2 rounded-2xl text-sm',
                                                msg.sender_type === 'client'
                                                    ? 'bg-slate-800 text-slate-200 rounded-bl-md'
                                                    : msg.sender_type === 'system'
                                                        ? 'bg-slate-900 border border-slate-800 text-slate-400 italic rounded-md w-full text-center'
                                                        : msg.sender_type === 'bot'
                                                            ? 'bg-purple-600/20 text-purple-200 border border-purple-500/20 rounded-br-md'
                                                            : 'bg-blue-600 text-white rounded-br-md'
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                {getSenderIcon(msg.sender_type)}
                                                <span className="text-[10px] uppercase opacity-60">
                                                    {msg.sender_type === 'client' ? 'Cliente' : msg.sender_type === 'bot' ? 'Bot' : 'Agente'}
                                                </span>
                                            </div>
                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <span className="text-[10px] opacity-50">
                                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {msg.sender_type !== 'client' && (
                                                    <span className="text-[10px] opacity-40">
                                                        {msg.status === 'sending' ? '⏳' : msg.status === 'sent' ? '✓' : msg.status === 'delivered' ? '✓✓' : msg.status === 'read' ? '✓✓' : msg.status === 'failed' ? '✗' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input or Assign Button */}
                        <div className="p-3 border-t border-slate-800 bg-slate-950">
                            {selected.status === 'waiting_agent' ? (
                                <button
                                    onClick={handleAssign}
                                    disabled={assigning}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium disabled:opacity-50"
                                >
                                    {assigning ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                                    {assigning ? 'Atribuindo à você...' : 'Assumir Atendimento'}
                                </button>
                            ) : selected.status === 'in_progress' && selected.agent_id !== user?.id ? (
                                <div className="flex items-center justify-center gap-2 py-3 bg-slate-800/50 text-slate-400 rounded-xl border border-slate-800 text-sm">
                                    <User className="w-4 h-4" />
                                    Esta conversa está sendo atendida por outro agente
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                        disabled={selected.status === 'resolved' || (selected.status === 'in_progress' && selected.agent_id !== user?.id)}
                                        placeholder={selected.status === 'resolved' ? "Conversa encerrada" : "Digite uma mensagem..."}
                                        className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!newMessage.trim() || sending || selected.status === 'resolved'}
                                        className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ──── Right: Info panel ──── */}
            {selected && (
                <div className="w-[280px] border-l border-slate-800 bg-slate-950 p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300">Detalhes</h3>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-400">{selected.contact_phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-400">
                                {selected.last_message_at
                                    ? new Date(selected.last_message_at).toLocaleString('pt-BR')
                                    : 'Sem mensagens'}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Jornada Temporal</h4>
                        <div className="space-y-2">
                            {selected.queued_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Fila Iniciada</span>
                                    <span className="text-xs text-slate-400">{new Date(selected.queued_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            )}
                            {selected.in_progress_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Assumido</span>
                                    <span className="text-xs text-slate-400">{new Date(selected.in_progress_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            )}
                            {selected.resolved_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Resolvido</span>
                                    <span className="text-xs text-slate-400">{new Date(selected.resolved_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {selected.collected_data && Object.keys(selected.collected_data).length > 0 && (
                        <div className="border-t border-slate-800 pt-3">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Dados Coletados (IA)</h4>
                            <div className="space-y-1.5">
                                {Object.entries(selected.collected_data).map(([key, value]) => (
                                    <div key={key} className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-800/50">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{key}</span>
                                        <span className="text-xs text-blue-400 font-medium">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-800 pt-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Roteamento</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Setor</span>
                                <select
                                    disabled={transferring}
                                    value={selected.sector_id || ''}
                                    onChange={(e) => handleTransfer(e.target.value)}
                                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50 max-w-[140px]"
                                >
                                    <option value="" disabled>Selecionar Setor...</option>
                                    {sectors.filter(s => s.is_active).map(s => (
                                        <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Método</span>
                                <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full',
                                    selected.routed_by === 'auto'
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'bg-amber-500/10 text-amber-400'
                                )}>
                                    {selected.routed_by === 'auto' ? '🤖 Automático' : '🔄 Fallback'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Status</span>
                                <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full font-medium',
                                    selected.status === 'active' ? 'bg-indigo-500/10 text-indigo-400' :
                                        selected.status === 'waiting_agent' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            selected.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' :
                                                selected.status === 'pending_triage' ? 'bg-purple-500/10 text-purple-400' :
                                                    'bg-emerald-500/10 text-emerald-400'
                                )}>
                                    {selected.status === 'active' ? 'Ativa (IA)' :
                                        selected.status === 'waiting_agent' ? '⏳ Fila de Espera' :
                                            selected.status === 'in_progress' ? 'Em Atendimento' :
                                                selected.status === 'pending_triage' ? 'Triagem' :
                                                    'Resolvida'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
