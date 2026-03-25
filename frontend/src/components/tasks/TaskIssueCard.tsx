// frontend/src/components/tasks/TaskIssueCard.tsx
'use client';

import type { Task, TaskStatus } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { formatGregorianToJalali } from '@/utils/date';

/** Jira-style issue key for display (no backend field yet). */
export function taskIssueKey(id: number): string {
  return `TSK-${id}`;
}

export function assigneeInitials(task: Task): string {
  const name = task.assignedTo?.fullName?.trim() || task.assignedTo?.username?.trim();
  if (!name) return '?';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? '';
    const b = parts[parts.length - 1]?.[0] ?? '';
    return (a + b).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const statusBorder: Record<TaskStatus, string> = {
  PENDING: 'border-s-slate-400',
  IN_PROGRESS: 'border-s-[#0052CC]',
  COMPLETED: 'border-s-emerald-500',
  CANCELLED: 'border-s-slate-300',
};

interface TaskIssueCardProps {
  task: Task;
  dueState: 'none' | 'overdue' | 'soon' | 'ok';
  updatingStatus: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
}

function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function RepeatGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7m0 0L19.876 4.5m-3.969 5.26m0 0v4.992" />
    </svg>
  );
}

export function TaskIssueCard({
  task,
  dueState,
  updatingStatus,
  onDragStart,
  onDragEnd,
  onStatusChange,
  onEdit,
}: TaskIssueCardProps) {
  const borderAccent = statusBorder[task.status] ?? 'border-s-slate-300';
  const dueClass =
    dueState === 'overdue'
      ? 'text-red-600 font-semibold'
      : dueState === 'soon'
        ? 'text-amber-700 font-medium'
        : 'text-slate-600';

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={[
        'group cursor-grab active:cursor-grabbing rounded border border-[#DFE1E6] bg-white py-2.5 ps-3 pe-2.5 shadow-sm',
        'transition-[box-shadow,border-color] hover:border-[#4C9AFF] hover:shadow-md',
        'border-s-4',
        borderAccent,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="shrink-0 font-mono text-[11px] font-semibold tracking-wide text-[#5E6C84]">
            {taskIssueKey(task.id)}
          </span>
          {task.isRecurring && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[#5E6C84]" title="تکراری">
              <RepeatGlyph className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <select
          value={task.status}
          onChange={(e) => {
            onStatusChange(e.target.value as TaskStatus);
          }}
          disabled={updatingStatus}
          onClick={(e) => e.stopPropagation()}
          className="max-w-[7.5rem] shrink-0 rounded border border-[#DFE1E6] bg-[#FAFBFC] px-1.5 py-0.5 text-[10px] text-[#172B4D] focus:border-[#4C9AFF] focus:outline-none"
          aria-label="وضعیت وظیفه"
        >
          <option value="PENDING">در انتظار</option>
          <option value="IN_PROGRESS">در حال انجام</option>
          <option value="COMPLETED">تکمیل شده</option>
          <option value="CANCELLED">لغو شده</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="mt-1.5 w-full text-start text-sm font-medium leading-snug text-[#172B4D] hover:text-[#0052CC] hover:underline"
      >
        {task.title}
      </button>

      {task.description ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5E6C84]">{task.description}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1">
        {task.project?.projectName ? (
          <span className="max-w-full truncate rounded-sm bg-[#DEEBFF] px-1.5 py-px text-[10px] font-medium text-[#0747A6]">
            {task.project.projectName}
          </span>
        ) : null}
        {task.customer ? (
          <span className="max-w-full truncate rounded-sm bg-[#EAEAEA] px-1.5 py-px text-[10px] text-[#424242]">
            {task.customer.companyName ||
              [task.customer.firstName, task.customer.lastName].filter(Boolean).join(' ') ||
              'مشتری'}
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#F0F1F2] pt-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#DFE1E6] text-[10px] font-bold text-[#42526E]"
            title={task.assignedTo?.fullName ?? task.assignedTo?.username ?? ''}
          >
            {assigneeInitials(task)}
          </span>
          {task.dueDate ? (
            <span className={`flex min-w-0 items-center gap-1 text-[11px] ${dueClass}`}>
              <CalendarGlyph className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{formatGregorianToJalali(task.dueDate)}</span>
              {task.dueTime ? <span className="text-[#5E6C84]">· {task.dueTime}</span> : null}
            </span>
          ) : (
            <span className="text-[11px] text-[#97A0AF]">بدون سررسید</span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-[11px] text-[#0052CC]" onClick={onEdit}>
          ویرایش
        </Button>
      </div>
    </article>
  );
}
