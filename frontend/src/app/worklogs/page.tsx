'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { WorkLog, Customer, Task } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatGregorianToJalali } from '@/utils/date';

export default function WorkLogsPage() {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', taskId: '', logDate: new Date().toISOString().slice(0, 10), durationMinutes: '', description: '', result: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.workLogs.list(),
      api.customers.list({ limit: 100 }),
      api.tasks.list(),
    ]).then(([wRes, cRes, tRes]) => {
      if (wRes.success && wRes.data) setWorkLogs(wRes.data.workLogs);
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
      if (tRes.success && tRes.data) setTasks(tRes.data.tasks);
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ customerId: '', taskId: '', logDate: new Date().toISOString().slice(0, 10), durationMinutes: '', description: '', result: '' });
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.description.trim() || !form.result.trim() || !form.logDate) {
      setError('تاریخ، شرح و نتیجه الزامی است.');
      return;
    }
    setSaving(true);
    const res = await api.workLogs.create({
      customerId: form.customerId ? Number(form.customerId) : undefined,
      taskId: form.taskId ? Number(form.taskId) : undefined,
      logDate: form.logDate,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      description: form.description.trim(),
      result: form.result.trim(),
    });
    setSaving(false);
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    resetForm();
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">گزارش کار</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>ثبت گزارش جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>ثبت گزارش کار</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="تاریخ *" type="date" value={form.logDate} onChange={(e) => setForm((f) => ({ ...f, logDate: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مشتری (اختیاری)</label>
                <select value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">-- بدون مشتری --</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{[c.firstName, c.lastName].filter(Boolean).join(' ')} — {c.customerCode}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">وظیفه (اختیاری)</label>
                <select value={form.taskId} onChange={(e) => setForm((f) => ({ ...f, taskId: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">-- بدون وظیفه --</option>
                  {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <Input label="مدت زمان (دقیقه)" type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">شرح فعالیت *</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نتیجه *</label>
                <textarea value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px]" required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : 'ثبت'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>انصراف</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>لیست گزارش‌ها</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : workLogs.length === 0 ? <p className="text-slate-500">گزارشی یافت نشد.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3">تاریخ</th>
                    <th className="py-2 px-3">کاربر</th>
                    <th className="py-2 px-3">مشتری</th>
                    <th className="py-2 px-3">وظیفه</th>
                    <th className="py-2 px-3">مدت (دقیقه)</th>
                    <th className="py-2 px-3">شرح</th>
                    <th className="py-2 px-3">نتیجه</th>
                  </tr>
                </thead>
                <tbody>
                  {workLogs.map((w) => (
                    <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3">{formatGregorianToJalali(w.logDate)}</td>
                      <td className="py-2 px-3">{w.loggedBy?.fullName ?? '-'}</td>
                      <td className="py-2 px-3">{w.customer ? [w.customer.firstName, w.customer.lastName].filter(Boolean).join(' ') : '-'}</td>
                      <td className="py-2 px-3">{w.task?.title ?? '-'}</td>
                      <td className="py-2 px-3">{w.durationMinutes ?? '-'}</td>
                      <td className="py-2 px-3 max-w-xs truncate">{w.description}</td>
                      <td className="py-2 px-3 max-w-xs truncate">{w.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
