// frontend/src/lib/validation/types.ts

/** Matches backend `ValidationFieldDetail` / API error.details entries. */
export interface ValidationFieldDetail {
  field: string;
  message: string;
}

/** First message per field path (Yup path or API field key). */
export type FieldErrorMap = Record<string, string>;
