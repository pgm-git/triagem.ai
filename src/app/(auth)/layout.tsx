import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'TriaGO',
    description: 'Login ou crie sua conta',
};

import { Suspense } from 'react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
            <div className="relative z-10 w-full max-w-md px-4">
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </div>
        </div>
    );
}
