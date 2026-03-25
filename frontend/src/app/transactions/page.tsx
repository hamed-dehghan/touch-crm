'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Transaction } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatGregorianToJalali } from '@/utils/date';
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type FilterToken,
} from '@/components/ui/DataTable';
import { filterRowsBySearch, paginateSlice, sortRows } from '@/lib/clientListQuery';
import { routes } from '@/lib/routes';
import { filterRowsByTokens, matchDateCell, matchNumberCell, matchSelectCell, matchTextCell } from '@/lib/filterTokens';

const transactionFilterDefinitions: DataTableFilter[] = [
  { key: 'id', label: 'شناسه', type: 'number' },
  { key: 'customer', label: 'نام مشتری', type: 'text' },
  { key: 'amount', label: 'مبلغ', type: 'number' },
  {
    key: 'paymentMethod',
    label: 'روش پرداخت',
    type: 'select',
    options: [
      { value: 'CASH', label: 'نقد' },
      { value: 'CHECK', label: 'چک' },
    ],
  },
  { key: 'transactionDate', label: 'تاریخ تراکنش', type: 'date' },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [savedTick, setSavedTick] = useState(0);

  const fetchTransactions = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const res = await api.transactions.list({ page: 1, limit: 10000 });
      if (!res.success || !res.data) {
        return {
          rows: [],
          pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
        };
      }
      let rows = [...res.data.transactions];
      rows = filterRowsBySearch(rows, params.search, (t) => {
        const name = t.customer
          ? [t.customer.firstName, t.customer.lastName].filter(Boolean).join(' ')
          : String(t.customerId);
        return `${t.id} ${name} ${t.amount} ${t.paymentMethod} ${t.transactionDate}`;
      });
      rows = filterRowsByTokens(rows, params.filters, {
        id: (t, op, v) => matchNumberCell(t.id, op, v),
        customer: (t, op, v) =>
          matchTextCell(
            t.customer ? [t.customer.firstName, t.customer.lastName].filter(Boolean).join(' ') : String(t.customerId),
            op,
            v,
          ),
        amount: (t, op, v) => matchNumberCell(t.amount, op, v),
        paymentMethod: (t, op, v) => matchSelectCell(t.paymentMethod, op, v),
        transactionDate: (t, op, v) => matchDateCell(t.transactionDate, op, v),
      });
      rows = sortRows(rows, params.sortBy, params.sortOrder, {
        id: (t) => t.id,
        transactionDate: (t) => new Date(t.transactionDate).getTime(),
        amount: (t) => t.amount,
        paymentMethod: (t) => t.paymentMethod,
        customer: (t) =>
          t.customer
            ? [t.customer.firstName, t.customer.lastName].filter(Boolean).join(' ')
            : String(t.customerId),
      });
      return paginateSlice(rows, params.page, params.limit);
    },
    [savedTick],
  );

  const columns: DataTableColumn<Transaction>[] = [
    {
      key: 'transactionDate',
      title: 'تاریخ',
      sortable: true,
      sticky: true,
      render: (t) => formatGregorianToJalali(t.transactionDate),
    },
    {
      key: 'customer',
      title: 'مشتری',
      sortable: true,
      sortField: 'customer',
      render: (t) =>
        t.customer ? [t.customer.firstName, t.customer.lastName].filter(Boolean).join(' ') : String(t.customerId),
    },
    {
      key: 'amount',
      title: 'مبلغ',
      sortable: true,
      render: (t) => <span dir="ltr">{t.amount.toLocaleString('fa-IR')}</span>,
    },
    {
      key: 'paymentMethod',
      title: 'روش پرداخت',
      sortable: true,
      render: (t) => (t.paymentMethod === 'CASH' ? 'نقد' : 'چک'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">تراکنش‌ها</h1>
        <Button onClick={() => router.push(routes.transactionNew)}>ثبت تراکنش جدید</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست تراکنش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Transaction>
            columns={columns}
            fetchData={fetchTransactions}
            rowKey={(r) => r.id}
            enableColumnPinning
            filters={transactionFilterDefinitions}
            searchPlaceholder="فیلترها را اضافه کنید یا متن جستجو را وارد کنید، سپس جستجو..."
            pageSize={10}
            emptyMessage="تراکنشی یافت نشد."
          />
        </CardContent>
      </Card>
    </div>
  );
}
