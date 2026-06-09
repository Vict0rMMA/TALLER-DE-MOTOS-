import { create } from 'zustand';

interface SplashState {
  active: boolean;
  activate: () => void;
  dismiss: () => void;
}

export const useSplashStore = create<SplashState>((set) => ({
  active: false,
  activate: () => set({ active: true }),
  dismiss: () => set({ active: false }),
}));
