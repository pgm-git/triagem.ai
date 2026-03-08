'use client';

import { useState } from 'react';
import { ConversationListItem } from '@/components/inbox/conversation-list-item';
import { MessageBubble } from '@/components/inbox/message-bubble';
import { MessageInput } from '@/components/inbox/message-input';
import type { Conversation, Message } from '@/types';
import { MessageSquare, Search, Phone, User, Building2, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock conversations
const mockConversations: Conversation[] = [
    {
        id: '1', organization_id: 'org-1', channel_id: 'ch-1', sector_id: '1',
        contact_name: 'Maria Silva', contact_phone: '+55 11 98765-4321',
        status: 'active', last_message_at: new Date(Date.now() - 120000).toISOString(),
        unread_count: 2, routed_by: 'auto', created_at: '', updated_at: '',
    },
    {
        id: '2', organization_id: 'org-1', channel_id: 'ch-1', sector_id: '2',
        contact_name: 'João Santos', contact_phone: '+55 21 91234-5678',
        status: 'active', last_message_at: new Date(Date.now() - 300000).toISOString(),
        unread_count: 0, routed_by: 'auto', created_at: '', updated_at: '',
    },
    {
        id: '3', organization_id: 'org-1', channel_id: 'ch-1', sector_id: '3',
        contact_name: 'Ana Oliveira', contact_phone: '+55 31 99876-5432',
        status: 'pending_triage', last_message_at: new Date(Date.now() - 600000).toISOString(),
        unread_count: 1, routed_by: 'fallback', created_at: '', updated_at: '',
    },
    {
        id: '4', organization_id: 'org-1', channel_id: 'ch-1', sector_id: '1',
        contact_name: 'Carlos Ferreira', contact_phone: '+55 41 98765-1234',
        status: 'resolved', last_message_at: new Date(Date.now() - 3600000).toISOString(),
        unread_count: 0, routed_by: 'manual', created_at: '', updated_at: '',
    },
];

const mockMessages: Record<string, Message[]> = {
    '1': [
        { id: 'm1', conversation_id: '1', content: 'Olá, preciso da segunda via do boleto', sender_type: 'client', status: 'read', created_at: new Date(Date.now() - 180000).toISOString() },
        { id: 'm2', conversation_id: '1', content: 'Conversa encaminhada para Financeiro', sender_type: 'system', status: 'read', created_at: new Date(Date.now() - 175000).toISOString() },
        { id: 'm3', conversation_id: '1', content: 'Olá Maria! Vou gerar a segunda via agora. Por favor, confirme seu CPF.', sender_type: 'agent', sender_id: 'agent-1', status: 'delivered', created_at: new Date(Date.now() - 150000).toISOString() },
        { id: 'm4', conversation_id: '1', content: '123.456.789-00', sender_type: 'client', status: 'read', created_at: new Date(Date.now() - 130000).toISOString() },
        { id: 'm5', conversation_id: '1', content: 'Obrigada! O boleto vence dia 15. Quer receber por aqui mesmo?', sender_type: 'agent', sender_id: 'agent-1', status: 'sent', created_at: new Date(Date.now() - 120000).toISOString() },
    ],
    '2': [
        { id: 'm6', conversation_id: '2', content: 'Boa tarde! Gostaria de um orçamento para o plano empresarial.', sender_type: 'client', status: 'read', created_at: new Date(Date.now() - 360000).toISOString() },
        { id: 'm7', conversation_id: '2', content: 'Conversa encaminhada para Comercial', sender_type: 'system', status: 'read', created_at: new Date(Date.now() - 355000).toISOString() },
        { id: 'm8', conversation_id: '2', content: 'Olá João! Claro, para quantos atendentes você precisa?', sender_type: 'agent', sender_id: 'agent-2', status: 'read', created_at: new Date(Date.now() - 300000).toISOString() },
    ],
    '3': [
        { id: 'm9', conversation_id: '3', content: 'meu sistema nao ta funcionando', sender_type: 'client', status: 'read', created_at: new Date(Date.now() - 600000).toISOString() },
    ],
};

const sectorMap: Record<string, string> = { '1': 'Financeiro', '2': 'Comercial', '3': 'Suporte', '4': 'Ouvidoria' };

export default function ConversasPage() {
    const [selectedId, setSelectedId] = useState<string | null>('1');
    const [conversations, setConversations] = useState(mockConversations);
    const [messages, setMessages] = useState(mockMessages);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filtered = statusFilter === 'all'
        ? conversations
        : conversations.filter((c) => c.status === statusFilter);

    const selectedConversation = conversations.find((c) => c.id === selectedId);
    const currentMessages = selectedId ? messages[selectedId] || [] : [];

    const handleSendMessage = (content: string) => {
        if (!selectedId) return;
        const newMsg: Message = {
            id: `m-${Date.now()}`,
            conversation_id: selectedId,
            content,
            sender_type: 'agent',
            sender_id: 'agent-1',
            status: 'sending',
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => ({ ...prev, [selectedId]: [...(prev[selectedId] || []), newMsg] }));
    };

    return (
        <div className="flex h-[calc(100vh-112px)] -mx-6 -mt-6 overflow-hidden">
            {/* Column 1: Conversation List */}
            <div className="w-[320px] border-r border-zinc-800 flex flex-col shrink-0">
                {/* Search + Filter */}
                <div className="p-3 space-y-2 border-b border-zinc-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar conversas..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>
                    <div className="flex gap-1">
                        {(['all', 'active', 'pending_triage', 'resolved'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    'px-2.5 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer',
                                    statusFilter === s
                                        ? 'bg-indigo-500/10 text-indigo-400'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                )}
                            >
                                {s === 'all' ? 'Todas' : s === 'active' ? 'Ativas' : s === 'pending_triage' ? 'Triagem' : 'Resolvidas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.map((conv) => (
                        <ConversationListItem
                            key={conv.id}
                            conversation={conv}
                            isActive={conv.id === selectedId}
                            onClick={() => setSelectedId(conv.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Column 2: Messages */}
            {selectedConversation ? (
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                                {selectedConversation.contact_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{selectedConversation.contact_name}</p>
                                <p className="text-[10px] text-zinc-500">{sectorMap[selectedConversation.sector_id]} • {selectedConversation.routed_by}</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer">
                                <Phone className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer">
                                <ArrowLeftRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                        {currentMessages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                    </div>

                    {/* Input */}
                    <MessageInput onSend={handleSendMessage} />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">Selecione uma conversa</p>
                    </div>
                </div>
            )}

            {/* Column 3: Contact Panel */}
            {selectedConversation && (
                <div className="w-[280px] border-l border-zinc-800 p-4 space-y-5 shrink-0 overflow-y-auto">
                    {/* Contact info */}
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-300 mx-auto mb-3">
                            {selectedConversation.contact_name.slice(0, 2).toUpperCase()}
                        </div>
                        <h3 className="text-sm font-semibold text-white">{selectedConversation.contact_name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{selectedConversation.contact_phone}</p>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Setor</span>
                            <span className="text-xs text-zinc-300 font-medium">{sectorMap[selectedConversation.sector_id]}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500 flex items-center gap-1.5"><ArrowLeftRight className="w-3.5 h-3.5" /> Roteado por</span>
                            <span className="text-xs text-zinc-300 font-medium capitalize">{selectedConversation.routed_by}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Status</span>
                            <span className={cn(
                                'px-2 py-0.5 text-[10px] font-semibold rounded uppercase',
                                selectedConversation.status === 'active' && 'bg-emerald-500/10 text-emerald-400',
                                selectedConversation.status === 'pending_triage' && 'bg-amber-500/10 text-amber-400',
                                selectedConversation.status === 'resolved' && 'bg-zinc-700 text-zinc-400'
                            )}>
                                {selectedConversation.status === 'active' ? 'Ativo' : selectedConversation.status === 'pending_triage' ? 'Triagem' : 'Resolvido'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-3 border-t border-zinc-800">
                        <button className="w-full py-2 text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all cursor-pointer">
                            Transferir conversa
                        </button>
                        <button className="w-full py-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all cursor-pointer">
                            Marcar como resolvida
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
