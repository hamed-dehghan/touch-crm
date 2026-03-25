// frontend/src/lib/formLayout.ts
/**
 * Shared layout tokens for RTL forms: fluid control column + fixed-width label strip on the right.
 * Keep arbitrary `grid-cols-[1fr_132px]` as a literal string so Tailwind can detect it.
 */

/** One grouped field row outer grid (add items-start, items-stretch, etc. as needed). */
export const formGroupedFieldGridOuter = 'grid grid-cols-[1fr_132px] overflow-visible bg-white';

/** Vertical gap between stacked fields. */
export const formFieldStackClass = 'space-y-4';

/** Responsive two-column field layout (e.g. task form). */
export const formTwoColumnClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';

/** Primary / secondary actions under fields. */
export const formActionsClass = 'flex flex-wrap gap-2';
