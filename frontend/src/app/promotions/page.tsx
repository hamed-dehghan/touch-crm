'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Promotion } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.promotions.list().then((res) => {
      if (res.success && res.data) setPromotions(res.data.promotions);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">تخفیف‌ها و جوایز</h1>
      <Card>
        <CardHeader><CardTitle>لیست تخفیف‌ها</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : promotions.length === 0 ? <p className="text-slate-500">تخفیفی یافت نشد.</p> : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3">عنوان</th>
                  <th className="py-2 px-3">نوع</th>
                  <th className="py-2 px-3">مقدار</th>
                  <th className="py-2 px-3">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3">{p.title}</td>
                    <td className="py-2 px-3">{p.rewardType}</td>
                    <td className="py-2 px-3">{p.rewardValue}</td>
                    <td className="py-2 px-3"><Badge variant={p.isActive ? 'success' : 'default'}>{p.isActive ? 'فعال' : 'غیرفعال'}</Badge></td>
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
