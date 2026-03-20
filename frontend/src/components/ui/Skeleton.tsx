'use client';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-foreground/10 ${className}`} aria-hidden="true" />;
}

