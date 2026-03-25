// frontend/src/components/ui/FormMessageBox.tsx
'use client';

export type FormMessageVariant = 'error' | 'warning' | 'info' | 'success';

const variantStyles: Record<
  FormMessageVariant,
  { wrap: string; icon: string; live: 'assertive' | 'polite' }
> = {
  error: {
    wrap: 'border-red-200 bg-red-50 text-red-900',
    icon: 'text-red-600',
    live: 'assertive',
  },
  warning: {
    wrap: 'border-amber-200 bg-amber-50 text-amber-950',
    icon: 'text-amber-600',
    live: 'polite',
  },
  info: {
    wrap: 'border-sky-200 bg-sky-50 text-sky-950',
    icon: 'text-sky-600',
    live: 'polite',
  },
  success: {
    wrap: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    icon: 'text-emerald-600',
    live: 'polite',
  },
};

function BannerIcon({ variant, className }: { variant: FormMessageVariant; className?: string }) {
  const c = className ?? 'h-5 w-5 shrink-0';
  switch (variant) {
    case 'success':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      );
    case 'info':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
      );
    case 'error':
    default:
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      );
  }
}

export interface FormMessageBoxProps {
  variant: FormMessageVariant;
  /** Main text (can include line breaks from API messages). */
  message: string;
  title?: string;
  className?: string;
  onDismiss?: () => void;
}

/** Form-level alert: errors, warnings, neutral info, or success. */
export function FormMessageBox({ variant, message, title, className = '', onDismiss }: FormMessageBoxProps) {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const v = variantStyles[variant];

  return (
    <div
      role="status"
      aria-live={v.live}
      className={`rounded-lg border px-3 py-3 text-sm shadow-sm ${v.wrap} ${className}`}
    >
      <div className="flex gap-2">
        <BannerIcon variant={variant} className={`h-5 w-5 shrink-0 ${v.icon}`} />
        <div className="min-w-0 flex-1 space-y-1">
          {title ? <p className="font-semibold">{title}</p> : null}
          <p className="whitespace-pre-wrap leading-relaxed">{trimmed}</p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded p-1 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current/30"
            aria-label="بستن"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
