'use client';

import { useState } from 'react';
import { Smartphone, Wifi, WifiOff, ExternalLink, RefreshCw, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Channel {
    id: string;
    provider: string;
    phone: string;
    status: 'connected' | 'disconnected' | 'pending';
}

export default function CanaisPage() {
    const [channels, setChannels] = useState<Channel[]>([
        { id: '1', provider: 'WhatsApp Business', phone: '+55 11 99999-0001', status: 'connected' },
    ]);

    const statusConfig = {
        connected: { label: 'Conectado', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        disconnected: { label: 'Desconectado', icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
        pending: { label: 'Pendente', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Canais</h1>
                    <p className="text-sm text-zinc-400 mt-1">Canais de comunicação conectados</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Novo Canal
                </button>
            </div>

            {/* Channel Cards */}
            <div className="space-y-4">
                {channels.map((channel) => {
                    const cfg = statusConfig[channel.status];
                    return (
                        <div key={channel.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Smartphone className="w-7 h-7 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{channel.provider}</h3>
                                        <p className="text-sm text-zinc-500 mt-0.5">{channel.phone}</p>
                                    </div>
                                </div>
                                <span className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border', cfg.color)}>
                                    <cfg.icon className="w-3.5 h-3.5" />
                                    {cfg.label}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-zinc-800">
                                <div>
                                    <p className="text-xs text-zinc-500">Mensagens hoje</p>
                                    <p className="text-lg font-bold text-white mt-0.5">48</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500">Conversas ativas</p>
                                    <p className="text-lg font-bold text-white mt-0.5">3</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500">Uptime</p>
                                    <p className="text-lg font-bold text-emerald-400 mt-0.5">99.8%</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-4">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all cursor-pointer">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Reconectar
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all cursor-pointer">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Configurações
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Supported Providers */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-400 mb-3">Provedores Compatíveis</h3>
                <div className="flex gap-3">
                    {['Twilio', '360dialog', 'Meta Cloud API'].map((p) => (
                        <span key={p} className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 rounded-lg border border-zinc-700">
                            {p}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
