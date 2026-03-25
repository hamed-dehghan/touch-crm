'use client';

import {
  Fragment,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { toEnglishDigits } from '@/utils/digits';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { PersianDatePicker } from './DatePicker';

/* ─── Types ─── */

export interface DataTableColumn<T> {
  key: string;
  title: string;
  render?: (row: T) => ReactNode;
  /**
   * Legacy flag.
   * Column pinning is now user-controlled and persisted in `localStorage`.
   */
  sticky?: boolean;
  /** Show sort control in header; `fetchData` receives `sortBy` / `sortOrder`. */
  sortable?: boolean;
  /**
   * API / server field name for sorting (Sequelize attribute). Defaults to `key`.
   * Use when the column `key` differs from the backend sort field.
   */
  sortField?: string;
  width?: string;
  className?: string;
}

export interface DataTableAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  hidden?: (row: T) => boolean;
  /**
   * When set, double-clicking the row runs this action (if visible).
   * If no action sets this, the table still treats an action labeled like Edit / «ویرایش» as the edit action for double-click.
   */
  triggerOnRowDoubleClick?: boolean;
}

export interface DataTablePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DataTableGroupAction<T> {
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  onClick: (selectedRows: T[]) => void | Promise<void>;
  /** Hide group action when selection doesn't match conditions */
  hidden?: (selectedRows: T[]) => boolean;
  /** Disable group action when selection doesn't match conditions */
  disabled?: (selectedRows: T[]) => boolean;
}

export interface DataTableFilterOption {
  value: string | number;
  label: string;
}

export interface DataTableFilter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date' | 'time' | 'autocomplete';
  operators?: { value: string; label: string }[];
  /**
   * Static options array, or an async loader.
   * For `type: 'autocomplete'` the function receives the current query string
   * so you can hit an API endpoint: `(query) => api.search(query)`.
   */
  options?: DataTableFilterOption[] | ((query?: string) => Promise<DataTableFilterOption[]>);
  icon?: ReactNode;
}

/** Logical combiner with the previous predicate (left-associative); ignored on the first token. */
export type FilterJunction = 'and' | 'or' | 'xor' | 'nand' | 'nor' | 'xnor';

export interface FilterToken {
  id: string;
  key: string;
  operator: string;
  value: string;
  label: string;
  valueLabel: string;
  /** How this token combines with the result so far; omitted on first chip (treated as AND when missing on later tokens for backward compatibility). */
  junction?: FilterJunction;
}

const JUNCTION_OPTIONS: { value: FilterJunction; label: string }[] = [
  { value: 'and', label: 'و (AND)' },
  { value: 'or', label: 'یا (OR)' },
  { value: 'xor', label: 'یای انحصاری (XOR)' },
  { value: 'nand', label: 'NAND' },
  { value: 'nor', label: 'NOR' },
  { value: 'xnor', label: 'XNOR' },
];

/** Top of the filter key dropdown when adding a 2+ condition — «و» / «یا» first, then full set (left-associative). */
const FILTERBOX_JUNCTION_ROWS: { value: FilterJunction; label: string; description: string }[] = [
  { value: 'and', label: 'و', description: 'همهٔ این شرط و شرط قبلی برقرار باشند' },
  { value: 'or', label: 'یا', description: 'حداقل یکی از این شرط یا شرط قبلی برقرار باشد' },
  {
    value: 'xor',
    label: 'یای انحصاری',
    description: 'دقیقاً یکی از دو شرط برقرار باشد (XOR)',
  },
  { value: 'nand', label: 'NAND', description: 'نقیضِ «هم این هم قبلی»' },
  { value: 'nor', label: 'NOR', description: 'نقیضِ «این یا قبلی یا هر دو»' },
  { value: 'xnor', label: 'XNOR', description: 'هر دو یکسان (هر دو برقرار یا هیچ‌کدام)' },
];

function junctionLabel(j: FilterJunction | undefined): string {
  const v = j ?? 'and';
  return JUNCTION_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

/** Compact chip text in the filter bar; full Persian + mnemonic in the dropdown (`junctionLabel`). */
function junctionChipLabel(j: FilterJunction | undefined): string {
  const v = j ?? 'and';
  return v.toUpperCase();
}

/** First token must not carry a junction; later tokens default to AND when unset. */
function normalizeFilterTokens(tokens: FilterToken[]): FilterToken[] {
  if (!tokens.length) return [];
  const [first, ...rest] = tokens;
  return [
    { ...first, junction: undefined },
    ...rest.map((t) => ({ ...t, junction: t.junction ?? 'and' })),
  ];
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  /** Let users choose pinned (fixed) columns from UI */
  enableColumnPinning?: boolean;
  /**
   * Enables row selection with checkboxes and shows a bulk action bar
   * (if `groupActions` is provided).
   */
  selectableRows?: boolean;
  groupActions?: DataTableGroupAction<T>[];
  /** Disable selection for some rows */
  isRowSelectable?: (row: T) => boolean;
  /** Clears selection on search/page/pageSize change (default: true) */
  clearSelectionOnDataChange?: boolean;
  /** Called whenever search/pagination/sort changes. Return rows + pagination info. */
  fetchData: (params: {
    page: number;
    limit: number;
    search: string;
    filters?: FilterToken[];
    /** Set when user sorted a `sortable` column (`sortField` or column `key`). */
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
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
  /**
   * Token-based filter definitions (GitLab-style). When provided, replaces simple search.
   * Users build filters in the bar first; the API runs only when they click Search (or Enter).
   * The same field can be used more than once (e.g. two price bounds).
   */
  filters?: DataTableFilter[];
  /**
   * When true (default), double-clicking a data row opens the edit flow if an edit action exists
   * (`triggerOnRowDoubleClick` on an action, or label «ویرایش» / `edit`).
   */
  openEditOnRowDoubleClick?: boolean;
}

/* ─── Filter defaults ─── */

const DEFAULT_OPERATORS: Record<DataTableFilter['type'], { value: string; label: string }[]> = {
  text: [
    { value: 'contains', label: 'شامل' },
    { value: 'is', label: 'برابر است' },
    { value: 'is_not', label: 'نیست' },
  ],
  select: [
    { value: 'is', label: 'برابر است' },
    { value: 'is_not', label: 'نیست' },
  ],
  number: [
    { value: '=', label: '=' },
    { value: '>', label: '>' },
    { value: '<', label: '<' },
    { value: '>=', label: '>=' },
    { value: '<=', label: '<=' },
  ],
  date: [
    { value: 'is', label: 'برابر است' },
    { value: 'before', label: 'قبل از' },
    { value: 'after', label: 'بعد از' },
  ],
  time: [
    { value: 'is', label: 'برابر است' },
    { value: 'before', label: 'قبل از' },
    { value: 'after', label: 'بعد از' },
  ],
  autocomplete: [
    { value: 'is', label: 'برابر است' },
    { value: 'is_not', label: 'نیست' },
  ],
};

let _filterTokenId = 0;
function nextTokenId(): string {
  return `ft-${++_filterTokenId}`;
}

/* ─── Helpers ─── */

/** Action invoked on row double-click: explicit flag, else common edit labels. */
function resolveRowDoubleClickAction<T>(
  actions: DataTableAction<T>[] | undefined,
  row: T,
): DataTableAction<T> | undefined {
  if (!actions?.length) return undefined;
  const visible = actions.filter((a) => !(a.hidden?.(row)));
  const explicit = visible.find((a) => a.triggerOnRowDoubleClick);
  if (explicit) return explicit;
  return visible.find((a) => {
    const label = a.label.trim().toLowerCase();
    return label === 'edit' || a.label.includes('ویرایش');
  });
}

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
  const isCustomPageSize =
    safeAllowCustom && !pageSizeOptions.includes(limit) && Number.isFinite(limit) && limit > 0;
  const [pageSizeMode, setPageSizeMode] = useState<'preset' | 'custom'>(
    isCustomPageSize ? 'custom' : 'preset',
  );
  const [customInput, setCustomInput] = useState(String(limit));
  useEffect(() => setCustomInput(String(limit)), [limit]);
  useEffect(() => {
    if (isCustomPageSize) {
      setPageSizeMode('custom');
    }
  }, [isCustomPageSize]);

  const applyCustom = () => {
    const n = Math.floor(Number(toEnglishDigits(customInput)));
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
            value={pageSizeMode === 'custom' ? 'custom' : String(limit)}
            disabled={disabled}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'custom') {
                setPageSizeMode('custom');
                return;
              }
              setPageSizeMode('preset');
              onPageSizeChange(Number(v));
            }}
            className="h-9 rounded-lg border border-[var(--color-border)] bg-white px-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n.toLocaleString('fa-IR')}
              </option>
            ))}
            {safeAllowCustom && (
              <option value="custom">
                سفارشی
              </option>
            )}
          </select>

          {safeAllowCustom && pageSizeMode === 'custom' && (
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={customInput}
              disabled={disabled}
              onChange={(e) => setCustomInput(toEnglishDigits(e.target.value))}
              onBlur={applyCustom}
              onKeyDown={(e) => {
                // Support Persian/Arabic digits even when input type is `number`.
                const normalizedKey = toEnglishDigits(e.key);
                const isAsciiDigit = /^[0-9]$/.test(normalizedKey);
                if (!e.ctrlKey && !e.metaKey && !e.altKey && normalizedKey !== e.key && isAsciiDigit) {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const start = el.selectionStart ?? customInput.length;
                  const end = el.selectionEnd ?? customInput.length;
                  const nextValue = customInput.slice(0, start) + normalizedKey + customInput.slice(end);
                  setCustomInput(nextValue);
                  requestAnimationFrame(() => {
                    try {
                      el.setSelectionRange(start + 1, start + 1);
                    } catch {
                      // ignore
                    }
                  });
                  return;
                }

                if (e.key === 'Enter') applyCustom();
              }}
            className="h-9 w-24 rounded-lg border border-[var(--color-border)] bg-white px-2.5 text-sm text-foreground text-left focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
            dir="ltr"
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

/** Column header: ascending active */
function SortAscIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75 12 8.25l7.5 7.5" />
    </svg>
  );
}

