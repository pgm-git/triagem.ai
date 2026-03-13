'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserContextType {
    user: User | null;
    organizationId: string | null;
    organization: any | null;
    profile: { full_name: string; email: string; role: string } | null;
    loading: boolean;
    refreshOrganization: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: null,
    organizationId: null,
    organization: null,
    profile: null,
    loading: true,
    refreshOrganization: async () => { },
});

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [organization, setOrganization] = useState<any>(null);
    const [profile, setProfile] = useState<UserContextType['profile']>(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, email, role, organization_id')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setOrganizationId(profileData.organization_id);
                setProfile({
                    full_name: profileData.full_name,
                    email: profileData.email,
                    role: profileData.role,
                });

                // Fetch organization details
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', profileData.organization_id)
                    .single();

                if (orgData) {
                    setOrganization(orgData);
                }
            }
        }
        setLoading(false);
    };

    const refreshOrganization = async () => {
        if (!organizationId) return;
        const supabase = createClient();
        const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', organizationId)
            .single();
        if (orgData) setOrganization(orgData);
    };

    useEffect(() => {
        loadUser();

        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                setOrganizationId(null);
                setOrganization(null);
                setProfile(null);
            } else {
                loadUser();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, organizationId, organization, profile, loading, refreshOrganization }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
