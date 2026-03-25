'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppDialogs } from '@/components/ui/AppDialogs';
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
  type DataTableGroupAction,
  type DataTableFilter,
  type FilterToken,
} from '@/components/ui/DataTable';
import { filterRowsBySearch, paginateSlice, sortRows } from '@/lib/clientListQuery';
import { filterRowsByTokens, matchSelectCell, matchTextCell } from '@/lib/filterTokens';
import { routes } from '@/lib/routes';

const userFilterDefinitions: DataTableFilter[] = [
  { key: 'username', label: 'نام کاربری', type: 'text' },
  { key: 'fullName', label: 'نام', type: 'text' },
  { key: 'email', label: 'ایمیل', type: 'text' },
  {
    key: 'roleId',
    label: 'نقش',
    type: 'select',
    options: () =>
      api.roles.list().then((rRes) =>
        rRes.success && rRes.data
          ? rRes.data.roles.map((r) => ({ value: String(r.id), label: r.roleName }))
          : [],
      ),
  },
  {
    key: 'isActive',
    label: 'وضعیت',
    type: 'select',
    options: [
      { value: 'true', label: 'فعال' },
      { value: 'false', label: 'غیرفعال' },
    ],
  },
];

export default function UsersPage() {
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [savedTick, setSavedTick] = useState(0);

  const fetchUsers = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const res = await api.users.list();
      if (!res.success || !res.data) {
        return {
          rows: [],
          pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
        };
      }
      let rows = [...res.data.users];
      rows = filterRowsByTokens(rows, params.filters, {
        username: (u, op, v) => matchTextCell(u.username, op, v),
        fullName: (u, op, v) => matchTextCell(u.fullName ?? '', op, v),
        email: (u, op, v) => matchTextCell(u.email ?? '', op, v),
        roleId: (u, op, v) => matchSelectCell(String(u.roleId), op, v),
        isActive: (u, op, v) => matchSelectCell(u.isActive ? 'true' : 'false', op, v),
      });
      rows = filterRowsBySearch(rows, params.search, (u) =>
        `${u.username} ${u.fullName ?? ''} ${u.email ?? ''} ${u.role?.roleName ?? ''}`,
      );
      rows = sortRows(rows, params.sortBy, params.sortOrder, {
        username: (u) => u.username,
        fullName: (u) => u.fullName ?? '',
        email: (u) => u.email ?? '',
        role: (u) => u.role?.roleName ?? '',
        isActive: (u) => (u.isActive ? 1 : 0),
      });
      return paginateSlice(rows, params.page, params.limit);
    },
    [savedTick],
  );

  const handleDelete = async (u: User) => {
    const ok = await dialogs.confirm('آیا از حذف این کاربر مطمئنید؟');
    if (!ok) return;
    const res = await api.users.delete(u.id);
    if (!res.success) {
      await dialogs.alert(res.error?.message ?? 'خطا در حذف');
      return;
    }
    setSavedTick((k) => k + 1);
  };

  const handleBulkDelete = async (selected: User[]) => {
    if (selected.length === 0) return;
    const ok = await dialogs.confirm('آیا از حذف کاربران انتخاب شده مطمئنید؟', {
      danger: true,
      confirmText: 'حذف',
    });
    if (!ok) return;
    const results = await Promise.all(selected.map((u) => api.users.delete(u.id)));
    const failed = results.find((r) => !r.success);
    if (failed) {
      await dialogs.alert(failed.error?.message ?? 'خطا در حذف گروهی');
      return;
    }
    setSavedTick((k) => k + 1);
  };

  const columns: DataTableColumn<User>[] = [
    {
      key: 'username',
      title: 'نام کاربری',
      sticky: true,
      sortable: true,
    },
    {
      key: 'fullName',
      title: 'نام',
      sortable: true,
      render: (u) => u.fullName ?? '-',
    },
    {
      key: 'email',
      title: 'ایمیل',
      sortable: true,
      render: (u) => u.email ?? '-',
    },
    {
      key: 'role',
      title: 'نقش',
      sortable: true,
      sortField: 'role',
      render: (u) => u.role?.roleName ?? '-',
    },
    {
      key: 'isActive',
      title: 'وضعیت',
      sortable: true,
      render: (u) => <Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? 'فعال' : 'غیرفعال'}</Badge>,
    },
  ];

  const actions: DataTableAction<User>[] = [
    {
      label: 'ویرایش',
      variant: 'primary',
      onClick: (row) => router.push(routes.settingsUserEdit(row.id)),
      triggerOnRowDoubleClick: true,
    },
    {
      label: 'حذف',
      variant: 'danger',
      onClick: handleDelete,
    },
  ];

  const groupActions: DataTableGroupAction<User>[] = [
    {
      label: 'حذف انتخاب شده',
      variant: 'danger',
      onClick: handleBulkDelete,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">مدیریت کاربران</h1>
        <Button onClick={() => router.push(routes.settingsUserNew)}>کاربر جدید</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست کاربران</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<User>
            columns={columns}
            actions={actions}
            groupActions={groupActions}
            selectableRows
            fetchData={fetchUsers}
            rowKey={(r) => r.id}
            enableColumnPinning
            filters={userFilterDefinitions}
            searchPlaceholder="فیلترها را اضافه کنید یا متن جستجو را وارد کنید، سپس جستجو..."
            pageSize={10}
            emptyMessage="کاربری یافت نشد."
          />
        </CardContent>
      </Card>
    </div>
  );
}
