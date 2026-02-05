'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { User, Role } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', roleId: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.users.list(), api.roles.list()]).then(([uRes, rRes]) => {
      if (uRes.success && uRes.data) setUsers(uRes.data.users);
      if (rRes.success && rRes.data) setRoles(rRes.data.roles);
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
  useEffect(() => { fetchData(); }, []);

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
    if (!form.username.trim() || !form.roleId) { setError('نام کاربری و نقش الزامی است.'); return; }
    if (!editingId && !form.password) { setError('رمز عبور برای کاربر جدید الزامی است.'); return; }
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
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این کاربر مطمئنید؟')) return;
    const res = await api.users.delete(id);
    if (!res.success) { alert(res.error?.message ?? 'خطا در حذف'); return; }
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">مدیریت کاربران</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>کاربر جدید</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'ویرایش کاربر' : 'کاربر جدید'}</CardTitle></CardHeader>
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
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.roleName}</option>)}
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
                <Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'ثبت'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>انصراف</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>لیست کاربران</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : users.length === 0 ? <p className="text-slate-500">کاربری یافت نشد.</p> : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3">نام کاربری</th>
                  <th className="py-2 px-3">نام</th>
                  <th className="py-2 px-3">ایمیل</th>
                  <th className="py-2 px-3">نقش</th>
                  <th className="py-2 px-3">وضعیت</th>
                  <th className="py-2 px-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3">{u.username}</td>
                    <td className="py-2 px-3">{u.fullName ?? '-'}</td>
                    <td className="py-2 px-3">{u.email ?? '-'}</td>
                    <td className="py-2 px-3">{u.role?.roleName ?? '-'}</td>
                    <td className="py-2 px-3"><Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? 'فعال' : 'غیرفعال'}</Badge></td>
                    <td className="py-2 px-3">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(u)}>ویرایش</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(u.id)}>حذف</Button>
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
