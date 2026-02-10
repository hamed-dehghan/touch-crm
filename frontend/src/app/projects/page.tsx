'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Project, Customer } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

const statusMap: Record<string, { label: string; variant: 'default' | 'warning' | 'success' }> = {
  OPEN: { label: 'باز', variant: 'default' },
  IN_PROGRESS: { label: 'در حال انجام', variant: 'warning' },
  COMPLETED: { label: 'تکمیل شده', variant: 'success' },
  CANCELLED: { label: 'لغو شده', variant: 'default' },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ projectName: '', customerId: '', description: '', status: 'OPEN' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.projects.list(), api.customers.list({ limit: 100 })]).then(([pRes, cRes]) => {
      if (pRes.success && pRes.data) setProjects(pRes.data.projects);
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ projectName: '', customerId: '', description: '', status: 'OPEN' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (p: Project) => {
    setForm({ projectName: p.projectName, customerId: String(p.customerId), description: p.description ?? '', status: p.status });
    setEditingId(p.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.projectName.trim()) { setError('نام پروژه الزامی است.'); return; }
    if (!editingId && !form.customerId) { setError('انتخاب مشتری الزامی است.'); return; }
    setSaving(true);
    const body = {
      projectName: form.projectName.trim(),
      customerId: Number(form.customerId),
      description: form.description || undefined,
      status: form.status as Project['status'],
    };
    const res = editingId ? await api.projects.update(editingId, body) : await api.projects.create(body);
    setSaving(false);
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    resetForm();
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">پروژه‌ها</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>پروژه جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'ویرایش پروژه' : 'پروژه جدید'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="نام پروژه *" value={form.projectName} onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مشتری *</label>
                <select value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
                  <option value="">-- انتخاب مشتری --</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{[c.firstName, c.lastName].filter(Boolean).join(' ')} — {c.customerCode}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">توضیحات</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px]" />
              </div>
              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">وضعیت</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="OPEN">باز</option>
                    <option value="IN_PROGRESS">در حال انجام</option>
                    <option value="COMPLETED">تکمیل شده</option>
                    <option value="CANCELLED">لغو شده</option>
                  </select>
                </div>
              )}
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
        <CardHeader><CardTitle>لیست پروژه‌ها</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : projects.length === 0 ? <p className="text-slate-500">پروژه‌ای یافت نشد.</p> : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3">نام پروژه</th>
                  <th className="py-2 px-3">مشتری</th>
                  <th className="py-2 px-3">وضعیت</th>
                  <th className="py-2 px-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const st = statusMap[p.status] ?? { label: p.status, variant: 'default' as const };
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3">{p.projectName}</td>
                      <td className="py-2 px-3">{p.customer ? [p.customer.firstName, p.customer.lastName].filter(Boolean).join(' ') : '-'}</td>
                      <td className="py-2 px-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="py-2 px-3">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>ویرایش</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
