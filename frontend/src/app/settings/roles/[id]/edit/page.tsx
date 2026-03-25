// frontend/src/app/settings/roles/[id]/edit/page.tsx
'use client';

import { use } from 'react';
import Link from 'next/link';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { RoleForm } from '@/components/settings/RoleForm';
import { routes } from '@/lib/routes';

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return <p className="text-red-600">شناسه نامعتبر است.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.settingsRoles} className="text-sm text-primary hover:underline">
          ← بازگشت به نقش‌ها
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">ویرایش نقش</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ویرایش</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleForm roleId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
