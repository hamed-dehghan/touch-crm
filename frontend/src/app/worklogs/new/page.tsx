// frontend/src/app/worklogs/new/page.tsx
'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { WorkLogForm } from '@/components/worklogs/WorkLogForm';
import { routes } from '@/lib/routes';

function WorkLogFormShell() {
  return <WorkLogForm />;
}

export default function NewWorkLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.worklogs} className="text-sm text-primary hover:underline">
          ← بازگشت به گزارش کار
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">ثبت گزارش کار</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>فرم گزارش</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-foreground/70">در حال بارگذاری...</p>}>
            <WorkLogFormShell />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
