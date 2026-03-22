/**
 * Client-side evaluation of DataTable FilterToken[] (GitLab-style filter bar).
 * Use with in-memory lists after api.*.list(); for server-paginated APIs, map tokens to query params separately.
 */

import type { FilterToken } from '@/components/ui/DataTable';
import type { ListParams } from '@/lib/api/client';

export function filterRowsByTokens<T>(
  rows: T[],
  tokens: FilterToken[] | undefined,
  evaluators: Record<string, (row: T, operator: string, value: string) => boolean>,
): T[] {
  if (!tokens?.length) return rows;
  return rows.filter((row) =>
    tokens.every((t) => {
      const fn = evaluators[t.key];
      return fn ? fn(row, t.operator, t.value) : true;
    }),
  );
}

export function matchTextCell(cell: string, operator: string, raw: string): boolean {
  const v = raw.trim().toLowerCase();
  const c = String(cell ?? '').trim().toLowerCase();
  if (!v) return true;
  if (operator === 'contains') return c.includes(v);
  if (operator === 'is') return c === v;
  if (operator === 'is_not') return c !== v;
  return true;
}

export function matchNumberCell(n: number, operator: string, raw: string): boolean {
  const target = Number(String(raw).replace(/,/g, ''));
  if (Number.isNaN(target)) return true;
  if (Number.isNaN(n)) return false;
  if (operator === '=') return n === target;
  if (operator === '>') return n > target;
  if (operator === '<') return n < target;
  if (operator === '>=') return n >= target;
  if (operator === '<=') return n <= target;
  return true;
}

export function matchSelectCell(val: string, operator: string, raw: string): boolean {
  if (operator === 'is') return val === raw;
  if (operator === 'is_not') return val !== raw;
  return true;
}

/** `iso` is a date string from the API; `raw` is typically YYYY-MM-DD from the filter input */
export function matchDateCell(iso: string | undefined, operator: string, raw: string): boolean {
  const targetDay = raw.trim().slice(0, 10);
  if (!targetDay) return true;
  if (!iso) return false;
  const cellDay = new Date(iso).toISOString().slice(0, 10);
  if (operator === 'is') return cellDay === targetDay;
  if (operator === 'before') return cellDay < targetDay;
  if (operator === 'after') return cellDay > targetDay;
  return true;
}

/**
 * Maps filter tokens to GET /customers query params (supported by backend + mock).
 */
export function buildCustomerListParamsFromTokens(tokens: FilterToken[] | undefined): Partial<ListParams> {
  const out: Partial<ListParams> = {};
  if (!tokens?.length) return out;

  let createdFrom: string | undefined;
  let createdTo: string | undefined;

  for (const t of tokens) {
    if (t.key === 'status' && t.operator === 'is') out.status = t.value;
    if (t.key === 'customerType' && t.operator === 'is') out.customerType = t.value;
    if (t.key === 'relationshipType' && t.operator === 'is') out.relationshipType = t.value;
    if (t.key === 'isActive' && t.operator === 'is') out.isActive = t.value;

    if (t.key === 'createdAt') {
      const day = t.value.trim().slice(0, 10);
      if (!day) continue;
      if (t.operator === 'is') {
        createdFrom = day;
        createdTo = day;
      } else if (t.operator === 'after') {
        createdFrom = day;
      } else if (t.operator === 'before') {
        createdTo = day;
      }
    }
  }

  if (createdFrom) out.createdFrom = createdFrom;
  if (createdTo) out.createdTo = createdTo;
  return out;
}
