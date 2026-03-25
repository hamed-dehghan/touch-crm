// frontend/src/components/ui/FormCheckboxRow.tsx
'use client';

import { useId } from 'react';
import { formGroupedFieldGridOuter } from '@/lib/formLayout';

export interface FormCheckboxRowProps {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

/** Checkbox aligned like grouped Input/Select: control left, label strip right. */
export function FormCheckboxRow({ label, checked, onChange, disabled }: FormCheckboxRowProps) {
  const id = useId();
  return (
    <div dir="ltr" className={`${formGroupedFieldGridOuter} w-full items-stretch`}>
      <div
        dir="rtl"
        className="col-start-1 flex min-h-10 items-center border-t border-l border-b border-r-0 border-[var(--color-border)] rounded-l-lg rounded-r-none bg-white px-3"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 shrink-0 rounded border-[var(--color-border)] text-accent focus:ring-accent disabled:opacity-60"
          aria-label={label}
        />
      </div>
      <label
        htmlFor={id}
        dir="rtl"
        className="col-start-2 flex h-10 min-h-10 cursor-pointer items-center justify-end border-t border-r border-b border-[var(--color-border)] rounded-r-lg bg-[#f8f8f8] px-3 text-right text-sm font-medium text-foreground/80"
      >
        {label}
      </label>
    </div>
  );
}
