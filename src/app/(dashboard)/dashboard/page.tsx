'use client';

import { useState, useEffect } from 'react';
import {
    MessageSquare,
    AlertTriangle,
    CheckCircle2,
    Building2,
    Smartphone,
    Loader2,
    ArrowRight,
    Clock,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';

interface DashboardStats {
    active_conversations: number;
    pending_triage: number;
    resolved_today: number;
    total_sectors: number;
    active_instances: number;
    recent_conversations: {
        id: string;
        contact_name: string | null;
        contact_phone: string;
        status: string;
        last_message_at: string;
        sectors: { name: string; icon: string } | null;
    }[];
    sector_distribution: { name: string; icon: string; count: number }[];
}

export default function DashboardPage() {
    const { profile } = useUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (err) {
                console.error('Failed to load dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
        // Refresh every 30s
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
        );
    }

    const cards = [
        { label: 'Conversas Ativas', value: stats?.active_conversations || 0, icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Aguardando Triagem', value: stats?.pending_triage || 0, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Resolvidas Hoje', value: stats?.resolved_today || 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Setores Ativos', value: stats?.total_sectors || 0, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'} 👋
                </h1>
                <p className="text-sm text-zinc-400 mt-1">Aqui está o resumo do seu atendimento</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bg)}>
                                <card.icon className={cn('w-5 h-5', card.color)} />
                            </div>
                            {card.label === 'Aguardando Triagem' && card.value > 0 && (
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Conversations */}
                <div className="col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                        <h2 className="text-sm font-semibold text-zinc-300">Conversas Recentes</h2>
                        <Link href="/conversas" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                            Ver todas <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-800/50">
                        {(!stats?.recent_conversations || stats.recent_conversations.length === 0) ? (
                            <div className="p-8 text-center text-zinc-500 text-sm">
                                <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                Nenhuma conversa ainda
                            </div>
                        ) : (
                            stats.recent_conversations.map((conv) => (
                                <Link
                                    key={conv.id}
                                    href="/conversas"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm">
                                        {conv.contact_name ? conv.contact_name[0]?.toUpperCase() : '📱'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-300 truncate">
                                            {conv.contact_name || conv.contact_phone}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {conv.sectors ? `${conv.sectors.icon} ${conv.sectors.name}` : 'Sem setor'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                        <Clock className="w-3 h-3" />
                                        {conv.last_message_at
                                            ? new Date(conv.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                            : '--'}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Sector Distribution */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="text-sm font-semibold text-zinc-300">Distribuição por Setor</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {(!stats?.sector_distribution || stats.sector_distribution.length === 0) ? (
                            <div className="text-center text-zinc-500 text-sm py-4">
                                <Building2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                Nenhuma conversa ativa
                            </div>
                        ) : (
                            stats.sector_distribution.map((sector) => {
                                const total = stats.sector_distribution.reduce((a, b) => a + b.count, 0);
                                const pct = total > 0 ? (sector.count / total) * 100 : 0;
                                return (
                                    <div key={sector.name}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-zinc-400">
                                                {sector.icon} {sector.name}
                                            </span>
                                            <span className="text-xs text-zinc-500">{sector.count}</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Connection Status */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        (stats?.active_instances || 0) > 0 ? 'bg-emerald-500/10' : 'bg-zinc-800'
                    )}>
                        <Smartphone className={cn(
                            'w-5 h-5',
                            (stats?.active_instances || 0) > 0 ? 'text-emerald-400' : 'text-zinc-600'
                        )} />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-300">
                            {(stats?.active_instances || 0) > 0
                                ? `${stats?.active_instances} instância${(stats?.active_instances || 0) > 1 ? 's' : ''} conectada${(stats?.active_instances || 0) > 1 ? 's' : ''}`
                                : 'Nenhum WhatsApp conectado'}
                        </p>
                        <p className="text-xs text-zinc-500">
                            {(stats?.active_instances || 0) > 0
                                ? 'Recebendo mensagens em tempo real'
                                : 'Conecte um WhatsApp em Canais para começar'}
                        </p>
                    </div>
                    {(stats?.active_instances || 0) === 0 && (
                        <Link
                            href="/canais"
                            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-all"
                        >
                            <Zap className="w-3 h-3" />
                            Conectar
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
