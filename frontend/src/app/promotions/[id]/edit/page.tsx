// frontend/src/app/promotions/[id]/edit/page.tsx
'use client';

import { use } from 'react';
import Link from 'next/link';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PromotionForm } from '@/components/promotions/PromotionForm';
import { routes } from '@/lib/routes';

export default function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return <p className="text-red-600">شناسه نامعتبر است.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.promotions} className="text-sm text-primary hover:underline">
          ← بازگشت به تخفیف‌ها
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">ویرایش تخفیف</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ویرایش</CardTitle>
        </CardHeader>
        <CardContent>
          <PromotionForm promotionId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
