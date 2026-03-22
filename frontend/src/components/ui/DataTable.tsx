'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Skeleton } from './Skeleton';

/* ─── Types ─── */

export interface DataTableColumn<T> {
  key: string;
  title: string;
  render?: (row: T) => ReactNode;
  /** Pin this column so it stays visible while scrolling horizontally */
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
  type: 'text' | 'select' | 'number' | 'date';
  operators?: { value: string; label: string }[];
  options?: DataTableFilterOption[] | (() => Promise<DataTableFilterOption[]>);
  icon?: ReactNode;
}

export interface FilterToken {
  id: string;
  key: string;
  operator: string;
  value: string;
  label: string;
  valueLabel: string;
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

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const clickedInsideDropdownRef = useRef(false);

  /** Allow the same field multiple times (e.g. two price bounds) — search runs only when user clicks Search. */
  const availableFilters = filters;

  const getOperators = (f: DataTableFilter) => f.operators ?? DEFAULT_OPERATORS[f.type] ?? [];

  useEffect(() => {
    if (step === 'idle') return;
    const handleClickOutside = (e: MouseEvent) => {
      if (clickedInsideDropdownRef.current) {
        clickedInsideDropdownRef.current = false;
        return;
      }
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

  const resetDropdown = () => {
    setStep('idle');
    setActiveFilter(null);
    setActiveOperator(null);
    setValueInput('');
    setAsyncOptions([]);
    setHighlightIdx(-1);
  };

  const openKeySelection = () => {
    if (availableFilters.length > 0) {
      setStep('selectKey');
      setHighlightIdx(-1);
    }
  };

  const selectKey = (filter: DataTableFilter) => {
    setActiveFilter(filter);
    const ops = getOperators(filter);
    if (ops.length === 1) {
      setActiveOperator(ops[0].value);
      enterValueStep(filter);
    } else {
      setStep('selectOperator');
      setHighlightIdx(-1);
    }
  };

  const selectOperator = (op: string) => {
    setActiveOperator(op);
    enterValueStep(activeFilter!);
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
    }
  };

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
    onTokensChange([...tokens, token]);
    resetDropdown();
    inputRef.current?.focus();
  };

  const removeToken = (id: string) => {
    onTokensChange(tokens.filter((t) => t.id !== id));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      resetDropdown();
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      if (step === 'selectValue') {
        if (valueInput.trim()) {
          commitToken(valueInput.trim(), valueInput.trim());
        }
        e.preventDefault();
        return;
      }
      if (step === 'selectKey' && highlightIdx >= 0 && highlightIdx < availableFilters.length) {
        selectKey(availableFilters[highlightIdx]);
        e.preventDefault();
        return;
      }
      if (step === 'idle' || step === 'selectKey') {
        onSearch();
        resetDropdown();
        e.preventDefault();
        return;
      }
    }
    if (e.key === 'Backspace' && freeText === '' && step === 'idle' && tokens.length > 0) {
      removeToken(tokens[tokens.length - 1].id);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => i + 1);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(-1, i - 1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFreeTextChange(e.target.value);
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
      const filtered = freeText
        ? availableFilters.filter((f) => f.label.includes(freeText))
        : availableFilters;
      items = filtered.length === 0 ? (
        <div className="px-3 py-2 text-sm text-foreground/50">فیلتری یافت نشد</div>
      ) : (
        filtered.map((f, i) => (
          <button
            key={f.key}
            type="button"
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-right transition-colors hover:bg-active-bg/30 ${
              i === highlightIdx ? 'bg-active-bg/30' : ''
            }`}
            onClick={() => selectKey(f)}
          >
            {f.icon && <span className="w-4 h-4 shrink-0">{f.icon}</span>}
            <span>{f.label}</span>
            <span className="mr-auto text-foreground/30 text-xs">
              {f.type === 'text' ? 'متن' : f.type === 'number' ? 'عدد' : f.type === 'select' ? 'انتخاب' : 'تاریخ'}
            </span>
          </button>
        ))
      );
    }

    if (step === 'selectOperator' && activeFilter) {
      const ops = getOperators(activeFilter);
      items = ops.map((op, i) => (
        <button
          key={op.value}
          type="button"
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
        const opts = asyncOptions;
        const filtered = valueInput
          ? opts.filter((o) => o.label.includes(valueInput))
          : opts;
        items = filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-foreground/50">گزینه‌ای یافت نشد</div>
        ) : (
          filtered.map((opt, i) => (
            <button
              key={String(opt.value)}
              type="button"
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
      // For text/number/date: no dropdown items — user types directly in the pill's input
    }

    if (!items) return null;

    return typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={dropdownRef}
            dir="rtl"
            className="fixed z-[99999] w-max min-w-[220px] max-w-[360px] max-h-[260px] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-white shadow-lg"
            style={getDropdownPos()}
            onMouseDown={(e) => {
              e.preventDefault();
              clickedInsideDropdownRef.current = true;
            }}
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
        {/* Committed tokens */}
        {tokens.map((token) => (
          <span
            key={token.id}
            className="inline-flex items-center gap-0 rounded-md border border-accent/20 bg-accent/10 text-accent text-xs leading-none overflow-hidden"
          >
            <span className="px-1.5 py-1 bg-accent/10 font-medium">{token.label}</span>
            <span className="px-1 py-1 text-accent/60">{operatorLabelStatic(token, filters)}</span>
            <span className="px-1.5 py-1">{token.valueLabel}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeToken(token.id); }}
              className="px-1 py-1 hover:bg-accent/20 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l6 6M9 3l-6 6" />
              </svg>
            </button>
          </span>
        ))}

        {/* In-progress token being built */}
        {isBuilding && activeFilter && (
          <span className="inline-flex items-center gap-0 rounded-md border border-accent/40 bg-accent/5 text-accent text-xs leading-none overflow-hidden">
            <span className="px-1.5 py-1 bg-accent/10 font-medium">{activeFilter.label}</span>
            {activeOperator && (
              <span className="px-1 py-1 text-accent/60">{operatorLabel(activeOperator)}</span>
            )}
            {step === 'selectValue' && (
              <input
                ref={inputRef}
                type={activeFilter.type === 'number' ? 'number' : 'text'}
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="مقدار..."
                className="border-none outline-none bg-transparent text-xs text-accent w-[80px] py-1 px-1 placeholder-accent/40"
                autoFocus
              />
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
            onKeyDown={handleInputKeyDown}
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

  const hasSticky = columns.some((c) => c.sticky);
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

  const [pinnedColumnKeys, setPinnedColumnKeys] = useState<string[]>(
    columns.filter((c) => c.sticky).map((c) => c.key),
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const headerCellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  useEffect(() => {
    const stickyDefaults = columns.filter((c) => c.sticky).map((c) => c.key);
    setPinnedColumnKeys((prev) => {
      const next = prev.filter((k) => columns.some((c) => c.key === k));
      for (const k of stickyDefaults) {
        if (!next.includes(k)) next.push(k);
      }
      return next;
    });
  }, [columns]);

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
            onChange={(e) => setSearchText(e.target.value)}
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
