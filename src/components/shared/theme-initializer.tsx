'use client';

import { useEffect } from 'react';
import { useUser } from '@/contexts/user-context';

export function ThemeInitializer() {
    const { organization } = useUser();

    useEffect(() => {
        if (!organization) return;

        const root = document.documentElement;

        // Map organization colors to CSS variables
        if (organization.primary_color) {
            root.style.setProperty('--primary', organization.primary_color);
            // Also update a "glow" version or similar if needed
            root.style.setProperty('--primary-glow', `${organization.primary_color}33`); // 20% alpha
        }

        if (organization.sidebar_color) {
            root.style.setProperty('--sidebar-bg', organization.sidebar_color);
        }

        // We can add more mappings here as the design system evolves
    }, [organization]);

    return null; // This component doesn't render anything
}
