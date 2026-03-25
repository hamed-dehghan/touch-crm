'use client';

import { forwardRef, type InputHTMLAttributes, type ChangeEvent, type KeyboardEvent } from 'react';
import { toEnglishDigits } from '@/utils/digits';
import { FieldMessages } from '@/components/ui/FieldFeedback';
import { formGroupedFieldGridOuter } from '@/lib/formLayout';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  warning?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, warning, hint, id, onChange, onKeyDown, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const inputId = id ?? label?.replace(/\s/g, '-').toLowerCase();
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;
    const inputType = (props.type ?? 'text') as string;
    const autoComplete = props.autoComplete ?? '';
    const name = props.name ?? '';
    const placeholderText = (props.placeholder ?? '').toLowerCase();

    const labelText = (label ?? '').toLowerCase();
    const isUsername =
      /username/i.test(autoComplete) ||
      name === 'username' ||
      /کاربری/.test(labelText) ||
      /username/.test(labelText);
    const isWebsite =
      inputType === 'url' ||
      /url|website|web-site/i.test(autoComplete) ||
      /website|url|web-site/i.test(name) ||
      /https?:\/\/|www\./i.test(placeholderText) ||
      /وب.?سایت/.test(labelText) ||
      /website|url/.test(labelText);

    const isEmail =
      inputType === 'email' ||
      /email/.test(placeholderText) ||
      /ایمیل/.test(placeholderText) ||
      /email/.test(labelText) ||
      /ایمیل/.test(labelText);
    const isPassword = inputType === 'password';
    const isNumber = inputType === 'number';
    const isExplicitLtr = props.dir === 'ltr';

    const forceLtr = isUsername || isWebsite || isEmail || isPassword || isNumber || isExplicitLtr;
    const hasGroupedLabel = Boolean(label);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const nextValue = toEnglishDigits(e.target.value);
      if (nextValue === e.target.value) {
        onChange?.(e);
        return;
      }

      // Update the event with normalized value for parent-controlled state.
      const nextEvent = {
        ...e,
        target: { ...e.target, value: nextValue },
      } as ChangeEvent<HTMLInputElement>;
      onChange?.(nextEvent);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      // Normalize single-digit key presses (covers Persian/Arabic keyboards).
      if (!onChange) {
        onKeyDown?.(e);
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        onKeyDown?.(e);
        return;
      }

      const normalizedKey = toEnglishDigits(e.key);
      const isAsciiDigit = /^[0-9]$/.test(normalizedKey);

      if (normalizedKey !== e.key && isAsciiDigit) {
        e.preventDefault();

        const el = e.currentTarget;
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const nextValue = el.value.slice(0, start) + normalizedKey + el.value.slice(end);

        const changeEvent = {
          ...e,
          target: { ...el, value: nextValue },
        } as unknown as ChangeEvent<HTMLInputElement>;

        onChange(changeEvent);
        return;
      }

      onKeyDown?.(e);
    };

    const invalidBorder = error ? '!border-red-500' : warning ? '!border-amber-500' : '';
    const inputClass = `block h-10 w-full px-3 py-2 text-foreground placeholder-placeholder ${
      hasGroupedLabel
        ? `border-t border-l border-b border-[var(--color-border)] border-r-0 rounded-l-lg rounded-r-none bg-white shadow-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${invalidBorder}`
        : `rounded-lg border border-[var(--color-border)] bg-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${invalidBorder}`
    } ${className} ${
      forceLtr
        ? isWebsite || isExplicitLtr
          ? 'text-left placeholder:text-left placeholder:[direction:ltr]'
          : 'text-left placeholder:text-right placeholder:[direction:rtl]'
        : ''
    }`;

    return (
      <div className="w-full">
        {hasGroupedLabel ? (
          <div dir="ltr" className={formGroupedFieldGridOuter}>
            <div dir="rtl" className="col-start-1">
              <input
                ref={ref}
                id={inputId}
                dir={forceLtr ? 'ltr' : undefined}
                className={inputClass}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                {...props}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <label
              htmlFor={inputId}
              dir="rtl"
              className={`col-start-2 h-10 border-t border-r border-b rounded-r-lg bg-[#f8f8f8] px-3 text-right text-sm font-medium text-foreground/80 flex items-center justify-end ${
                error ? 'border-red-500' : warning ? 'border-amber-500' : 'border-[var(--color-border)]'
              }`}
            >
              {label}
            </label>
          </div>
        ) : (
          <input
            ref={ref}
            id={inputId}
            dir={forceLtr ? 'ltr' : undefined}
            className={inputClass}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...props}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        )}
        <FieldMessages errorId={errorId} error={error} warning={warning} hint={hint} />
      </div>
    );
  }
);
Input.displayName = 'Input';
export { Input };
