'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/ui';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/user-context';
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
    LogOut,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminOnlyPaths = ['/setores', '/equipe', '/canais', '/logs', '/simulador', '/configuracoes'];

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/conversas', label: 'Conversas', icon: MessageSquare },
    { href: '/setores', label: 'Setores', icon: Building2 },
    { href: '/equipe', label: 'Equipe', icon: Users },
    { href: '/canais', label: 'Canais', icon: Smartphone },
    { href: '/logs', label: 'Logs', icon: ClipboardList },
    { href: '/simulador', label: 'Simulador', icon: Sparkles },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const { profile } = useUser(); // Hook to get user role!

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-200 ease-in-out',
                sidebarCollapsed ? 'w-[56px]' : 'w-[240px]'
            )}
        >
            {/* Logo */}
            <div className="h-14 flex items-center px-3 border-b border-slate-800 gap-2 shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 shrink-0">
                    <MessageSquareMore className="w-4 h-4 text-blue-400" />
                </div>
                {!sidebarCollapsed && (
                    <span className="text-sm font-semibold text-white truncate">TriaGO</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isAdminContent = adminOnlyPaths.includes(item.href);
                    if (isAdminContent && (!profile || profile.role === 'agent')) {
                        return null; // Hide from Agents
                    }

                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            )}
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-blue-400')} />
                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom actions */}
            <div className="border-t border-slate-800 p-2 shrink-0 space-y-1">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
                    title={sidebarCollapsed ? 'Sair' : undefined}
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>Sair</span>}
                </button>
                <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center w-full py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all cursor-pointer"
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

