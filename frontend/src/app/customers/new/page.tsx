// frontend/src/app/customers/new/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { routes } from '@/lib/routes';

export default function NewCustomerPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={routes.customers} className="text-sm text-primary hover:underline">
            ← بازگشت به لیست مشتریان
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-2">ثبت مشتری جدید</h1>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>فرم مشتری</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            onCancel={() => router.push(routes.customers)}
            onSaved={(payload) => {
              if (payload?.customerId != null) {
                router.push(routes.customer(payload.customerId));
              } else {
                router.push(routes.customers);
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
