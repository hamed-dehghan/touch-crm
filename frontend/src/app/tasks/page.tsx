// frontend/src/app/tasks/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { Task, User, Project, TaskStatus } from '@/types/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatGregorianToJalali } from '@/utils/date';
import { TasksBoardLoadingSkeleton } from '@/components/layout/LoadingSkeletons';
import { loadAllProjects } from '@/lib/loadAllPaged';
import { routes } from '@/lib/routes';
import { TaskIssueCard, assigneeInitials, taskIssueKey } from '@/components/tasks/TaskIssueCard';

type TasksView = 'board' | 'list' | 'timeline';

type DateCategory = 'overdue' | 'today' | 'tomorrow' | 'future' | 'completed' | 'cancelled';

const categoryMeta: Record<DateCategory, { label: string; badgeVariant: 'danger' | 'warning' | 'info' | 'default' | 'success' }> = {
  overdue: { label: 'معوقه', badgeVariant: 'danger' },
  today: { label: 'امروز', badgeVariant: 'warning' },
  tomorrow: { label: 'فردا', badgeVariant: 'info' },
  future: { label: 'آینده', badgeVariant: 'default' },
  completed: { label: 'تکمیل‌شده', badgeVariant: 'success' },
  cancelled: { label: 'لغو شده', badgeVariant: 'default' },
};

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

function dueStateForTask(t: Task): 'none' | 'overdue' | 'soon' | 'ok' {
  if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return 'ok';
  if (!t.dueDate) return 'none';
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const dueDateStr = t.dueDate.slice(0, 10);
  if (dueDateStr < todayStr) return 'overdue';
  if (dueDateStr === todayStr || dueDateStr === tomorrowStr) return 'soon';
  return 'ok';
}

function getCustomerDisplayName(c?: { firstName?: string; lastName?: string; companyName?: string }): string {
  if (!c) return '—';
  if (c.companyName) return c.companyName;
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
}

const statusColumns: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const statusMap: Record<TaskStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; jiraTint: string }> = {
  PENDING: { label: 'در انتظار', variant: 'default', jiraTint: 'text-slate-700' },
  IN_PROGRESS: { label: 'در حال انجام', variant: 'warning', jiraTint: 'text-[#0052CC]' },
  COMPLETED: { label: 'تکمیل شده', variant: 'success', jiraTint: 'text-emerald-700' },
  CANCELLED: { label: 'لغو شده', variant: 'default', jiraTint: 'text-slate-500' },
};

