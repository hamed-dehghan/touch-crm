// frontend/src/app/tasks/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Task, User, Project, Customer } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatGregorianToJalali } from '@/utils/date';

/* ── helpers ── */

type DateCategory = 'overdue' | 'today' | 'tomorrow' | 'future' | 'completed' | 'cancelled';

const categoryMeta: Record<DateCategory, { label: string; badgeVariant: 'danger' | 'warning' | 'info' | 'default' | 'success' }> = {
  overdue: { label: 'معوقه', badgeVariant: 'danger' },
  today: { label: 'امروز', badgeVariant: 'warning' },
  tomorrow: { label: 'فردا', badgeVariant: 'info' },
  future: { label: 'آینده', badgeVariant: 'default' },
  completed: { label: 'تکمیل‌شده', badgeVariant: 'success' },
  cancelled: { label: 'لغو شده', badgeVariant: 'default' },
};

/** Category order for display */
const categoryOrder: DateCategory[] = ['overdue', 'today', 'tomorrow', 'future', 'completed', 'cancelled'];

function categoriseTask(t: Task): DateCategory {
  if (t.status === 'COMPLETED') return 'completed';
  if (t.status === 'CANCELLED') return 'cancelled';
  if (!t.dueDate) return 'future';

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const dueDateStr = t.dueDate.slice(0, 10);
  if (dueDateStr < todayStr) return 'overdue';
  if (dueDateStr === todayStr) return 'today';
  if (dueDateStr === tomorrowStr) return 'tomorrow';
  return 'future';
}

function getCustomerDisplayName(c?: { firstName?: string; lastName?: string; companyName?: string }): string {
  if (!c) return '-';
  if (c.companyName) return c.companyName;
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '-';
}

