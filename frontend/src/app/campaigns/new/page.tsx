// frontend/src/app/campaigns/new/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { Campaign } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { routes } from '@/lib/routes';
import { formActionsClass, formFieldStackClass } from '@/lib/formLayout';

export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', messageTemplate: '', filterConditionsJson: '{}', status: 'DRAFT' as Campaign['status'] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.messageTemplate.trim()) {
      setError('نام و قالب پیام الزامی است.');
      return;
    }
    setSaving(true);
    const res = await api.campaigns.create({
      name: form.name.trim(),
      messageTemplate: form.messageTemplate.trim(),
      filterConditionsJson: form.filterConditionsJson,
      status: form.status,
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    const id = res.data?.campaign?.id;
    router.push(id != null ? routes.campaign(id) : routes.campaigns);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.campaigns} className="text-sm text-primary hover:underline">
          ← بازگشت به کمپین‌ها
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">کمپین جدید</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ایجاد کمپین</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={formFieldStackClass}>
            <Input label="نام کمپین *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <Textarea
              label="قالب پیام *"
              value={form.messageTemplate}
              onChange={(e) => setForm((f) => ({ ...f, messageTemplate: e.target.value }))}
              className="min-h-[80px]"
              required
              placeholder="سلام [FirstName]! ..."
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className={formActionsClass}>
              <Button type="submit" disabled={saving}>
                {saving ? 'در حال ذخیره...' : 'ثبت کمپین'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(routes.campaigns)}>
                انصراف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
