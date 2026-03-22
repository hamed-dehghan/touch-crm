// frontend/src/utils/date.ts — Jalali display helpers; API values stay Gregorian/ISO.
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persianFa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorianFa from 'react-date-object/locales/gregorian_fa';

/**
 * Parses a Gregorian instant (string, Date, or Unix ms) into a DateObject.
 * Accepts: YYYY-MM-DD, ISO string, Date, or number (milliseconds since epoch).
 */
function parseGregorian(value: string | Date | number | undefined | null): DateObject | null {
  if (value == null || value === '') return null;
  try {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const d = new DateObject({ date: new Date(value), calendar: gregorian, locale: gregorianFa });
      return (d as DateObject & { isValid?: boolean }).isValid !== false ? d : null;
    }
    const d =
      typeof value === 'string'
        ? new DateObject({ date: value, calendar: gregorian, locale: gregorianFa })
        : new DateObject({ date: value, calendar: gregorian, locale: gregorianFa });
    return (d as DateObject & { isValid?: boolean }).isValid !== false ? d : null;
  } catch {
    return null;
  }
}

/**
 * Formats a Gregorian date for display in Jalali (Persian) calendar.
 * Returns empty string if value is invalid.
 * @param value - Gregorian date string (YYYY-MM-DD or ISO), Date, or Unix ms
 * @param includeTime - If true, include time (HH:mm); default false (date-only)
 */
export function formatGregorianToJalali(
  value: string | Date | number | undefined | null,
  includeTime = false
): string {
  const d = parseGregorian(value);
  if (!d) return '';
  const jalali = d.convert(persian, persianFa);
  return includeTime ? jalali.format('YYYY/MM/DD HH:mm') : jalali.format('YYYY/MM/DD');
}

/** Alias: format API timestamps or date strings as Jalali (date-only by default). */
export const formatApiTimestampToJalali = formatGregorianToJalali;
