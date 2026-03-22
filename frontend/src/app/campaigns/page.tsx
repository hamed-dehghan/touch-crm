'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Campaign } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', messageTemplate: '', filterConditionsJson: '{}', status: 'DRAFT' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.messageTemplate.trim()) {
      setError('نام و قالب پیام الزامی است.');
      return;
    }
    setSaving(true);
    const res = await api.campaigns.create({
      name: form.name.trim(),
      messageTemplate: form.messageTemplate.trim(),
      filterConditionsJson: form.filterConditionsJson,
      status: form.status as Campaign['status'],
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    setShowForm(false);
    setForm({ name: '', messageTemplate: '', filterConditionsJson: '{}', status: 'DRAFT' });
    setSavedTick((k) => k + 1);
  };

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
      onClick: (row) => router.push(`/campaigns/${row.id}`),
      triggerOnRowDoubleClick: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">کمپین‌ها</h1>
        <Button onClick={() => setShowForm(true)}>کمپین جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>ایجاد کمپین جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="نام کمپین *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">قالب پیام *</label>
                <textarea
                  value={form.messageTemplate}
                  onChange={(e) => setForm((f) => ({ ...f, messageTemplate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                  required
                  placeholder="سلام [FirstName]! ..."
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'در حال ذخیره...' : 'ثبت کمپین'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                  }}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
