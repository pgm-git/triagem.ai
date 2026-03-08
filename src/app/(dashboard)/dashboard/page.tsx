'use client';

import { useState } from 'react';
import {
    Activity,
    MessageSquare,
    AlertTriangle,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    TrendingUp,
    ToggleRight,
    ToggleLeft,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const [trackerAtivo, setTrackerAtivo] = useState(true);

    const stats = [
        { label: 'Conversas hoje', value: '24', change: '+12%', trend: 'up' as const, icon: MessageSquare },
        { label: 'Em triagem', value: '3', change: '-2', trend: 'down' as const, icon: Activity },
        { label: 'Fallbacks', value: '5', change: '+1', trend: 'up' as const, icon: AlertTriangle },
        { label: 'Tempo médio', value: '2m 15s', change: '-18%', trend: 'down' as const, icon: TrendingUp },
    ];

    const recentConversations = [
        { name: 'Maria Silva', sector: 'Financeiro', time: '2 min', status: 'active' },
        { name: 'João Santos', sector: 'Comercial', time: '5 min', status: 'active' },
        { name: 'Ana Oliveira', sector: 'Suporte', time: '10 min', status: 'pending_triage' },
        { name: 'Carlos Ferreira', sector: 'Financeiro', time: '1h', status: 'resolved' },
        { name: 'Paula Costa', sector: 'Ouvidoria', time: '2h', status: 'resolved' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-sm text-zinc-400 mt-1">Visão operacional do seu atendimento</p>
                </div>
                <button
                    onClick={() => setTrackerAtivo(!trackerAtivo)}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
                        trackerAtivo
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    )}
                >
                    {trackerAtivo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    {trackerAtivo ? 'Tracker Ativo' : 'Tracker Pausado'}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-zinc-400">{stat.label}</span>
                            <stat.icon className="w-4 h-4 text-zinc-600" />
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <div className="flex items-center gap-1 mt-1">
                            {stat.trend === 'up' ? (
                                <ArrowUp className="w-3 h-3 text-emerald-400" />
                            ) : (
                                <ArrowDown className="w-3 h-3 text-emerald-400" />
                            )}
                            <span className="text-xs text-emerald-400">{stat.change}</span>
                            <span className="text-xs text-zinc-600 ml-1">vs ontem</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Conversations */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                        <h3 className="text-sm font-semibold text-white">Conversas Recentes</h3>
                        <Link href="/conversas" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                            Ver todas <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-800/50">
                        {recentConversations.map((conv, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                                        {conv.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm text-white font-medium">{conv.name}</p>
                                        <p className="text-[10px] text-zinc-500">{conv.sector}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-600">{conv.time}</span>
                                    <span
                                        className={cn(
                                            'w-2 h-2 rounded-full',
                                            conv.status === 'active' && 'bg-emerald-400',
                                            conv.status === 'pending_triage' && 'bg-amber-400',
                                            conv.status === 'resolved' && 'bg-zinc-600'
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sector Distribution */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Distribuição por Setor</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Financeiro', count: 10, percent: 42, color: 'bg-indigo-500' },
                            { name: 'Comercial', count: 7, percent: 29, color: 'bg-emerald-500' },
                            { name: 'Suporte', count: 5, percent: 21, color: 'bg-amber-500' },
                            { name: 'Ouvidoria', count: 2, percent: 8, color: 'bg-red-500' },
                        ].map((sector) => (
                            <div key={sector.name} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-300">{sector.name}</span>
                                    <span className="text-xs text-zinc-500">{sector.count} ({sector.percent}%)</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={cn('h-full rounded-full transition-all duration-500', sector.color)}
                                        style={{ width: `${sector.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
