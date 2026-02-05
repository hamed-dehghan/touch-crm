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

/**
 * Converts Gregorian YYYY-MM-DD string to DateObject (Gregorian) for the picker.
 * The picker displays in Persian but we store/send Gregorian to the API.
 */
function parseGregorianDate(value: string | undefined): DateObject | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  try {
    const d = new DateObject({ date: value, calendar: gregorian, locale: gregorianFa });
    return (d as DateObject & { isValid?: boolean }).isValid !== false ? d : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Converts DateObject from picker (Persian) to Gregorian YYYY-MM-DD.
 */
function toGregorianDateString(date: DateObject): string {
  return date.convert(gregorian, gregorianFa).format('YYYY-MM-DD');
}

/**
 * Converts Gregorian date-time string (YYYY-MM-DD or ISO) to DateObject.
 */
function parseGregorianDateTime(value: string | undefined): DateObject | undefined {
  if (!value) return undefined;
  try {
    const d = new DateObject({ date: value, calendar: gregorian, locale: gregorianFa });
    return (d as DateObject & { isValid?: boolean }).isValid !== false ? d : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Converts DateObject to ISO date-time string (YYYY-MM-DDTHH:mm:ss).
 */
function toGregorianDateTimeString(date: DateObject): string {
  return date.convert(gregorian, gregorianFa).format('YYYY-MM-DDTHH:mm:ss');
}

export interface PersianDatePickerProps {
  /** Gregorian date string YYYY-MM-DD (API format) */
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  /** RTL-friendly container class */
  className?: string;
}

/**
 * Persian (Jalali) date picker. Value/onChange use Gregorian YYYY-MM-DD for API compatibility.
 */
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

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <DatePickerLib
        id={id}
        className="rmdp-prime"
        containerClassName="w-full"
        inputClass={`block w-full rounded-lg border px-3 py-2 text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:pointer-events-none ${error ? 'border-red-500' : 'border-[var(--color-border)]'}`}
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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export interface PersianDateTimePickerProps {
  /** Gregorian date-time string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss) */
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  hideSeconds?: boolean;
  className?: string;
}

/**
 * Persian (Jalali) date + time picker. Value/onChange use Gregorian ISO-like string (YYYY-MM-DDTHH:mm:ss).
 */
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

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <DatePickerLib
        id={id}
        className="rmdp-prime"
        containerClassName="w-full"
        inputClass={`block w-full rounded-lg border px-3 py-2 text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:pointer-events-none ${error ? 'border-red-500' : 'border-[var(--color-border)]'}`}
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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
