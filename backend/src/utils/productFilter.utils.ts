import { Op } from 'sequelize';
import { escapeIlikePattern, wrapIlike } from './search.utils.js';

/** One token from the DataTable filter bar (key / operator / value). */
export interface ProductFilterToken {
  key: string;
  operator: string;
  value: string;
}

/**
 * Parse `filters` query param: JSON array of `{ key, operator, value }`.
 */
export function parseProductFiltersQuery(raw: unknown): ProductFilterToken[] {
  if (raw === undefined || raw === null || raw === '') return [];
  const s = typeof raw === 'string' ? raw : Array.isArray(raw) ? String(raw[0]) : '';
  if (!s.trim()) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ProductFilterToken =>
        Boolean(x) &&
        typeof (x as ProductFilterToken).key === 'string' &&
        typeof (x as ProductFilterToken).operator === 'string' &&
        typeof (x as ProductFilterToken).value === 'string'
    );
  } catch {
    return [];
  }
}

/** ILIKE pattern for exact match (special chars escaped, no wildcards). */
function iLikeExact(term: string): string {
  return escapeIlikePattern(term.trim());
}

/**
 * Build a Sequelize-compatible condition object for one filter token.
 * Returns null if the token is invalid or unsupported.
 */
export function conditionFromProductFilterToken(t: ProductFilterToken): Record<string, unknown> | null {
  const { key, operator, value } = t;
  const v = value.trim();
  if (!v && key !== 'productName') return null;

  if (key === 'productName') {
    if (!v) return null;
    if (operator === 'contains') {
      return { productName: { [Op.iLike]: wrapIlike(v) } };
    }
    if (operator === 'is') {
      return { productName: { [Op.iLike]: iLikeExact(v) } };
    }
    if (operator === 'is_not') {
      /* Exact case-insensitive "not equals" (ILIKE without wildcards). */
      return { productName: { [Op.notILike]: iLikeExact(v) } };
    }
    return null;
  }

  if (key === 'price' || key === 'taxRate') {
    const col = key === 'price' ? 'price' : 'taxRate';
    const n = Number(v.replace(/,/g, ''));
    if (Number.isNaN(n)) return null;
    const opMap: Record<string, symbol> = {
      '=': Op.eq,
      '>': Op.gt,
      '<': Op.lt,
      '>=': Op.gte,
      '<=': Op.lte,
    };
    const sym = opMap[operator];
    if (!sym) return null;
    return { [col]: { [sym]: n } };
  }

  if (key === 'createdAt') {
    const day = v.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    const start = new Date(`${day}T00:00:00.000Z`);
    const end = new Date(`${day}T23:59:59.999Z`);
    if (operator === 'is') {
      return { createdAt: { [Op.between]: [start, end] } };
    }
    if (operator === 'before') {
      return { createdAt: { [Op.lt]: start } };
    }
    if (operator === 'after') {
      return { createdAt: { [Op.gt]: end } };
    }
    return null;
  }

  return null;
}

/**
 * Build Sequelize `where` fragments from filter tokens (AND).
 */
export function whereFragmentsFromProductFilters(tokens: ProductFilterToken[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const t of tokens) {
    const c = conditionFromProductFilterToken(t);
    if (c) out.push(c);
  }
  return out;
}

/** Whitelist for GET /products `sortBy` (Sequelize model attribute names). */
export const PRODUCT_LIST_SORT_FIELDS = ['id', 'productName', 'price', 'taxRate', 'createdAt'] as const;

/**
 * Parse `sortBy` + `sortOrder` query params. Defaults to `createdAt` DESC.
 */
export function parseProductListOrder(query: Record<string, unknown>): [string, 'ASC' | 'DESC'][] {
  const raw = query.sortBy;
  const sortBy = typeof raw === 'string' ? raw.trim() : '';
  const orderRaw = String(query.sortOrder ?? 'desc').toLowerCase();
  const dir: 'ASC' | 'DESC' = orderRaw === 'asc' ? 'ASC' : 'DESC';
  if (sortBy && (PRODUCT_LIST_SORT_FIELDS as readonly string[]).includes(sortBy)) {
    return [[sortBy, dir]];
  }
  return [['createdAt', 'DESC']];
}
