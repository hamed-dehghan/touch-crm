'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ productName: '', price: '', taxRate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    api.products.list().then((res) => {
      if (res.success && res.data) setProducts(res.data.products);
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setForm({ productName: '', price: '', taxRate: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (p: Product) => {
    setForm({ productName: p.productName, price: String(p.price), taxRate: String(p.taxRate) });
    setEditingId(p.id);
    setShowForm(true);
    setError('');
  };

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
    const res = editingId
      ? await api.products.update(editingId, body)
      : await api.products.create(body);
    setSaving(false);
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    resetForm();
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این محصول مطمئنید؟')) return;
    const res = await api.products.delete(id);
    if (res.success) fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">محصولات</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>افزودن محصول</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'ویرایش محصول' : 'محصول جدید'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="نام محصول *" value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} required />
              <Input label="قیمت (ریال) *" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
              <Input label="نرخ مالیات (%)" type="number" min={0} max={100} value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'ثبت'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>انصراف</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>لیست محصولات</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : products.length === 0 ? <p className="text-slate-500">محصولی یافت نشد.</p> : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3">نام</th>
                  <th className="py-2 px-3">قیمت</th>
                  <th className="py-2 px-3">نرخ مالیات</th>
                  <th className="py-2 px-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3">{p.productName}</td>
                    <td className="py-2 px-3">{p.price.toLocaleString('fa-IR')}</td>
                    <td className="py-2 px-3">{p.taxRate}%</td>
                    <td className="py-2 px-3">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>ویرایش</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(p.id)}>حذف</Button>
                    </td>
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
