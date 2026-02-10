'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Transaction, Customer, Order } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatGregorianToJalali } from '@/utils/date';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', orderId: '', paymentMethod: 'CASH', amount: '', transactionDate: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.transactions.list(),
      api.customers.list({ limit: 100 }),
      api.orders.list(),
    ]).then(([tRes, cRes, oRes]) => {
      if (tRes.success && tRes.data) setTransactions(tRes.data.transactions);
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
      if (oRes.success && oRes.data) setOrders(oRes.data.orders);
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.customerId || !form.amount || !form.transactionDate) { setError('مشتری، مبلغ و تاریخ الزامی است.'); return; }
    setSaving(true);
    const res = await api.transactions.create({
      customerId: Number(form.customerId),
      orderId: form.orderId ? Number(form.orderId) : undefined,
      paymentMethod: form.paymentMethod,
      amount: Number(form.amount),
      transactionDate: form.transactionDate,
    });
    setSaving(false);
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    setShowForm(false);
    setForm({ customerId: '', orderId: '', paymentMethod: 'CASH', amount: '', transactionDate: new Date().toISOString().slice(0, 10) });
    fetchData();
  };

  const customerOrders = form.customerId ? orders.filter((o) => o.customerId === Number(form.customerId)) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">تراکنش‌ها</h1>
        <Button onClick={() => setShowForm(true)}>ثبت تراکنش جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>تراکنش جدید</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مشتری *</label>
                <select value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value, orderId: '' }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
                  <option value="">-- انتخاب کنید --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{[c.firstName, c.lastName].filter(Boolean).join(' ')} — {c.customerCode}</option>
                  ))}
                </select>
              </div>
              {customerOrders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">سفارش (اختیاری)</label>
                  <select value={form.orderId} onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="">-- بدون سفارش --</option>
                    {customerOrders.map((o) => (
                      <option key={o.id} value={o.id}>سفارش #{o.id} — {o.finalAmount.toLocaleString('fa-IR')} ریال</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">روش پرداخت *</label>
                <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="CASH">نقد</option>
                  <option value="CHECK">چک</option>
                </select>
              </div>
              <Input label="مبلغ (ریال) *" type="number" min={1} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
              <Input label="تاریخ تراکنش *" type="date" value={form.transactionDate} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))} required />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : 'ثبت تراکنش'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(''); }}>انصراف</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>لیست تراکنش‌ها</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : transactions.length === 0 ? <p className="text-slate-500">تراکنشی یافت نشد.</p> : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3">تاریخ</th>
                  <th className="py-2 px-3">مشتری</th>
                  <th className="py-2 px-3">مبلغ</th>
                  <th className="py-2 px-3">روش پرداخت</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3">{formatGregorianToJalali(t.transactionDate)}</td>
                    <td className="py-2 px-3">{t.customer ? [t.customer.firstName, t.customer.lastName].filter(Boolean).join(' ') : t.customerId}</td>
                    <td className="py-2 px-3">{t.amount.toLocaleString('fa-IR')}</td>
                    <td className="py-2 px-3">{t.paymentMethod === 'CASH' ? 'نقد' : 'چک'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
