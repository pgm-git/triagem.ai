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
    BarChart3,
    Activity,
    Target,
    GitMerge
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { FallbackAnalysisModal } from '@/components/dashboard/FallbackAnalysisModal';

interface SLAStats {
    queue_length: number;
    resolved_today: number;
    avg_wait_time_secs: number;
    avg_handle_time_secs: number;
    in_progress: number;
}

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
    volume?: {
        conversations_today: number;
        conversations_month: number;
        messages_today: number;
        messages_month: number;
    };
    routing_efficiency?: number;
    total_fallback?: number;
    fallback_conversations?: {
        id: string;
        contact_name: string | null;
        contact_phone: string;
        status: string;
        last_message_at: string;
        sectors: { name: string; icon: string } | null;
    }[];
}

export default function DashboardPage() {
    const { profile } = useUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [slaStats, setSlaStats] = useState<SLAStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [analysisConvId, setAnalysisConvId] = useState<string | null>(null);

    const loadStats = async () => {
        try {
            const [resStats, resSla] = await Promise.all([
                fetch('/api/dashboard/stats'),
                fetch('/api/dashboard/sla')
            ]);

            if (resStats.ok) {
                setStats(await resStats.json());
            }
            if (resSla.ok) {
                setSlaStats(await resSla.json());
            }
        } catch (err) {
            console.error('Failed to load dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        // Refresh every 30s
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${Math.floor(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    const isAgent = profile?.role === 'agent';

    const adminCards = [
        { label: 'Conversas Ativas', value: stats?.active_conversations || 0, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Aguardando Triagem', value: stats?.pending_triage || 0, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Resolvidas Hoje (Equipe)', value: slaStats?.resolved_today || 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Eficiência da IA', value: `${stats?.routing_efficiency || 100}%`, icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    const agentCards = [
        { label: 'Fila de Espera (Meus Setores)', value: slaStats?.queue_length || 0, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Em Atendimento', value: slaStats?.in_progress || 0, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Finalizadas Hoje', value: slaStats?.resolved_today || 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Meu TMA', value: formatTime(slaStats?.avg_handle_time_secs || 0), icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    const cards = isAgent ? agentCards : adminCards;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'} 👋
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Aqui está o resumo do seu atendimento</p>
                </div>

                {/* KPI Volume Minibox */}
                <div className="flex gap-6 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                    <div>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Atendimentos</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-white">{stats?.volume?.conversations_today || 0}</span>
                            <span className="text-xs text-slate-500">dia</span>
                            <span className="text-slate-700">/</span>
                            <span className="text-sm font-medium text-slate-400">{stats?.volume?.conversations_month || 0}</span>
                            <span className="text-[10px] text-slate-500">mês</span>
                        </div>
                    </div>
                    <div className="w-px bg-slate-800"></div>
                    <div>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Mensagens</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-white">{stats?.volume?.messages_today || 0}</span>
                            <span className="text-xs text-slate-500">dia</span>
                            <span className="text-slate-700">/</span>
                            <span className="text-sm font-medium text-slate-400">{stats?.volume?.messages_month || 0}</span>
                            <span className="text-[10px] text-slate-500">mês</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bg)}>
                                <card.icon className={cn('w-5 h-5', card.color)} />
                            </div>
                            {(card.label.includes('Aguardando') || card.label.includes('Fila')) && (card.value as number) > 0 && (
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Render Advanced Dashboard only for Admins */}
            {!isAgent && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Fallback Insights & Recent */}
                    <div className="col-span-2 space-y-6">
                        {/* Fallback Widget */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/20">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                        <GitMerge className="w-4 h-4 text-purple-400" />
                                        Treinamento Contínuo (Fallbacks)
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Conversas que a IA não soube rotear. Associe palavras-chave para ensinar a IA.
                                    </p>
                                </div>
                                <div className="bg-purple-500/10 text-purple-400 text-xs font-semibold px-2 py-1 rounded-md">
                                    {stats?.total_fallback || 0} pendentes
                                </div>
                            </div>
                            <div className="divide-y divide-slate-800/50">
                                {(!stats?.fallback_conversations || stats.fallback_conversations.length === 0) ? (
                                    <div className="p-8 text-center text-slate-500 text-sm">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                                        Excelente! A IA roteou com sucesso todas as conversas recentes.
                                    </div>
                                ) : (
                                    stats.fallback_conversations.map((conv) => (
                                        <div
                                            key={conv.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 hover:bg-slate-800/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm flex-shrink-0">
                                                    {conv.contact_name ? conv.contact_name[0]?.toUpperCase() : '📱'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-300 truncate">
                                                        {conv.contact_name || conv.contact_phone}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(conv.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                            Caiu na Ouvidoria
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setAnalysisConvId(conv.id);
                                                    setAnalysisModalOpen(true);
                                                }}
                                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap transition-colors"
                                            >
                                                Analisar Conversa
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Conversations */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-xl">
                            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                                <h2 className="text-sm font-semibold text-slate-300">Conversas Recentes</h2>
                                <Link href="/conversas" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                                    Ver todas <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-800/50">
                                {(!stats?.recent_conversations || stats.recent_conversations.length === 0) ? (
                                    <div className="p-8 text-center text-slate-500 text-sm">
                                        <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                        Nenhuma conversa ainda
                                    </div>
                                ) : (
                                    stats.recent_conversations.map((conv) => (
                                        <Link
                                            key={conv.id}
                                            href="/conversas"
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">
                                                {conv.contact_name ? conv.contact_name[0]?.toUpperCase() : '📱'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-300 truncate">
                                                    {conv.contact_name || conv.contact_phone}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {conv.sectors ? `${conv.sectors.icon} ${conv.sectors.name}` : 'Sem setor'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
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
                    </div>

                    {/* Sector Distribution */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl">
                        <div className="p-4 border-b border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-300">Distribuição por Setor</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {(!stats?.sector_distribution || stats.sector_distribution.length === 0) ? (
                                <div className="text-center text-slate-500 text-sm py-4">
                                    <Building2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                    Nenhuma conversa ativa
                                </div>
                            ) : (
                                stats.sector_distribution.map((sector) => {
                                    const total = stats.sector_distribution.reduce((a, b) => a + b.count, 0);
                                    const pct = total > 0 ? (sector.count / total) * 100 : 0;
                                    return (
                                        <div key={sector.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-slate-400">
                                                    {sector.icon} {sector.name}
                                                </span>
                                                <span className="text-xs text-slate-500">{sector.count}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
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
            )}

            {/* Connection Status */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        (stats?.active_instances || 0) > 0 ? 'bg-emerald-500/10' : 'bg-slate-800'
                    )}>
                        <Smartphone className={cn(
                            'w-5 h-5',
                            (stats?.active_instances || 0) > 0 ? 'text-emerald-400' : 'text-slate-600'
                        )} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-300">
                            {(stats?.active_instances || 0) > 0
                                ? `${stats?.active_instances} instância${(stats?.active_instances || 0) > 1 ? 's' : ''} conectada${(stats?.active_instances || 0) > 1 ? 's' : ''}`
                                : 'Nenhum WhatsApp conectado'}
                        </p>
                        <p className="text-xs text-slate-500">
                            {(stats?.active_instances || 0) > 0
                                ? 'Recebendo mensagens em tempo real'
                                : 'Conecte um WhatsApp em Canais para começar'}
                        </p>
                    </div>
                    {(stats?.active_instances || 0) === 0 && (
                        <Link
                            href="/canais"
                            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all"
                        >
                            <Zap className="w-3 h-3" />
                            Conectar
                        </Link>
                    )}
                </div>
            </div>

            <FallbackAnalysisModal
                isOpen={analysisModalOpen}
                onClose={() => setAnalysisModalOpen(false)}
                conversationId={analysisConvId}
                onRetrained={() => {
                    // Instantly reload stats to remove the conversation from the Fallback list
                    loadStats();
                }}
            />
        </div>
    );
}
