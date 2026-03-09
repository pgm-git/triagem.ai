import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Configuração — TriaGO',
    description: 'Configure seu TriaGO em 5 passos',
};

export default function SetupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {children}
            </div>
        </div>
    );
}
