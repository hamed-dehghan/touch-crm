'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Order } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatGregorianToJalali } from '@/utils/date';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders.list().then((res) => {
      if (res.success && res.data) setOrders(res.data.orders);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">سفارشات</h1>
        <Link href="/orders/new"><Button>ثبت سفارش جدید</Button></Link>
      </div>
      <Card>
        <CardHeader><CardTitle>لیست سفارشات</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : orders.length === 0 ? <p className="text-slate-500">سفارشی یافت نشد.</p> : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3">شناسه</th>
                  <th className="py-2 px-3">مشتری</th>
                  <th className="py-2 px-3">تاریخ</th>
                  <th className="py-2 px-3">مبلغ نهایی</th>
                  <th className="py-2 px-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3">{o.id}</td>
                    <td className="py-2 px-3">{o.customer ? [o.customer.firstName, o.customer.lastName].filter(Boolean).join(' ') : o.customerId}</td>
                    <td className="py-2 px-3">{formatGregorianToJalali(o.orderDate)}</td>
                    <td className="py-2 px-3">{o.finalAmount.toLocaleString('fa-IR')}</td>
                    <td className="py-2 px-3"><Link href={`/orders/${o.id}`}><Button variant="ghost" size="sm">مشاهده</Button></Link></td>
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
