'use client';

import { useEffect } from 'react';
import { useUser } from '@/contexts/user-context';

export function ThemeInitializer() {
    const { organization } = useUser();

    useEffect(() => {
        if (!organization) return;

        const root = document.documentElement;

        // Map organization colors to the new brand-prefixed CSS variables
        if (organization.primary_color) {
            root.style.setProperty('--brand-primary', organization.primary_color);
        }

        if (organization.sidebar_color) {
            root.style.setProperty('--brand-sidebar', organization.sidebar_color);
        }

        // Potential for secondary color as well
        if (organization.secondary_color) {
            root.style.setProperty('--brand-secondary', organization.secondary_color);
        }
    }, [organization]);

    return null; // This component doesn't render anything
}
