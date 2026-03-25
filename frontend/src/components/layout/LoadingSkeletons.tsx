'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

function TableHeaderSkeleton({ columns }: { columns: number }) {
  return (
    <tr className="border-b border-slate-200">
      {Array.from({ length: columns }).map((_, i) => (
        <th key={i} className="py-2 px-3">
          <Skeleton className="h-4 w-3/4" />
        </th>
      ))}
    </tr>
  );
}

function TableBodySkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-100">
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="py-2 px-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TableLoadingSkeleton({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead>
          <TableHeaderSkeleton columns={columns} />
        </thead>
        <tbody>
          <TableBodySkeleton columns={columns} rows={rows} />
        </tbody>
      </table>
    </div>
  );
}

export function TasksBoardLoadingSkeleton({ cardsPerColumn = 2 }: { cardsPerColumn?: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
      {Array.from({ length: 4 }).map((_, col) => (
        <div
          key={col}
          className="min-h-[22rem] min-w-[17.5rem] flex-1 rounded-lg bg-[#F4F5F7] p-2 lg:min-w-0"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <Skeleton className="h-4 w-28 rounded bg-[#EBECF0]" />
            <Skeleton className="h-5 w-8 rounded-full bg-[#DFE1E6]" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: cardsPerColumn }).map((__, i) => (
              <div key={i} className="rounded border border-[#DFE1E6] border-s-4 border-s-slate-300 bg-white px-3 py-2.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-3 w-16 rounded bg-[#EBECF0]" />
                  <Skeleton className="h-5 w-20 rounded bg-[#FAFBFC]" />
                </div>
                <Skeleton className="mt-2 h-4 w-full rounded bg-[#EBECF0]" />
                <Skeleton className="mt-1.5 h-3 w-4/5 rounded bg-[#F4F5F7]" />
                <div className="mt-2 flex gap-1">
                  <Skeleton className="h-4 w-14 rounded-sm bg-[#DEEBFF]" />
                  <Skeleton className="h-4 w-16 rounded-sm bg-[#EAEAEA]" />
                </div>
                <div className="mt-2.5 flex justify-between border-t border-[#F0F1F2] pt-2">
                  <Skeleton className="h-7 w-7 rounded-full bg-[#DFE1E6]" />
                  <Skeleton className="h-7 w-14 rounded bg-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrderDetailLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <Card>
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="px-6 py-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </Card>

      <Card>
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="px-6 py-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <th key={i} className="py-2 px-3">
                      <Skeleton className="h-4 w-3/4" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, r) => (
                  <tr key={r} className="border-b border-slate-100">
                    {Array.from({ length: 4 }).map((__, c) => (
                      <td key={c} className="py-2 px-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function CustomerDetailLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-72" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-2 text-sm">
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="px-6 py-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </Card>

        <Card>
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function CampaignDetailLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <Card>
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="px-6 py-4 space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    </div>
  );
}

export function CustomerEditLoadingSkeleton() {
  return (
    <div className="max-w-xl">
      <Skeleton className="h-8 w-44 mb-6" />
      <Card>
        <div className="px-6 py-4 pt-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-1 rounded-none" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div>
              <Skeleton className="h-4 w-20 mb-1 rounded-none" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

