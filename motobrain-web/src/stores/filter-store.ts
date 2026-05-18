import { create } from 'zustand';

interface FilterState {
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  globalSearch: '',
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
}));
