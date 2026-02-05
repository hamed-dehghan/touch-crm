import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persianFa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorianFa from 'react-date-object/locales/gregorian_fa';

/**
 * Parses a Gregorian date (string or Date) into a DateObject.
 * Accepts: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, ISO string, or Date.
 */
function parseGregorian(value: string | Date | undefined | null): DateObject | null {
  if (value == null || value === '') return null;
  try {
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
 * @param value - Gregorian date string (YYYY-MM-DD or ISO) or Date
 * @param includeTime - If true, include time (HH:mm); default false
 */
export function formatGregorianToJalali(
  value: string | Date | undefined | null,
  includeTime = false
): string {
  const d = parseGregorian(value);
  if (!d) return '';
  const jalali = d.convert(persian, persianFa);
  return includeTime ? jalali.format('YYYY/MM/DD HH:mm') : jalali.format('YYYY/MM/DD');
}
