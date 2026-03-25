// frontend/src/lib/validation/yupErrors.ts
import { ValidationError as YupValidationError } from 'yup';
import type { FieldErrorMap, ValidationFieldDetail } from './types';

function yupToDetails(error: YupValidationError): ValidationFieldDetail[] {
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

/** Turn Yup error into `{ [field]: message }` (first error per field). */
export function fieldErrorsFromYup(error: unknown): FieldErrorMap {
  if (!(error instanceof YupValidationError)) {
    return { _form: error instanceof Error ? error.message : 'اعتبارسنجی ناموفق بود.' };
  }
  const details = yupToDetails(error);
  const map: FieldErrorMap = {};
  for (const { field, message } of details) {
    if (map[field] == null) map[field] = message;
  }
  return map;
}

/** Run async Yup schema; returns field map on failure instead of throwing. */
export async function safeValidate<T>(
  schema: { validate(value: unknown, options?: object): Promise<T> },
  value: unknown
) {
  try {
    const data = await schema.validate(value, { abortEarly: false, stripUnknown: true });
    return { ok: true as const, data };
  } catch (e) {
    return { ok: false as const, fieldErrors: fieldErrorsFromYup(e) };
  }
}
