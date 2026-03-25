// frontend/src/lib/validation/apiFieldErrors.ts
import type { ApiResponse } from '@/types/api';
import type { FieldErrorMap } from './types';

type ApiErrorDetails = NonNullable<NonNullable<ApiResponse<unknown>['error']>['details']>;

/** Map API `error.details` array to input keys for inline messages. */
export function fieldErrorsFromApiDetails(details: ApiErrorDetails | undefined): FieldErrorMap {
  if (!details) return {};
  if (!Array.isArray(details)) return {};

  const map: FieldErrorMap = {};
  for (const item of details) {
    if (typeof item === 'string') {
      if (map._form == null) map._form = item;
      continue;
    }
    const field = item.field?.trim() ? item.field.trim() : '_form';
    if (map[field] == null) map[field] = item.message;
  }
  return map;
}
