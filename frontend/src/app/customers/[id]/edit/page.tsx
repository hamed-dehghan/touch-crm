// frontend/src/app/customers/[id]/edit/page.tsx
'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { routes } from '@/lib/routes';

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: idParam } = use(params);
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return <p className="text-red-600">شناسه نامعتبر است.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={routes.customer(id)} className="text-sm text-primary hover:underline">
            ← بازگشت به پروفایل
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-2">ویرایش مشتری</h1>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>فرم مشتری</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            customerId={id}
            onCancel={() => router.push(routes.customer(id))}
            onSaved={() => router.push(routes.customer(id))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
