'use client';

import { useState } from 'react';
import { ClipboardList, Search, Filter, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
    id: string;
    time: string;
    event: string;
    from: string | null;
    to: string;
    contact: string;
    method: 'auto' | 'manual' | 'fallback';
}

const mockLogs: LogEntry[] = [
    { id: '1', time: '14:32', event: 'auto_route', from: null, to: 'Financeiro', contact: 'Maria Silva', method: 'auto' },
    { id: '2', time: '14:28', event: 'auto_route', from: null, to: 'Comercial', contact: 'João Santos', method: 'auto' },
    { id: '3', time: '14:15', event: 'fallback', from: null, to: 'Suporte', contact: 'Ana Oliveira', method: 'fallback' },
    { id: '4', time: '13:50', event: 'reassign', from: 'Comercial', to: 'Financeiro', contact: 'Carlos Ferreira', method: 'manual' },
    { id: '5', time: '13:30', event: 'auto_route', from: null, to: 'Ouvidoria', contact: 'Paula Costa', method: 'auto' },
    { id: '6', time: '13:12', event: 'auto_route', from: null, to: 'Financeiro', contact: 'Roberto Lima', method: 'auto' },
    { id: '7', time: '12:45', event: 'fallback', from: null, to: 'Suporte', contact: 'Fernanda Souza', method: 'fallback' },
    { id: '8', time: '12:20', event: 'manual_route', from: null, to: 'Comercial', contact: 'Marcos Alves', method: 'manual' },
];

const eventLabels: Record<string, string> = {
    auto_route: 'Roteamento automático',
    manual_route: 'Roteamento manual',
    fallback: 'Fallback',
    reassign: 'Transferência',
};

const methodColors: Record<string, string> = {
    auto: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    manual: 'bg-zinc-700 text-zinc-300 border-zinc-600',
    fallback: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function LogsPage() {
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState('');

    const filtered = mockLogs
        .filter((l) => filter === 'all' || l.method === filter)
        .filter((l) => !search || l.contact.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Logs</h1>
                <p className="text-sm text-zinc-400 mt-1">Histórico de ações de roteamento</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por contato..."
                        className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
                <div className="flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-zinc-500" />
                    {(['all', 'auto', 'manual', 'fallback'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer',
                                filter === f
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'
                            )}
                        >
                            {f === 'all' ? 'Todos' : f === 'auto' ? 'Auto' : f === 'manual' ? 'Manual' : 'Fallback'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Hora</th>
                            <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Contato</th>
                            <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Evento</th>
                            <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Destino</th>
                            <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Método</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {filtered.map((log) => (
                            <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="px-5 py-3 text-xs text-zinc-500 font-mono">{log.time}</td>
                                <td className="px-5 py-3">
                                    <span className="text-sm text-white">{log.contact}</span>
                                </td>
                                <td className="px-5 py-3 text-xs text-zinc-400">{eventLabels[log.event]}</td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                                        {log.from && (
                                            <>
                                                <span className="text-zinc-500">{log.from}</span>
                                                <ArrowRight className="w-3 h-3 text-zinc-600" />
                                            </>
                                        )}
                                        <span>{log.to}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={cn('px-2 py-0.5 text-[10px] font-semibold rounded-full border capitalize', methodColors[log.method])}>
                                        {log.method}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="py-12 text-center text-sm text-zinc-500">Nenhum log encontrado</div>
                )}
            </div>
        </div>
    );
}
