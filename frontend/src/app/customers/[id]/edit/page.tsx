'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PersianDatePicker } from '@/components/ui/DatePicker';
import { CustomerEditLoadingSkeleton } from '@/components/layout/LoadingSkeletons';

/**
 * Redirect to customer detail page.
 * Editing is now handled via the modal on the detail page.
 */
export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/customers/${params.id}`);
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await api.customers.update(id, {
      firstName: form.firstName || undefined,
      lastName: form.lastName,
      phoneNumber: form.phoneNumber,
      email: form.email || undefined,
      birthDate: form.birthDate || undefined,
      status: form.status,
      customerLevelId: form.customerLevelId ? Number(form.customerLevelId) : undefined,
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا در بروزرسانی');
      return;
    }
    router.push(`/customers/${id}`);
  };

  if (loading) return <CustomerEditLoadingSkeleton />;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">ویرایش مشتری</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="نام" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            <Input label="نام خانوادگی *" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
            <Input label="شماره موبایل *" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} required />
            <Input label="ایمیل" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <PersianDatePicker label="تاریخ تولد" value={form.birthDate} onChange={(v) => setForm((f) => ({ ...f, birthDate: v }))} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">وضعیت</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'LEAD' | 'OPPORTUNITY' | 'CUSTOMER' }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="LEAD">سرنخ</option>
                <option value="OPPORTUNITY">فرصت</option>
                <option value="CUSTOMER">مشتری</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره...' : 'ذخیره'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>انصراف</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
