// frontend/src/utils/digits.ts
/**
 * Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII digits (0-9).
 * Keeps all non-digit characters intact (e.g. `/`, `.` , `-`).
 */
export function toEnglishDigits(input: string): string {
  if (!input) return input;

  // Persian digits: ۰۱۲۳۴۵۶۷۸۹
  const faDigits = '۰۱۲۳۴۵۶۷۸۹';
  // Arabic-Indic digits: ٠١٢٣٤٥٦٧٨٩
  const arDigits = '٠١٢٣٤٥٦٧٨٩';

  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const faIdx = faDigits.indexOf(ch);
    if (faIdx >= 0) {
      out += String(faIdx);
      continue;
    }
    const arIdx = arDigits.indexOf(ch);
    if (arIdx >= 0) {
      out += String(arIdx);
      continue;
    }
    out += ch;
  }
  return out;
}

/**
 * Converts ASCII digits (0-9) to Persian digits (۰-۹).
 * Useful when you want to display numbers in Persian style.
 */
export function toPersianDigits(input: string): string {
  if (!input) return input;
  const en = '0123456789';
  const fa = '۰۱۲۳۴۵۶۷۸۹';

  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const idx = en.indexOf(ch);
    out += idx >= 0 ? fa[idx]! : ch;
  }
  return out;
}

