'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { Task, User, Project, TaskStatus } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatGregorianToJalali } from '@/utils/date';
import { TasksBoardLoadingSkeleton } from '@/components/layout/LoadingSkeletons';

const statusMap: Record<string, { label: string; variant: 'default' | 'warning' | 'success' }> = {
  PENDING: { label: 'در انتظار', variant: 'default' },
  IN_PROGRESS: { label: 'در حال انجام', variant: 'warning' },
  COMPLETED: { label: 'تکمیل شده', variant: 'success' },
  CANCELLED: { label: 'لغو شده', variant: 'default' },
};

const statusColumns: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', description: '', assignedToUserId: '', projectId: '', dueDate: '', isRecurring: false, recurringIntervalDays: '' });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
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
  }, [filterStatus]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches data and updates state
  useEffect(() => { fetchData(); }, [fetchData]);

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

  const changeStatus = async (id: number, status: TaskStatus) => {
    setUpdatingStatusId(id);
    const res = await api.tasks.updateStatus(id, status);
    setUpdatingStatusId(null);
    if (!res.success) {
      setError(res.error?.message ?? 'تغییر وضعیت انجام نشد.');
      return;
    }
    fetchData();
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterAssignee && String(task.assignedToUserId) !== filterAssignee) return false;
      if (filterProject) {
        if (!task.projectId || String(task.projectId) !== filterProject) return false;
      }
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = (task.description ?? '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) return false;
      }
      return true;
    });
  }, [tasks, filterAssignee, filterProject, search]);

  const columns = useMemo(() => {
    return statusColumns.reduce<Record<TaskStatus, Task[]>>((acc, status) => {
      acc[status] = filteredTasks.filter((task) => task.status === status);
      return acc;
    }, { PENDING: [], IN_PROGRESS: [], COMPLETED: [], CANCELLED: [] });
  }, [filteredTasks]);

  const onDropToColumn = async (nextStatus: TaskStatus) => {
    if (draggingTaskId === null) return;
    const task = tasks.find((item) => item.id === draggingTaskId);
    if (!task || task.status === nextStatus) {
      setDraggingTaskId(null);
      return;
    }

    const previousStatus = task.status;
    setTasks((prev) => prev.map((item) => (item.id === draggingTaskId ? { ...item, status: nextStatus } : item)));
    setUpdatingStatusId(draggingTaskId);

    const res = await api.tasks.updateStatus(draggingTaskId, nextStatus);
    setUpdatingStatusId(null);
    setDraggingTaskId(null);

    if (!res.success) {
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status: previousStatus } : item)));
      setError(res.error?.message ?? 'تغییر وضعیت انجام نشد.');
      return;
    }
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
        <CardHeader><CardTitle>برد وظایف</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 mb-4 md:grid-cols-4">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">همه وضعیت‌ها</option>
              <option value="PENDING">در انتظار</option>
              <option value="IN_PROGRESS">در حال انجام</option>
              <option value="COMPLETED">تکمیل شده</option>
              <option value="CANCELLED">لغو شده</option>
            </select>
            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">همه مسئولین</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.fullName ?? u.username}</option>)}
            </select>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">همه پروژه‌ها</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.projectName}</option>)}
            </select>
            <Input placeholder="جستجو در عنوان یا توضیح..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {loading ? (
            <TasksBoardLoadingSkeleton cardsPerColumn={2} />
          ) : filteredTasks.length === 0 ? (
            <p className="text-slate-500">وظیفه‌ای مطابق فیلترها پیدا نشد.</p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-4">
              {statusColumns.map((status) => {
                const st = statusMap[status] ?? { label: status, variant: 'default' as const };
                const columnTasks = columns[status];

                return (
                  <div
                    key={status}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { void onDropToColumn(status); }}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-[320px]"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <span className="text-xs text-slate-500">{columnTasks.length} وظیفه</span>
                    </div>

                    <div className="space-y-2">
                      {columnTasks.map((t) => (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={() => setDraggingTaskId(t.id)}
                          onDragEnd={() => setDraggingTaskId(null)}
                          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-slate-900 text-sm">{t.title}</h3>
                            {t.isRecurring && <span className="text-[10px] text-slate-500">(تکراری)</span>}
                          </div>
                          {t.description && <p className="mt-1 text-xs text-slate-600 line-clamp-2">{t.description}</p>}

                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            <p>مسئول: {t.assignedTo?.fullName ?? '-'}</p>
                            <p>پروژه: {t.project?.projectName ?? '-'}</p>
                            <p>مهلت: {t.dueDate ? formatGregorianToJalali(t.dueDate) : '-'}</p>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>ویرایش</Button>
                            <select
                              value={t.status}
                              onChange={(e) => { void changeStatus(t.id, e.target.value as TaskStatus); }}
                              disabled={updatingStatusId === t.id}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
                            >
                              <option value="PENDING">در انتظار</option>
                              <option value="IN_PROGRESS">در حال انجام</option>
                              <option value="COMPLETED">تکمیل شده</option>
                              <option value="CANCELLED">لغو شده</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
