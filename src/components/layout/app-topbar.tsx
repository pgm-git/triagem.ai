'use client';

import { Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export function AppTopbar() {
    return (
        <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between px-6">
            {/* Left — Account Selector */}
            <button className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer">
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                    R
                </div>
                <span className="font-medium">Minha Empresa</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            {/* Right — Actions */}
            <div className="flex items-center gap-3">
                <Link
                    href="/setup"
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
                >
                    Configurar
                </Link>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer">
                    <Settings className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
                    U
                </div>
            </div>
        </header>
    );
}
