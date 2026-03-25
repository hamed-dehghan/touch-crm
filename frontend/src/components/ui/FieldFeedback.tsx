// frontend/src/components/ui/FieldFeedback.tsx
'use client';

import type { ReactNode } from 'react';

export type FieldFeedbackVariant = 'error' | 'warning' | 'hint';

const variantClass: Record<FieldFeedbackVariant, string> = {
  error: 'text-red-600',
  warning: 'text-amber-700',
  hint: 'text-foreground/65',
};

export function FieldFeedbackRow({
  id,
  variant,
  children,
}: {
  id?: string;
  variant: FieldFeedbackVariant;
  children: ReactNode;
}) {
  if (children == null || children === '') return null;
  return (
    <p
      id={id}
      className={`mt-1 text-sm leading-relaxed ${variantClass[variant]}`}
      role={variant === 'error' ? 'alert' : undefined}
    >
      {children}
    </p>
  );
}

export interface FieldMessagesProps {
  /** For `aria-describedby` on the control. */
  errorId?: string;
  error?: string;
  warning?: string;
  hint?: string;
}

/** Standard stack: errors always; warnings; hints only when no error (hints are supplementary). */
export function FieldMessages({ errorId, error, warning, hint }: FieldMessagesProps) {
  return (
    <>
      <FieldFeedbackRow id={errorId} variant="error" children={error} />
      <FieldFeedbackRow variant="warning" children={warning} />
      {!error && <FieldFeedbackRow variant="hint" children={hint} />}
    </>
  );
}
