'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/ui';
import {
    LayoutDashboard,
    MessageSquare,
    Route as GitBranch,
    Building2,
    Smartphone,
    ClipboardList,
    Settings,
    ChevronLeft,
    ChevronRight,
    MessageSquareMore,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/conversas', label: 'Conversas', icon: MessageSquare },
    { href: '/setores', label: 'Setores', icon: Building2 },
    { href: '/canais', label: 'Canais', icon: Smartphone },
    { href: '/logs', label: 'Logs', icon: ClipboardList },
    { href: '/simulador', label: 'Simulador', icon: Sparkles },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-200 ease-in-out',
                sidebarCollapsed ? 'w-[56px]' : 'w-[240px]'
            )}
        >
            {/* Logo */}
            <div className="h-14 flex items-center px-3 border-b border-zinc-800 gap-2 shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 shrink-0">
                    <MessageSquareMore className="w-4 h-4 text-indigo-400" />
                </div>
                {!sidebarCollapsed && (
                    <span className="text-sm font-semibold text-white truncate">TrackerAi Pro</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-indigo-500/10 text-indigo-400'
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                            )}
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-indigo-400')} />
                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="border-t border-zinc-800 p-2 shrink-0">
                <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center w-full py-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all cursor-pointer"
                >
                    {sidebarCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>
        </aside>
    );
}
