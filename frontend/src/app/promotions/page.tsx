'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Promotion, Customer } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAppDialogs } from '@/components/ui/AppDialogs';
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
  type DataTableGroupAction,
  type DataTableFilter,
  type FilterToken,
} from '@/components/ui/DataTable';
import { filterRowsBySearch, paginateSlice, sortRows } from '@/lib/clientListQuery';
import { filterRowsByTokens, matchNumberCell, matchSelectCell, matchTextCell } from '@/lib/filterTokens';

const promotionFilterDefinitions: DataTableFilter[] = [
  { key: 'title', label: 'عنوان', type: 'text' },
  {
    key: 'rewardType',
    label: 'نوع پاداش',
    type: 'select',
    options: [
      { value: 'PERCENTAGE', label: 'درصدی' },
      { value: 'FIXED_AMOUNT', label: 'مبلغ ثابت' },
    ],
  },
  { key: 'rewardValue', label: 'مقدار پاداش', type: 'number' },
  {
    key: 'isActive',
    label: 'وضعیت',
    type: 'select',
    options: [
      { value: 'true', label: 'فعال' },
      { value: 'false', label: 'غیرفعال' },
    ],
  },
];

export default function PromotionsPage() {
  const dialogs = useAppDialogs();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [form, setForm] = useState({
    title: '',
    rewardType: 'PERCENTAGE',
    rewardValue: '',
    conditionJson: '{}',
    durationDays: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedTick, setSavedTick] = useState(0);

  useEffect(() => {
    api.customers.list({ limit: 500 }).then((cRes) => {
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
    });
  }, []);

  const fetchPromotions = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const res = await api.promotions.list();
      if (!res.success || !res.data) {
        return {
          rows: [],
          pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
        };
      }
      let rows = [...res.data.promotions];
      rows = filterRowsByTokens(rows, params.filters, {
        title: (p, op, v) => matchTextCell(p.title, op, v),
        rewardType: (p, op, v) => matchSelectCell(p.rewardType, op, v),
        rewardValue: (p, op, v) => matchNumberCell(p.rewardValue, op, v),
        isActive: (p, op, v) => matchSelectCell(p.isActive ? 'true' : 'false', op, v),
      });
      rows = filterRowsBySearch(rows, params.search, (p) =>
        `${p.title} ${p.rewardType} ${p.rewardValue} ${p.isActive ? 'فعال' : 'غیرفعال'}`,
      );
      rows = sortRows(rows, params.sortBy, params.sortOrder, {
        title: (p) => p.title,
        rewardType: (p) => p.rewardType,
        rewardValue: (p) => p.rewardValue,
        isActive: (p) => (p.isActive ? 1 : 0),
      });
      return paginateSlice(rows, params.page, params.limit);
    },
    [savedTick],
  );

  const resetForm = () => {
    setForm({ title: '', rewardType: 'PERCENTAGE', rewardValue: '', conditionJson: '{}', durationDays: '', isActive: true });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (p: Promotion) => {
    setForm({
      title: p.title,
      rewardType: p.rewardType,
      rewardValue: String(p.rewardValue),
      conditionJson: p.conditionJson,
      durationDays: p.durationDays?.toString() ?? '',
      isActive: p.isActive,
    });
    setEditingId(p.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.rewardValue) {
      setError('عنوان و مقدار الزامی است.');
      return;
    }
    setSaving(true);
    const body = {
      title: form.title.trim(),
      rewardType: form.rewardType as 'PERCENTAGE' | 'FIXED_AMOUNT',
      rewardValue: Number(form.rewardValue),
      conditionJson: form.conditionJson,
      durationDays: form.durationDays ? Number(form.durationDays) : undefined,
      isActive: form.isActive,
    };
    const res = editingId ? await api.promotions.update(editingId, body) : await api.promotions.create(body);
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    resetForm();
    setSavedTick((k) => k + 1);
  };

  const handleDelete = async (p: Promotion) => {
    const ok = await dialogs.confirm('آیا از حذف این تخفیف مطمئنید؟');
    if (!ok) return;
    const res = await api.promotions.delete(p.id);
    if (res.success) setSavedTick((k) => k + 1);
  };

  const handleBulkDelete = async (selected: Promotion[]) => {
    if (selected.length === 0) return;
    const ok = await dialogs.confirm('آیا از حذف تخفیف‌های انتخاب شده مطمئنید؟', {
      danger: true,
      confirmText: 'حذف',
    });
    if (!ok) return;
    const results = await Promise.all(selected.map((p) => api.promotions.delete(p.id)));
    const failed = results.find((r) => !r.success);
    if (failed) {
      await dialogs.alert(failed.error?.message ?? 'خطا در حذف گروهی');
      return;
    }
    setSavedTick((k) => k + 1);
  };

  const handleAssign = async () => {
    if (!showAssign || !assignCustomerId) return;
    const res = await api.promotions.assign(showAssign, Number(assignCustomerId));
    if (res.success) {
      setShowAssign(null);
      setAssignCustomerId('');
      await dialogs.alert('تخفیف با موفقیت اختصاص داده شد.');
    }
  };

  const columns: DataTableColumn<Promotion>[] = [
    {
      key: 'title',
      title: 'عنوان',
      sticky: true,
      sortable: true,
    },
    {
      key: 'rewardType',
      title: 'نوع',
      sortable: true,
      render: (p) => (p.rewardType === 'PERCENTAGE' ? 'درصدی' : 'مبلغ ثابت'),
    },
    {
      key: 'rewardValue',
      title: 'مقدار',
      sortable: true,
      render: (p) => `${p.rewardValue.toLocaleString('fa-IR')}${p.rewardType === 'PERCENTAGE' ? '%' : ''}`,
    },
    {
      key: 'isActive',
      title: 'وضعیت',
      sortable: true,
      render: (p) => <Badge variant={p.isActive ? 'success' : 'default'}>{p.isActive ? 'فعال' : 'غیرفعال'}</Badge>,
    },
  ];

  const actions: DataTableAction<Promotion>[] = [
    {
      label: 'ویرایش',
      variant: 'primary',
      onClick: startEdit,
      triggerOnRowDoubleClick: true,
    },
    {
      label: 'اختصاص',
      variant: 'secondary',
      onClick: (p) => {
        setShowAssign(p.id);
        setAssignCustomerId('');
      },
    },
    {
      label: 'حذف',
      variant: 'danger',
      onClick: handleDelete,
    },
  ];

  const groupActions: DataTableGroupAction<Promotion>[] = [
    {
      label: 'حذف انتخاب شده',
      variant: 'danger',
      onClick: handleBulkDelete,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">تخفیف‌ها و جوایز</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          تخفیف جدید
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'ویرایش تخفیف' : 'تخفیف جدید'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="عنوان *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نوع پاداش *</label>
                <select
                  value={form.rewardType}
                  onChange={(e) => setForm((f) => ({ ...f, rewardType: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="PERCENTAGE">درصدی</option>
                  <option value="FIXED_AMOUNT">مبلغ ثابت</option>
                </select>
              </div>
              <Input
                label="مقدار پاداش *"
                type="number"
                min={0}
                value={form.rewardValue}
                onChange={(e) => setForm((f) => ({ ...f, rewardValue: e.target.value }))}
                required
              />
              <Input
                label="مدت اعتبار (روز)"
                type="number"
                min={1}
                value={form.durationDays}
                onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                فعال
              </label>
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

      {showAssign !== null && (
        <Card>
          <CardHeader>
            <CardTitle>اختصاص تخفیف به مشتری</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">انتخاب مشتری</label>
                <select
                  value={assignCustomerId}
                  onChange={(e) => setAssignCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">-- انتخاب کنید --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {[c.firstName, c.lastName].filter(Boolean).join(' ')} — {c.customerCode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAssign} disabled={!assignCustomerId}>
                  اختصاص
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssign(null);
                    setAssignCustomerId('');
                  }}
                >
                  انصراف
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>لیست تخفیف‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Promotion>
            columns={columns}
            actions={actions}
            groupActions={groupActions}
            selectableRows
            fetchData={fetchPromotions}
            rowKey={(r) => r.id}
            enableColumnPinning
            filters={promotionFilterDefinitions}
            searchPlaceholder="فیلترها را اضافه کنید یا متن جستجو را وارد کنید، سپس جستجو..."
            pageSize={10}
            emptyMessage="تخفیفی یافت نشد."
          />
        </CardContent>
      </Card>
    </div>
  );
}
