// frontend/src/app/products/[id]/edit/page.tsx
'use client';

import { use } from 'react';
import Link from 'next/link';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProductForm } from '@/components/products/ProductForm';
import { routes } from '@/lib/routes';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return <p className="text-red-600">شناسه نامعتبر است.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.products} className="text-sm text-primary hover:underline">
          ← بازگشت به محصولات
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">ویرایش محصول</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ویرایش</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm productId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
