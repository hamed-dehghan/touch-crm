'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { WorkLog, Customer, Task } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatGregorianToJalali } from '@/utils/date';
import { PersianDatePicker } from '@/components/ui/DatePicker';
import { DataTable, type DataTableColumn, type DataTableFilter, type FilterToken } from '@/components/ui/DataTable';
import { filterRowsBySearch, paginateSlice, sortRows } from '@/lib/clientListQuery';
import { filterRowsByTokens, matchDateCell, matchNumberCell, matchTextCell } from '@/lib/filterTokens';

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    taskId: '',
    logDate: new Date().toISOString().slice(0, 10),
    durationMinutes: '',
    description: '',
    result: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedTick, setSavedTick] = useState(0);

  useEffect(() => {
    Promise.all([api.customers.list({ limit: 500 }), api.tasks.list()]).then(([cRes, tRes]) => {
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
      if (tRes.success && tRes.data) setTasks(tRes.data.tasks);
    });
  }, []);

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

  const resetForm = () => {
    setForm({
      customerId: '',
      taskId: '',
      logDate: new Date().toISOString().slice(0, 10),
      durationMinutes: '',
      description: '',
      result: '',
    });
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.description.trim() || !form.result.trim() || !form.logDate) {
      setError('تاریخ، شرح و نتیجه الزامی است.');
      return;
    }
    setSaving(true);
    const res = await api.workLogs.create({
      customerId: form.customerId ? Number(form.customerId) : undefined,
      taskId: form.taskId ? Number(form.taskId) : undefined,
      logDate: form.logDate,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      description: form.description.trim(),
      result: form.result.trim(),
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    resetForm();
    setSavedTick((k) => k + 1);
  };

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
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          ثبت گزارش جدید
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>ثبت گزارش کار</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PersianDatePicker label="تاریخ *" value={form.logDate} onChange={(v) => setForm((f) => ({ ...f, logDate: v }))} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مشتری (اختیاری)</label>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">-- بدون مشتری --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {[c.firstName, c.lastName].filter(Boolean).join(' ')} — {c.customerCode}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">وظیفه (اختیاری)</label>
                <select
                  value={form.taskId}
                  onChange={(e) => setForm((f) => ({ ...f, taskId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">-- بدون وظیفه --</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="مدت زمان (دقیقه)"
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">شرح فعالیت *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نتیجه *</label>
                <textarea
                  value={form.result}
                  onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'در حال ذخیره...' : 'ثبت'}
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
