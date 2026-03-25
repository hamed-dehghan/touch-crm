// frontend/src/components/settings/UserForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Role, User } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AutocompleteSelect } from '@/components/ui/AutocompleteSelect';
import { FormCheckboxRow } from '@/components/ui/FormCheckboxRow';
import { formActionsClass, formFieldStackClass } from '@/lib/formLayout';
import { routes } from '@/lib/routes';

export function UserForm({ userId }: { userId?: number }) {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', roleId: '', isActive: true });
  const [loading, setLoading] = useState(!!userId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.roles.list().then((rRes) => {
      if (rRes.success && rRes.data) setRoles(rRes.data.roles);
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      setForm({ username: '', password: '', fullName: '', email: '', roleId: '', isActive: true });
      setLoading(false);
      return;
    }
    setLoading(true);
    api.users.list().then((res) => {
      setLoading(false);
      if (!res.success || !res.data) {
        setError('کاربر یافت نشد.');
        return;
      }
      const u = res.data.users.find((x: User) => x.id === userId);
      if (!u) {
        setError('کاربر یافت نشد.');
        return;
      }
      setForm({
        username: u.username,
        password: '',
        fullName: u.fullName ?? '',
        email: u.email ?? '',
        roleId: String(u.roleId),
        isActive: u.isActive,
      });
    });
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.roleId) {
      setError('نام کاربری و نقش الزامی است.');
      return;
    }
    if (!userId && !form.password) {
      setError('رمز عبور برای کاربر جدید الزامی است.');
      return;
    }
    setSaving(true);
    let res;
    if (userId) {
      res = await api.users.update(userId, {
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
    router.push(routes.settingsUsers);
  };

  if (loading) {
    return <p className="text-sm text-foreground/70">در حال بارگذاری...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={formFieldStackClass}>
      <Input label="نام کاربری *" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
      {!userId && <Input label="رمز عبور *" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />}
      <Input label="نام و نام خانوادگی" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
      <Input label="ایمیل" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
      <AutocompleteSelect
        label="نقش *"
        value={form.roleId}
        onChange={(next) => setForm((f) => ({ ...f, roleId: next }))}
        options={roles.map((r) => ({
          value: String(r.id),
          label: r.roleName,
          keywords: r.description ?? '',
        }))}
        required
      />
      {userId && (
        <FormCheckboxRow label="فعال" checked={form.isActive} onChange={(next) => setForm((f) => ({ ...f, isActive: next }))} />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={formActionsClass}>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : userId ? 'بروزرسانی' : 'ثبت'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(routes.settingsUsers)}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
