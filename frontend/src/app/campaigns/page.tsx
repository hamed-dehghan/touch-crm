'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/lib/routes';
import { api } from '@/lib/api';
import type { Campaign } from '@/types/api';
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
import { filterRowsByTokens, matchSelectCell, matchTextCell } from '@/lib/filterTokens';

const campaignFilterDefinitions: DataTableFilter[] = [
  { key: 'name', label: 'نام کمپین', type: 'text' },
  {
    key: 'status',
    label: 'وضعیت',
    type: 'select',
    options: [
      { value: 'DRAFT', label: 'پیش‌نویس' },
      { value: 'SCHEDULED', label: 'زمان‌بندی شده' },
      { value: 'SENT', label: 'ارسال شده' },
      { value: 'CANCELLED', label: 'لغو شده' },
    ],
  },
];

export default function CampaignsPage() {
  const router = useRouter();
  const [savedTick, setSavedTick] = useState(0);

  const statusVariant = (s: string) => (s === 'SENT' ? 'success' : s === 'DRAFT' ? 'default' : 'warning');
  const statusLabel = (s: string) =>
    ({ DRAFT: 'پیش‌نویس', SCHEDULED: 'زمان‌بندی شده', SENT: 'ارسال شده', CANCELLED: 'لغو شده' }[s] ?? s);

  const fetchCampaigns = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const res = await api.campaigns.list();
      if (!res.success || !res.data) {
        return {
          rows: [],
          pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
        };
      }
      let rows = [...res.data.campaigns];
      rows = filterRowsByTokens(rows, params.filters, {
        name: (c, op, v) => matchTextCell(c.name, op, v),
        status: (c, op, v) => matchSelectCell(c.status, op, v),
      });
      rows = filterRowsBySearch(rows, params.search, (c) => `${c.name} ${c.status} ${c.messageTemplate ?? ''}`);
      rows = sortRows(rows, params.sortBy, params.sortOrder, {
        name: (c) => c.name,
        status: (c) => c.status,
      });
      return paginateSlice(rows, params.page, params.limit);
    },
    [savedTick],
  );

  const columns: DataTableColumn<Campaign>[] = [
    {
      key: 'name',
      title: 'نام',
      sticky: true,
      sortable: true,
    },
    {
      key: 'status',
      title: 'وضعیت',
      sortable: true,
      render: (c) => <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>,
    },
  ];

  const actions: DataTableAction<Campaign>[] = [
    {
      label: 'مشاهده',
      variant: 'primary',
      onClick: (row) => router.push(routes.campaign(row.id)),
      triggerOnRowDoubleClick: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">کمپین‌ها</h1>
        <Button onClick={() => router.push(routes.campaignNew)}>کمپین جدید</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست کمپین‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Campaign>
            columns={columns}
            actions={actions}
            fetchData={fetchCampaigns}
            rowKey={(r) => r.id}
            enableColumnPinning
            filters={campaignFilterDefinitions}
            searchPlaceholder="فیلترها را اضافه کنید یا متن جستجو را وارد کنید، سپس جستجو..."
            pageSize={10}
            emptyMessage="کمپینی یافت نشد."
          />
        </CardContent>
      </Card>
    </div>
  );
}
