'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token === null && pathname !== '/login') {
      router.replace('/login');
    }
  }, [token, pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-content-bg">
        <div className="animate-pulse text-foreground/70">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-content-bg" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
