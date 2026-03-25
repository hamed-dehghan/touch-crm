'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Promotion, Customer } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
import { routes } from '@/lib/routes';

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
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState('');
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
      onClick: (row) => router.push(routes.promotionEdit(row.id)),
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
        <Button onClick={() => router.push(routes.promotionNew)}>تخفیف جدید</Button>
      </div>

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
