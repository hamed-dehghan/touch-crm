'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PersianDatePicker } from '@/components/ui/DatePicker';

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [referredByCustomerId, setReferredByCustomerId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!lastName.trim() || !phoneNumber.trim()) {
      setError('نام خانوادگی و شماره تلفن الزامی است.');
      return;
    }
    setLoading(true);
    const res = await api.customers.create({
      firstName: firstName || undefined,
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email || undefined,
      birthDate: birthDate || undefined,
      referredByCustomerId: referredByCustomerId ? Number(referredByCustomerId) : undefined,
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error?.message ?? 'خطا در ثبت مشتری');
      return;
    }
    router.push(`/customers/${res.data!.customer.id}`);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">ثبت مشتری جدید</h1>
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات مشتری (حداقل)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="نام" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="نام خانوادگی *" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <Input label="شماره موبایل *" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            <Input label="ایمیل" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <PersianDatePicker label="تاریخ تولد" value={birthDate} onChange={setBirthDate} />
            <Input label="معرف (شناسه مشتری)" value={referredByCustomerId} onChange={(e) => setReferredByCustomerId(e.target.value)} placeholder="اختیاری" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'در حال ثبت...' : 'ثبت مشتری'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>انصراف</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
