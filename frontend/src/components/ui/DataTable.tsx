'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { Button } from './Button';
import { Skeleton } from './Skeleton';

/* ─── Types ─── */

export interface DataTableColumn<T> {
  key: string;
  title: string;
  render?: (row: T) => ReactNode;
  /** Pin this column so it stays visible while scrolling horizontally */
  sticky?: boolean;
  width?: string;
  className?: string;
}

export interface DataTableAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  hidden?: (row: T) => boolean;
}

export interface DataTablePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  /** Called whenever search/pagination changes. Return rows + pagination info. */
  fetchData: (params: {
    page: number;
    limit: number;
    search: string;
  }) => Promise<{ rows: T[]; pagination: DataTablePagination }>;
  /** Unique key extractor for each row */
  rowKey: (row: T) => string | number;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** How many rows per page (default 10) */
  pageSize?: number;
  /** Page size options for the selector */
  pageSizeOptions?: number[];
  /** Allow typing a custom page size number */
  allowCustomPageSize?: boolean;
  /** Show or hide the search box (default true) */
  searchable?: boolean;
  /** Extra class on the wrapper */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Debounce delay for search input in ms (default 400) */
  searchDebounce?: number;
  /** Columns count used for the loading skeleton (defaults to columns.length) */
  skeletonColumns?: number;
}

/* ─── Helpers ─── */

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Sub-components ─── */

function TableSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-[var(--color-border)]">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="py-3 px-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function PaginationBar({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  allowCustomPageSize,
  disabled,
}: {
  pagination: DataTablePagination;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  pageSizeOptions: number[];
  allowCustomPageSize: boolean;
  disabled?: boolean;
}) {
  const { page, totalPages: rawTotalPages, total, limit } = pagination;
  const totalPages = Math.max(1, rawTotalPages);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = total === 0 ? 0 : Math.min(page * limit, total);

  const pageNumbers = getPageNumbers(page, totalPages);

  const safeAllowCustom = allowCustomPageSize ?? false;
  const [customInput, setCustomInput] = useState(String(limit));
  useEffect(() => setCustomInput(String(limit)), [limit]);

  const applyCustom = () => {
    const n = Math.floor(Number(customInput));
    if (!Number.isFinite(n)) return;
    if (n < 1) return;
    if (n === limit) return;
    onPageSizeChange(n);
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-4 px-1 text-sm text-foreground/70">
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          نمایش {from.toLocaleString('fa-IR')} تا {to.toLocaleString('fa-IR')} از{' '}
          {total.toLocaleString('fa-IR')} رکورد
        </span>

        <div className="flex items-center gap-2">
          <span className="text-foreground/50">تعداد در صفحه</span>

          <select
            value={limit}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-lg border border-[var(--color-border)] bg-white px-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n.toLocaleString('fa-IR')}
              </option>
            ))}
          </select>

          {safeAllowCustom && (
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={customInput}
              disabled={disabled}
              onChange={(e) => setCustomInput(e.target.value)}
              onBlur={applyCustom}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyCustom();
              }}
              className="h-9 w-24 rounded-lg border border-[var(--color-border)] bg-white px-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(1)}
          className="!px-2"
        >
          <DoubleChevronRight className="w-4 h-4 rotate-180" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="!px-2"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-foreground/40 select-none">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'primary' : 'ghost'}
              size="sm"
              className="!px-2.5 min-w-[32px]"
              disabled={disabled}
              onClick={() => onPageChange(p as number)}
            >
              {(p as number).toLocaleString('fa-IR')}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="!px-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="!px-2"
        >
          <DoubleChevronLeft className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

/* ─── Inline SVG icons ─── */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function DoubleChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 19l-7-7 7-7" />
    </svg>
  );
}

function DoubleChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 19l7-7-7-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19l7-7-7-7" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className ?? ''}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ─── Main Component ─── */

