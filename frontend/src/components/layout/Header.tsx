'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { Button } from '@/components/ui/Button';
import { LogoIcon } from '@/components/Logo';

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const toggleMobileOpen = useSidebarStore((s) => s.toggleMobileOpen);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 border-b border-[var(--color-border)] bg-white px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileOpen}
          aria-label="منوی اصلی"
          className="md:hidden p-2 -m-2 rounded-lg text-foreground hover:bg-active-bg/50 transition-colors"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <LogoIcon width={32} height={44} className="w-8 h-auto shrink-0" />
          <span className="text-lg font-bold text-foreground">باشگاه مشتریان</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground hidden sm:inline">{user?.fullName ?? user?.username ?? ''}</span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          خروج
        </Button>
      </div>
    </header>
  );
}
