'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Transaction, Customer, Order } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatGregorianToJalali } from '@/utils/date';
import { PersianDatePicker } from '@/components/ui/DatePicker';
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type FilterToken,
} from '@/components/ui/DataTable';
import { filterRowsBySearch, paginateSlice, sortRows } from '@/lib/clientListQuery';
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    orderId: '',
    paymentMethod: 'CASH',
    amount: '',
    transactionDate: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedTick, setSavedTick] = useState(0);

  useEffect(() => {
    Promise.all([api.customers.list({ limit: 500 }), api.orders.list()]).then(([cRes, oRes]) => {
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
      if (oRes.success && oRes.data) setOrders(oRes.data.orders);
    });
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.customerId || !form.amount || !form.transactionDate) {
      setError('مشتری، مبلغ و تاریخ الزامی است.');
      return;
    }
    setSaving(true);
    const res = await api.transactions.create({
      customerId: Number(form.customerId),
      orderId: form.orderId ? Number(form.orderId) : undefined,
      paymentMethod: form.paymentMethod,
      amount: Number(form.amount),
      transactionDate: form.transactionDate,
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    setShowForm(false);
    setForm({
      customerId: '',
      orderId: '',
      paymentMethod: 'CASH',
      amount: '',
      transactionDate: new Date().toISOString().slice(0, 10),
    });
    setSavedTick((k) => k + 1);
  };

  const customerOrders = form.customerId
    ? orders.filter((o) => o.customerId === Number(form.customerId))
    : [];

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
        <Button onClick={() => setShowForm(true)}>ثبت تراکنش جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>تراکنش جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مشتری *</label>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value, orderId: '' }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">-- انتخاب کنید --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {[c.firstName, c.lastName].filter(Boolean).join(' ')} — {c.customerCode}
                    </option>
                  ))}
                </select>
              </div>
              {customerOrders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">سفارش (اختیاری)</label>
                  <select
                    value={form.orderId}
                    onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">-- بدون سفارش --</option>
                    {customerOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        سفارش #{o.id} — {o.finalAmount.toLocaleString('fa-IR')} ریال
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">روش پرداخت *</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="CASH">نقد</option>
                  <option value="CHECK">چک</option>
                </select>
              </div>
              <Input
                label="مبلغ (ریال) *"
                type="number"
                min={1}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
              <PersianDatePicker
                label="تاریخ تراکنش *"
                value={form.transactionDate}
                onChange={(v) => setForm((f) => ({ ...f, transactionDate: v }))}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'در حال ذخیره...' : 'ثبت تراکنش'}
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
