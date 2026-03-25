// frontend/src/components/settings/RoleForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routes';
import { formActionsClass, formFieldStackClass } from '@/lib/formLayout';

export function RoleForm({ roleId }: { roleId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState({ roleName: '', description: '' });
  const [loading, setLoading] = useState(!!roleId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roleId) {
      setForm({ roleName: '', description: '' });
      setLoading(false);
      return;
    }
    setLoading(true);
    api.roles.getById(roleId).then((res) => {
      setLoading(false);
      if (!res.success || !res.data) {
        setError('نقش یافت نشد.');
        return;
      }
      const r = res.data.role;
      setForm({ roleName: r.roleName, description: r.description ?? '' });
    });
  }, [roleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.roleName.trim()) {
      setError('نام نقش الزامی است.');
      return;
    }
    setSaving(true);
    const res = roleId
      ? await api.roles.update(roleId, { roleName: form.roleName.trim(), description: form.description || undefined })
      : await api.roles.create({ roleName: form.roleName.trim(), description: form.description || undefined });
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    router.push(routes.settingsRoles);
  };

  if (loading) {
    return <p className="text-sm text-foreground/70">در حال بارگذاری...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={formFieldStackClass}>
      <Input label="نام نقش *" value={form.roleName} onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value }))} required />
      <Input label="توضیحات" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={formActionsClass}>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : roleId ? 'بروزرسانی' : 'ثبت'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(routes.settingsRoles)}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
