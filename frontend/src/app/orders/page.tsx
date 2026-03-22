'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Order } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
  type DataTableFilter,
  type FilterToken,
} from '@/components/ui/DataTable';
import { formatGregorianToJalali } from '@/utils/date';
import { filterRowsBySearch, paginateSlice, sortRows } from '@/lib/clientListQuery';
import { filterRowsByTokens, matchDateCell, matchNumberCell, matchTextCell } from '@/lib/filterTokens';

const orderFilterDefinitions: DataTableFilter[] = [
  { key: 'id', label: 'شناسه سفارش', type: 'number' },
  { key: 'customer', label: 'نام مشتری', type: 'text' },
  { key: 'orderDate', label: 'تاریخ سفارش', type: 'date' },
  { key: 'finalAmount', label: 'مبلغ نهایی', type: 'number' },
  { key: 'totalAmount', label: 'جمع کل', type: 'number' },
  { key: 'discountAmount', label: 'تخفیف', type: 'number' },
  { key: 'taxAmount', label: 'مالیات', type: 'number' },
];

export default function OrdersPage() {
  const router = useRouter();

  const fetchOrders = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const res = await api.orders.list();
      if (!res.success || !res.data) {
        return {
          rows: [],
          pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
        };
      }
      let rows = [...res.data.orders];
      rows = filterRowsBySearch(rows, params.search, (o) => {
        const name = o.customer
          ? [o.customer.firstName, o.customer.lastName].filter(Boolean).join(' ')
          : String(o.customerId);
        return `${o.id} ${name} ${o.finalAmount}`;
      });
      rows = filterRowsByTokens(rows, params.filters, {
        id: (o, op, v) => matchNumberCell(o.id, op, v),
        customer: (o, op, v) =>
          matchTextCell(
            o.customer ? [o.customer.firstName, o.customer.lastName].filter(Boolean).join(' ') : String(o.customerId),
            op,
            v,
          ),
        orderDate: (o, op, v) => matchDateCell(o.orderDate, op, v),
        finalAmount: (o, op, v) => matchNumberCell(o.finalAmount, op, v),
        totalAmount: (o, op, v) => matchNumberCell(o.totalAmount, op, v),
        discountAmount: (o, op, v) => matchNumberCell(o.discountAmount, op, v),
        taxAmount: (o, op, v) => matchNumberCell(o.taxAmount, op, v),
      });
      rows = sortRows(rows, params.sortBy, params.sortOrder, {
        id: (o) => o.id,
        orderDate: (o) => new Date(o.orderDate).getTime(),
        totalAmount: (o) => o.totalAmount,
        discountAmount: (o) => o.discountAmount,
        taxAmount: (o) => o.taxAmount,
        finalAmount: (o) => o.finalAmount,
        customer: (o) =>
          o.customer
            ? [o.customer.firstName, o.customer.lastName].filter(Boolean).join(' ')
            : String(o.customerId),
      });
      return paginateSlice(rows, params.page, params.limit);
    },
    [],
  );

  const columns: DataTableColumn<Order>[] = [
    {
      key: 'id',
      title: 'شناسه',
      width: '80px',
      sortable: true,
      render: (r) => r.id.toLocaleString('fa-IR'),
    },
    {
      key: 'customer',
      title: 'مشتری',
      sticky: true,
      sortable: true,
      sortField: 'customer',
      render: (row) =>
        row.customer
          ? [row.customer.firstName, row.customer.lastName].filter(Boolean).join(' ')
          : String(row.customerId),
    },
    {
      key: 'orderDate',
      title: 'تاریخ سفارش',
      sortable: true,
      render: (row) => formatGregorianToJalali(row.orderDate),
    },
    {
      key: 'totalAmount',
      title: 'جمع کل',
      sortable: true,
      render: (r) => (
        <span dir="ltr">{r.totalAmount.toLocaleString('fa-IR')} ریال</span>
      ),
    },
    {
      key: 'discountAmount',
      title: 'تخفیف',
      sortable: true,
      render: (r) => (
        <span dir="ltr">{r.discountAmount.toLocaleString('fa-IR')} ریال</span>
      ),
    },
    {
      key: 'taxAmount',
      title: 'مالیات',
      sortable: true,
      render: (r) => (
        <span dir="ltr">{r.taxAmount.toLocaleString('fa-IR')} ریال</span>
      ),
    },
    {
      key: 'finalAmount',
      title: 'مبلغ نهایی',
      sortable: true,
      render: (r) => (
        <span dir="ltr">{r.finalAmount.toLocaleString('fa-IR')} ریال</span>
      ),
    },
  ];

  const actions: DataTableAction<Order>[] = [
    {
      label: 'مشاهده',
      variant: 'primary',
      onClick: (row) => router.push(`/orders/${row.id}`),
      triggerOnRowDoubleClick: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">سفارشات</h1>
        <Link href="/orders/new">
          <Button>ثبت سفارش جدید</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>لیست سفارشات</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Order>
            columns={columns}
            actions={actions}
            fetchData={fetchOrders}
            rowKey={(r) => r.id}
            enableColumnPinning
            filters={orderFilterDefinitions}
            searchPlaceholder="فیلترها را اضافه کنید یا متن جستجو را وارد کنید، سپس جستجو..."
            pageSize={10}
            emptyMessage="سفارشی یافت نشد."
          />
        </CardContent>
      </Card>
    </div>
  );
}
