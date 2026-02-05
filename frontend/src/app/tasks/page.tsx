'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Task, User, Project } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatGregorianToJalali } from '@/utils/date';

const statusMap: Record<string, { label: string; variant: 'default' | 'warning' | 'success' }> = {
  PENDING: { label: 'در انتظار', variant: 'default' },
  IN_PROGRESS: { label: 'در حال انجام', variant: 'warning' },
  COMPLETED: { label: 'تکمیل شده', variant: 'success' },
  CANCELLED: { label: 'لغو شده', variant: 'default' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', description: '', assignedToUserId: '', projectId: '', dueDate: '', isRecurring: false, recurringIntervalDays: '' });
  const [filterStatus, setFilterStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.tasks.list(filterStatus ? { status: filterStatus } : undefined),
      api.users.list(),
      api.projects.list(),
    ]).then(([tRes, uRes, pRes]) => {
      if (tRes.success && tRes.data) setTasks(tRes.data.tasks);
      if (uRes.success && uRes.data) setUsers(uRes.data.users);
      if (pRes.success && pRes.data) setProjects(pRes.data.projects);
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- initial data load
  useEffect(() => { fetchData(); }, [filterStatus]);

  const resetForm = () => {
    setForm({ title: '', description: '', assignedToUserId: '', projectId: '', dueDate: '', isRecurring: false, recurringIntervalDays: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (t: Task) => {
    setForm({
      title: t.title,
      description: t.description ?? '',
      assignedToUserId: String(t.assignedToUserId),
      projectId: t.projectId?.toString() ?? '',
      dueDate: t.dueDate?.slice(0, 10) ?? '',
      isRecurring: t.isRecurring,
      recurringIntervalDays: t.recurringIntervalDays?.toString() ?? '',
    });
    setEditingId(t.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.assignedToUserId) { setError('عنوان و کاربر مسئول الزامی است.'); return; }
    setSaving(true);
    const body = {
      title: form.title.trim(),
      description: form.description || undefined,
      assignedToUserId: Number(form.assignedToUserId),
      projectId: form.projectId ? Number(form.projectId) : undefined,
      dueDate: form.dueDate || undefined,
      isRecurring: form.isRecurring,
      recurringIntervalDays: form.recurringIntervalDays ? Number(form.recurringIntervalDays) : undefined,
    };
    const res = editingId ? await api.tasks.update(editingId, body) : await api.tasks.create(body);
    setSaving(false);
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    resetForm();
    fetchData();
  };

  const changeStatus = async (id: number, status: string) => {
    await api.tasks.updateStatus(id, status);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">وظایف</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>وظیفه جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'ویرایش وظیفه' : 'وظیفه جدید'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="عنوان *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">توضیحات</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مسئول *</label>
                <select value={form.assignedToUserId} onChange={(e) => setForm((f) => ({ ...f, assignedToUserId: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
                  <option value="">-- انتخاب کنید --</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.fullName ?? u.username}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">پروژه (اختیاری)</label>
                <select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">-- بدون پروژه --</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
              </div>
              <Input label="مهلت انجام" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))} />
                تکرارشونده
              </label>
              {form.isRecurring && (
                <Input label="بازه تکرار (روز)" type="number" min={1} value={form.recurringIntervalDays} onChange={(e) => setForm((f) => ({ ...f, recurringIntervalDays: e.target.value }))} />
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
        <CardHeader><CardTitle>لیست وظایف</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">همه وضعیت‌ها</option>
              <option value="PENDING">در انتظار</option>
              <option value="IN_PROGRESS">در حال انجام</option>
              <option value="COMPLETED">تکمیل شده</option>
              <option value="CANCELLED">لغو شده</option>
            </select>
          </div>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : tasks.length === 0 ? <p className="text-slate-500">وظیفه‌ای یافت نشد.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3">عنوان</th>
                    <th className="py-2 px-3">مسئول</th>
                    <th className="py-2 px-3">پروژه</th>
                    <th className="py-2 px-3">مهلت</th>
                    <th className="py-2 px-3">وضعیت</th>
                    <th className="py-2 px-3">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const st = statusMap[t.status] ?? { label: t.status, variant: 'default' as const };
                    return (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3">
                          {t.title}
                          {t.isRecurring && <span className="text-xs text-slate-400 mr-1">(تکراری)</span>}
                        </td>
                        <td className="py-2 px-3">{t.assignedTo?.fullName ?? '-'}</td>
                        <td className="py-2 px-3">{t.project?.projectName ?? '-'}</td>
                        <td className="py-2 px-3">{t.dueDate ? formatGregorianToJalali(t.dueDate) : '-'}</td>
                        <td className="py-2 px-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                        <td className="py-2 px-3 space-x-reverse space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>ویرایش</Button>
                          {t.status !== 'COMPLETED' && <Button variant="ghost" size="sm" onClick={() => changeStatus(t.id, 'COMPLETED')}>تکمیل</Button>}
                          {t.status === 'PENDING' && <Button variant="ghost" size="sm" onClick={() => changeStatus(t.id, 'IN_PROGRESS')}>شروع</Button>}
                          {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && <Button variant="danger" size="sm" onClick={() => changeStatus(t.id, 'CANCELLED')}>لغو</Button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
