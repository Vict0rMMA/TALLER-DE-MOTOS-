import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      // Solo persistir la preferencia del sidebar de escritorio.
      // 'isOpen' es estado efímero de UI; persistirlo desincroniza la
      // hidratación SSR y deja el menú móvil sin abrir.
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    },
  ),
);
