'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Project } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
  type DataTableFilter,
  type FilterToken,
} from '@/components/ui/DataTable';
import { filterRowsBySearch, paginateSlice, sortRows } from '@/lib/clientListQuery';
import { loadAllProjects } from '@/lib/loadAllPaged';
import { filterRowsByTokens, matchSelectCell, matchTextCell } from '@/lib/filterTokens';
import { routes } from '@/lib/routes';

const projectFilterDefinitions: DataTableFilter[] = [
  { key: 'projectName', label: 'نام پروژه', type: 'text' },
  {
    key: 'status',
    label: 'وضعیت',
    type: 'select',
    options: [
      { value: 'OPEN', label: 'باز' },
      { value: 'IN_PROGRESS', label: 'در حال انجام' },
      { value: 'COMPLETED', label: 'تکمیل شده' },
      { value: 'CANCELLED', label: 'لغو شده' },
    ],
  },
  { key: 'customer', label: 'مشتری', type: 'text' },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'warning' | 'success' }> = {
  OPEN: { label: 'باز', variant: 'default' },
  IN_PROGRESS: { label: 'در حال انجام', variant: 'warning' },
  COMPLETED: { label: 'تکمیل شده', variant: 'success' },
  CANCELLED: { label: 'لغو شده', variant: 'default' },
};

export default function ProjectsPage() {
  const router = useRouter();
  const [savedTick, setSavedTick] = useState(0);

  const fetchProjects = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const rowsAll = await loadAllProjects();
      let rows = [...rowsAll];
      rows = filterRowsByTokens(rows, params.filters, {
        projectName: (p, op, v) => matchTextCell(p.projectName, op, v),
        status: (p, op, v) => matchSelectCell(p.status, op, v),
        customer: (p, op, v) =>
          matchTextCell(
            p.customer ? [p.customer.firstName, p.customer.lastName].filter(Boolean).join(' ') : '',
            op,
            v,
          ),
      });
      rows = filterRowsBySearch(rows, params.search, (p) =>
        `${p.projectName} ${p.status} ${p.customer ? [p.customer.firstName, p.customer.lastName].filter(Boolean).join(' ') : ''}`,
      );
      rows = sortRows(rows, params.sortBy, params.sortOrder, {
        projectName: (p) => p.projectName,
        status: (p) => p.status,
        customer: (p) =>
          p.customer ? [p.customer.firstName, p.customer.lastName].filter(Boolean).join(' ') : '',
      });
      return paginateSlice(rows, params.page, params.limit);
    },
    [savedTick],
  );

  const columns: DataTableColumn<Project>[] = [
    {
      key: 'projectName',
      title: 'نام پروژه',
      sticky: true,
      sortable: true,
    },
    {
      key: 'customer',
      title: 'مشتری',
      sortable: true,
      sortField: 'customer',
      render: (p) => (p.customer ? [p.customer.firstName, p.customer.lastName].filter(Boolean).join(' ') : '-'),
    },
    {
      key: 'status',
      title: 'وضعیت',
      sortable: true,
      render: (p) => {
        const st = statusMap[p.status] ?? { label: p.status, variant: 'default' as const };
        return <Badge variant={st.variant}>{st.label}</Badge>;
      },
    },
  ];

  const actions: DataTableAction<Project>[] = [
    {
      label: 'ویرایش',
      variant: 'primary',
      onClick: (row) => router.push(routes.projectEdit(row.id)),
      triggerOnRowDoubleClick: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">پروژه‌ها</h1>
        <Button onClick={() => router.push(routes.projectNew)}>پروژه جدید</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست پروژه‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Project>
            columns={columns}
            actions={actions}
            fetchData={fetchProjects}
            rowKey={(r) => r.id}
            enableColumnPinning
            filters={projectFilterDefinitions}
            searchPlaceholder="فیلترها را اضافه کنید یا متن جستجو را وارد کنید، سپس جستجو..."
            pageSize={10}
            emptyMessage="پروژه‌ای یافت نشد."
          />
        </CardContent>
      </Card>
    </div>
  );
}
