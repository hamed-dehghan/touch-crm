// frontend/src/app/settings/users/new/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { UserForm } from '@/components/settings/UserForm';
import { routes } from '@/lib/routes';

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.settingsUsers} className="text-sm text-primary hover:underline">
          ← بازگشت به کاربران
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">کاربر جدید</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ثبت کاربر</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm />
        </CardContent>
      </Card>
    </div>
  );
}