/* ── component ── */

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

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.tasks.list(filterStatus ? { status: filterStatus } : undefined),
      api.users.list(),
      api.projects.list(),
      api.customers.list(),
    ]).then(([tRes, uRes, pRes, cRes]) => {
      if (tRes.success && tRes.data) setTasks(tRes.data.tasks);
      if (uRes.success && uRes.data) setUsers(uRes.data.users);
      if (pRes.success && pRes.data) setProjects(pRes.data.projects);
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- initial data load
  useEffect(() => { fetchData(); }, [filterStatus]);

  /* ── form helpers ── */

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (t: Task) => {
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
    setEditingId(t.id);
    setShowForm(true);
    setError('');
  };

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

  /** Save and close form */
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
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    resetForm();
    fetchData();
  };

  /** Save then redirect to work-log form */
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
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    const taskId = res.data?.task?.id;
    resetForm();
    fetchData();
    router.push(`/worklogs?taskId=${taskId ?? ''}`);
  };

  /** Save then open a fresh new-task form */
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
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    fetchData();
  };

  /** Toggle completion via status endpoint */
  const toggleComplete = async (t: Task) => {
    const newStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await api.tasks.updateStatus(t.id, newStatus);
    fetchData();
  };

  const cancelTask = async (id: number) => {
    await api.tasks.updateStatus(id, 'CANCELLED');
    fetchData();
  };

  /* ── grouped tasks ── */

  const grouped = useMemo(() => {
    const map: Record<DateCategory, Task[]> = {
      overdue: [], today: [], tomorrow: [], future: [], completed: [], cancelled: [],
    };
    for (const t of tasks) {
      map[categoriseTask(t)].push(t);
    }
    return map;
  }, [tasks]);

  /* ── render ── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">وظایف</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>وظیفه جدید</Button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'ویرایش وظیفه' : 'وظیفه جدید'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Row 1 */}
              <Input label="عنوان *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">مشتری مرتبط</label>
                <select value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
                  <option value="">-- بدون مشتری --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{getCustomerDisplayName(c)}</option>
                  ))}
                </select>
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">مسئول *</label>
                <select value={form.assignedToUserId} onChange={(e) => setForm((f) => ({ ...f, assignedToUserId: e.target.value }))} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" required>
                  <option value="">-- انتخاب کنید --</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.fullName ?? u.username}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">پروژه (اختیاری)</label>
                <select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
                  <option value="">-- بدون پروژه --</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
              </div>

              {/* Row 3 - dates */}
              <Input label="تاریخ سررسید" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              <Input label="ساعت انجام" type="time" value={form.dueTime} onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))} />

              {/* Row 4 - reminder */}
              <Input label="یادآوری (روز قبل از سررسید)" type="number" min={0} value={form.reminderDaysBefore} onChange={(e) => setForm((f) => ({ ...f, reminderDaysBefore: e.target.value }))} />

              {/* Recurring toggle */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm pb-2">
                  <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))} className="h-4 w-4" />
                  وظیفه دوره‌ای (تکرارشونده)
                </label>
              </div>

              {/* Recurring fields */}
              {form.isRecurring && (
                <>
                  <Input label="بازه تکرار (روز)" type="number" min={1} value={form.recurringIntervalDays} onChange={(e) => setForm((f) => ({ ...f, recurringIntervalDays: e.target.value }))} />
                  <Input label="تاریخ شروع دوره" type="date" value={form.recurringStartDate} onChange={(e) => setForm((f) => ({ ...f, recurringStartDate: e.target.value }))} />
                  <Input label="تاریخ پایان دوره" type="date" value={form.recurringEndDate} onChange={(e) => setForm((f) => ({ ...f, recurringEndDate: e.target.value }))} />
                </>
              )}

              {/* Description - full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">شرح وظیفه</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm min-h-[80px]"
                />
              </div>

              {/* TODO: file attachment upload (requires backend upload endpoint) */}

              {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'ثبت'}</Button>
                <Button type="button" variant="secondary" disabled={saving} onClick={handleSaveAndWorkLog}>ثبت / گزارش کار</Button>
                <Button type="button" variant="secondary" disabled={saving} onClick={handleSaveAndNew}>ثبت / وظیفه جدید</Button>
                <Button type="button" variant="outline" onClick={resetForm}>انصراف</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
          <option value="">همه وضعیت‌ها</option>
          <option value="PENDING">در انتظار</option>
          <option value="COMPLETED">تکمیل شده</option>
          <option value="CANCELLED">لغو شده</option>
        </select>
      </div>

      {/* Task cards grouped by date category */}
      {loading ? (
        <p className="text-placeholder">در حال بارگذاری...</p>
      ) : tasks.length === 0 ? (
        <p className="text-placeholder">وظیفه‌ای یافت نشد.</p>
      ) : (
        categoryOrder.map((cat) => {
          const list = grouped[cat];
          if (list.length === 0) return null;
          const meta = categoryMeta[cat];
          return (
            <section key={cat} className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                <span className="text-sm font-normal text-placeholder">({list.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => {
                  const isOverdue = cat === 'overdue';
                  return (
                    <Card
                      key={t.id}
                      className={`relative transition-shadow hover:shadow-md ${isOverdue ? 'border-red-400 bg-red-50' : ''}`}
                    >
                      <CardContent className="space-y-2 py-4">
                        {/* Top row: checkbox + title */}
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={t.status === 'COMPLETED'}
                            onChange={() => toggleComplete(t)}
                            className="mt-1 h-4 w-4 accent-green-600 shrink-0"
                            title={t.status === 'COMPLETED' ? 'بازگشت به حالت انتظار' : 'تکمیل وظیفه'}
                          />
                          <span className={`font-medium ${t.status === 'COMPLETED' ? 'line-through text-placeholder' : 'text-foreground'}`}>
                            {t.title}
                          </span>
                          {t.isRecurring && <Badge variant="info" className="mr-auto shrink-0">تکراری</Badge>}
                        </div>

                        {/* Meta rows */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-placeholder">
                          {t.assignedTo && <span>مسئول: {t.assignedTo.fullName ?? t.assignedTo.username}</span>}
                          {t.customer && <span>مشتری: {getCustomerDisplayName(t.customer)}</span>}
                          {t.project && <span>پروژه: {t.project.projectName}</span>}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-placeholder">
                          {t.dueDate && <span>سررسید: {formatGregorianToJalali(t.dueDate)}</span>}
                          {t.dueTime && <span>ساعت: {t.dueTime}</span>}
                          {t.reminderDaysBefore != null && t.reminderDaysBefore > 0 && (
                            <span>یادآوری: {t.reminderDaysBefore} روز قبل</span>
                          )}
                        </div>

                        {t.description && (
                          <p className="text-xs text-placeholder line-clamp-2">{t.description}</p>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-1 pt-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>ویرایش</Button>
                          {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && (
                            <Button variant="danger" size="sm" onClick={() => cancelTask(t.id)}>لغو</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
