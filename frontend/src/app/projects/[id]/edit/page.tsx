// frontend/src/app/projects/[id]/edit/page.tsx
'use client';

import { use } from 'react';
import Link from 'next/link';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { routes } from '@/lib/routes';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return <p className="text-red-600">شناسه نامعتبر است.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.projects} className="text-sm text-primary hover:underline">
          ← بازگشت به پروژه‌ها
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">ویرایش پروژه</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ویرایش</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm projectId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
