// frontend/src/components/tasks/TaskForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User, Project, Customer } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PersianDatePicker } from '@/components/ui/DatePicker';
import { AutocompleteSelect } from '@/components/ui/AutocompleteSelect';
import { loadAllProjects } from '@/lib/loadAllPaged';
import { routes } from '@/lib/routes';
import { FormCheckboxRow } from '@/components/ui/FormCheckboxRow';
import { formActionsClass, formTwoColumnClass } from '@/lib/formLayout';

const emptyForm = {
  title: '',
  description: '',
  customerId: '',
  assignedToUserId: '',
  projectId: '',
  dueDate: '',
  dueTime: '',
  reminderDaysBefore: '',
  isRecurring: false,
  recurringIntervalDays: '',
  recurringStartDate: '',
  recurringEndDate: '',
};

function getCustomerDisplayName(c?: { firstName?: string; lastName?: string; companyName?: string }): string {
  if (!c) return '-';
  if (c.companyName) return c.companyName;
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '-';
}

export function TaskForm({ taskId }: { taskId?: number }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(taskId ?? null);
  const [loading, setLoading] = useState(!!taskId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.users.list(), loadAllProjects(), api.customers.list()]).then(([uRes, projectRows, cRes]) => {
      if (uRes.success && uRes.data) setUsers(uRes.data.users);
      setProjects(projectRows);
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
    });
  }, []);

  useEffect(() => {
    if (!taskId) {
      setForm(emptyForm);
      setEditingId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.tasks.getById(taskId).then((res) => {
      setLoading(false);
      if (!res.success || !res.data) {
        setError('وظیفه یافت نشد.');
        return;
      }
      const t = res.data.task;
      setEditingId(t.id);
      setForm({
        title: t.title,
        description: t.description ?? '',
        customerId: t.customerId?.toString() ?? '',
        assignedToUserId: String(t.assignedToUserId),
        projectId: t.projectId?.toString() ?? '',
        dueDate: t.dueDate?.slice(0, 10) ?? '',
        dueTime: t.dueTime ?? '',
        reminderDaysBefore: t.reminderDaysBefore?.toString() ?? '',
        isRecurring: t.isRecurring,
        recurringIntervalDays: t.recurringIntervalDays?.toString() ?? '',
        recurringStartDate: t.recurringStartDate ?? '',
        recurringEndDate: t.recurringEndDate ?? '',
      });
    });
  }, [taskId]);

  const buildBody = () => ({
    title: form.title.trim(),
    description: form.description || undefined,
    customerId: form.customerId ? Number(form.customerId) : undefined,
    assignedToUserId: Number(form.assignedToUserId),
    projectId: form.projectId ? Number(form.projectId) : undefined,
    dueDate: form.dueDate || undefined,
    dueTime: form.dueTime || undefined,
    reminderDaysBefore: form.reminderDaysBefore ? Number(form.reminderDaysBefore) : undefined,
    isRecurring: form.isRecurring,
    recurringIntervalDays: form.recurringIntervalDays ? Number(form.recurringIntervalDays) : undefined,
    recurringStartDate: form.recurringStartDate || undefined,
    recurringEndDate: form.recurringEndDate || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.assignedToUserId) {
      setError('عنوان و کاربر مسئول الزامی است.');
      return;
    }
    setSaving(true);
    const body = buildBody();
    const res = editingId ? await api.tasks.update(editingId, body) : await api.tasks.create(body);
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    router.push(routes.tasks);
  };

  const handleSaveAndWorkLog = async () => {
    setError('');
    if (!form.title.trim() || !form.assignedToUserId) {
      setError('عنوان و کاربر مسئول الزامی است.');
      return;
    }
    setSaving(true);
    const body = buildBody();
    const res = editingId ? await api.tasks.update(editingId, body) : await api.tasks.create(body);
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    const tid = res.data?.task?.id;
    router.push(tid != null ? routes.worklogNewWithTask(tid) : routes.worklogNew);
  };

  const handleSaveAndNew = async () => {
    setError('');
    if (!form.title.trim() || !form.assignedToUserId) {
      setError('عنوان و کاربر مسئول الزامی است.');
      return;
    }
    setSaving(true);
    const body = buildBody();
    const res = editingId ? await api.tasks.update(editingId, body) : await api.tasks.create(body);
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    if (taskId) {
      router.push(routes.taskNew);
    }
  };

  if (loading) {
    return <p className="text-sm text-foreground/70">در حال بارگذاری...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={formTwoColumnClass}>
      <Input label="عنوان *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      <AutocompleteSelect
        label="مشتری مرتبط"
        value={form.customerId}
        onChange={(next) => setForm((f) => ({ ...f, customerId: next }))}
        options={customers.map((c) => ({
          value: String(c.id),
          label: getCustomerDisplayName(c),
          keywords: [c.customerCode, c.phone].filter(Boolean).join(' '),
        }))}
        emptyOptionLabel="-- بدون مشتری --"
      />

      <AutocompleteSelect
        label="مسئول *"
        value={form.assignedToUserId}
        onChange={(next) => setForm((f) => ({ ...f, assignedToUserId: next }))}
        options={users.map((u) => ({
          value: String(u.id),
          label: u.fullName ?? u.username,
          keywords: [u.username, u.email, u.fullName].filter(Boolean).join(' '),
        }))}
        required
      />

      <AutocompleteSelect
        label="پروژه (اختیاری)"
        value={form.projectId}
        onChange={(next) => setForm((f) => ({ ...f, projectId: next }))}
        options={projects.map((p) => ({
          value: String(p.id),
          label: p.projectName,
          keywords: [p.projectCode, p.projectName].filter(Boolean).join(' '),
        }))}
        emptyOptionLabel="-- بدون پروژه --"
      />

      <PersianDatePicker label="تاریخ سررسید" value={form.dueDate || undefined} onChange={(v) => setForm((f) => ({ ...f, dueDate: v }))} />
      <Input label="ساعت انجام" type="time" value={form.dueTime} onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))} />

      <Input
        label="یادآوری (روز قبل از سررسید)"
        type="number"
        min={0}
        value={form.reminderDaysBefore}
        onChange={(e) => setForm((f) => ({ ...f, reminderDaysBefore: e.target.value }))}
      />

      <FormCheckboxRow
        label="وظیفه دوره‌ای"
        checked={form.isRecurring}
        onChange={(next) => setForm((f) => ({ ...f, isRecurring: next }))}
      />

      {form.isRecurring && (
        <>
          <Input
            label="بازه تکرار (روز)"
            type="number"
            min={1}
            value={form.recurringIntervalDays}
            onChange={(e) => setForm((f) => ({ ...f, recurringIntervalDays: e.target.value }))}
          />
          <PersianDatePicker
            label="تاریخ شروع دوره"
            value={form.recurringStartDate || undefined}
            onChange={(v) => setForm((f) => ({ ...f, recurringStartDate: v }))}
          />
          <PersianDatePicker
            label="تاریخ پایان دوره"
            value={form.recurringEndDate || undefined}
            onChange={(v) => setForm((f) => ({ ...f, recurringEndDate: v }))}
          />
        </>
      )}

      <div className="md:col-span-2">
        <Textarea
          label="شرح وظیفه"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="min-h-[80px]"
        />
      </div>

      {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

      <div className={`${formActionsClass} md:col-span-2`}>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'ثبت'}
        </Button>
        <Button type="button" variant="secondary" disabled={saving} onClick={() => void handleSaveAndWorkLog()}>
          ثبت / گزارش کار
        </Button>
        <Button type="button" variant="secondary" disabled={saving} onClick={() => void handleSaveAndNew()}>
          ثبت / وظیفه جدید
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(routes.tasks)}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
