'use client';

import { Settings, ChevronDown, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/user-context';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function AppTopbar() {
    const { profile, organization } = useUser();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get first letter of name, fallback to U
    const initial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';
    const orgInitial = organization?.name ? organization.name.slice(0, 1).toUpperCase() : 'T';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };
    return (
        <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-6">
            {/* Left — Account Selector */}
            <button className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors cursor-pointer">
                <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 overflow-hidden">
                    {organization?.logo_url ? (
                        <img src={organization.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        orgInitial
                    )}
                </div>
                <span className="font-medium">{organization?.name || 'Carregando...'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Right — Actions */}
            <div className="flex items-center gap-3">
                <Link
                    href="/setup"
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                >
                    Configurar
                </Link>
                <Link
                    href={'/configuracoes'}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                    title="Configurações"
                >
                    <Settings className="w-4 h-4" />
                </Link>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300 hover:bg-slate-600 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        {initial}
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-2 border-b border-slate-800 mb-1">
                                <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Usuário'}</p>
                                <p className="text-xs text-slate-400 truncate">{profile?.email || ''}</p>
                            </div>

                            <Link
                                href="/configuracoes"
                                onClick={() => setDropdownOpen(false)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <User className="w-4 h-4" />
                                Editar Perfil
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors cursor-pointer text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
