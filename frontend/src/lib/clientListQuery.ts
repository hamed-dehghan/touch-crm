import type { DataTablePagination } from '@/components/ui/DataTable';

/** Slice rows for server-style pagination (total reflects filtered list). */
export function paginateSlice<T>(
  rows: T[],
  page: number,
  limit: number,
): { rows: T[]; pagination: DataTablePagination } {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * limit;
  return {
    rows: rows.slice(offset, offset + limit),
    pagination: { page: safePage, limit, total, totalPages },
  };
}

export function sortRows<T>(
  rows: T[],
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined,
  accessors: Record<string, (row: T) => string | number | Date | null | undefined>,
): T[] {
  if (!sortBy || !sortOrder || !accessors[sortBy]) return rows;
  const get = accessors[sortBy];
  const dir = sortOrder === 'asc' ? 1 : -1;
  const out = [...rows];
  out.sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    const ta = va instanceof Date ? va.getTime() : va;
    const tb = vb instanceof Date ? vb.getTime() : vb;
    if (typeof ta === 'number' && typeof tb === 'number' && !Number.isNaN(ta) && !Number.isNaN(tb)) {
      return (ta - tb) * dir;
    }
    return String(ta ?? '').localeCompare(String(tb ?? ''), 'fa') * dir;
  });
  return out;
}

export function filterRowsBySearch<T>(rows: T[], search: string, toText: (row: T) => string): T[] {
  const s = search.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((r) => toText(r).toLowerCase().includes(s));
}
