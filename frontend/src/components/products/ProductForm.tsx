// frontend/src/components/products/ProductForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routes';
import { formActionsClass, formFieldStackClass } from '@/lib/formLayout';

export function ProductForm({ productId }: { productId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState({ productName: '', price: '', taxRate: '' });
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) {
      setForm({ productName: '', price: '', taxRate: '' });
      setLoading(false);
      return;
    }
    setLoading(true);
    api.products.getById(productId).then((res) => {
      setLoading(false);
      if (!res.success || !res.data) {
        setError('محصول یافت نشد.');
        return;
      }
      const p = res.data.product;
      setForm({ productName: p.productName, price: String(p.price), taxRate: String(p.taxRate) });
    });
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.productName.trim() || !form.price) {
      setError('نام محصول و قیمت الزامی است.');
      return;
    }
    setSaving(true);
    const body = {
      productName: form.productName.trim(),
      price: Number(form.price),
      taxRate: Number(form.taxRate) || 0,
    };
    const res = productId ? await api.products.update(productId, body) : await api.products.create(body);
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    router.push(routes.products);
  };

  if (loading) {
    return <p className="text-sm text-foreground/70">در حال بارگذاری...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={formFieldStackClass}>
      <Input
        label="نام محصول *"
        value={form.productName}
        onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
        required
      />
      <Input
        label="قیمت (ریال) *"
        type="number"
        min={0}
        value={form.price}
        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
        required
      />
      <Input
        label="نرخ مالیات (%)"
        type="number"
        min={0}
        max={100}
        value={form.taxRate}
        onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={formActionsClass}>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : productId ? 'بروزرسانی' : 'ثبت'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(routes.products)}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
