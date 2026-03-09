'use client';

import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';
import { MessageSquare } from 'lucide-react';

interface ConversationListItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
}

export function ConversationListItem({ conversation, isActive, onClick }: ConversationListItemProps) {
    const timeAgo = getTimeAgo(conversation.last_message_at);

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-start gap-3 px-4 py-3 text-left transition-all cursor-pointer border-b border-slate-800/50',
                isActive ? 'bg-blue-500/10' : 'hover:bg-slate-800/30'
            )}
        >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                {conversation.contact_name.slice(0, 2).toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className={cn('text-sm font-medium truncate', isActive ? 'text-blue-300' : 'text-white')}>
                        {conversation.contact_name}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">{timeAgo}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                    {conversation.contact_phone}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                        className={cn(
                            'px-1.5 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider',
                            conversation.status === 'active' && 'bg-emerald-500/10 text-emerald-400',
                            conversation.status === 'pending_triage' && 'bg-amber-500/10 text-amber-400',
                            conversation.status === 'resolved' && 'bg-slate-700 text-slate-400'
                        )}
                    >
                        {conversation.status === 'active' ? 'Ativo' : conversation.status === 'pending_triage' ? 'Triagem' : 'Resolvido'}
                    </span>
                    {conversation.unread_count > 0 && (
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                            {conversation.unread_count}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
}
