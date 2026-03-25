// frontend/src/app/transactions/new/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Customer, Order } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PersianDatePicker } from '@/components/ui/DatePicker';
import { loadAllOrders } from '@/lib/loadAllPaged';
import { routes } from '@/lib/routes';
import { formActionsClass, formFieldStackClass } from '@/lib/formLayout';

export default function NewTransactionPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({
    customerId: '',
    orderId: '',
    paymentMethod: 'CASH',
    amount: '',
    transactionDate: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.customers.list({ limit: 500 }), loadAllOrders()]).then(([cRes, orderRows]) => {
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
      setOrders(orderRows);
    });
  }, []);

  const customerOrders = form.customerId ? orders.filter((o) => o.customerId === Number(form.customerId)) : [];

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
    router.push(routes.transactions);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.transactions} className="text-sm text-primary hover:underline">
          ← بازگشت به تراکنش‌ها
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">تراکنش جدید</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ثبت تراکنش</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={formFieldStackClass}>
            <Select
              label="مشتری *"
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value, orderId: '' }))}
              options={[
                { value: '', label: '-- انتخاب کنید --' },
                ...customers.map((c) => ({
                  value: String(c.id),
                  label: `${[c.firstName, c.lastName].filter(Boolean).join(' ')} — ${c.customerCode}`,
                })),
              ]}
              required
            />
            {customerOrders.length > 0 && (
              <Select
                label="سفارش (اختیاری)"
                value={form.orderId}
                onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
                options={[
                  { value: '', label: '-- بدون سفارش --' },
                  ...customerOrders.map((o) => ({
                    value: String(o.id),
                    label: `سفارش #${o.id} — ${o.finalAmount.toLocaleString('fa-IR')} ریال`,
                  })),
                ]}
              />
            )}
            <Select
              label="روش پرداخت *"
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
              options={[
                { value: 'CASH', label: 'نقد' },
                { value: 'CHECK', label: 'چک' },
              ]}
            />
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
            <div className={formActionsClass}>
              <Button type="submit" disabled={saving}>
                {saving ? 'در حال ذخیره...' : 'ثبت تراکنش'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(routes.transactions)}>
                انصراف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
