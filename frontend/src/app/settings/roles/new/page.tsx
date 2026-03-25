// frontend/src/app/settings/roles/new/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { RoleForm } from '@/components/settings/RoleForm';
import { routes } from '@/lib/routes';

export default function NewRolePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.settingsRoles} className="text-sm text-primary hover:underline">
          ← بازگشت به نقش‌ها
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">نقش جدید</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ثبت نقش</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleForm />
        </CardContent>
      </Card>
    </div>
  );
}
