import { create } from 'zustand';
import type { Profile, Organization, Membership } from '@/types';

interface AuthStore {
    user: Profile | null;
    currentOrg: Organization | null;
    memberships: Membership[];
    setUser: (user: Profile | null) => void;
    setCurrentOrg: (org: Organization | null) => void;
    setMemberships: (memberships: Membership[]) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    currentOrg: null,
    memberships: [],
    setUser: (user) => set({ user }),
    setCurrentOrg: (currentOrg) => set({ currentOrg }),
    setMemberships: (memberships) => set({ memberships }),
    logout: () => set({ user: null, currentOrg: null, memberships: [] }),
}));
