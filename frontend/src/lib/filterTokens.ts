/**
 * Client-side evaluation of DataTable FilterToken[] (GitLab-style filter bar).
 * Use with in-memory lists after api.*.list(); for server-paginated APIs, map tokens to query params separately.
 */

import type { FilterJunction, FilterToken } from '@/components/ui/DataTable';
import type { ListParams } from '@/lib/api/client';

function evalTokenPredicate<T>(
  row: T,
  t: FilterToken,
  evaluators: Record<string, (row: T, operator: string, value: string) => boolean>,
): boolean {
  const fn = evaluators[t.key];
  return fn ? fn(row, t.operator, t.value) : true;
}

function combineJunction(acc: boolean, next: boolean, junction: FilterJunction | undefined): boolean {
  const j = junction ?? 'and';
  switch (j) {
    case 'and':
      return acc && next;
    case 'or':
      return acc || next;
    case 'xor':
      return acc !== next;
    case 'nand':
      return !(acc && next);
    case 'nor':
      return !(acc || next);
    case 'xnor':
      return acc === next;
    default:
      return acc && next;
  }
}

/** Left-associative: (((p0 op1 p1) op2 p2) …). First token ignores `junction`. */
export function filterRowsByTokens<T>(
  rows: T[],
  tokens: FilterToken[] | undefined,
  evaluators: Record<string, (row: T, operator: string, value: string) => boolean>,
): T[] {
  if (!tokens?.length) return rows;
  return rows.filter((row) => {
    let acc = evalTokenPredicate(row, tokens[0], evaluators);
    for (let i = 1; i < tokens.length; i++) {
      const next = evalTokenPredicate(row, tokens[i], evaluators);
      acc = combineJunction(acc, next, tokens[i].junction);
    }
    return acc;
  });
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

function parseTimeToMinutes(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  // If we receive an ISO date-time string, extract the `HH:mm` part.
  // Examples: `2026-03-25T14:30:00Z`, `2026-03-25T14:30:00+03:30`
  if (s.includes('T')) {
    const mIso = s.match(/T(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (mIso) {
      const hh = Number(mIso[1]);
      const mm = Number(mIso[2]);
      if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
      if (hh < 0 || hh > 23) return null;
      if (mm < 0 || mm > 59) return null;
      return hh * 60 + mm;
    }
  }
  // Accept `HH:mm` or `HH:mm:ss`.
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

/** `cell` is expected to be a time string like `HH:mm` or `HH:mm:ss`. */
export function matchTimeCell(cell: string | undefined, operator: string, raw: string): boolean {
  const targetMins = parseTimeToMinutes(raw);
  if (targetMins === null) return true; // no/invalid input => don't filter out
  if (!cell) return false;
  const cellMins = parseTimeToMinutes(cell);
  if (cellMins === null) return false;
  if (operator === 'is') return cellMins === targetMins;
  if (operator === 'before') return cellMins < targetMins;
  if (operator === 'after') return cellMins > targetMins;
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
