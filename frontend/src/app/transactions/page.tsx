'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Transaction } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatGregorianToJalali } from '@/utils/date';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.transactions.list().then((res) => {
      if (res.success && res.data) setTransactions(res.data.transactions);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">تراکنش‌ها</h1>
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
                    <td className="py-2 px-3">{t.paymentMethod}</td>
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
