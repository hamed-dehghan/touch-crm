// frontend/src/app/promotions/new/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PromotionForm } from '@/components/promotions/PromotionForm';
import { routes } from '@/lib/routes';

export default function NewPromotionPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.promotions} className="text-sm text-primary hover:underline">
          ← بازگشت به تخفیف‌ها
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">تخفیف جدید</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ثبت تخفیف</CardTitle>
        </CardHeader>
        <CardContent>
          <PromotionForm />
        </CardContent>
      </Card>
    </div>
  );
}
