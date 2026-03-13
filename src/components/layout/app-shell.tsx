'use client';

import { AppSidebar } from './app-sidebar';
import { AppTopbar } from './app-topbar';
import { UserProvider } from '@/contexts/user-context';
import { useUIStore } from '@/stores/ui';
import { cn } from '@/lib/utils';

import { ThemeInitializer } from '../shared/theme-initializer';

export function AppShell({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed } = useUIStore();

    return (
        <UserProvider>
            <ThemeInitializer />
            <div className="min-h-screen bg-slate-950">
                <AppSidebar />
                <div
                    className={cn(
                        'transition-all duration-200 ease-in-out',
                        sidebarCollapsed ? 'ml-[56px]' : 'ml-[240px]'
                    )}
                >
                    <AppTopbar />
                    <main className="p-6">
                        <div className="max-w-[1280px] mx-auto">{children}</div>
                    </main>
                </div>
            </div>
        </UserProvider>
    );
}
