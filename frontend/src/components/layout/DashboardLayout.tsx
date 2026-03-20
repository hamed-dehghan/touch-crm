'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useAuthHydrated } from '@/store/authStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AppDialogsProvider } from '@/components/ui/AppDialogs';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthHydrated();

  // Only redirect after the store has rehydrated from localStorage
  useEffect(() => {
    if (hydrated && token === null && pathname !== '/login') {
      router.replace('/login');
    }
  }, [hydrated, token, pathname, router]);

  if (pathname === '/login') {
    return <AppDialogsProvider>{children}</AppDialogsProvider>;
  }

  // Show loading while the store is rehydrating or token is not yet available
  if (!hydrated || !token) {
    return (
      <AppDialogsProvider>
        <div className="h-screen flex bg-content-bg overflow-hidden" dir="rtl">
          {/* Desktop sidebar skeleton */}
          <aside className="hidden md:flex flex-col h-screen w-56 border-l border-[var(--color-border)] bg-white shrink-0">
            <nav className="p-2 flex-1 overflow-y-auto">
              <ul className="space-y-0.5">
                {Array.from({ length: 11 }).map((_, i) => (
                  <li key={i}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
                      <div className="w-5 h-5 shrink-0 rounded bg-foreground/10 animate-pulse" />
                      <div className="h-4 flex-1 rounded bg-foreground/10 animate-pulse" />
                    </div>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-2 border-t border-[var(--color-border)] mt-auto shrink-0">
              <div className="w-full py-2 rounded-lg bg-foreground/10 animate-pulse" />
            </div>
          </aside>

          <div className="flex-1 flex flex-col min-w-0">
            {/* Header skeleton (matches Header.tsx height) */}
            <header className="h-14 border-b border-[var(--color-border)] bg-white px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-foreground/10 animate-pulse md:hidden" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-foreground/10 animate-pulse" />
                  <div className="h-5 w-48 rounded bg-foreground/10 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-36 rounded bg-foreground/10 animate-pulse hidden sm:inline" />
                <div className="h-8 w-20 rounded bg-foreground/10 animate-pulse" />
              </div>
            </header>

            <main className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4 max-w-3xl">
                <div className="h-6 w-2/3 rounded bg-foreground/10 animate-pulse" />
                <div className="h-4 w-full rounded bg-foreground/10 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-foreground/10 animate-pulse" />
                <div className="h-4 w-4/6 rounded bg-foreground/10 animate-pulse" />
                <div className="h-4 w-3/6 rounded bg-foreground/10 animate-pulse" />
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-lg bg-foreground/10 animate-pulse" />
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </AppDialogsProvider>
    );
  }

  return (
    <AppDialogsProvider>
      <div className="h-screen flex bg-content-bg overflow-hidden" dir="rtl">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="shrink-0">
            <Header />
          </div>
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AppDialogsProvider>
  );
}
