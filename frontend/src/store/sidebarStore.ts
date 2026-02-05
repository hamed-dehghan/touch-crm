import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'panel-sidebar-collapsed';

type SidebarState = {
  /** Desktop: sidebar collapsed to icons-only */
  collapsed: boolean;
  /** Mobile: overlay menu open */
  mobileOpen: boolean;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
  setMobileOpen: (v: boolean) => void;
  toggleMobileOpen: () => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      setCollapsed: (v) => set({ collapsed: v }),
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      setMobileOpen: (v) => set({ mobileOpen: v }),
      toggleMobileOpen: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
    }),
    { name: STORAGE_KEY, partialize: (s) => ({ collapsed: s.collapsed }) }
  )
);
