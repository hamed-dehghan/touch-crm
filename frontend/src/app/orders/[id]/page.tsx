'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Order } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatGregorianToJalali } from '@/utils/date';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Number.isNaN(id)) return;
    (async () => {
      const res = await api.orders.getById(id);
      if (res.success && res.data) setOrder(res.data.order);
      setLoading(false);
    })();
  }, [id]);

  if (loading || !order) return <div className="text-slate-500">در حال بارگذاری...</div>;

  const customerName = order.customer ? [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') : `مشتری ${order.customerId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">سفارش #{order.id}</h1>
        <Button variant="ghost" onClick={() => router.back()}>بازگشت</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>اطلاعات سفارش</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-slate-500">مشتری:</span> {customerName}</p>
          <p><span className="text-slate-500">تاریخ:</span> {formatGregorianToJalali(order.orderDate)}</p>
          <p><span className="text-slate-500">جمع:</span> {order.totalAmount.toLocaleString('fa-IR')}</p>
          <p><span className="text-slate-500">تخفیف:</span> {order.discountAmount.toLocaleString('fa-IR')}</p>
          <p><span className="text-slate-500">مالیات:</span> {order.taxAmount.toLocaleString('fa-IR')}</p>
          <p><span className="text-slate-500">مبلغ نهایی:</span> {order.finalAmount.toLocaleString('fa-IR')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>آیتم‌ها</CardTitle></CardHeader>
        <CardContent>
          {order.orderItems && order.orderItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3">محصول</th>
                    <th className="py-2 px-3">تعداد</th>
                    <th className="py-2 px-3">قیمت واحد</th>
                    <th className="py-2 px-3">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-2 px-3">{item.product?.productName ?? item.productId}</td>
                      <td className="py-2 px-3">{item.quantity}</td>
                      <td className="py-2 px-3">{item.pricePerUnit.toLocaleString('fa-IR')}</td>
                      <td className="py-2 px-3">{(item.pricePerUnit * item.quantity).toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500">آیتمی ثبت نشده.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