/** Column header: descending active */
function SortDescIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25 12 15.75 4.5 8.25" />
    </svg>
  );
}

/** Column header: sortable, no active order */
function SortNeutralIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75 12 3m0 0 3.75 3.75M12 21l-3.75-3.75M12 21l3.75-3.75M12 12V3" />
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

function RowActionsDropdown<T>({
  actions,
  row,
}: {
  actions: DataTableAction<T>[];
  row: T;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const visibleActions = actions.filter((a) => !a.hidden || !a.hidden(row));
  const disabled = visibleActions.length === 0;

  useEffect(() => {
    if (!open) return;
    const computePos = () => {
      const btn = triggerRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      setMenuPos({
        top: r.top,
        left: r.right + 6,
      });
    };
    computePos();

    const onScroll = () => setOpen(false);
    const onResize = () => computePos();

    const onPointerDown = (e: MouseEvent) => {
      const el = containerRef.current;
      const menuEl = menuRef.current;
      const target = e.target as Node;
      if (!el) return;
      if (el.contains(target)) return;
      if (menuEl && menuEl.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const menu =
    open && !disabled && menuPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            dir="rtl"
            className="fixed z-[99999] w-max min-w-[160px] rounded-lg border border-[var(--color-border)] bg-white shadow-lg overflow-hidden"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {visibleActions.map((action) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                onClick={async () => {
                  setOpen(false);
                  try {
                    await Promise.resolve(action.onClick(row));
                  } catch {
                    // Keep default error handling to parent pages.
                  }
                }}
                className={`w-full flex items-center justify-start gap-2 px-3 py-2 text-sm transition-colors ${getActionClasses(action.variant)} hover:!bg-active-bg/30`}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={containerRef} className="relative inline-flex">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`!px-0 !min-w-0 w-8 h-8 ${open ? 'bg-active-bg/40 ring-1 ring-accent/30' : ''}`}
        ref={triggerRef}
      >
        ...
      </Button>

      {menu}
    </div>
  );
}

/* ─── Filtered Search Bar (GitLab-style) ─── */

type DropdownStep = 'idle' | 'selectKey' | 'selectOperator' | 'selectValue';

function FilteredSearchBar({
  filters,
  tokens,
  onTokensChange,
  freeText,
  onFreeTextChange,
  onSearch,
  onClearAll,
  hasPendingChanges = false,
  placeholder,
  loading,
}: {
  filters: DataTableFilter[];
  tokens: FilterToken[];
  onTokensChange: (tokens: FilterToken[]) => void;
  freeText: string;
  onFreeTextChange: (text: string) => void;
  /** Applies draft filters + free text and runs the table query (button / Enter). */
  onSearch: () => void;
  /** Clears draft + applied filters and refetches (optional; used by DataTable). */
  onClearAll?: () => void;
  /** True when draft differs from last applied search — highlights the Search button. */
  hasPendingChanges?: boolean;
  placeholder: string;
  loading: boolean;
}) {
  const [step, setStep] = useState<DropdownStep>('idle');
  const [activeFilter, setActiveFilter] = useState<DataTableFilter | null>(null);
  const [activeOperator, setActiveOperator] = useState<string | null>(null);
  const [valueInput, setValueInput] = useState('');
  const [asyncOptions, setAsyncOptions] = useState<DataTableFilterOption[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const clickedInsideDropdownRef = useRef(false);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [junctionMenuForId, setJunctionMenuForId] = useState<string | null>(null);
  const junctionMenuAnchorRef = useRef<HTMLButtonElement | null>(null);
  const junctionMenuRef = useRef<HTMLDivElement>(null);
  const clickedInsideJunctionMenuRef = useRef(false);
  /** Logical link to the previous chip when adding another condition from the filterbox (dropdown «و» / «یا» / …). */
  const [pendingNextJunction, setPendingNextJunction] = useState<FilterJunction>('and');

  /** Allow the same field multiple times (e.g. two price bounds) — search runs only when user clicks Search. */
  const availableFilters = filters;

  const getOperators = (f: DataTableFilter) => f.operators ?? DEFAULT_OPERATORS[f.type] ?? [];

  /** Lists used for keyboard highlight — must match what `renderDropdown` renders. */
  const filteredKeyOptions = useMemo(() => {
    if (step !== 'selectKey') return [];
    return freeText
      ? availableFilters.filter((f) => f.label.toLowerCase().includes(freeText.toLowerCase()))
      : availableFilters;
  }, [step, freeText, availableFilters]);

  const showJunctionRowsInKeyStep =
    step === 'selectKey' && tokens.length > 0 && !freeText.trim();
  const keyStepJunctionCount = showJunctionRowsInKeyStep ? FILTERBOX_JUNCTION_ROWS.length : 0;
  const keyStepListLength = step === 'selectKey' ? keyStepJunctionCount + filteredKeyOptions.length : 0;

  const operatorOptions = useMemo(() => {
    if (step !== 'selectOperator' || !activeFilter) return [];
    return getOperators(activeFilter);
  }, [step, activeFilter]);

  const filteredSelectOptions = useMemo(() => {
    if (step !== 'selectValue' || !activeFilter) return [];
    if (activeFilter.type === 'autocomplete') return asyncOptions;
    if (activeFilter.type !== 'select') return [];
    const opts = asyncOptions;
    if (!valueInput.trim()) return opts;
    const q = valueInput.toLowerCase();
    return opts.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [step, activeFilter, asyncOptions, valueInput]);

  useEffect(() => {
    if (step === 'idle') return;
    const handleClickOutside = (e: MouseEvent) => {
      if (clickedInsideDropdownRef.current) {
        clickedInsideDropdownRef.current = false;
        return;
      }
      // Allow interacting with Jalali datepicker popup without closing the filter step.
      // `react-multi-date-picker` renders elements with these classnames.
      const el = e.target as HTMLElement | null;
      const inDatePicker =
        step === 'selectValue' &&
        activeFilter?.type === 'date' &&
        Boolean(el?.closest?.('.rmdp-wrapper, .rmdp-container, .rmdp-calendar, .rmdp-shadow'));
      if (inDatePicker) return;
      const target = e.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideContainer && !insideDropdown) {
        resetDropdown();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetDropdown();
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [step]);

  useEffect(() => {
    if (!junctionMenuForId) return undefined;
    const onDown = (e: MouseEvent) => {
      if (clickedInsideJunctionMenuRef.current) {
        clickedInsideJunctionMenuRef.current = false;
        return;
      }
      const t = e.target as Node;
      if (junctionMenuRef.current?.contains(t)) return;
      if (junctionMenuAnchorRef.current?.contains(t)) return;
      setJunctionMenuForId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setJunctionMenuForId(null);
    };
    document.addEventListener('mousedown', onDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [junctionMenuForId]);

  /** When operator list is open there is no text input — focus the dropdown for Arrow/Enter. */
  useEffect(() => {
    if (step !== 'selectOperator') return undefined;
    const id = requestAnimationFrame(() => {
      dropdownRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [step]);

  /** Keep keyboard highlight in range when filter text narrows the list. */
  useEffect(() => {
    if (step === 'selectKey') {
      setHighlightIdx((i) => {
        const n = keyStepListLength;
        if (n === 0) return -1;
        if (i < 0) return i;
        return Math.min(i, n - 1);
      });
    } else if (step === 'selectOperator') {
      setHighlightIdx((i) => {
        const n = operatorOptions.length;
        if (n === 0) return -1;
        if (i < 0) return i;
        return Math.min(i, n - 1);
      });
    } else if (step === 'selectValue' && (activeFilter?.type === 'select' || activeFilter?.type === 'autocomplete')) {
      setHighlightIdx((i) => {
        const n = filteredSelectOptions.length;
        if (n === 0) return -1;
        if (i < 0) return i;
        return Math.min(i, n - 1);
      });
    }
  }, [step, activeFilter?.type, keyStepListLength, operatorOptions, filteredSelectOptions]);

  /** Scroll highlighted option into view for long lists. */
  useEffect(() => {
    if (highlightIdx < 0) return;
    const id =
      step === 'selectKey'
        ? `filter-key-${highlightIdx}`
        : step === 'selectOperator'
          ? `filter-op-${highlightIdx}`
          : step === 'selectValue' && (activeFilter?.type === 'select' || activeFilter?.type === 'autocomplete')
            ? `filter-val-${highlightIdx}`
            : null;
    if (!id) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, [highlightIdx, step, activeFilter?.type]);

  const resetDropdown = () => {
    setStep('idle');
    setActiveFilter(null);
    setActiveOperator(null);
    setValueInput('');
    setAsyncOptions([]);
    setHighlightIdx(-1);
    setAutocompleteLoading(false);
    setJunctionMenuForId(null);
    setPendingNextJunction('and');
    if (autocompleteTimerRef.current) clearTimeout(autocompleteTimerRef.current);
  };

  const openKeySelection = () => {
    if (availableFilters.length > 0) {
      setStep('selectKey');
      setHighlightIdx(-1);
      if (tokens.length > 0) setPendingNextJunction('and');
    }
  };

  const selectKey = (filter: DataTableFilter) => {
    /** Clear the typed query used to find this field so it doesn't stay in the bar. */
    onFreeTextChange('');
    setActiveFilter(filter);
    const ops = getOperators(filter);
    if (ops.length === 1) {
      setActiveOperator(ops[0].value);
      void enterValueStep(filter);
    } else {
      setStep('selectOperator');
      setHighlightIdx(-1);
    }
  };

  const selectOperator = (op: string) => {
    setActiveOperator(op);
    void enterValueStep(activeFilter!);
  };

  const enterValueStep = async (filter: DataTableFilter) => {
    setStep('selectValue');
    setValueInput('');
    setHighlightIdx(-1);
    if (filter.type === 'select' && filter.options) {
      if (typeof filter.options === 'function') {
        const opts = await filter.options();
        setAsyncOptions(opts);
      } else {
        setAsyncOptions(filter.options);
      }
    } else if (filter.type === 'autocomplete') {
      setAsyncOptions([]);
    }
  };

  /** Debounced search for autocomplete filters */
  useEffect(() => {
    if (step !== 'selectValue' || !activeFilter || activeFilter.type !== 'autocomplete') return;
    if (typeof activeFilter.options !== 'function') return;
    if (!valueInput.trim()) {
      setAsyncOptions([]);
      return;
    }
    const optsFn = activeFilter.options;
    if (autocompleteTimerRef.current) clearTimeout(autocompleteTimerRef.current);
    setAutocompleteLoading(true);
    autocompleteTimerRef.current = setTimeout(async () => {
      try {
        const results = await optsFn(valueInput.trim());
        setAsyncOptions(results);
        setHighlightIdx(results.length > 0 ? 0 : -1);
      } catch {
        setAsyncOptions([]);
      } finally {
        setAutocompleteLoading(false);
      }
    }, 300);
    return () => {
      if (autocompleteTimerRef.current) clearTimeout(autocompleteTimerRef.current);
    };
  }, [step, activeFilter, valueInput]);

  const commitToken = (value: string, valueLabel: string) => {
    if (!activeFilter || !activeOperator) return;
    const token: FilterToken = {
      id: nextTokenId(),
      key: activeFilter.key,
      operator: activeOperator,
      value,
      label: activeFilter.label,
      valueLabel,
    };
    if (tokens.length > 0) token.junction = pendingNextJunction;
    onTokensChange(normalizeFilterTokens([...tokens, token]));
    resetDropdown();
    inputRef.current?.focus();
  };

  const removeToken = (id: string) => {
    onTokensChange(normalizeFilterTokens(tokens.filter((t) => t.id !== id)));
  };

  const setTokenJunction = (tokenId: string, junction: FilterJunction) => {
    onTokensChange(
      normalizeFilterTokens(tokens.map((t) => (t.id === tokenId ? { ...t, junction } : t))),
    );
    setJunctionMenuForId(null);
  };

  /**
   * Unified keyboard handling for filter field → operator → value (list or text).
   * Used on the main input, value input, and the dropdown panel (when no text field is focused).
   */
  const handleKeyboardNav = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      resetDropdown();
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const moveHighlight = (dir: 1 | -1, len: number) => {
      if (len <= 0) return;
      setHighlightIdx((i) => {
        if (dir === 1) {
          if (i < 0) return 0;
          return Math.min(len - 1, i + 1);
        }
        if (i <= 0) return -1;
        return Math.max(0, i - 1);
      });
    };

    if (e.key === 'ArrowDown') {
      if (step === 'idle' && availableFilters.length > 0) {
        e.preventDefault();
        openKeySelection();
        setHighlightIdx(0);
        return;
      }
      if (step === 'selectKey') {
        e.preventDefault();
        moveHighlight(1, keyStepListLength);
        return;
      }
      if (step === 'selectOperator') {
        e.preventDefault();
        moveHighlight(1, operatorOptions.length);
        return;
      }
      if (step === 'selectValue' && (activeFilter?.type === 'select' || activeFilter?.type === 'autocomplete')) {
        e.preventDefault();
        moveHighlight(1, filteredSelectOptions.length);
        return;
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (step === 'selectKey') {
        e.preventDefault();
        moveHighlight(-1, keyStepListLength);
        return;
      }
      if (step === 'selectOperator') {
        e.preventDefault();
        moveHighlight(-1, operatorOptions.length);
        return;
      }
      if (step === 'selectValue' && (activeFilter?.type === 'select' || activeFilter?.type === 'autocomplete')) {
        e.preventDefault();
        moveHighlight(-1, filteredSelectOptions.length);
        return;
      }
      return;
    }

    if (e.key === 'Enter') {
      if (step === 'selectKey') {
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < keyStepJunctionCount) {
          setPendingNextJunction(FILTERBOX_JUNCTION_ROWS[highlightIdx].value);
          return;
        }
        const fieldIdx = highlightIdx - keyStepJunctionCount;
        if (fieldIdx >= 0 && fieldIdx < filteredKeyOptions.length) {
          selectKey(filteredKeyOptions[fieldIdx]);
        } else {
          onSearch();
          resetDropdown();
        }
        return;
      }
      if (step === 'selectOperator') {
        e.preventDefault();
        let idx = highlightIdx;
        if (idx < 0 && operatorOptions.length === 1) idx = 0;
        if (idx >= 0 && idx < operatorOptions.length) {
          selectOperator(operatorOptions[idx].value);
        }
        return;
      }
      if (step === 'selectValue') {
        if (activeFilter?.type === 'select' || activeFilter?.type === 'autocomplete') {
          e.preventDefault();
          if (highlightIdx >= 0 && highlightIdx < filteredSelectOptions.length) {
            const opt = filteredSelectOptions[highlightIdx];
            commitToken(String(opt.value), opt.label);
          }
          return;
        }
        if (valueInput.trim()) {
          e.preventDefault();
          commitToken(valueInput.trim(), valueInput.trim());
        }
        return;
      }
      if (step === 'idle') {
        e.preventDefault();
        onSearch();
        resetDropdown();
      }
      return;
    }

    if (e.key === 'Backspace') {
      if (step === 'selectValue' && valueInput === '') {
        e.preventDefault();
        setStep('selectOperator');
        setActiveOperator(null);
        setValueInput('');
        setAsyncOptions([]);
        setHighlightIdx(-1);
        return;
      }
      if (step === 'selectOperator') {
        e.preventDefault();
        setStep('selectKey');
        setActiveFilter(null);
        setActiveOperator(null);
        setHighlightIdx(-1);
        inputRef.current?.focus();
        return;
      }
      if (step === 'selectKey' && freeText === '') {
        if (tokens.length > 0) {
          removeToken(tokens[tokens.length - 1].id);
        }
        return;
      }
      if (step === 'idle' && freeText === '' && tokens.length > 0) {
        removeToken(tokens[tokens.length - 1].id);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFreeTextChange(toEnglishDigits(e.target.value));
    if (step === 'idle' && e.target.value !== '') {
      openKeySelection();
    }
  };

  const handleInputFocus = () => {
    if (step === 'idle') openKeySelection();
  };

  const operatorLabel = (opValue: string): string => {
    if (!activeFilter) return opValue;
    const ops = getOperators(activeFilter);
    return ops.find((o) => o.value === opValue)?.label ?? opValue;
  };

  const renderDropdown = () => {
    if (step === 'idle') return null;

    let items: ReactNode = null;

    if (step === 'selectKey') {
      const junctionBlock =
        showJunctionRowsInKeyStep ? (
          <>
            <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-foreground/45">ترکیب با شرط قبلی</div>
            {FILTERBOX_JUNCTION_ROWS.map((row, i) => (
              <button
                key={row.value}
                type="button"
                id={`filter-key-${i}`}
                className={`w-full flex flex-col items-stretch gap-0.5 px-3 py-2 text-sm text-right transition-colors hover:bg-active-bg/30 ${
                  i === highlightIdx ? 'bg-active-bg/30' : ''
                } ${pendingNextJunction === row.value ? 'border-r-2 border-r-accent bg-accent/5' : ''}`}
                onClick={() => setPendingNextJunction(row.value)}
              >
                <span className="font-semibold text-foreground">{row.label}</span>
                <span className="text-xs text-foreground/45 leading-snug">{row.description}</span>
              </button>
            ))}
            <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-foreground/45 border-t border-[var(--color-border)]">
              فیلد
            </div>
          </>
        ) : null;

      const fieldBlock =
        filteredKeyOptions.length === 0 ? (
          <div className="px-3 py-2 text-sm text-foreground/50">فیلتری یافت نشد</div>
        ) : (
          filteredKeyOptions.map((f, i) => {
            const rowIdx = keyStepJunctionCount + i;
            return (
              <button
                key={f.key}
                type="button"
                id={`filter-key-${rowIdx}`}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-right transition-colors hover:bg-active-bg/30 ${
                  rowIdx === highlightIdx ? 'bg-active-bg/30' : ''
                }`}
                onClick={() => selectKey(f)}
              >
                {f.icon && <span className="w-4 h-4 shrink-0">{f.icon}</span>}
                <span>{f.label}</span>
                <span className="mr-auto text-foreground/30 text-xs">
                  {f.type === 'text'
                    ? 'متن'
                    : f.type === 'number'
                      ? 'عدد'
                      : f.type === 'select'
                        ? 'انتخاب'
                        : f.type === 'autocomplete'
                          ? 'جستجو'
                          : f.type === 'date'
                            ? 'تاریخ'
                            : 'زمان'}
                </span>
              </button>
            );
          })
        );

      items = (
        <>
          {junctionBlock}
          {fieldBlock}
        </>
      );
    }

    if (step === 'selectOperator' && activeFilter) {
      items = operatorOptions.map((op, i) => (
        <button
          key={op.value}
          type="button"
          id={`filter-op-${i}`}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-right transition-colors hover:bg-active-bg/30 ${
            i === highlightIdx ? 'bg-active-bg/30' : ''
          }`}
          onClick={() => selectOperator(op.value)}
        >
          <span>{op.label}</span>
        </button>
      ));
    }

    if (step === 'selectValue' && activeFilter) {
      if (activeFilter.type === 'select') {
        items =
          filteredSelectOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-foreground/50">گزینه‌ای یافت نشد</div>
          ) : (
            filteredSelectOptions.map((opt, i) => (
              <button
                key={String(opt.value)}
                type="button"
                id={`filter-val-${i}`}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-right transition-colors hover:bg-active-bg/30 ${
                  i === highlightIdx ? 'bg-active-bg/30' : ''
                }`}
                onClick={() => commitToken(String(opt.value), opt.label)}
              >
                <span>{opt.label}</span>
              </button>
            ))
          );
      }
      if (activeFilter.type === 'autocomplete') {
        if (autocompleteLoading) {
          items = <div className="px-3 py-2 text-sm text-foreground/50">در حال جستجو...</div>;
        } else if (!valueInput.trim()) {
          items = <div className="px-3 py-2 text-sm text-foreground/50">تایپ کنید تا جستجو شود...</div>;
        } else if (filteredSelectOptions.length === 0) {
          items = <div className="px-3 py-2 text-sm text-foreground/50">نتیجه‌ای یافت نشد</div>;
        } else {
          items = filteredSelectOptions.map((opt, i) => (
            <button
              key={String(opt.value)}
              type="button"
              id={`filter-val-${i}`}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-right transition-colors hover:bg-active-bg/30 ${
                i === highlightIdx ? 'bg-active-bg/30' : ''
              }`}
              onClick={() => commitToken(String(opt.value), opt.label)}
            >
              <span>{opt.label}</span>
            </button>
          ));
        }
      }
    }

    if (!items) return null;

    return typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={dropdownRef}
            tabIndex={-1}
            role="listbox"
            aria-label="فیلتر"
            dir="rtl"
            className="fixed z-[99999] w-max min-w-[220px] max-w-[360px] max-h-[260px] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-white shadow-lg outline-none focus:ring-2 focus:ring-accent/30"
            style={getDropdownPos()}
            onMouseDown={(e) => {
              e.preventDefault();
              clickedInsideDropdownRef.current = true;
            }}
            onKeyDown={handleKeyboardNav}
          >
            {items}
          </div>,
          document.body,
        )
      : null;
  };

  const getDropdownPos = (): React.CSSProperties => {
    if (!containerRef.current) return {};
    const r = containerRef.current.getBoundingClientRect();
    return {
      top: r.bottom + 4,
      right: window.innerWidth - r.right,
      width: r.width,
    };
  };

  const getJunctionMenuPos = (): React.CSSProperties => {
    const el = junctionMenuAnchorRef.current;
    if (!el) return {};
    const r = el.getBoundingClientRect();
    return {
      top: r.bottom + 4,
      right: window.innerWidth - r.right,
      minWidth: Math.max(160, r.width),
    };
  };

  const renderJunctionMenu = () => {
    if (!junctionMenuForId || typeof document === 'undefined') return null;
    return createPortal(
      <div
        ref={junctionMenuRef}
        role="listbox"
        aria-label="عملگر منطقی"
        dir="rtl"
        className="fixed z-[99999] w-max max-h-[260px] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-white shadow-lg outline-none focus:ring-2 focus:ring-accent/30"
        style={getJunctionMenuPos()}
        onMouseDown={(e) => {
          e.preventDefault();
          clickedInsideJunctionMenuRef.current = true;
        }}
      >
        {JUNCTION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="option"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-right transition-colors hover:bg-active-bg/30"
            onClick={() => setTokenJunction(junctionMenuForId, opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>,
      document.body,
    );
  };

  const isBuilding = step === 'selectOperator' || step === 'selectValue';

  return (
    <div className="relative mb-4" ref={containerRef}>
      <div
        className={`flex items-center flex-wrap gap-1.5 min-h-[40px] rounded-lg border bg-white px-2 py-1.5 transition-colors ${
          step !== 'idle'
            ? 'border-accent ring-1 ring-accent'
            : 'border-[var(--color-border)]'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Committed tokens + logical junctions (left-associative) */}
        {tokens.map((token, idx) => (
          <Fragment key={token.id}>
            {idx > 0 && (
              <button
                type="button"
                title="عملگر منطقی با شرط قبلی"
                className="shrink-0 rounded border border-dashed border-foreground/25 bg-foreground/[0.04] px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-foreground/70 hover:bg-active-bg/30 hover:border-accent/40"
                onClick={(e) => {
                  e.stopPropagation();
                  const btn = e.currentTarget;
                  junctionMenuAnchorRef.current = btn;
                  setJunctionMenuForId((cur) => (cur === token.id ? null : token.id));
                }}
              >
                {junctionChipLabel(token.junction)}
              </button>
            )}
            <span className="inline-flex items-center gap-0 rounded-md border border-accent/20 bg-accent/10 text-accent text-xs leading-none overflow-hidden">
              <span className="px-1.5 py-1 bg-accent/10 font-medium">{token.label}</span>
              <span className="px-1 py-1 text-accent/60">{operatorLabelStatic(token, filters)}</span>
              <span className="px-1.5 py-1">{token.valueLabel}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToken(token.id);
                }}
                className="px-1 py-1 hover:bg-accent/20 transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            </span>
          </Fragment>
        ))}

        {/* In-progress token being built */}
        {isBuilding && activeFilter && (
          <span
            className={`inline-flex items-center gap-0 rounded-md border border-accent/40 bg-accent/5 text-accent text-xs leading-none ${
              activeFilter.type === 'date' ? 'overflow-visible' : 'overflow-hidden'
            }`}
          >
            {tokens.length > 0 && (
              <span
                className="px-1.5 py-1 font-semibold bg-accent/15 text-accent border-l border-accent/25"
                title="پیوند با شرط قبلی"
              >
                {FILTERBOX_JUNCTION_ROWS.find((r) => r.value === pendingNextJunction)?.label ??
                  pendingNextJunction}
              </span>
            )}
            <span className="px-1.5 py-1 bg-accent/10 font-medium">{activeFilter.label}</span>
            {activeOperator && (
              <span className="px-1 py-1 text-accent/60">{operatorLabel(activeOperator)}</span>
            )}
            {step === 'selectValue' && (
              <>
                {activeFilter.type === 'date' ? (
                  <div
                    className="w-[160px] py-0.5 px-1"
                    onKeyDown={(e) => {
                      // Let Enter/Esc/Backspace behave like other inputs.
                      handleKeyboardNav(e);
                    }}
                  >
                    <PersianDatePicker
                      value={valueInput}
                      placeholder="تاریخ..."
                      className="[&_input]:!h-7 [&_input]:!text-xs [&_input]:!px-2 [&_input]:!py-1 [&_input]:!rounded-md [&_input]:!border-accent/30 [&_input]:!bg-transparent [&_input]:focus:!ring-0 [&_input]:focus:!border-accent"
                      onChange={(v) => {
                        // Keep it as draft; user can hit Enter to commit (consistent with other free-value inputs).
                        const day = v.trim().slice(0, 10);
                        setValueInput(day);
                      }}
                    />
                  </div>
                ) : activeFilter.type === 'time' ? (
                  <input
                    ref={inputRef}
                    type="time"
                    value={valueInput}
                    step={60}
                    onChange={(e) => setValueInput(e.target.value)}
                    onKeyDown={(e) => {
                      handleKeyboardNav(e);
                    }}
                    className="border-none outline-none bg-transparent text-xs text-accent py-1 px-1 placeholder-accent/40 w-[100px] text-left"
                    autoFocus
                  />
                ) : (
                  <input
                    ref={inputRef}
                    type={activeFilter.type === 'number' ? 'number' : 'text'}
                    value={valueInput}
                    onChange={(e) => setValueInput(toEnglishDigits(e.target.value))}
                    onKeyDown={(e) => {
                      // When input type is `number`, browsers may reject non-ASCII digits.
                      if (activeFilter.type === 'number') {
                        const normalizedKey = toEnglishDigits(e.key);
                        const isAsciiDigit = /^[0-9]$/.test(normalizedKey);
                        if (
                          !e.ctrlKey &&
                          !e.metaKey &&
                          !e.altKey &&
                          normalizedKey !== e.key &&
                          isAsciiDigit
                        ) {
                          e.preventDefault();
                          const el = e.currentTarget;
                          const start = el.selectionStart ?? valueInput.length;
                          const end = el.selectionEnd ?? valueInput.length;
                          const nextValue = valueInput.slice(0, start) + normalizedKey + valueInput.slice(end);
                          setValueInput(nextValue);
                          requestAnimationFrame(() => {
                            try {
                              el.setSelectionRange(start + 1, start + 1);
                            } catch {
                              // ignore
                            }
                          });
                          return;
                        }
                      }

                      handleKeyboardNav(e);
                    }}
                    placeholder={activeFilter.type === 'autocomplete' ? 'جستجو...' : 'مقدار...'}
                    dir={activeFilter.type === 'number' ? 'ltr' : undefined}
                    className={`border-none outline-none bg-transparent text-xs text-accent w-[80px] py-1 px-1 placeholder-accent/40 ${
                      activeFilter.type === 'number' ? 'text-left' : ''
                    }`}
                    autoFocus
                  />
                )}
              </>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); resetDropdown(); }}
              className="px-1 py-1 hover:bg-accent/20 transition-colors text-accent/40 hover:text-accent"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l6 6M9 3l-6 6" />
              </svg>
            </button>
          </span>
        )}

        {/* Free-text input (hidden when building a token) */}
        {!isBuilding && (
          <input
            ref={inputRef}
            type="text"
            value={freeText}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyboardNav}
            placeholder={tokens.length > 0 ? '' : placeholder}
            className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm text-foreground placeholder-placeholder py-0.5"
          />
        )}

        {/* Spacer when building to push buttons to the end */}
        {isBuilding && <span className="flex-1" />}

        {loading && (
          <SpinnerIcon className="w-4 h-4 text-accent shrink-0" />
        )}

        {(tokens.length > 0 || isBuilding) && (
          <button
            type="button"
            onClick={() => {
              resetDropdown();
              if (onClearAll) onClearAll();
              else {
                onTokensChange([]);
                onFreeTextChange('');
              }
            }}
            className="p-1 rounded hover:bg-red-50 text-foreground/30 hover:text-red-500 transition-colors shrink-0"
            title="پاک کردن همه فیلترها"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={onSearch}
          className={`p-1.5 rounded-md bg-accent text-white hover:bg-accent/90 transition-all shrink-0 ${
            hasPendingChanges ? 'ring-2 ring-offset-1 ring-accent ring-offset-white shadow-sm' : ''
          }`}
          title="اعمال فیلترها و جستجو"
        >
          <SearchIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {renderDropdown()}
      {renderJunctionMenu()}
    </div>
  );
}

function operatorLabelStatic(token: FilterToken, filters: DataTableFilter[]): string {
  const filter = filters.find((f) => f.key === token.key);
  if (!filter) return token.operator;
  const ops = filter.operators ?? DEFAULT_OPERATORS[filter.type] ?? [];
  return ops.find((o) => o.value === token.operator)?.label ?? token.operator;
}

/* ─── Main Component ─── */

export function DataTable<T>({
  columns,
  actions,
  enableColumnPinning = true,
  selectableRows,
  groupActions,
  isRowSelectable,
  clearSelectionOnDataChange = true,
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
  filters,
  openEditOnRowDoubleClick = true,
}: DataTableProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(pageSize);
  /** Draft: what the user is editing in the filter bar (not sent until Search). */
  const [filterDraftTokens, setFilterDraftTokens] = useState<FilterToken[]>([]);
  const [filterDraftFreeText, setFilterDraftFreeText] = useState('');
  /** Applied: last submitted query (used for API + pagination). */
  const [filterAppliedTokens, setFilterAppliedTokens] = useState<FilterToken[]>([]);
  const [filterAppliedFreeText, setFilterAppliedFreeText] = useState('');
  const [filterSearchVersion, setFilterSearchVersion] = useState(0);

  const applyFilterSearch = useCallback(() => {
    setFilterAppliedTokens(filterDraftTokens);
    setFilterAppliedFreeText(filterDraftFreeText);
    setFilterSearchVersion((v) => v + 1);
  }, [filterDraftTokens, filterDraftFreeText]);

  const clearAllFilters = useCallback(() => {
    setFilterDraftTokens([]);
    setFilterDraftFreeText('');
    setFilterAppliedTokens([]);
    setFilterAppliedFreeText('');
    setFilterSearchVersion((v) => v + 1);
  }, []);

  const filterBarDirty =
    JSON.stringify(filterDraftTokens) !== JSON.stringify(filterAppliedTokens) ||
    filterDraftFreeText !== filterAppliedFreeText;
  /** Server sort: `sortField` / `key` string; null = use API default. */
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(() => new Set());
  const [pagination, setPagination] = useState<DataTablePagination>({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  });

  const debouncedSearch = useDebouncedValue(searchText, searchDebounce);

  const fetchIdRef = useRef(0);

  const bulkActions = groupActions ?? [];
  const enableSelection = Boolean(selectableRows) || bulkActions.length > 0;
  const checkboxThRef = useRef<HTMLTableCellElement | null>(null);
  const [checkboxColWidth, setCheckboxColWidth] = useState(0);
  const bulkActionsWithClear: DataTableGroupAction<T>[] = [
    ...bulkActions,
    {
      label: 'پاک کردن',
      variant: 'outline',
      onClick: () => {
        setSelectedKeys(new Set());
      },
    },
  ];

  useEffect(() => {
    setLimit(pageSize);
  }, [pageSize]);

  const load = useCallback(
    async (p: number, search: string, tokens?: FilterToken[]) => {
      const id = ++fetchIdRef.current;
      setLoading(true);
      try {
        const result = await fetchData({
          page: p,
          limit,
          search,
          filters: tokens && tokens.length > 0 ? tokens : undefined,
          sortBy: sortBy ?? undefined,
          sortOrder: sortBy ? sortOrder : undefined,
        });
        if (id !== fetchIdRef.current) return;
        setRows(result.rows);
        setPagination(result.pagination);
      } finally {
        if (id === fetchIdRef.current) setLoading(false);
      }
    },
    [fetchData, limit, sortBy, sortOrder],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limit, filterSearchVersion, sortBy, sortOrder]);

  useEffect(() => {
    if (!enableSelection) return;
    if (!clearSelectionOnDataChange) return;
    setSelectedKeys(new Set());
  }, [debouncedSearch, page, limit, enableSelection, clearSelectionOnDataChange, filterSearchVersion, sortBy, sortOrder]);

  useEffect(() => {
    if (filters) {
      load(
        page,
        filterAppliedFreeText,
        filterAppliedTokens.length > 0 ? filterAppliedTokens : undefined,
      );
    } else {
      load(page, debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, load, filterSearchVersion, sortBy, sortOrder]);

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

  const hasActions = actions && actions.length > 0;
  const totalVisibleCols = columns.length + (enableSelection ? 1 : 0) + (hasActions ? 1 : 0);
  const skelCols = skeletonColumns ?? totalVisibleCols;
  const skeletonRows = Math.min(limit, 20);

  const visibleSelectableRows = enableSelection
    ? rows.filter((r) => (isRowSelectable ? isRowSelectable(r) : true))
    : [];
  const visibleSelectableKeys = enableSelection
    ? visibleSelectableRows.map((r) => rowKey(r))
    : [];
  const visibleSelectedCount = enableSelection
    ? visibleSelectableKeys.filter((k) => selectedKeys.has(k)).length
    : 0;
  const selectedRows = enableSelection ? rows.filter((r) => selectedKeys.has(rowKey(r))) : [];
  const allVisibleSelected =
    enableSelection && visibleSelectableKeys.length > 0 && visibleSelectedCount === visibleSelectableKeys.length;

  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    const indeterminate =
      enableSelection &&
      visibleSelectableKeys.length > 0 &&
      visibleSelectedCount > 0 &&
      visibleSelectedCount < visibleSelectableKeys.length;
    headerCheckboxRef.current.indeterminate = Boolean(indeterminate);
  }, [enableSelection, visibleSelectableKeys.length, visibleSelectedCount]);

  const toggleRow = (row: T, nextValue: boolean) => {
    const key = rowKey(row);
    if (!enableSelection) return;
    const selectable = isRowSelectable ? isRowSelectable(row) : true;
    if (!selectable) return;
    setSelectedKeys((prev) => {
      const n = new Set(prev);
      if (nextValue) n.add(key);
      else n.delete(key);
      return n;
    });
  };

  const toggleAllVisible = (nextValue: boolean) => {
    if (!enableSelection) return;
    setSelectedKeys((prev) => {
      const n = new Set(prev);
      for (const r of visibleSelectableRows) {
        const k = rowKey(r);
        if (nextValue) n.add(k);
        else n.delete(k);
      }
      return n;
    });
  };

  const [bulkLoading, setBulkLoading] = useState(false);

  const [ctxMenu, setCtxMenu] = useState<{ row: T; x: number; y: number } | null>(null);
  const ctxMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    const onPointerDown = (e: MouseEvent) => {
      if (ctxMenuRef.current && ctxMenuRef.current.contains(e.target as Node)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [ctxMenu]);

  const handleRowContextMenu = (e: React.MouseEvent, row: T) => {
    if (!actions || actions.length === 0) return;
    e.preventDefault();
    setCtxMenu({ row, x: e.clientX, y: e.clientY });
  };

  const handleRowDoubleClick = useCallback(
    (e: React.MouseEvent, row: T) => {
      if (!openEditOnRowDoubleClick || !actions?.length) return;
      const el = e.target as HTMLElement;
      if (el.closest('button, a, input, select, textarea, [role="button"], label')) return;
      const act = resolveRowDoubleClickAction(actions, row);
      if (!act) return;
      e.preventDefault();
      void Promise.resolve(act.onClick(row));
    },
    [actions, openEditOnRowDoubleClick],
  );

  const [pinnedColumnKeys, setPinnedColumnKeys] = useState<string[]>([]);
  const pinnedColumnsSignature = useMemo(
    () => columns.map((c) => c.key).slice().sort().join('|'),
    [columns],
  );
  const [pinStorageKey, setPinStorageKey] = useState<string | null>(null);

  // Restore user pinning from localStorage (route + column set scoped).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname || 'unknown';
    setPinStorageKey(`touch-crm:datatable:pins:${path}:${pinnedColumnsSignature}`);
  }, [pinnedColumnsSignature]);

  useEffect(() => {
    if (!pinStorageKey) return;
    try {
      const raw = window.localStorage.getItem(pinStorageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const valid = parsed
        .filter((k): k is string => typeof k === 'string')
        .filter((k) => columns.some((c) => c.key === k));

      // De-dupe while preserving order.
      setPinnedColumnKeys(Array.from(new Set(valid)));
    } catch {
      // If parsing fails, just ignore persisted state.
    }
  }, [pinStorageKey, columns]);

  // Persist user pinning to localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pinStorageKey) return;
    window.localStorage.setItem(pinStorageKey, JSON.stringify(pinnedColumnKeys));
  }, [pinStorageKey, pinnedColumnKeys]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const headerCellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  useEffect(() => {
    const updateWidths = () => {
      const next: Record<string, number> = {};
      for (const c of columns) {
        const th = headerCellRefs.current[c.key];
        if (th) next[c.key] = th.offsetWidth;
      }
      setColumnWidths(next);
      if (checkboxThRef.current) {
        setCheckboxColWidth(checkboxThRef.current.offsetWidth);
      }
    };
    const frame = requestAnimationFrame(updateWidths);
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', updateWidths);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateWidths);
    };
  }, [columns, rows.length, loading, limit, pinnedColumnKeys]);

  const isPinned = (key: string) => pinnedColumnKeys.includes(key);
  const getPinnedRightOffset = (key: string): number => {
    let offset = 0;
    for (const c of columns) {
      if (c.key === key) break;
      if (!isPinned(c.key)) continue;
      offset += columnWidths[c.key] ?? 160;
    }
    return offset;
  };
  const togglePinned = (key: string) => {
    setPinnedColumnKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleColumnSortClick = (col: DataTableColumn<T>) => {
    if (!col.sortable) return;
    const field = col.sortField ?? col.key;
    if (sortBy === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortBy(null);
        setSortOrder('asc');
      }
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Search bar */}
      {searchable && filters && filters.length > 0 ? (
        <FilteredSearchBar
          filters={filters}
          tokens={filterDraftTokens}
          onTokensChange={setFilterDraftTokens}
          freeText={filterDraftFreeText}
          onFreeTextChange={setFilterDraftFreeText}
          onSearch={applyFilterSearch}
          onClearAll={clearAllFilters}
          hasPendingChanges={filterBarDirty}
          placeholder={searchPlaceholder}
          loading={loading}
        />
      ) : searchable ? (
        <div className="relative mb-4">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(toEnglishDigits(e.target.value))}
            placeholder={searchPlaceholder}
            className="block w-full rounded-lg border border-[var(--color-border)] pr-9 pl-3 py-2 text-sm text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-white"
          />
          {loading && searchText && (
            <SpinnerIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
          )}
        </div>
      ) : null}

      {/* Bulk actions (selection) */}
      {enableSelection && bulkActions.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <span className="text-sm text-foreground/70">
            {selectedRows.length.toLocaleString('fa-IR')} رکورد انتخاب شده
          </span>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden divide-x divide-[var(--color-border)] divide-x-reverse">
              {bulkActionsWithClear
                .filter((a) => !a.hidden || !a.hidden(selectedRows))
                .map((action) => {
                  const disabled =
                    selectedRows.length === 0 ||
                    Boolean(action.disabled?.(selectedRows)) ||
                    bulkLoading;
                  return (
                    <button
                      key={action.label}
                      type="button"
                      disabled={disabled}
                      onClick={async () => {
                        if (disabled) return;
                        setBulkLoading(true);
                        try {
                          await Promise.resolve(action.onClick(selectedRows));
                          setSelectedKeys(new Set());
                        } catch {
                          // Keep selection on failures; parent can surface the error.
                        } finally {
                          setBulkLoading(false);
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-60 ${getActionClasses(action.variant)}`}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Table wrapper with horizontal scroll */}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="min-w-full text-sm text-right">
          <thead>
            <tr className="bg-content-bg border-b border-[var(--color-border)]">
              {enableSelection && (
                <th
                  ref={checkboxThRef}
                  className="py-3 px-3 font-semibold text-foreground/70 whitespace-nowrap sticky bg-content-bg z-30 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--color-border)]"
                  style={{ right: 0 }}
                >
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allVisibleSelected}
                    disabled={visibleSelectableRows.length === 0 || loading}
                    onChange={(e) => toggleAllVisible(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)' }}
                    className="h-4 w-4"
                  />
                </th>
              )}
              {columns.map((col) => {
                const pinned = isPinned(col.key);
                const pinOffset = pinned ? getPinnedRightOffset(col.key) + (enableSelection ? checkboxColWidth : 0) : undefined;
                return (
                  <th
                    key={col.key}
                    ref={(el) => { headerCellRefs.current[col.key] = el; }}
                    className={`py-3 px-4 font-semibold text-foreground/70 whitespace-nowrap ${col.className ?? ''} ${
                      pinned ? 'sticky bg-content-bg z-20 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--color-border)]' : ''
                    }`}
                    style={{
                      ...(col.width ? { width: col.width } : {}),
                      ...(pinned ? { right: pinOffset } : {}),
                    }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.title}
                      {col.sortable && (() => {
                        const sf = col.sortField ?? col.key;
                        const active = sortBy === sf;
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleColumnSortClick(col);
                            }}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded transition-colors shrink-0 ${
                              active ? 'text-accent' : 'text-foreground/25 hover:text-foreground/55'
                            }`}
                            title={
                              active
                                ? sortOrder === 'asc'
                                  ? 'صعودی — کلیک برای نزولی'
                                  : 'نزولی — کلیک برای حذف مرتب‌سازی'
                                : 'مرتب‌سازی ستون'
                            }
                            aria-label="مرتب‌سازی"
                          >
                            {active ? (
                              sortOrder === 'asc' ? (
                                <SortAscIcon className="w-4 h-4" />
                              ) : (
                                <SortDescIcon className="w-4 h-4" />
                              )
                            ) : (
                              <SortNeutralIcon className="w-4 h-4" />
                            )}
                          </button>
                        );
                      })()}
                      {enableColumnPinning && (
                        <button
                          type="button"
                          onClick={() => togglePinned(col.key)}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${
                            pinned
                              ? 'text-accent'
                              : 'text-foreground/20 hover:text-foreground/50'
                          }`}
                          title={pinned ? 'آزاد کردن ستون' : 'سنجاق ستون'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                            {pinned ? (
                              <path fillRule="evenodd" d="M8.5 1a.5.5 0 0 0-1 0v5.6L4.2 8.9a.5.5 0 0 0-.2.4v1.2a.5.5 0 0 0 .5.5H7.5v3.5a.5.5 0 0 0 1 0V11h3a.5.5 0 0 0 .5-.5V9.3a.5.5 0 0 0-.2-.4L8.5 6.6V1Z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M8.5 1a.5.5 0 0 0-1 0v5.6L4.2 8.9a.5.5 0 0 0-.2.4v1.2a.5.5 0 0 0 .5.5H7.5v3.5a.5.5 0 0 0 1 0V11h3a.5.5 0 0 0 .5-.5V9.3a.5.5 0 0 0-.2-.4L8.5 6.6V1Z" clipRule="evenodd" opacity=".4" />
                            )}
                          </svg>
                        </button>
                      )}
                    </span>
                  </th>
                );
              })}
              {hasActions && (
                <th
                  className="py-3 px-2 font-semibold text-foreground/70 whitespace-nowrap sticky bg-content-bg z-30 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--color-border)]"
                  style={{ left: 0 }}
                  aria-label="عملیات"
                >
                  <span className="sr-only">عملیات</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={skelCols} rows={skeletonRows} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={totalVisibleCols} className="py-12 text-center text-foreground/50">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const dblClickAction =
                  openEditOnRowDoubleClick && actions?.length
                    ? resolveRowDoubleClickAction(actions, row)
                    : undefined;
                return (
                <tr
                  key={rowKey(row)}
                  className={`group border-b border-[var(--color-border)] hover:bg-table-row-hover transition-colors ${
                    dblClickAction ? 'cursor-pointer' : ''
                  }`}
                  title={dblClickAction ? 'دو بار کلیک برای ویرایش' : undefined}
                  onContextMenu={(e) => handleRowContextMenu(e, row)}
                  onDoubleClick={(e) => handleRowDoubleClick(e, row)}
                >
                  {enableSelection && (
                    <td
                      className="py-3 px-3 sticky bg-white group-hover:bg-table-row-hover z-30 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--color-border)] transition-colors"
                      style={{ right: 0 }}
                    >
                      {(() => {
                        const selectable = isRowSelectable ? isRowSelectable(row) : true;
                        const key = rowKey(row);
                        const checked = selectedKeys.has(key);
                        return (
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!selectable || bulkLoading}
                            onChange={(e) => toggleRow(row, e.target.checked)}
                            style={{ accentColor: 'var(--color-primary)' }}
                            className="h-4 w-4"
                          />
                        );
                      })()}
                    </td>
                  )}
                  {columns.map((col) => {
                    const pinned = isPinned(col.key);
                    const pinOffset = pinned ? getPinnedRightOffset(col.key) + (enableSelection ? checkboxColWidth : 0) : undefined;
                    return (
                      <td
                        key={col.key}
                        className={`py-3 px-4 ${col.className ?? ''} ${
                          pinned
                            ? 'sticky bg-white group-hover:bg-table-row-hover z-20 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--color-border)] transition-colors'
                            : ''
                        }`}
                        style={{
                          ...(col.width ? { width: col.width } : {}),
                          ...(pinned ? { right: pinOffset } : {}),
                        }}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td
                      className="py-2 px-2 sticky bg-white group-hover:bg-table-row-hover z-30 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-[var(--color-border)] transition-colors"
                      style={{ left: 0 }}
                    >
                        <RowActionsDropdown actions={actions!} row={row} />
                    </td>
                  )}
                </tr>
                );
              })
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

      {/* Row context menu */}
      {ctxMenu && hasActions && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={ctxMenuRef}
            role="menu"
            dir="rtl"
            className="fixed z-[99999] w-max min-w-[160px] rounded-lg border border-[var(--color-border)] bg-white shadow-lg overflow-hidden"
            style={{ top: ctxMenu.y, left: ctxMenu.x }}
          >
            {actions!
              .filter((a) => !a.hidden || !a.hidden(ctxMenu.row))
              .map((action) => (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    const row = ctxMenu.row;
                    setCtxMenu(null);
                    try {
                      await Promise.resolve(action.onClick(row));
                    } catch {
                      /* handled by parent */
                    }
                  }}
                  className={`w-full flex items-center justify-start gap-2 px-3 py-2 text-sm transition-colors ${getActionClasses(action.variant)} hover:!bg-active-bg/30`}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
          </div>,
          document.body,
        )}
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
