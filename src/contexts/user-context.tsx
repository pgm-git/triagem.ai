'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserContextType {
    user: User | null;
    organizationId: string | null;
    profile: { full_name: string; email: string; role: string } | null;
    loading: boolean;
}

const UserContext = createContext<UserContextType>({
    user: null,
    organizationId: null,
    profile: null,
    loading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserContextType['profile']>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        const loadUser = async () => {
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
                }
            }
            setLoading(false);
        };

        loadUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                setOrganizationId(null);
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, organizationId, profile, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
