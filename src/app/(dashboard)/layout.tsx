import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
    title: 'TriaGO',
    description: 'Dashboard operacional',
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppShell>{children}</AppShell>;
}