const viewTabs: { id: TasksView; label: string }[] = [
  { id: 'board', label: 'برد' },
  { id: 'list', label: 'فهرست' },
  { id: 'timeline', label: 'زمان‌بندی' },
];

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<TasksView>('board');
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.tasks.list(filterStatus ? { status: filterStatus } : undefined),
      api.users.list(),
      loadAllProjects(),
    ]).then(([tRes, uRes, projectRows]) => {
      if (tRes.success && tRes.data) setTasks(tRes.data.tasks);
      if (uRes.success && uRes.data) setUsers(uRes.data.users);
      setProjects(projectRows);
      setLoading(false);
    });
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        const keyMatch = taskIssueKey(task.id).toLowerCase().includes(query);
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = (task.description ?? '').toLowerCase().includes(query);
        if (!keyMatch && !matchesTitle && !matchesDescription) return false;
      }
      return true;
    });
  }, [tasks, filterAssignee, filterProject, search]);

  const listSorted = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const ad = a.dueDate ? a.dueDate.slice(0, 10) : '9999-99-99';
      const bd = b.dueDate ? b.dueDate.slice(0, 10) : '9999-99-99';
      if (ad !== bd) return ad.localeCompare(bd);
      return b.id - a.id;
    });
  }, [filteredTasks]);

  const columns = useMemo(() => {
    return statusColumns.reduce<Record<TaskStatus, Task[]>>((acc, status) => {
      acc[status] = filteredTasks.filter((task) => task.status === status);
      return acc;
    }, { PENDING: [], IN_PROGRESS: [], COMPLETED: [], CANCELLED: [] });
  }, [filteredTasks]);

  const grouped = useMemo(() => {
    const map: Record<DateCategory, Task[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      future: [],
      completed: [],
      cancelled: [],
    };
    for (const t of filteredTasks) {
      map[categoriseTask(t)].push(t);
    }
    return map;
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

  const toggleComplete = async (t: Task) => {
    const newStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await api.tasks.updateStatus(t.id, newStatus);
    fetchData();
  };

  const cancelTask = async (id: number) => {
    await api.tasks.updateStatus(id, 'CANCELLED');
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="text-xs font-medium text-[#5E6C84]" aria-label="مسیر">
            <span>فضای کاری</span>
            <span className="mx-1.5 text-[#97A0AF]">/</span>
            <span className="text-[#172B4D]">وظایف</span>
          </nav>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#172B4D]">وظایف</h1>
        </div>
        <Button
          onClick={() => router.push(routes.taskNew)}
          className="bg-[#0052CC] hover:bg-[#0747A6] focus-visible:ring-[#4C9AFF]"
        >
          ایجاد وظیفه
        </Button>
      </div>

      <div className="rounded-lg border border-[#DFE1E6] bg-[#F4F5F7] p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-1 rounded-md bg-white p-1 shadow-sm ring-1 ring-[#DFE1E6]">
            {viewTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={[
                  'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                  view === tab.id
                    ? 'bg-[#DEEBFF] text-[#0747A6] shadow-sm'
                    : 'text-[#5E6C84] hover:bg-[#F4F5F7] hover:text-[#172B4D]',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:flex lg:max-w-4xl lg:flex-1 lg:flex-wrap lg:justify-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-[#DFE1E6] bg-white px-3 py-2 text-sm text-[#172B4D] shadow-sm focus:border-[#4C9AFF] focus:outline-none"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="PENDING">در انتظار</option>
              <option value="IN_PROGRESS">در حال انجام</option>
              <option value="COMPLETED">تکمیل شده</option>
              <option value="CANCELLED">لغو شده</option>
            </select>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="rounded-md border border-[#DFE1E6] bg-white px-3 py-2 text-sm text-[#172B4D] shadow-sm focus:border-[#4C9AFF] focus:outline-none"
            >
              <option value="">همه مسئولین</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName ?? u.username}
                </option>
              ))}
            </select>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="rounded-md border border-[#DFE1E6] bg-white px-3 py-2 text-sm text-[#172B4D] shadow-sm focus:border-[#4C9AFF] focus:outline-none"
            >
              <option value="">همه پروژه‌ها</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
            <Input
              placeholder="جستجو (کلید، عنوان، توضیح)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-[#DFE1E6] bg-white text-[#172B4D] placeholder:text-[#97A0AF] sm:min-w-[200px]"
            />
          </div>
        </div>
        {view === 'board' && (
          <p className="mt-2 text-xs text-[#5E6C84]">
            ستون‌ها را مانند Jira بکشید و رها کنید تا وضعیت از سرور به‌روز شود.
          </p>
        )}
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      {loading ? (
        view === 'board' ? (
          <TasksBoardLoadingSkeleton cardsPerColumn={2} />
        ) : (
          <p className="text-sm text-[#5E6C84]">در حال بارگذاری...</p>
        )
      ) : filteredTasks.length === 0 ? (
        <Card className="border-[#DFE1E6] bg-white">
          <CardContent className="py-10 text-center text-sm text-[#5E6C84]">موردی مطابق فیلترها نیست.</CardContent>
        </Card>
      ) : view === 'board' ? (
        <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {statusColumns.map((status) => {
            const st = statusMap[status] ?? { label: status, variant: 'default' as const, jiraTint: '' };
            const columnTasks = columns[status];

            return (
              <div
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  void onDropToColumn(status);
                }}
                className="flex min-h-[24rem] min-w-[17.5rem] flex-1 flex-col rounded-lg bg-[#F4F5F7] p-2 lg:min-w-0"
              >
                <header className="mb-2 flex items-center justify-between px-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className={`truncate text-xs font-bold tracking-wide ${st.jiraTint}`}>{st.label}</h2>
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#DFE1E6] px-1.5 text-[11px] font-semibold text-[#42526E]">
                      {columnTasks.length}
                    </span>
                  </div>
                </header>
                <div className="flex flex-1 flex-col gap-2">
                  {columnTasks.map((t) => (
                    <TaskIssueCard
                      key={t.id}
                      task={t}
                      dueState={dueStateForTask(t)}
                      updatingStatus={updatingStatusId === t.id}
                      onDragStart={() => setDraggingTaskId(t.id)}
                      onDragEnd={() => setDraggingTaskId(null)}
                      onStatusChange={(s) => {
                        void changeStatus(t.id, s);
                      }}
                      onEdit={() => router.push(routes.taskEdit(t.id))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === 'list' ? (
        <div className="overflow-x-auto rounded-lg border border-[#DFE1E6] bg-white shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#DFE1E6] bg-[#FAFBFC] text-start text-xs font-semibold tracking-wide text-[#5E6C84]">
                <th className="px-3 py-3">کلید</th>
                <th className="px-3 py-3">عنوان</th>
                <th className="px-3 py-3">وضعیت</th>
                <th className="px-3 py-3">مسئول</th>
                <th className="px-3 py-3">سررسید</th>
                <th className="px-3 py-3">پروژه</th>
                <th className="px-3 py-3">مشتری</th>
                <th className="px-3 py-3 w-28">جزئیات</th>
              </tr>
            </thead>
            <tbody>
              {listSorted.map((t) => {
                const sm = statusMap[t.status];
                const dueSt = dueStateForTask(t);
                return (
                  <tr
                    key={t.id}
                    className="border-b border-[#F0F1F2] transition-colors hover:bg-[#F4F5F7]"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold text-[#0052CC]">{taskIssueKey(t.id)}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => router.push(routes.taskEdit(t.id))}
                        className="text-start font-medium text-[#172B4D] hover:text-[#0052CC] hover:underline"
                      >
                        {t.title}
                      </button>
                      {t.isRecurring ? (
                        <Badge variant="info" className="ms-2 align-middle text-[10px]">
                          تکراری
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={sm.variant}>{sm.label}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DFE1E6] text-[10px] font-bold text-[#42526E]">
                          {assigneeInitials(t)}
                        </span>
                        <span className="text-[#172B4D]">{t.assignedTo?.fullName ?? t.assignedTo?.username ?? '—'}</span>
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2.5 whitespace-nowrap ${
                        dueSt === 'overdue' ? 'font-semibold text-red-600' : dueSt === 'soon' ? 'font-medium text-amber-700' : 'text-[#5E6C84]'
                      }`}
                    >
                      {t.dueDate ? formatGregorianToJalali(t.dueDate) : '—'}
                      {t.dueTime ? ` · ${t.dueTime}` : ''}
                    </td>
                    <td className="px-3 py-2.5 max-w-[140px] truncate text-[#5E6C84]" title={t.project?.projectName}>
                      {t.project?.projectName ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 max-w-[140px] truncate text-[#5E6C84]">{getCustomerDisplayName(t.customer)}</td>
                    <td className="px-3 py-2.5">
                      <Button variant="ghost" size="sm" className="h-8 text-[#0052CC]" onClick={() => router.push(routes.taskEdit(t.id))}>
                        باز کردن
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryOrder.map((cat) => {
            const list = grouped[cat];
            if (list.length === 0) return null;
            const meta = categoryMeta[cat];
            return (
              <section key={cat} className="space-y-3">
                <h2 className="flex items-center gap-2 border-b border-[#DFE1E6] pb-2 text-base font-semibold text-[#172B4D]">
                  <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                  <span className="text-sm font-normal text-[#5E6C84]">({list.length})</span>
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((t) => {
                    const isOverdue = cat === 'overdue';
                    return (
                      <Card
                        key={t.id}
                        className={`border-[#DFE1E6] transition-shadow hover:shadow-md ${isOverdue ? 'border-s-4 border-s-red-500 bg-red-50/40' : 'bg-white'}`}
                      >
                        <CardContent className="space-y-2 py-3">
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={t.status === 'COMPLETED'}
                              onChange={() => toggleComplete(t)}
                              className="mt-1 h-4 w-4 accent-[#0052CC] shrink-0"
                              title={t.status === 'COMPLETED' ? 'بازگشت به در انتظار' : 'علامت تکمیل'}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="font-mono text-[11px] font-semibold text-[#5E6C84]">{taskIssueKey(t.id)}</span>
                                {t.isRecurring ? (
                                  <Badge variant="info" className="text-[10px]">
                                    تکراری
                                  </Badge>
                                ) : null}
                              </div>
                              <span
                                className={`mt-0.5 block font-medium ${t.status === 'COMPLETED' ? 'text-[#97A0AF] line-through' : 'text-[#172B4D]'}`}
                              >
                                {t.title}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5E6C84]">
                            {t.assignedTo ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DFE1E6] text-[9px] font-bold">
                                  {assigneeInitials(t)}
                                </span>
                                {t.assignedTo.fullName ?? t.assignedTo.username}
                              </span>
                            ) : null}
                            {t.project ? <span>پروژه: {t.project.projectName}</span> : null}
                            {t.customer ? <span>مشتری: {getCustomerDisplayName(t.customer)}</span> : null}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5E6C84]">
                            {t.dueDate ? (
                              <span className={isOverdue ? 'font-semibold text-red-600' : undefined}>
                                سررسید: {formatGregorianToJalali(t.dueDate)}
                                {t.dueTime ? ` · ${t.dueTime}` : ''}
                              </span>
                            ) : null}
                            {t.reminderDaysBefore != null && t.reminderDaysBefore > 0 ? (
                              <span>یادآوری: {t.reminderDaysBefore} روز قبل</span>
                            ) : null}
                          </div>
                          {t.description ? <p className="line-clamp-2 text-xs text-[#5E6C84]">{t.description}</p> : null}
                          <div className="flex flex-wrap gap-1 pt-1">
                            <Button variant="ghost" size="sm" className="h-8 text-[#0052CC]" onClick={() => router.push(routes.taskEdit(t.id))}>
                              ویرایش
                            </Button>
                            {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' ? (
                              <Button variant="danger" size="sm" className="h-8" onClick={() => cancelTask(t.id)}>
                                لغو
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
