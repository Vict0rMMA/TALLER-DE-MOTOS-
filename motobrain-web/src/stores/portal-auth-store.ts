import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PortalCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  workshopId: string;
}

interface PortalAuthState {
  customer: PortalCustomer | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (customer: PortalCustomer, token: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const usePortalAuthStore = create<PortalAuthState>()(
  persist(
    (set) => ({
      customer: null,
      token: null,
      isHydrated: false,
      setAuth: (customer, token) => {
        if (typeof document !== 'undefined') {
          document.cookie = `motobrain_portal_token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        }
        set({ customer, token });
      },
      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'motobrain_portal_token=; path=/; max-age=0';
        }
        set({ customer: null, token: null });
      },
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'motobrain-portal-auth',
      partialize: (s) => ({ customer: s.customer, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && typeof document !== 'undefined') {
          document.cookie = `motobrain_portal_token=${state.token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        }
        state?.setHydrated();
      },
    },
  ),
);
