'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Customer, CustomerRfmResponse, Transaction, WorkLog } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatGregorianToJalali } from '@/utils/date';

type Tab = 'profile' | 'transactions' | 'worklogs';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rfm, setRfm] = useState<CustomerRfmResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('profile');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (Number.isNaN(id)) return;
    (async () => {
      setLoading(true);
      const [custRes, rfmRes, transRes, wlRes] = await Promise.all([
        api.customers.getById(id),
        api.customers.getRfm(id),
        api.customers.getTransactions(id),
        api.workLogs.getByCustomer(id),
      ]);
      setLoading(false);
      if (custRes.success && custRes.data) setCustomer(custRes.data.customer);
      if (rfmRes.success && rfmRes.data) setRfm(rfmRes.data);
      if (transRes.success && transRes.data) setTransactions(transRes.data.transactions);
      if (wlRes.success && wlRes.data) setWorkLogs(wlRes.data.workLogs);
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این مشتری مطمئنید؟')) return;
    setDeleting(true);
    const res = await api.customers.delete(id);
    setDeleting(false);
    if (res.success) router.push('/customers');
  };

  if (loading || !customer) return <div className="text-slate-500">در حال بارگذاری...</div>;

  const statusVariant = customer.status === 'CUSTOMER' ? 'success' : customer.status === 'OPPORTUNITY' ? 'warning' : 'default';

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t ? 'bg-white border border-b-0 border-slate-200 text-primary' : 'text-slate-500 hover:text-slate-700'}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{[customer.firstName, customer.lastName].filter(Boolean).join(' ')}</h1>
        <div className="flex gap-2">
          <Link href={`/customers/${id}/edit`}><Button variant="outline">ویرایش</Button></Link>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'در حال حذف...' : 'حذف'}</Button>
          <Button variant="ghost" onClick={() => router.back()}>بازگشت</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <button type="button" className={tabClass('profile')} onClick={() => setTab('profile')}>پروفایل</button>
        <button type="button" className={tabClass('transactions')} onClick={() => setTab('transactions')}>تراکنش‌ها ({transactions.length})</button>
        <button type="button" className={tabClass('worklogs')} onClick={() => setTab('worklogs')}>گزارش کار ({workLogs.length})</button>
      </div>

      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>پروفایل</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p><span className="text-slate-500">تلفن:</span> {customer.phoneNumber}</p>
              {customer.email && <p><span className="text-slate-500">ایمیل:</span> {customer.email}</p>}
              {customer.birthDate && <p><span className="text-slate-500">تاریخ تولد:</span> {formatGregorianToJalali(customer.birthDate)}</p>}
              <p><span className="text-slate-500">وضعیت:</span> <Badge variant={statusVariant}>{customer.status}</Badge></p>
              <p><span className="text-slate-500">سطح وفاداری:</span> {customer.customerLevel?.levelName ?? '-'}</p>
              {customer.companyName && <p><span className="text-slate-500">شرکت:</span> {customer.companyName}</p>}
              {customer.address && <p><span className="text-slate-500">آدرس:</span> {customer.address}</p>}
            </CardContent>
          </Card>
          {rfm && (
            <Card>
              <CardHeader><CardTitle>امتیاز RFM</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Recency: {rfm.rfm.recency}</p>
                  <p>Frequency: {rfm.rfm.frequency}</p>
                  <p>Monetary: {rfm.rfm.monetary}</p>
                  <p>میانگین: {rfm.rfm.averageScore}</p>
                  {rfm.customerLevel && <p className="col-span-2">سطح: {rfm.customerLevel.levelName}</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'transactions' && (
        <Card>
          <CardHeader><CardTitle>تراکنش‌های اخیر</CardTitle></CardHeader>
          <CardContent>
            {transactions.length === 0 ? <p className="text-slate-500">تراکنشی یافت نشد.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-3">تاریخ</th>
                      <th className="py-2 px-3">مبلغ</th>
                      <th className="py-2 px-3">روش پرداخت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100">
                        <td className="py-2 px-3">{formatGregorianToJalali(t.transactionDate)}</td>
                        <td className="py-2 px-3">{t.amount.toLocaleString('fa-IR')}</td>
                        <td className="py-2 px-3">{t.paymentMethod === 'CASH' ? 'نقد' : 'چک'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'worklogs' && (
        <Card>
          <CardHeader><CardTitle>گزارش کار</CardTitle></CardHeader>
          <CardContent>
            {workLogs.length === 0 ? <p className="text-slate-500">گزارش کاری یافت نشد.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-3">تاریخ</th>
                      <th className="py-2 px-3">کاربر</th>
                      <th className="py-2 px-3">مدت (دقیقه)</th>
                      <th className="py-2 px-3">شرح</th>
                      <th className="py-2 px-3">نتیجه</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workLogs.map((w) => (
                      <tr key={w.id} className="border-b border-slate-100">
                        <td className="py-2 px-3">{formatGregorianToJalali(w.logDate)}</td>
                        <td className="py-2 px-3">{w.loggedBy?.fullName ?? '-'}</td>
                        <td className="py-2 px-3">{w.durationMinutes ?? '-'}</td>
                        <td className="py-2 px-3">{w.description}</td>
                        <td className="py-2 px-3">{w.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
