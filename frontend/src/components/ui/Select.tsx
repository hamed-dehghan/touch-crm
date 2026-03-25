'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { FieldMessages } from '@/components/ui/FieldFeedback';
import { formGroupedFieldGridOuter } from '@/lib/formLayout';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  warning?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, warning, hint, options, placeholder, id, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const selectId = id ?? label?.replace(/\s/g, '-').toLowerCase();
    const hasGroupedLabel = Boolean(label);
    const errorId = error ? `${selectId}-error` : undefined;
    const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;
    const invalidBorder = error ? '!border-red-500' : warning ? '!border-amber-500' : '';

    return (
      <div className="w-full">
        {hasGroupedLabel ? (
          <div dir="ltr" className={formGroupedFieldGridOuter}>
            <div dir="rtl" className="col-start-1">
              <select
                ref={ref}
                id={selectId}
                className={`block h-10 w-full border-t border-l border-b border-[var(--color-border)] border-r-0 rounded-l-lg rounded-r-none bg-white px-3 py-2 text-foreground shadow-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${invalidBorder} ${className}`}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                {...props}
              >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <label
              htmlFor={selectId}
              dir="rtl"
              className={`col-start-2 flex h-10 items-center justify-end border-t border-r border-b rounded-r-lg bg-[#f8f8f8] px-3 text-right text-sm font-medium text-foreground/80 ${
                error ? 'border-red-500' : warning ? 'border-amber-500' : 'border-[var(--color-border)]'
              }`}
            >
              {label}
            </label>
          </div>
        ) : (
          <select
            ref={ref}
            id={selectId}
            className={`block h-10 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-white ${
              error ? 'border-red-500' : warning ? 'border-amber-500' : ''
            } ${className}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        <FieldMessages errorId={errorId} error={error} warning={warning} hint={hint} />
      </div>
    );
  }
);
Select.displayName = 'Select';
export { Select };
