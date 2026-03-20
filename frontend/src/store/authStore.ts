'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);

/**
 * Hook that returns true once the auth store has finished rehydrating from localStorage.
 * During SSR and the first client render the persisted state is not yet available,
 * so components should show a loading state until this returns true.
 */
export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // `persist` may be undefined in some environments (e.g. during SSR or
    // if the middleware API shape changes), so guard all access to it.
    const persistApi = (useAuthStore as typeof useAuthStore & {
      persist?: {
        hasHydrated: () => boolean;
        onFinishHydration: (cb: () => void) => () => void;
      };
    }).persist;

    if (!persistApi) {
      // If persistence API is not available, treat the store as already hydrated
      setHydrated(true);
      return;
    }

    if (persistApi.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const unsub = persistApi.onFinishHydration(() => {
      setHydrated(true);
    });

    return unsub;
  }, []);

  return hydrated;
}
