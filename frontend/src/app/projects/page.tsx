'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Project, Customer } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ projectName: '', customerId: '', description: '', status: 'OPEN' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedTick, setSavedTick] = useState(0);

  useEffect(() => {
    api.customers.list({ limit: 500 }).then((cRes) => {
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
    });
  }, []);

  const fetchProjects = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const res = await api.projects.list();
      if (!res.success || !res.data) {
        return {
          rows: [],
          pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
        };
      }
      let rows = [...res.data.projects];
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

  const resetForm = () => {
    setForm({ projectName: '', customerId: '', description: '', status: 'OPEN' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (p: Project) => {
    setForm({ projectName: p.projectName, customerId: String(p.customerId), description: p.description ?? '', status: p.status });
    setEditingId(p.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.projectName.trim()) {
      setError('نام پروژه الزامی است.');
      return;
    }
    if (!editingId && !form.customerId) {
      setError('انتخاب مشتری الزامی است.');
      return;
    }
    setSaving(true);
    const body = {
      projectName: form.projectName.trim(),
      customerId: Number(form.customerId),
      description: form.description || undefined,
      status: form.status as Project['status'],
    };
    const res = editingId ? await api.projects.update(editingId, body) : await api.projects.create(body);
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    resetForm();
    setSavedTick((k) => k + 1);
  };

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
      onClick: startEdit,
      triggerOnRowDoubleClick: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">پروژه‌ها</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          پروژه جدید
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'ویرایش پروژه' : 'پروژه جدید'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="نام پروژه *" value={form.projectName} onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مشتری *</label>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">-- انتخاب مشتری --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {[c.firstName, c.lastName].filter(Boolean).join(' ')} — {c.customerCode}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">توضیحات</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                />
              </div>
              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">وضعیت</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="OPEN">باز</option>
                    <option value="IN_PROGRESS">در حال انجام</option>
                    <option value="COMPLETED">تکمیل شده</option>
                    <option value="CANCELLED">لغو شده</option>
                  </select>
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'ثبت'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
