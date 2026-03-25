'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { WorkLog } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatGregorianToJalali } from '@/utils/date';
import { DataTable, type DataTableColumn, type DataTableFilter, type FilterToken } from '@/components/ui/DataTable';
import { filterRowsBySearch, paginateSlice, sortRows } from '@/lib/clientListQuery';
import { filterRowsByTokens, matchDateCell, matchNumberCell, matchTextCell } from '@/lib/filterTokens';
import { routes } from '@/lib/routes';

const workLogFilterDefinitions: DataTableFilter[] = [
  { key: 'logDate', label: 'تاریخ', type: 'date' },
  { key: 'loggedBy', label: 'کاربر', type: 'text' },
  { key: 'customer', label: 'مشتری', type: 'text' },
  { key: 'task', label: 'وظیفه', type: 'text' },
  { key: 'durationMinutes', label: 'مدت (دقیقه)', type: 'number' },
  { key: 'description', label: 'شرح', type: 'text' },
  { key: 'result', label: 'نتیجه', type: 'text' },
];

export default function WorkLogsPage() {
  const router = useRouter();
  const [savedTick, setSavedTick] = useState(0);

  const fetchWorkLogs = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const res = await api.workLogs.list();
      if (!res.success || !res.data) {
        return {
          rows: [],
          pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
        };
      }
      let rows = [...res.data.workLogs];
      rows = filterRowsByTokens(rows, params.filters, {
        logDate: (w, op, v) => matchDateCell(w.logDate, op, v),
        loggedBy: (w, op, v) => matchTextCell(w.loggedBy?.fullName ?? '', op, v),
        customer: (w, op, v) =>
          matchTextCell(
            w.customer ? [w.customer.firstName, w.customer.lastName].filter(Boolean).join(' ') : '',
            op,
            v,
          ),
        task: (w, op, v) => matchTextCell(w.task?.title ?? '', op, v),
        durationMinutes: (w, op, v) => matchNumberCell(w.durationMinutes ?? NaN, op, v),
        description: (w, op, v) => matchTextCell(w.description, op, v),
        result: (w, op, v) => matchTextCell(w.result, op, v),
      });
      rows = filterRowsBySearch(rows, params.search, (w) => {
        const user = w.loggedBy?.fullName ?? '';
        const cust = w.customer ? [w.customer.firstName, w.customer.lastName].filter(Boolean).join(' ') : '';
        const task = w.task?.title ?? '';
        return `${user} ${cust} ${task} ${w.description} ${w.result} ${w.durationMinutes ?? ''}`;
      });
      rows = sortRows(rows, params.sortBy, params.sortOrder, {
        logDate: (w) => new Date(w.logDate).getTime(),
        loggedBy: (w) => w.loggedBy?.fullName ?? '',
        customer: (w) =>
          w.customer ? [w.customer.firstName, w.customer.lastName].filter(Boolean).join(' ') : '',
        task: (w) => w.task?.title ?? '',
        durationMinutes: (w) => w.durationMinutes ?? 0,
        description: (w) => w.description,
        result: (w) => w.result,
      });
      return paginateSlice(rows, params.page, params.limit);
    },
    [savedTick],
  );

  const columns: DataTableColumn<WorkLog>[] = [
    {
      key: 'logDate',
      title: 'تاریخ',
      sticky: true,
      sortable: true,
      render: (w) => formatGregorianToJalali(w.logDate),
    },
    {
      key: 'loggedBy',
      title: 'کاربر',
      sortable: true,
      sortField: 'loggedBy',
      render: (w) => w.loggedBy?.fullName ?? '-',
    },
    {
      key: 'customer',
      title: 'مشتری',
      sortable: true,
      sortField: 'customer',
      render: (w) => (w.customer ? [w.customer.firstName, w.customer.lastName].filter(Boolean).join(' ') : '-'),
    },
    {
      key: 'task',
      title: 'وظیفه',
      sortable: true,
      sortField: 'task',
      render: (w) => w.task?.title ?? '-',
    },
    {
      key: 'durationMinutes',
      title: 'مدت (دقیقه)',
      sortable: true,
      render: (w) => (w.durationMinutes != null ? w.durationMinutes.toLocaleString('fa-IR') : '-'),
    },
    {
      key: 'description',
      title: 'شرح',
      sortable: true,
      className: 'max-w-xs',
      render: (w) => <span className="line-clamp-2">{w.description}</span>,
    },
    {
      key: 'result',
      title: 'نتیجه',
      sortable: true,
      className: 'max-w-xs',
      render: (w) => <span className="line-clamp-2">{w.result}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">گزارش کار</h1>
        <Button onClick={() => router.push(routes.worklogNew)}>ثبت گزارش جدید</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست گزارش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<WorkLog>
            columns={columns}
            fetchData={fetchWorkLogs}
            rowKey={(r) => r.id}
            enableColumnPinning
            filters={workLogFilterDefinitions}
            searchPlaceholder="فیلترها را اضافه کنید یا متن جستجو را وارد کنید، سپس جستجو..."
            pageSize={10}
            emptyMessage="گزارشی یافت نشد."
          />
        </CardContent>
      </Card>
    </div>
  );
}
