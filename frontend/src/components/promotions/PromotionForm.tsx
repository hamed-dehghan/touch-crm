// frontend/src/components/promotions/PromotionForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormCheckboxRow } from '@/components/ui/FormCheckboxRow';
import { formActionsClass, formFieldStackClass } from '@/lib/formLayout';
import { routes } from '@/lib/routes';

export function PromotionForm({ promotionId }: { promotionId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    rewardType: 'PERCENTAGE',
    rewardValue: '',
    conditionJson: '{}',
    durationDays: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(!!promotionId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!promotionId) {
      setForm({ title: '', rewardType: 'PERCENTAGE', rewardValue: '', conditionJson: '{}', durationDays: '', isActive: true });
      setLoading(false);
      return;
    }
    setLoading(true);
    api.promotions.getById(promotionId).then((res) => {
      setLoading(false);
      if (!res.success || !res.data) {
        setError('تخفیف یافت نشد.');
        return;
      }
      const p = res.data.promotion;
      setForm({
        title: p.title,
        rewardType: p.rewardType,
        rewardValue: String(p.rewardValue),
        conditionJson: p.conditionJson,
        durationDays: p.durationDays?.toString() ?? '',
        isActive: p.isActive,
      });
    });
  }, [promotionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.rewardValue) {
      setError('عنوان و مقدار الزامی است.');
      return;
    }
    setSaving(true);
    const body = {
      title: form.title.trim(),
      rewardType: form.rewardType as 'PERCENTAGE' | 'FIXED_AMOUNT',
      rewardValue: Number(form.rewardValue),
      conditionJson: form.conditionJson,
      durationDays: form.durationDays ? Number(form.durationDays) : undefined,
      isActive: form.isActive,
    };
    const res = promotionId ? await api.promotions.update(promotionId, body) : await api.promotions.create(body);
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    router.push(routes.promotions);
  };

  if (loading) {
    return <p className="text-sm text-foreground/70">در حال بارگذاری...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={formFieldStackClass}>
      <Input label="عنوان *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      <Select
        label="نوع پاداش *"
        value={form.rewardType}
        onChange={(e) => setForm((f) => ({ ...f, rewardType: e.target.value }))}
        options={[
          { value: 'PERCENTAGE', label: 'درصدی' },
          { value: 'FIXED_AMOUNT', label: 'مبلغ ثابت' },
        ]}
      />
      <Input
        label="مقدار پاداش *"
        type="number"
        min={0}
        value={form.rewardValue}
        onChange={(e) => setForm((f) => ({ ...f, rewardValue: e.target.value }))}
        required
      />
      <Input
        label="مدت اعتبار (روز)"
        type="number"
        min={1}
        value={form.durationDays}
        onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
      />
      <FormCheckboxRow label="فعال" checked={form.isActive} onChange={(next) => setForm((f) => ({ ...f, isActive: next }))} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={formActionsClass}>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : promotionId ? 'بروزرسانی' : 'ثبت'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(routes.promotions)}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
