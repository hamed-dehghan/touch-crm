// frontend/src/components/projects/ProjectForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Customer, Project } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AutocompleteSelect } from '@/components/ui/AutocompleteSelect';
import { Textarea } from '@/components/ui/Textarea';
import { routes } from '@/lib/routes';
import { formActionsClass, formFieldStackClass } from '@/lib/formLayout';

export function ProjectForm({ projectId }: { projectId?: number }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ projectName: '', customerId: '', description: '', status: 'OPEN' as Project['status'] });
  const [loading, setLoading] = useState(!!projectId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.customers.list({ limit: 500 }).then((cRes) => {
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
    });
  }, []);

  useEffect(() => {
    if (!projectId) {
      setForm({ projectName: '', customerId: '', description: '', status: 'OPEN' });
      setLoading(false);
      return;
    }
    setLoading(true);
    api.projects.getById(projectId).then((res) => {
      setLoading(false);
      if (!res.success || !res.data) {
        setError('پروژه یافت نشد.');
        return;
      }
      const p = res.data.project;
      setForm({
        projectName: p.projectName,
        customerId: String(p.customerId),
        description: p.description ?? '',
        status: p.status,
      });
    });
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.projectName.trim()) {
      setError('نام پروژه الزامی است.');
      return;
    }
    if (!projectId && !form.customerId) {
      setError('انتخاب مشتری الزامی است.');
      return;
    }
    setSaving(true);
    const body = {
      projectName: form.projectName.trim(),
      customerId: Number(form.customerId),
      description: form.description || undefined,
      status: form.status,
    };
    const res = projectId ? await api.projects.update(projectId, body) : await api.projects.create(body);
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا');
      return;
    }
    router.push(routes.projects);
  };

  if (loading) {
    return <p className="text-sm text-foreground/70">در حال بارگذاری...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={formFieldStackClass}>
      <Input label="نام پروژه *" value={form.projectName} onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))} required />
      <AutocompleteSelect
        label="مشتری *"
        value={form.customerId}
        onChange={(next) => setForm((f) => ({ ...f, customerId: next }))}
        options={customers.map((c) => ({
          value: String(c.id),
          label: `${[c.firstName, c.lastName].filter(Boolean).join(' ')} — ${c.customerCode}`,
          keywords: [c.customerCode, c.phone, c.companyName].filter(Boolean).join(' '),
        }))}
        required
      />
      <Textarea
        label="توضیحات"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        className="min-h-[60px]"
      />
      {projectId && (
        <Select
          label="وضعیت"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Project['status'] }))}
          options={[
            { value: 'OPEN', label: 'باز' },
            { value: 'IN_PROGRESS', label: 'در حال انجام' },
            { value: 'COMPLETED', label: 'تکمیل شده' },
            { value: 'CANCELLED', label: 'لغو شده' },
          ]}
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={formActionsClass}>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : projectId ? 'بروزرسانی' : 'ثبت'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(routes.projects)}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
