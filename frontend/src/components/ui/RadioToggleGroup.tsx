// frontend/src/components/ui/RadioToggleGroup.tsx
'use client';

import { useId } from 'react';
import { formGroupedFieldGridOuter } from '@/lib/formLayout';

export interface RadioToggleOption {
  value: string;
  label: string;
}

interface RadioToggleGroupProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioToggleOption[];
  disabled?: boolean;
  className?: string;
}

export function RadioToggleGroup({
  label,
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}: RadioToggleGroupProps) {
  const groupId = useId();
  const hasGroupedLabel = Boolean(label);

  const controls = (
    <div
      role="radiogroup"
      aria-disabled={disabled}
      className={`grid h-10 w-full grid-cols-2 overflow-hidden ${
        hasGroupedLabel
          ? 'rounded-l-lg rounded-r-none border-t border-l border-b border-[var(--color-border)] border-r-0 bg-white'
          : 'rounded-lg border border-[var(--color-border)] bg-white'
      }`}
    >
      {options.map((opt, index) => {
        const checked = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={opt.label}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`h-full px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ${
              checked ? 'bg-[#e5e7eb] text-foreground' : 'bg-white text-foreground/85 hover:bg-active-bg/20'
            } ${index > 0 ? 'border-r border-[var(--color-border)]' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  if (!hasGroupedLabel) {
    return (
      <div id={groupId} className={`w-full ${className}`}>
        {controls}
      </div>
    );
  }

  return (
    <div
      id={groupId}
      dir="ltr"
      className={`w-full ${formGroupedFieldGridOuter} ${className}`}
    >
      <div dir="rtl" className="col-start-1">
        {controls}
      </div>
      <label
        dir="rtl"
        className="col-start-2 h-10 border-t border-r border-b border-[var(--color-border)] rounded-r-lg bg-[#f8f8f8] px-3 text-right text-sm font-medium text-foreground/80 flex items-center justify-end"
      >
        {label}
      </label>
    </div>
  );
}
