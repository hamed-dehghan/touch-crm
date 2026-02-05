'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Role, Permission } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function RolesPage() {
  const [roles, setRoles] = useState<(Role & { permissionCount: number; permissions?: Permission[] })[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ roleName: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Permission assignment
  const [assignRoleId, setAssignRoleId] = useState<number | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.roles.list(), api.roles.getPermissions()]).then(([rRes, pRes]) => {
      if (rRes.success && rRes.data) setRoles(rRes.data.roles);
      if (pRes.success && pRes.data) setAllPermissions(pRes.data.permissions);
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ roleName: '', description: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (r: typeof roles[0]) => {
    setForm({ roleName: r.roleName, description: r.description ?? '' });
    setEditingId(r.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.roleName.trim()) { setError('نام نقش الزامی است.'); return; }
    setSaving(true);
    const res = editingId
      ? await api.roles.update(editingId, { roleName: form.roleName.trim(), description: form.description || undefined })
      : await api.roles.create({ roleName: form.roleName.trim(), description: form.description || undefined });
    setSaving(false);
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این نقش مطمئنید؟')) return;
    const res = await api.roles.delete(id);
    if (!res.success) { alert(res.error?.message ?? 'خطا در حذف'); return; }
    fetchData();
  };

  const openPermissions = (role: typeof roles[0]) => {
    setAssignRoleId(role.id);
    setSelectedPermissionIds(role.permissions?.map((p) => p.id) ?? []);
  };

  const togglePermission = (pid: number) => {
    setSelectedPermissionIds((prev) => prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]);
  };

  const savePermissions = async () => {
    if (assignRoleId === null) return;
    setSaving(true);
    const res = await api.roles.assignPermissions(assignRoleId, selectedPermissionIds);
    setSaving(false);
    if (res.success) {
      setAssignRoleId(null);
      fetchData();
    }
  };

  // Group permissions by resource
  const permsByResource = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const r = p.resource ?? 'other';
    (acc[r] = acc[r] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">مدیریت نقش‌ها و مجوزها</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>نقش جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'ویرایش نقش' : 'نقش جدید'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="نام نقش *" value={form.roleName} onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value }))} required />
              <Input label="توضیحات" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'ثبت'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>انصراف</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {assignRoleId !== null && (
        <Card>
          <CardHeader><CardTitle>تخصیص مجوزها به نقش: {roles.find((r) => r.id === assignRoleId)?.roleName}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(permsByResource).map(([resource, perms]) => (
                <div key={resource}>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1 capitalize">{resource}</h3>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-1.5 text-xs bg-slate-50 rounded px-2 py-1 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={selectedPermissionIds.includes(p.id)}
                          onChange={() => togglePermission(p.id)}
                        />
                        {p.actionCode}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button onClick={savePermissions} disabled={saving}>{saving ? 'در حال ذخیره...' : 'ذخیره مجوزها'}</Button>
                <Button variant="outline" onClick={() => setAssignRoleId(null)}>انصراف</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>لیست نقش‌ها</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : roles.length === 0 ? <p className="text-slate-500">نقشی یافت نشد.</p> : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3">نام نقش</th>
                  <th className="py-2 px-3">توضیحات</th>
                  <th className="py-2 px-3">تعداد مجوز</th>
                  <th className="py-2 px-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium">{r.roleName}</td>
                    <td className="py-2 px-3">{r.description ?? '-'}</td>
                    <td className="py-2 px-3"><Badge>{r.permissionCount}</Badge></td>
                    <td className="py-2 px-3">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>ویرایش</Button>
                      <Button variant="ghost" size="sm" onClick={() => openPermissions(r)}>مجوزها</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(r.id)}>حذف</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
