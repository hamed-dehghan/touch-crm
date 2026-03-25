'use client';

import { useId } from 'react';
import DatePickerLib from 'react-multi-date-picker';
import 'react-multi-date-picker/styles/layouts/prime.css';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persianFa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorianFa from 'react-date-object/locales/gregorian_fa';
import { formGroupedFieldGridOuter } from '@/lib/formLayout';

function parseGregorianDate(value: string | undefined): DateObject | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  try {
    const d = new DateObject({ date: value, calendar: gregorian, locale: gregorianFa });
    return (d as DateObject & { isValid?: boolean }).isValid !== false ? d : undefined;
  } catch {
    return undefined;
  }
}

function toGregorianDateString(date: DateObject): string {
  return date.convert(gregorian, gregorianFa).format('YYYY-MM-DD');
}

function parseGregorianDateTime(value: string | undefined): DateObject | undefined {
  if (!value) return undefined;
  try {
    const d = new DateObject({ date: value, calendar: gregorian, locale: gregorianFa });
    return (d as DateObject & { isValid?: boolean }).isValid !== false ? d : undefined;
  } catch {
    return undefined;
  }
}

function toGregorianDateTimeString(date: DateObject): string {
  return date.convert(gregorian, gregorianFa).format('YYYY-MM-DDTHH:mm:ss');
}

export interface PersianDatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function PersianDatePicker({
  value,
  onChange,
  label,
  error,
  disabled,
  placeholder = 'انتخاب تاریخ',
  className = '',
}: PersianDatePickerProps) {
  const id = useId();
  const dateValue = parseGregorianDate(value);
  const hasGroupedLabel = Boolean(label);

  const picker = (
    <DatePickerLib
      id={id}
      className="rmdp-prime"
      containerClassName={`w-full ${hasGroupedLabel ? 'col-start-1' : ''}`}
      inputClass={`block h-10 w-full px-3 py-2 text-foreground placeholder-placeholder disabled:pointer-events-none disabled:opacity-50 ${
        hasGroupedLabel
          ? 'border-t border-l border-b border-[var(--color-border)] border-r-0 rounded-l-lg rounded-r-none bg-white shadow-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
          : `${error ? 'border-red-500' : 'border-[var(--color-border)]'} rounded-lg border bg-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent`
      }`}
      calendar={persian}
      locale={persianFa}
      value={dateValue ?? null}
      onChange={(d: DateObject | null) => {
        if (d) onChange?.(toGregorianDateString(d));
        else onChange?.('');
      }}
      format="YYYY/MM/DD"
      placeholder={placeholder}
      disabled={disabled}
      calendarPosition="bottom-right"
      showOtherDays
      arrow={false}
    />
  );

  const labelEl = label && (
    <label
      htmlFor={id}
      dir="rtl"
      className={`text-right text-sm font-medium text-foreground/80 ${
        hasGroupedLabel
          ? `col-start-2 row-start-1 flex h-10 min-h-10 items-center justify-end border-t border-r border-b rounded-r-lg bg-[#f8f8f8] px-3 ${
              error ? 'border-red-500' : 'border-[var(--color-border)]'
            }`
          : 'mb-1 block text-foreground'
      }`}
    >
      {label}
    </label>
  );

  return (
    <div className={`w-full ${className}`}>
      {hasGroupedLabel ? (
        <div dir="ltr" className={`${formGroupedFieldGridOuter} items-stretch`}>
          {picker}
          {labelEl}
        </div>
      ) : (
        <>
          {labelEl}
          {picker}
        </>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export interface PersianDateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  hideSeconds?: boolean;
  className?: string;
}

export function PersianDateTimePicker({
  value,
  onChange,
  label,
  error,
  disabled,
  placeholder = 'انتخاب تاریخ و زمان',
  hideSeconds = true,
  className = '',
}: PersianDateTimePickerProps) {
  const id = useId();
  const dateValue = parseGregorianDateTime(value);
  const hasGroupedLabel = Boolean(label);

  const picker = (
    <DatePickerLib
      id={id}
      className="rmdp-prime"
      containerClassName={`w-full ${hasGroupedLabel ? 'col-start-1' : ''}`}
      inputClass={`block h-10 w-full px-3 py-2 text-foreground placeholder-placeholder disabled:pointer-events-none disabled:opacity-50 ${
        hasGroupedLabel
          ? 'border-t border-l border-b border-[var(--color-border)] border-r-0 rounded-l-lg rounded-r-none bg-white shadow-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
          : `${error ? 'border-red-500' : 'border-[var(--color-border)]'} rounded-lg border bg-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent`
      }`}
      calendar={persian}
      locale={persianFa}
      value={dateValue ?? null}
      onChange={(d: DateObject | null) => {
        if (d) onChange?.(toGregorianDateTimeString(d));
        else onChange?.('');
      }}
      format="YYYY/MM/DD HH:mm"
      placeholder={placeholder}
      disabled={disabled}
      calendarPosition="bottom-right"
      showOtherDays
      arrow={false}
      plugins={[<TimePicker key="time" position="bottom" hideSeconds={hideSeconds} />]}
    />
  );

  const labelEl = label && (
    <label
      htmlFor={id}
      dir="rtl"
      className={`text-right text-sm font-medium text-foreground/80 ${
        hasGroupedLabel
          ? `col-start-2 row-start-1 flex h-10 min-h-10 items-center justify-end border-t border-r border-b rounded-r-lg bg-[#f8f8f8] px-3 ${
              error ? 'border-red-500' : 'border-[var(--color-border)]'
            }`
          : 'mb-1 block text-foreground'
      }`}
    >
      {label}
    </label>
  );

  return (
    <div className={`w-full ${className}`}>
      {hasGroupedLabel ? (
        <div dir="ltr" className={`${formGroupedFieldGridOuter} items-stretch`}>
          {picker}
          {labelEl}
        </div>
      ) : (
        <>
          {labelEl}
          {picker}
        </>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
