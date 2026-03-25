// frontend/src/lib/loadAllPaged.ts
/** Load every page from list endpoints capped at backend MAX_PAGE_SIZE (100). */
import { api } from '@/lib/api';
import type { Order, Project, Transaction } from '@/types/api';

const PAGE_LIMIT = 100;
/** Max transactions to load for dashboard totals (avoid unbounded reads). */
const TRANSACTION_MAX_PAGES = 10;

export async function loadAllOrders(): Promise<Order[]> {
  const first = await api.orders.list({ page: 1, limit: PAGE_LIMIT });
  if (!first.success || !first.data) return [];
  const { orders, pagination } = first.data;
  if (!pagination || pagination.totalPages <= 1) return orders;
  const more = await Promise.all(
    Array.from({ length: pagination.totalPages - 1 }, (_, i) =>
      api.orders.list({ page: i + 2, limit: PAGE_LIMIT }),
    ),
  );
  const all = [...orders];
  for (const r of more) {
    if (r.success && r.data) all.push(...r.data.orders);
  }
  return all;
}

export async function loadAllProjects(): Promise<Project[]> {
  const first = await api.projects.list({ page: 1, limit: PAGE_LIMIT });
  if (!first.success || !first.data) return [];
  const { projects, pagination } = first.data;
  if (!pagination || pagination.totalPages <= 1) return projects;
  const more = await Promise.all(
    Array.from({ length: pagination.totalPages - 1 }, (_, i) =>
      api.projects.list({ page: i + 2, limit: PAGE_LIMIT }),
    ),
  );
  const all = [...projects];
  for (const r of more) {
    if (r.success && r.data) all.push(...r.data.projects);
  }
  return all;
}

/** Loads up to TRANSACTION_MAX_PAGES pages for sum; totalCount is full list size from API. */
export async function loadTransactionsForDashboard(): Promise<{
  transactions: Transaction[];
  totalCount: number;
}> {
  const first = await api.transactions.list({ page: 1, limit: PAGE_LIMIT });
  if (!first.success || !first.data) return { transactions: [], totalCount: 0 };
  const { transactions, pagination } = first.data;
  const totalCount = pagination?.total ?? transactions.length;
  const maxPages = Math.min(pagination?.totalPages ?? 1, TRANSACTION_MAX_PAGES);
  if (maxPages <= 1) return { transactions, totalCount };
  const more = await Promise.all(
    Array.from({ length: maxPages - 1 }, (_, i) =>
      api.transactions.list({ page: i + 2, limit: PAGE_LIMIT }),
    ),
  );
  const all = [...transactions];
  for (const r of more) {
    if (r.success && r.data) all.push(...r.data.transactions);
  }
  return { transactions: all, totalCount };
}
