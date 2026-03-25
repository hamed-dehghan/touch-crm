// backend/src/utils/validation.ts
import { ValidationError as YupValidationError } from 'yup';

/** One failing field from Yup (camelCase paths, e.g. phones[0].phoneNumber). */
export interface ValidationFieldDetail {
  field: string;
  message: string;
}

/** Map Yup ValidationError to stable, deduped field rows for API `error.details`. */
export function yupErrorsToDetails(error: YupValidationError): ValidationFieldDetail[] {
  const inner = error.inner?.filter((e) => e.message);
  if (inner?.length) {
    const seen = new Set<string>();
    const out: ValidationFieldDetail[] = [];
    for (const e of inner) {
      const field = e.path ?? '_form';
      const key = `${field}\0${e.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ field, message: e.message });
    }
    return out;
  }
  if (error.path) {
    return [{ field: error.path, message: error.message }];
  }
  return [{ field: '_form', message: error.message }];
}
