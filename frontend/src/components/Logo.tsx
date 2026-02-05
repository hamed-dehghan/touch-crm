'use client';

import Image from 'next/image';

const LOGO_SRC = '/logo.png';

/**
 * Logo image only (for Sidebar, favicon area, etc.).
 * Preserves the logo's natural aspect ratio (taller than wide).
 */
export function LogoIcon({
  className = '',
  width = 40,
  height = 56,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt=""
      width={width}
      height={height}
      className={`object-contain shrink-0 ${className}`}
      aria-hidden
      priority
    />
  );
}

/**
 * Full logo for login and other pages: image with optional "TOUCH CRM" text and slogan.
 */
export function Logo({
  showSlogan = true,
  showBrandName = true,
  iconClassName = 'text-[#D81B60]',
  className = '',
}: {
  showSlogan?: boolean;
  showBrandName?: boolean;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-3 mb-2">
        <LogoIcon width={48} height={68} className="shrink-0" />
        {showBrandName && (
          <span className="text-xl font-bold uppercase tracking-tight">
            <span className="text-foreground">TOUCH</span>{' '}
            <span className={iconClassName}>CRM</span>
          </span>
        )}
      </div>
      {showSlogan && (
        <p className="text-sm text-foreground/80">سیستم مدیریت ارتباط با مشتری تاچ</p>
      )}
    </div>
  );
}
