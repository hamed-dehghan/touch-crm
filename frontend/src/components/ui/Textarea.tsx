'use client';

import { forwardRef, type TextareaHTMLAttributes, type ChangeEvent } from 'react';
import { toEnglishDigits } from '@/utils/digits';
import { FieldMessages } from '@/components/ui/FieldFeedback';
import { formGroupedFieldGridOuter } from '@/lib/formLayout';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  warning?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, warning, hint, id, onChange, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const textareaId = id ?? label?.replace(/\s/g, '-').toLowerCase();
    const hasGroupedLabel = Boolean(label);
    const errorId = error ? `${textareaId}-error` : undefined;
    const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;
    const invalidBorder = error ? '!border-red-500' : warning ? '!border-amber-500' : '';

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = toEnglishDigits(e.target.value);
      if (nextValue === e.target.value) {
        onChange?.(e);
        return;
      }

      const nextEvent = {
        ...e,
        target: { ...e.target, value: nextValue },
      } as ChangeEvent<HTMLTextAreaElement>;
      onChange?.(nextEvent);
    };

    return (
      <div className="w-full">
        {hasGroupedLabel ? (
          <div dir="ltr" className={`${formGroupedFieldGridOuter} items-stretch`}>
            <div dir="rtl" className="col-start-1">
              <textarea
                ref={ref}
                id={textareaId}
                rows={3}
                className={`block w-full resize-y border-t border-l border-b border-[var(--color-border)] border-r-0 rounded-l-lg rounded-r-none bg-white px-3 py-2 text-foreground placeholder-placeholder shadow-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${invalidBorder} ${className}`}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                {...props}
                onChange={handleChange}
              />
            </div>
            <label
              htmlFor={textareaId}
              dir="rtl"
              className={`col-start-2 border-t border-r border-b rounded-r-lg bg-[#f8f8f8] px-3 py-2 text-right text-sm font-medium text-foreground/80 flex items-start justify-end ${
                error ? 'border-red-500' : warning ? 'border-amber-500' : 'border-[var(--color-border)]'
              }`}
            >
              {label}
            </label>
          </div>
        ) : (
          <textarea
            ref={ref}
            id={textareaId}
            rows={3}
            className={`block w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-y ${
              error ? 'border-red-500' : warning ? 'border-amber-500' : ''
            } ${className}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...props}
            onChange={handleChange}
          />
        )}
        <FieldMessages errorId={errorId} error={error} warning={warning} hint={hint} />
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
export { Textarea };
