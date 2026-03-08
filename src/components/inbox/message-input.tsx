'use client';

import { Send, Paperclip, Smile } from 'lucide-react';
import { useState } from 'react';

interface MessageInputProps {
    onSend: (content: string) => void;
    disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        onSend(content.trim());
        setContent('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-3">
            <div className="flex items-end gap-2">
                <button
                    type="button"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer shrink-0"
                >
                    <Paperclip className="w-4 h-4" />
                </button>
                <div className="flex-1 relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite uma mensagem..."
                        disabled={disabled}
                        rows={1}
                        className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none disabled:opacity-50"
                    />
                </div>
                <button
                    type="button"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer shrink-0"
                >
                    <Smile className="w-4 h-4" />
                </button>
                <button
                    type="submit"
                    disabled={!content.trim() || disabled}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white disabled:text-zinc-600 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </form>
    );
}
