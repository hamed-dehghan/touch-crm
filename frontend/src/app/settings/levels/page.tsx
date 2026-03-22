'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api';
import type { CustomerLevel } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DataTable, type DataTableColumn, type DataTableFilter, type FilterToken } from '@/components/ui/DataTable';
import { filterRowsBySearch, paginateSlice, sortRows } from '@/lib/clientListQuery';
import { filterRowsByTokens, matchNumberCell, matchTextCell } from '@/lib/filterTokens';

const levelFilterDefinitions: DataTableFilter[] = [
  { key: 'levelName', label: 'نام سطح', type: 'text' },
  { key: 'minScore', label: 'حداقل امتیاز', type: 'number' },
  { key: 'maxScore', label: 'حداکثر امتیاز', type: 'number' },
];

export default function CustomerLevelsPage() {
  const fetchLevels = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const res = await api.customerLevels.list();
      if (!res.success || !res.data) {
        return {
          rows: [],
          pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
        };
      }
      let rows = [...res.data.customerLevels];
      rows = filterRowsByTokens(rows, params.filters, {
        levelName: (l, op, v) => matchTextCell(l.levelName, op, v),
        minScore: (l, op, v) => matchNumberCell(l.minScore, op, v),
        maxScore: (l, op, v) => matchNumberCell(l.maxScore, op, v),
      });
      rows = filterRowsBySearch(rows, params.search, (l) => `${l.levelName} ${l.minScore} ${l.maxScore}`);
      rows = sortRows(rows, params.sortBy, params.sortOrder, {
        levelName: (l) => l.levelName,
        minScore: (l) => l.minScore,
        maxScore: (l) => l.maxScore,
      });
      return paginateSlice(rows, params.page, params.limit);
    },
    [],
  );

  const columns: DataTableColumn<CustomerLevel>[] = [
    {
      key: 'levelName',
      title: 'نام سطح',
      sticky: true,
      sortable: true,
    },
    {
      key: 'minScore',
      title: 'حداقل امتیاز',
      sortable: true,
      render: (l) => l.minScore.toLocaleString('fa-IR'),
    },
    {
      key: 'maxScore',
      title: 'حداکثر امتیاز',
      sortable: true,
      render: (l) => l.maxScore.toLocaleString('fa-IR'),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">سطوح وفاداری (RFM)</h1>
      <Card>
        <CardHeader>
          <CardTitle>سطوح و بازه امتیاز</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<CustomerLevel>
            columns={columns}
            fetchData={fetchLevels}
            rowKey={(r) => r.id}
            enableColumnPinning
            filters={levelFilterDefinitions}
            searchPlaceholder="فیلترها را اضافه کنید یا متن جستجو را وارد کنید، سپس جستجو..."
            pageSize={10}
            emptyMessage="سطحی تعریف نشده."
          />
        </CardContent>
      </Card>
    </div>
  );
}
