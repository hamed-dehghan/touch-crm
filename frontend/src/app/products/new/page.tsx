// frontend/src/app/products/new/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProductForm } from '@/components/products/ProductForm';
import { routes } from '@/lib/routes';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.products} className="text-sm text-primary hover:underline">
          ← بازگشت به محصولات
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">محصول جدید</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ثبت محصول</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  );
}
