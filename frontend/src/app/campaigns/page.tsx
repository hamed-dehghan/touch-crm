'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Campaign } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', messageTemplate: '', filterConditionsJson: '{}', status: 'DRAFT' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.campaigns.list().then((res) => {
      if (res.success && res.data) setCampaigns(res.data.campaigns);
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
  useEffect(() => { fetchData(); }, []);

  const statusVariant = (s: string) => (s === 'SENT' ? 'success' : s === 'DRAFT' ? 'default' : 'warning');
  const statusLabel = (s: string) => ({ DRAFT: 'پیش‌نویس', SCHEDULED: 'زمان‌بندی شده', SENT: 'ارسال شده', CANCELLED: 'لغو شده' }[s] ?? s);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.messageTemplate.trim()) { setError('نام و قالب پیام الزامی است.'); return; }
    setSaving(true);
    const res = await api.campaigns.create({
      name: form.name.trim(),
      messageTemplate: form.messageTemplate.trim(),
      filterConditionsJson: form.filterConditionsJson,
      status: form.status as Campaign['status'],
    });
    setSaving(false);
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    setShowForm(false);
    setForm({ name: '', messageTemplate: '', filterConditionsJson: '{}', status: 'DRAFT' });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">کمپین‌ها</h1>
        <Button onClick={() => setShowForm(true)}>کمپین جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>ایجاد کمپین جدید</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="نام کمپین *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">قالب پیام *</label>
                <textarea
                  value={form.messageTemplate}
                  onChange={(e) => setForm((f) => ({ ...f, messageTemplate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                  required
                  placeholder="سلام [FirstName]! ..."
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : 'ثبت کمپین'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(''); }}>انصراف</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
                    <td className="py-2 px-3"><Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge></td>
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
