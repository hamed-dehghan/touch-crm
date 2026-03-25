'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Product } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppDialogs } from '@/components/ui/AppDialogs';
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
  type DataTableFilter,
  type FilterToken,
} from '@/components/ui/DataTable';
import { formatGregorianToJalali } from '@/utils/date';
import { routes } from '@/lib/routes';

export default function ProductsPage() {
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProducts = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const filtersPayload =
        params.filters && params.filters.length > 0
          ? JSON.stringify(
              params.filters.map((f) => ({
                key: f.key,
                operator: f.operator,
                value: f.value,
                ...(f.junction ? { junction: f.junction } : {}),
              })),
            )
          : undefined;

      const res = await api.products.list({
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        filters: filtersPayload,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });

      if (res.success && res.data) {
        return {
          rows: res.data.products,
          pagination: res.data.pagination,
        };
      }

      return {
        rows: [],
        pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
      };
    },
    [refreshKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleDelete = async (p: Product) => {
    const ok = await dialogs.confirm('آیا از حذف این محصول مطمئنید؟');
    if (!ok) return;
    const res = await api.products.delete(p.id);
    if (res.success) setRefreshKey((k) => k + 1);
  };

  const handleBulkDelete = async (selected: Product[]) => {
    if (selected.length === 0) return;

    const ok = await dialogs.confirm('آیا از حذف محصولات انتخاب شده مطمئنید؟', {
      danger: true,
      confirmText: 'حذف',
    });
    if (!ok) return;

    const results = await Promise.all(selected.map((p) => api.products.delete(p.id)));
    const failed = results.find((r) => !r.success);

    if (failed) {
      await dialogs.alert(failed.error?.message ?? 'خطا در حذف گروهی');
      return;
    }

    setRefreshKey((k) => k + 1);
  };

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'id',
      title: 'شناسه',
      width: '80px',
      sortable: true,
      render: (row) => row.id.toLocaleString('fa-IR'),
    },
    {
      key: 'productName',
      title: 'نام محصول',
      sticky: true,
      sortable: true,
    },
    {
      key: 'price',
      title: 'قیمت (ریال)',
      sortable: true,
      render: (row) => row.price.toLocaleString('fa-IR'),
    },
    {
      key: 'taxRate',
      title: 'نرخ مالیات',
      sortable: true,
      render: (row) => `${row.taxRate}%`,
    },
    {
      key: 'createdAt',
      title: 'تاریخ ایجاد',
      sortable: true,
      render: (row) => (row.createdAt ? formatGregorianToJalali(row.createdAt) : '—'),
    },
  ];

  const actions: DataTableAction<Product>[] = [
    {
      label: 'ویرایش',
      onClick: (row) => router.push(routes.productEdit(row.id)),
      variant: 'primary',
      icon: <PencilIcon className="w-3.5 h-3.5" />,
      triggerOnRowDoubleClick: true,
    },
    {
      label: 'حذف',
      onClick: handleDelete,
      variant: 'danger',
      icon: <TrashIcon className="w-3.5 h-3.5" />,
    },
  ];

  const groupActions = [
    {
      label: 'حذف انتخاب شده',
      onClick: handleBulkDelete,
      variant: 'danger' as const,
      icon: <TrashIcon className="w-3.5 h-3.5" />,
    },
  ];

  const productFilters: DataTableFilter[] = [
    { key: 'productName', label: 'نام محصول', type: 'text' },
    { key: 'price', label: 'قیمت', type: 'number' },
    { key: 'taxRate', label: 'نرخ مالیات', type: 'number' },
    { key: 'createdAt', label: 'تاریخ ایجاد', type: 'date' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">محصولات</h1>
        <Button onClick={() => router.push(routes.productNew)}>افزودن محصول</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست محصولات</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Product>
            columns={columns}
            actions={actions}
            groupActions={groupActions}
            selectableRows
            fetchData={fetchProducts}
            rowKey={(row) => row.id}
            searchPlaceholder="چند فیلتر اضافه کنید، سپس دکمه جستجو را بزنید..."
            pageSize={10}
            emptyMessage="محصولی یافت نشد."
            filters={productFilters}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Inline icons ─── */

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}
