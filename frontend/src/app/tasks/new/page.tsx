// frontend/src/app/tasks/new/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TaskForm } from '@/components/tasks/TaskForm';
import { routes } from '@/lib/routes';

export default function NewTaskPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.tasks} className="text-sm text-primary hover:underline">
          ← بازگشت به وظایف
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">وظیفه جدید</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ثبت وظیفه</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm />
        </CardContent>
      </Card>
    </div>
  );
}
