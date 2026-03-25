// frontend/src/app/projects/new/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { routes } from '@/lib/routes';

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.projects} className="text-sm text-primary hover:underline">
          ← بازگشت به پروژه‌ها
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">پروژه جدید</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ثبت پروژه</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