export function DataTable<T>({
  columns,
  actions,
  fetchData,
  rowKey,
  searchPlaceholder = 'جستجو...',
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  allowCustomPageSize = true,
  searchable = true,
  className = '',
  emptyMessage = 'رکوردی یافت نشد.',
  searchDebounce = 400,
  skeletonColumns,
}: DataTableProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(pageSize);
  const [pagination, setPagination] = useState<DataTablePagination>({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  });

  const debouncedSearch = useDebouncedValue(searchText, searchDebounce);

  const fetchIdRef = useRef(0);

  useEffect(() => {
    setLimit(pageSize);
  }, [pageSize]);

  const load = useCallback(
    async (p: number, search: string) => {
      const id = ++fetchIdRef.current;
      setLoading(true);
      try {
        const result = await fetchData({ page: p, limit, search });
        if (id !== fetchIdRef.current) return;
        setRows(result.rows);
        setPagination(result.pagination);
      } finally {
        if (id === fetchIdRef.current) setLoading(false);
      }
    },
    [fetchData, limit],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limit]);

  useEffect(() => {
    load(page, debouncedSearch);
  }, [page, debouncedSearch, load]);

  const safeTotalPages = Math.max(1, pagination.totalPages);

  const handlePageChange = (p: number) => {
    if (p < 1 || p > safeTotalPages) return;
    setPage(p);
  };

  const handlePageSizeChange = (newLimit: number) => {
    const n = Math.floor(newLimit);
    if (!Number.isFinite(n)) return;
    if (n < 1) return;
    if (n === limit) return;
    setLimit(n);
    // Optimistic UI update while the next request is in-flight.
    setPagination((prev) => ({
      ...prev,
      page: 1,
      limit: n,
      total: 0,
      totalPages: 0,
    }));
  };

  const hasSticky = columns.some((c) => c.sticky);
  const hasActions = actions && actions.length > 0;
  const totalVisibleCols = columns.length + (hasActions ? 1 : 0);
  const skelCols = skeletonColumns ?? totalVisibleCols;
  const skeletonRows = Math.min(limit, 20);

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Search bar */}
      {searchable && (
        <div className="relative mb-4">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={searchPlaceholder}
            className="block w-full rounded-lg border border-[var(--color-border)] pr-9 pl-3 py-2 text-sm text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-white"
          />
          {loading && searchText && (
            <SpinnerIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
          )}
        </div>
      )}

      {/* Table wrapper with horizontal scroll */}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm text-right min-w-[600px]">
          <thead>
            <tr className="bg-content-bg border-b border-[var(--color-border)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 font-semibold text-foreground/70 whitespace-nowrap ${
                    col.sticky ? 'sticky right-0 bg-content-bg z-10 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--color-border)]' : ''
                  } ${col.className ?? ''}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.title}
                </th>
              ))}
              {hasActions && (
                <th className="py-3 px-4 font-semibold text-foreground/70 whitespace-nowrap sticky left-0 bg-content-bg z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--color-border)]">
                  عملیات
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={skelCols} rows={skeletonRows} />
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={totalVisibleCols}
                  className="py-12 text-center text-foreground/50"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-[var(--color-border)] hover:bg-active-bg/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 ${
                        col.sticky
                          ? 'sticky right-0 bg-white z-10 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--color-border)]'
                          : ''
                      } ${col.className ?? ''}`}
                      style={col.width ? { width: col.width } : undefined}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="py-3 px-4 sticky left-0 bg-white z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--color-border)]">
                      <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden divide-x divide-[var(--color-border)] divide-x-reverse">
                        {actions!
                          .filter((a) => !a.hidden || !a.hidden(row))
                          .map((action) => (
                            <button
                              key={action.label}
                              onClick={() => action.onClick(row)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${getActionClasses(action.variant)}`}
                            >
                              {action.icon}
                              {action.label}
                            </button>
                          ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <PaginationBar
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        allowCustomPageSize={allowCustomPageSize}
        disabled={loading}
      />
    </div>
  );
}

function getActionClasses(variant?: string): string {
  switch (variant) {
    case 'danger':
      return 'text-red-600 hover:bg-red-50';
    case 'primary':
      return 'text-accent hover:bg-accent/5';
    case 'outline':
      return 'text-accent hover:bg-accent/5';
    default:
      return 'text-foreground/70 hover:bg-content-bg';
  }
}
