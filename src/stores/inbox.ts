import { create } from 'zustand';

interface InboxStore {
    selectedConversationId: string | null;
    filters: {
        sectorId?: string;
        status?: string;
    };
    setSelected: (id: string | null) => void;
    setFilters: (filters: InboxStore['filters']) => void;
    clearFilters: () => void;
}

export const useInboxStore = create<InboxStore>((set) => ({
    selectedConversationId: null,
    filters: {},
    setSelected: (selectedConversationId) => set({ selectedConversationId }),
    setFilters: (filters) => set({ filters }),
    clearFilters: () => set({ filters: {} }),
}));
