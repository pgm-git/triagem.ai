import { create } from 'zustand';
import type { WizardData } from '@/types';

interface SetupStore {
    currentStep: 1 | 2 | 3 | 4 | 5;
    data: Partial<WizardData>;
    setupComplete: boolean;
    setStep: (step: 1 | 2 | 3 | 4 | 5) => void;
    updateData: (data: Partial<WizardData>) => void;
    reset: () => void;
    markComplete: () => void;
}

export const useSetupStore = create<SetupStore>((set) => ({
    currentStep: 1,
    data: {},
    setupComplete: false,
    setStep: (currentStep) => set({ currentStep }),
    updateData: (newData) =>
        set((state) => ({ data: { ...state.data, ...newData } })),
    reset: () => set({ currentStep: 1, data: {}, setupComplete: false }),
    markComplete: () => set({ setupComplete: true }),
}));
