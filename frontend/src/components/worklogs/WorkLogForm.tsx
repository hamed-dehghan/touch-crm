// frontend/src/components/worklogs/WorkLogForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Customer, Task } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PersianDatePicker } from '@/components/ui/DatePicker';
import { AutocompleteSelect } from '@/components/ui/AutocompleteSelect';
import { routes } from '@/lib/routes';
import { formActionsClass, formFieldStackClass } from '@/lib/formLayout';

export function WorkLogForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskIdFromQuery = searchParams.get('taskId') ?? '';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({
    customerId: '',
    taskId: taskIdFromQuery,
    logDate: new Date().toISOString().slice(0, 10),
    durationMinutes: '',
    description: '',
    result: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm((f) => ({ ...f, taskId: taskIdFromQuery }));
  }, [taskIdFromQuery]);

  useEffect(() => {
    Promise.all([api.customers.list({ limit: 500 }), api.tasks.list()]).then(([cRes, tRes]) => {
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
      if (tRes.success && tRes.data) setTasks(tRes.data.tasks);
    });
  }, []);

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
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    router.push(routes.worklogs);
  };

  return (
    <form onSubmit={handleSubmit} className={formFieldStackClass}>
      <PersianDatePicker label="تاریخ *" value={form.logDate} onChange={(v) => setForm((f) => ({ ...f, logDate: v }))} />
      <AutocompleteSelect
        label="مشتری (اختیاری)"
        value={form.customerId}
        onChange={(next) => setForm((f) => ({ ...f, customerId: next }))}
        options={customers.map((c) => ({
          value: String(c.id),
          label: `${[c.firstName, c.lastName].filter(Boolean).join(' ')} — ${c.customerCode}`,
          keywords: [c.customerCode, c.phone, c.companyName].filter(Boolean).join(' '),
        }))}
        emptyOptionLabel="-- بدون مشتری --"
      />
      <AutocompleteSelect
        label="وظیفه (اختیاری)"
        value={form.taskId}
        onChange={(next) => setForm((f) => ({ ...f, taskId: next }))}
        options={tasks.map((t) => ({
          value: String(t.id),
          label: t.title,
          keywords: t.description ?? '',
        }))}
        emptyOptionLabel="-- بدون وظیفه --"
      />
      <Input
        label="مدت زمان (دقیقه)"
        type="number"
        min={1}
        value={form.durationMinutes}
        onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
      />
      <Textarea
        label="شرح فعالیت *"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        className="min-h-[60px]"
        required
      />
      <Textarea
        label="نتیجه *"
        value={form.result}
        onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
        className="min-h-[60px]"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={formActionsClass}>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : 'ثبت'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(routes.worklogs)}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
