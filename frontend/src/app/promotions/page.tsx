'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Promotion, Customer } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [form, setForm] = useState({ title: '', rewardType: 'PERCENTAGE', rewardValue: '', conditionJson: '{}', durationDays: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.promotions.list(), api.customers.list({ limit: 100 })]).then(([pRes, cRes]) => {
      if (pRes.success && pRes.data) setPromotions(pRes.data.promotions);
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ title: '', rewardType: 'PERCENTAGE', rewardValue: '', conditionJson: '{}', durationDays: '', isActive: true });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (p: Promotion) => {
    setForm({
      title: p.title,
      rewardType: p.rewardType,
      rewardValue: String(p.rewardValue),
      conditionJson: p.conditionJson,
      durationDays: p.durationDays?.toString() ?? '',
      isActive: p.isActive,
    });
    setEditingId(p.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.rewardValue) { setError('عنوان و مقدار الزامی است.'); return; }
    setSaving(true);
    const body = {
      title: form.title.trim(),
      rewardType: form.rewardType as 'PERCENTAGE' | 'FIXED_AMOUNT',
      rewardValue: Number(form.rewardValue),
      conditionJson: form.conditionJson,
      durationDays: form.durationDays ? Number(form.durationDays) : undefined,
      isActive: form.isActive,
    };
    const res = editingId ? await api.promotions.update(editingId, body) : await api.promotions.create(body);
    setSaving(false);
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این تخفیف مطمئنید؟')) return;
    const res = await api.promotions.delete(id);
    if (res.success) fetchData();
  };

  const handleAssign = async () => {
    if (!showAssign || !assignCustomerId) return;
    const res = await api.promotions.assign(showAssign, Number(assignCustomerId));
    if (res.success) { setShowAssign(null); setAssignCustomerId(''); alert('تخفیف با موفقیت اختصاص داده شد.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">تخفیف‌ها و جوایز</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>تخفیف جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'ویرایش تخفیف' : 'تخفیف جدید'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="عنوان *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نوع پاداش *</label>
                <select value={form.rewardType} onChange={(e) => setForm((f) => ({ ...f, rewardType: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="PERCENTAGE">درصدی</option>
                  <option value="FIXED_AMOUNT">مبلغ ثابت</option>
                </select>
              </div>
              <Input label="مقدار پاداش *" type="number" min={0} value={form.rewardValue} onChange={(e) => setForm((f) => ({ ...f, rewardValue: e.target.value }))} required />
              <Input label="مدت اعتبار (روز)" type="number" min={1} value={form.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                فعال
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'ثبت'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>انصراف</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showAssign !== null && (
        <Card>
          <CardHeader><CardTitle>اختصاص تخفیف به مشتری</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">انتخاب مشتری</label>
                <select value={assignCustomerId} onChange={(e) => setAssignCustomerId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">-- انتخاب کنید --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{[c.firstName, c.lastName].filter(Boolean).join(' ')} — {c.phoneNumber}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAssign} disabled={!assignCustomerId}>اختصاص</Button>
                <Button variant="outline" onClick={() => { setShowAssign(null); setAssignCustomerId(''); }}>انصراف</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <th className="py-2 px-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3">{p.title}</td>
                    <td className="py-2 px-3">{p.rewardType === 'PERCENTAGE' ? 'درصدی' : 'مبلغ ثابت'}</td>
                    <td className="py-2 px-3">{p.rewardValue}{p.rewardType === 'PERCENTAGE' ? '%' : ''}</td>
                    <td className="py-2 px-3"><Badge variant={p.isActive ? 'success' : 'default'}>{p.isActive ? 'فعال' : 'غیرفعال'}</Badge></td>
                    <td className="py-2 px-3">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>ویرایش</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setShowAssign(p.id); setAssignCustomerId(''); }}>اختصاص</Button>
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
