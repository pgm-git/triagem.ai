'use client';

import type { Message } from '@/types';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isClient = message.sender_type === 'client';
    const isSystem = message.sender_type === 'system';
    const time = new Date(message.created_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (isSystem) {
        return (
            <div className="flex justify-center my-3">
                <span className="px-3 py-1 text-[11px] text-slate-500 bg-slate-800/50 rounded-full">
                    {message.content}
                </span>
            </div>
        );
    }

    return (
        <div className={cn('flex mb-2', isClient ? 'justify-start' : 'justify-end')}>
            <div
                className={cn(
                    'max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                    isClient
                        ? 'bg-slate-800 text-slate-200 rounded-bl-md'
                        : 'bg-blue-600 text-white rounded-br-md'
                )}
            >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div
                    className={cn(
                        'flex items-center justify-end gap-1 mt-1',
                        isClient ? 'text-slate-500' : 'text-blue-200'
                    )}
                >
                    <span className="text-[10px]">{time}</span>
                    {!isClient && (
                        message.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                        ) : message.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5" />
                        ) : (
                            <Check className="w-3.5 h-3.5" />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
