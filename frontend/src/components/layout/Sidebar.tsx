'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoIcon } from '@/components/Logo';
import { useSidebarStore } from '@/store/sidebarStore';

type IconName = 'home' | 'users' | 'cart' | 'box' | 'tag' | 'megaphone' | 'receipt' | 'levels' | 'tasks' | 'projects' | 'worklogs' | 'settings' | 'shield';

const navItems: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'نگاه کلی', icon: 'home' },
  { href: '/customers', label: 'مشتریان', icon: 'users' },
  { href: '/orders', label: 'سفارشات', icon: 'cart' },
  { href: '/products', label: 'محصولات', icon: 'box' },
  { href: '/transactions', label: 'تراکنش‌ها', icon: 'receipt' },
  { href: '/promotions', label: 'تخفیف‌ها', icon: 'tag' },
  { href: '/campaigns', label: 'کمپین‌ها', icon: 'megaphone' },
  { href: '/projects', label: 'پروژه‌ها', icon: 'projects' },
  { href: '/tasks', label: 'وظایف', icon: 'tasks' },
  { href: '/worklogs', label: 'گزارش کار', icon: 'worklogs' },
  { href: '/settings/levels', label: 'سطوح وفاداری', icon: 'levels' },
  { href: '/settings/users', label: 'کاربران', icon: 'settings' },
  { href: '/settings/roles', label: 'نقش‌ها', icon: 'shield' },
];

function NavIcon({
  name,
  className,
  active,
}: {
  name: IconName;
  className?: string;
  active?: boolean;
}) {
  const c = active ? 'text-primary' : 'text-foreground';
  const cls = `${c} ${className ?? ''}`.trim();
  const w = 'w-5 h-5 shrink-0';
  switch (name) {
    case 'home':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
      );
    case 'users':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case 'cart':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
        </svg>
      );
    case 'box':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
        </svg>
      );
    case 'tag':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <path d="M7 7h.01" />
        </svg>
      );
    case 'megaphone':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 11l18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 11-5.8-1.6" />
        </svg>
      );
    case 'receipt':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
    case 'levels':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case 'tasks':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      );
    case 'projects':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      );
    case 'worklogs':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    case 'shield':
      return (
        <svg className={`${w} ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return null;
  }
}

function SidebarContent({
  collapsed,
  showLabels,
  pathname,
}: {
  collapsed: boolean;
  showLabels: boolean;
  pathname: string;
}) {
  const isCollapsed = collapsed && showLabels === false;

  return (
    <>
      <div className={`p-4 border-b border-[var(--color-border)] flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
        <LogoIcon width={32} height={44} className="w-8 h-auto shrink-0" />
        {!isCollapsed && (
          <span className="text-lg font-bold text-foreground truncate">باشگاه مشتریان</span>
        )}
      </div>
      <nav className="p-2 flex-1 overflow-hidden">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const linkClass = `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-active-bg text-primary' : 'text-foreground hover:bg-active-bg/50'
            } ${isCollapsed ? 'justify-center' : ''}`;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative ${isCollapsed ? 'flex justify-center' : ''}`}
                >
                  <span className={linkClass}>
                    <NavIcon name={item.icon} active={isActive} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {/* Hover tooltip when collapsed (desktop) — left of sidebar in RTL = toward content */}
                  {isCollapsed && (
                    <span
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-full ml-2 px-2 py-1 rounded bg-foreground text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow"
                      aria-hidden
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarStore();

  // Close mobile overlay on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      <div
        role="button"
        tabIndex={0}
        aria-label="بستن منو"
        onClick={() => setMobileOpen(false)}
        onKeyDown={(e) => e.key === 'Enter' && setMobileOpen(false)}
        className={`fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile drawer (icons + labels when open) */}
      <aside
        className={`fixed top-0 bottom-0 z-50 w-56 border-l border-[var(--color-border)] bg-white flex flex-col transition-transform duration-200 ease-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ right: 0 }}
      >
        <SidebarContent collapsed={false} showLabels={true} pathname={pathname} />
      </aside>

      {/* Desktop sidebar (in flow, collapsible) */}
      <aside
        className={`hidden md:flex flex-col min-h-screen border-l border-[var(--color-border)] bg-white shrink-0 transition-[width] duration-200 ease-out ${
          collapsed ? 'w-[4.5rem]' : 'w-56'
        }`}
      >
        <SidebarContent collapsed={collapsed} showLabels={!collapsed} pathname={pathname} />
        <div className="p-2 border-t border-[var(--color-border)]">
          <ToggleButton collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}

function ToggleButton({ collapsed }: { collapsed: boolean }) {
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);

  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      aria-label={collapsed ? 'باز کردن منو' : 'بستن منو'}
      className="flex items-center justify-center w-full py-2 rounded-lg text-foreground hover:bg-active-bg/50 transition-colors"
    >
      {collapsed ? (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  );
}
