// frontend/src/components/ui/AutocompleteSelect.tsx
'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { toEnglishDigits } from '@/utils/digits';
import { FieldMessages } from '@/components/ui/FieldFeedback';
import { formGroupedFieldGridOuter } from '@/lib/formLayout';

export interface AutocompleteOption {
  value: string;
  label: string;
  keywords?: string;
  disabled?: boolean;
  level?: number;
  isGroupHeader?: boolean;
}

interface AutocompleteSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  emptyOptionLabel?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  grouped?: boolean;
  error?: string;
  warning?: string;
  hint?: string;
}

export function AutocompleteSelect({
  label,
  value,
  onChange,
  options,
  placeholder = '-- انتخاب کنید --',
  emptyOptionLabel,
  searchPlaceholder = 'جستجو...',
  noResultsText = 'موردی یافت نشد.',
  className = '',
  disabled,
  required,
  grouped = false,
  error,
  warning,
  hint,
}: AutocompleteSelectProps) {
  const autoId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const allOptions = useMemo(
    () =>
      emptyOptionLabel
        ? [{ value: '', label: emptyOptionLabel }, ...options]
        : options,
    [emptyOptionLabel, options],
  );

  const selected = allOptions.find((o) => o.value === value) ?? null;
  const hasGroupedLabel = Boolean(label);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((opt) => {
      const haystack = `${opt.label} ${opt.keywords ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allOptions, query]);

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(-1);
      return;
    }
    const selectedIndex = filteredOptions.findIndex((o) => o.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : (filteredOptions.length > 0 ? 0 : -1));
  }, [open, filteredOptions, value]);

  useEffect(() => {
    if (!open || highlightedIndex < 0) return;
    optionsRef.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
  };

  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const closeDropdown = () => {
    setOpen(false);
    setHighlightedIndex(-1);
    setQuery('');
  };

  const moveHighlight = (delta: 1 | -1) => {
    if (filteredOptions.length === 0) {
      setHighlightedIndex(-1);
      return;
    }
    setHighlightedIndex((prev) => {
      if (prev < 0) return delta === 1 ? 0 : filteredOptions.length - 1;
      const next = prev + delta;
      if (next < 0) return filteredOptions.length - 1;
      if (next >= filteredOptions.length) return 0;
      return next;
    });
  };

  const selectHighlighted = () => {
    if (highlightedIndex < 0 || highlightedIndex >= filteredOptions.length) return;
    const selectedOption = filteredOptions[highlightedIndex];
    if (!selectedOption || selectedOption.disabled) return;
    selectOption(selectedOption.value);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const invalidBorder = error ? '!border-red-500' : warning ? '!border-amber-500' : '';
  const groupedLabelTriggerClass = `border-t border-l border-b border-[var(--color-border)] border-r-0 rounded-l-lg rounded-r-none bg-white shadow-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${invalidBorder}`;

  const triggerButtonClass = `h-10 w-full px-3 py-2 text-sm text-right text-foreground disabled:cursor-not-allowed disabled:opacity-60 ${
    hasGroupedLabel
      ? groupedLabelTriggerClass
      : grouped
        ? 'rounded-lg border-0 bg-transparent focus:outline-none focus:ring-0'
        : `rounded-lg border border-[var(--color-border)] bg-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${invalidBorder}`
  }`;
  const errorId = error ? `${autoId}-error` : undefined;

  const dropdownPanel = open && (
    <div className="relative">
      <div className="absolute z-30 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
        <div className="p-2 border-b border-[var(--color-border)]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(toEnglishDigits(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                moveHighlight(1);
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                moveHighlight(-1);
                return;
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                selectHighlighted();
                return;
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                closeDropdown();
                setTimeout(() => triggerRef.current?.focus(), 0);
              }
            }}
            placeholder={searchPlaceholder}
            data-dropdown-search
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="max-h-56 overflow-y-auto py-1" role="listbox">
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-foreground/60">{noResultsText}</p>
          ) : (
            filteredOptions.map((opt, index) => (
              <button
                key={`${opt.value}-${opt.label}`}
                ref={(el) => {
                  optionsRef.current[index] = el;
                }}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                disabled={opt.disabled}
                className={`block w-full px-3 py-2 text-right text-sm ${
                  opt.disabled
                    ? 'cursor-default bg-content-bg/70 text-foreground/60 font-medium'
                    : `hover:bg-active-bg/30 ${index === highlightedIndex || opt.value === value ? 'bg-active-bg/40 text-accent' : 'text-foreground'}`
                } ${opt.isGroupHeader ? 'border-t border-[var(--color-border)] first:border-t-0' : ''}`}
                onMouseEnter={() => {
                  if (!opt.disabled) setHighlightedIndex(index);
                }}
                onClick={() => {
                  if (!opt.disabled) selectOption(opt.value);
                }}
              >
                <span
                  className="block"
                  style={{ paddingInlineStart: `${Math.max(0, opt.level ?? 0) * 16}px` }}
                >
                  {opt.label}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const fieldColumn = (
    <div className="col-start-1 min-w-0" dir="rtl">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        className={triggerButtonClass}
        onClick={() => (open ? closeDropdown() : openDropdown())}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDropdown();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      >
        {selected?.label ?? placeholder}
      </button>
      {dropdownPanel}
    </div>
  );

  if (hasGroupedLabel) {
    return (
      <div className={`w-full ${className}`}>
        <div dir="ltr" className={`${formGroupedFieldGridOuter} items-stretch`} ref={wrapperRef}>
          {fieldColumn}
          <label
            dir="rtl"
            className={`col-start-2 row-start-1 flex h-10 min-h-10 items-center justify-end border-t border-r border-b rounded-r-lg bg-[#f8f8f8] px-3 text-right text-sm font-medium text-foreground/80 ${
              error ? 'border-red-500' : warning ? 'border-amber-500' : 'border-[var(--color-border)]'
            }`}
          >
            {label}
          </label>
        </div>
        <FieldMessages errorId={errorId} error={error} warning={warning} hint={hint} />
      </div>
    );
  }

  return (
    <>
      {/* Keep trigger as a direct child for `FieldGroup` styling (`div > button`). */}
      <div ref={wrapperRef} className={`w-full ${className}`}>
        {label && (
          <label dir="rtl" className="mb-1 block text-right text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          className={triggerButtonClass}
          onClick={() => (open ? closeDropdown() : openDropdown())}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openDropdown();
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        >
          {selected?.label ?? placeholder}
        </button>
        {dropdownPanel}
        <FieldMessages errorId={errorId} error={error} warning={warning} hint={hint} />
      </div>
    </>
  );
}
