import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/entities';
import { clearAuthCookie, setAuthCookie } from '@/lib/utils';

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,
      setAuth: (user, token) => {
        setAuthCookie(token);
        set({ user, token });
      },
      logout: () => {
        clearAuthCookie();
        set({ user: null, token: null });
      },
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'motobrain-auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthCookie(state.token);
        state?.setHydrated();
      },
    },
  ),
);
