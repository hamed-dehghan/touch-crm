'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Campaign } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.campaigns.list().then((res) => {
      if (res.success && res.data) setCampaigns(res.data.campaigns);
      setLoading(false);
    });
  }, []);

  const statusVariant = (s: string) => (s === 'SENT' ? 'success' : s === 'DRAFT' ? 'default' : 'warning');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">کمپین‌ها</h1>
      <Card>
        <CardHeader><CardTitle>لیست کمپین‌ها</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : campaigns.length === 0 ? <p className="text-slate-500">کمپینی یافت نشد.</p> : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3">نام</th>
                  <th className="py-2 px-3">وضعیت</th>
                  <th className="py-2 px-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3">{c.name}</td>
                    <td className="py-2 px-3"><Badge variant={statusVariant(c.status)}>{c.status}</Badge></td>
                    <td className="py-2 px-3"><Link href={`/campaigns/${c.id}`}><Button variant="ghost" size="sm">مشاهده</Button></Link></td>
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
