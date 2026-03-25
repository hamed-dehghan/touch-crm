'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Role, Permission } from '@/types/api';
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
import { filterRowsByTokens, matchNumberCell, matchTextCell } from '@/lib/filterTokens';
import { routes } from '@/lib/routes';

const roleFilterDefinitions: DataTableFilter[] = [
  { key: 'roleName', label: 'نام نقش', type: 'text' },
  { key: 'description', label: 'توضیحات', type: 'text' },
  { key: 'permissionCount', label: 'تعداد مجوز', type: 'number' },
];

type RoleRow = Role & { permissionCount: number; permissions?: Permission[] };

export default function RolesPage() {
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [saving, setSaving] = useState(false);
  const [assignRoleId, setAssignRoleId] = useState<number | null>(null);
  const [assignRoleName, setAssignRoleName] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [savedTick, setSavedTick] = useState(0);

  useEffect(() => {
    api.roles.getPermissions().then((pRes) => {
      if (pRes.success && pRes.data) setAllPermissions(pRes.data.permissions);
    });
  }, []);

  const fetchRoles = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const rRes = await api.roles.list();
      if (!rRes.success || !rRes.data) {
        return {
          rows: [] as RoleRow[],
          pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
        };
      }
      let rows = [...rRes.data.roles] as RoleRow[];
      rows = filterRowsByTokens(rows, params.filters, {
        roleName: (r, op, v) => matchTextCell(r.roleName, op, v),
        description: (r, op, v) => matchTextCell(r.description ?? '', op, v),
        permissionCount: (r, op, v) => matchNumberCell(r.permissionCount, op, v),
      });
      rows = filterRowsBySearch(rows, params.search, (r) => `${r.roleName} ${r.description ?? ''} ${r.permissionCount}`);
      rows = sortRows(rows, params.sortBy, params.sortOrder, {
        roleName: (r) => r.roleName,
        description: (r) => r.description ?? '',
        permissionCount: (r) => r.permissionCount,
      });
      return paginateSlice(rows, params.page, params.limit);
    },
    [savedTick],
  );

  const handleDelete = async (r: RoleRow) => {
    const ok = await dialogs.confirm('آیا از حذف این نقش مطمئنید؟');
    if (!ok) return;
    const res = await api.roles.delete(r.id);
    if (!res.success) {
      await dialogs.alert(res.error?.message ?? 'خطا در حذف');
      return;
    }
    setSavedTick((k) => k + 1);
  };

  const handleBulkDelete = async (selected: RoleRow[]) => {
    if (selected.length === 0) return;
    const ok = await dialogs.confirm('آیا از حذف نقش‌های انتخاب شده مطمئنید؟', {
      danger: true,
      confirmText: 'حذف',
    });
    if (!ok) return;
    const results = await Promise.all(selected.map((r) => api.roles.delete(r.id)));
    const failed = results.find((r) => !r.success);
    if (failed) {
      await dialogs.alert(failed.error?.message ?? 'خطا در حذف گروهی');
      return;
    }
    setSavedTick((k) => k + 1);
  };

  const openPermissions = (role: RoleRow) => {
    setAssignRoleId(role.id);
    setAssignRoleName(role.roleName);
    setSelectedPermissionIds(role.permissions?.map((p) => p.id) ?? []);
  };

  const togglePermission = (pid: number) => {
    setSelectedPermissionIds((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]));
  };

  const savePermissions = async () => {
    if (assignRoleId === null) return;
    setSaving(true);
    const res = await api.roles.assignPermissions(assignRoleId, selectedPermissionIds);
    setSaving(false);
    if (res.success) {
      setAssignRoleId(null);
      setAssignRoleName('');
      setSavedTick((k) => k + 1);
    }
  };

  const permsByResource = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const r = p.resource ?? 'other';
    (acc[r] = acc[r] || []).push(p);
    return acc;
  }, {});

  const columns: DataTableColumn<RoleRow>[] = [
    {
      key: 'roleName',
      title: 'نام نقش',
      sticky: true,
      sortable: true,
      render: (r) => <span className="font-medium">{r.roleName}</span>,
    },
    {
      key: 'description',
      title: 'توضیحات',
      sortable: true,
      render: (r) => r.description ?? '-',
    },
    {
      key: 'permissionCount',
      title: 'تعداد مجوز',
      sortable: true,
      render: (r) => <Badge>{r.permissionCount}</Badge>,
    },
  ];

  const actions: DataTableAction<RoleRow>[] = [
    {
      label: 'ویرایش',
      variant: 'primary',
      onClick: (row) => router.push(routes.settingsRoleEdit(row.id)),
      triggerOnRowDoubleClick: true,
    },
    {
      label: 'مجوزها',
      variant: 'secondary',
      onClick: openPermissions,
    },
    {
      label: 'حذف',
      variant: 'danger',
      onClick: handleDelete,
    },
  ];

  const groupActions: DataTableGroupAction<RoleRow>[] = [
    {
      label: 'حذف انتخاب شده',
      variant: 'danger',
      onClick: handleBulkDelete,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">مدیریت نقش‌ها و مجوزها</h1>
        <Button onClick={() => router.push(routes.settingsRoleNew)}>نقش جدید</Button>
      </div>

      {assignRoleId !== null && (
        <Card>
          <CardHeader>
            <CardTitle>تخصیص مجوزها به نقش: {assignRoleName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(permsByResource).map(([resource, perms]) => (
                <div key={resource}>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1 capitalize">{resource}</h3>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-1.5 text-xs bg-slate-50 rounded px-2 py-1 cursor-pointer hover:bg-slate-100">
                        <input type="checkbox" checked={selectedPermissionIds.includes(p.id)} onChange={() => togglePermission(p.id)} />
                        {p.actionCode}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button onClick={savePermissions} disabled={saving}>
                  {saving ? 'در حال ذخیره...' : 'ذخیره مجوزها'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssignRoleId(null);
                    setAssignRoleName('');
                  }}
                >
                  انصراف
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>لیست نقش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<RoleRow>
            columns={columns}
            actions={actions}
            groupActions={groupActions}
            selectableRows
            fetchData={fetchRoles}
            rowKey={(r) => r.id}
            enableColumnPinning
            filters={roleFilterDefinitions}
            searchPlaceholder="فیلترها را اضافه کنید یا متن جستجو را وارد کنید، سپس جستجو..."
            pageSize={10}
            emptyMessage="نقشی یافت نشد."
          />
        </CardContent>
      </Card>
    </div>
  );
}
