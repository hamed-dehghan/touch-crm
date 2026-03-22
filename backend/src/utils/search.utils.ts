// backend/src/utils/search.utils.ts
import { Op } from 'sequelize';

/** Max length for basic search string `q` / `search` to limit query cost. */
export const MAX_SEARCH_QUERY_LENGTH = 200;

/** Default and max page size caps for list endpoints. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Escape `%`, `_`, and `\` for PostgreSQL ILIKE patterns (use with iLike, not LIKE).
 */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** Wrap user input as a case-insensitive substring pattern. */
export function wrapIlike(term: string): string {
  return `%${escapeIlikePattern(term)}%`;
}

/**
 * Read basic search from `q` (preferred) or `search` (legacy). Returns undefined if empty.
 */
export function getBasicSearchString(query: Record<string, unknown>): string | undefined {
  const raw = query.q !== undefined ? query.q : query.search;
  if (raw === undefined || raw === null) return undefined;
  const s = String(Array.isArray(raw) ? raw[0] : raw).trim();
  if (!s) return undefined;
  return s.slice(0, MAX_SEARCH_QUERY_LENGTH);
}

/** Build `{ [Op.or]: [{ col: { iLike } }, ...] }` for Sequelize. */
export function orILike(columns: string[], term: string): { [Op.or]: Record<string, unknown>[] } {
  const pattern = wrapIlike(term);
  return {
    [Op.or]: columns.map((col) => ({ [col]: { [Op.iLike]: pattern } })),
  };
}

export function parsePagination(
  query: Record<string, unknown>,
  defaults: { page: number; limit: number } = { page: 1, limit: DEFAULT_PAGE_SIZE }
): { page: number; limit: number; offset: number } {
  const pageRaw = parseInt(String(query.page ?? defaults.page), 10);
  const limitRaw = parseInt(String(query.limit ?? defaults.limit), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : defaults.page;
  const limitUncapped = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : defaults.limit;
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, limitUncapped));
  return { page, limit, offset: (page - 1) * limit };
}

/** True if the string is only digits (safe to use as integer id match). */
export function isDigitsOnly(s: string): boolean {
  return /^\d+$/.test(s);
}

/**
 * Append a date-only range on `field` (column name as in DB/Sequelize model).
 * Inclusive: `dateFrom` start of day, `dateTo` end of day (local).
 */
export function dateRangeOnField(
  field: string,
  dateFrom?: string,
  dateTo?: string
): Record<string, unknown> | undefined {
  if (!dateFrom && !dateTo) return undefined;
  const bounds: Record<string | symbol, Date> = {};
  if (dateFrom) {
    const d = new Date(dateFrom);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      bounds[Op.gte] = d;
    }
  }
  if (dateTo) {
    const d = new Date(dateTo);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      bounds[Op.lte] = d;
    }
  }
  if (Object.keys(bounds).length === 0) return undefined;
  return { [field]: bounds };
}
