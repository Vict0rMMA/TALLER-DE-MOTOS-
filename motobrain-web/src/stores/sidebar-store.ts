import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      isCollapsed: false,
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setOpen: (isOpen) => set({ isOpen }),
      toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
    }),
    {
      name: 'motobrain-sidebar',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    },
  ),
);
