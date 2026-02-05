'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CustomerLevel } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CustomerLevelsPage() {
  const [levels, setLevels] = useState<CustomerLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.customerLevels.list().then((res) => {
      if (res.success && res.data) setLevels(res.data.customerLevels);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">سطوح وفاداری (RFM)</h1>
      <Card>
        <CardHeader><CardTitle>سطوح و بازه امتیاز</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : levels.length === 0 ? <p className="text-slate-500">سطحی تعریف نشده.</p> : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3">نام سطح</th>
                  <th className="py-2 px-3">حداقل امتیاز</th>
                  <th className="py-2 px-3">حداکثر امتیاز</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3">{l.levelName}</td>
                    <td className="py-2 px-3">{l.minScore}</td>
                    <td className="py-2 px-3">{l.maxScore}</td>
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
