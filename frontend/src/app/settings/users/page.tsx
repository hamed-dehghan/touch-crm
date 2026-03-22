'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { User, Role } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  const dialogs = useAppDialogs();
  const [roles, setRoles] = useState<Role[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', roleId: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedTick, setSavedTick] = useState(0);

  useEffect(() => {
    api.roles.list().then((rRes) => {
      if (rRes.success && rRes.data) setRoles(rRes.data.roles);
    });
  }, []);

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

  const resetForm = () => {
    setForm({ username: '', password: '', fullName: '', email: '', roleId: '', isActive: true });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (u: User) => {
    setForm({ username: u.username, password: '', fullName: u.fullName ?? '', email: u.email ?? '', roleId: String(u.roleId), isActive: u.isActive });
    setEditingId(u.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.roleId) {
      setError('نام کاربری و نقش الزامی است.');
      return;
    }
    if (!editingId && !form.password) {
      setError('رمز عبور برای کاربر جدید الزامی است.');
      return;
    }
    setSaving(true);
    let res;
    if (editingId) {
      res = await api.users.update(editingId, {
        username: form.username.trim(),
        fullName: form.fullName || undefined,
        email: form.email || undefined,
        roleId: Number(form.roleId),
        isActive: form.isActive,
      });
    } else {
      res = await api.users.create({
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName || undefined,
        email: form.email || undefined,
        roleId: Number(form.roleId),
      });
    }
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    resetForm();
    setSavedTick((k) => k + 1);
  };

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
      onClick: startEdit,
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
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          کاربر جدید
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'ویرایش کاربر' : 'کاربر جدید'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="نام کاربری *" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
              {!editingId && <Input label="رمز عبور *" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />}
              <Input label="نام و نام خانوادگی" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
              <Input label="ایمیل" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نقش *</label>
                <select value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
                  <option value="">-- انتخاب نقش --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roleName}
                    </option>
                  ))}
                </select>
              </div>
              {editingId && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                  فعال
                </label>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'ثبت'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
