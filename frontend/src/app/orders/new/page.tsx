'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Customer, Product } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AutocompleteSelect } from '@/components/ui/AutocompleteSelect';
import { TrashIcon } from '@/components/ui/icons';
import { routes } from '@/lib/routes';
import { formActionsClass, formFieldStackClass } from '@/lib/formLayout';

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [lineItems, setLineItems] = useState<{ productId: number; quantity: number }[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.customers.list({ limit: 100 }).then((r) => r.success && r.data && setCustomers(r.data.customers));
    api.products.list().then((r) => r.success && r.data && setProducts(r.data.products));
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const addLine = () => setLineItems((prev) => [...prev, { productId: products[0]?.id ?? 0, quantity: 1 }]);
  const updateLine = (index: number, field: 'productId' | 'quantity', value: number) => {
    setLineItems((prev) => {
      const next = [...prev];
      if (field === 'productId') next[index] = { ...next[index], productId: value };
      else next[index] = { ...next[index], quantity: value };
      return next;
    });
  };
  const removeLine = (index: number) => setLineItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = lineItems.reduce((sum, item) => {
    const p = products.find((x) => x.id === item.productId);
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);
  const finalAmount = subtotal - discountAmount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedCustomerId) { setError('مشتری را انتخاب کنید.'); return; }
    if (lineItems.length === 0) { setError('حداقل یک آیتم اضافه کنید.'); return; }
    setLoading(true);
    const res = await api.orders.create({
      customerId: selectedCustomerId,
      orderItems: lineItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      discountAmount,
      taxAmount,
    });
    setLoading(false);
    if (!res.success) { setError(res.error?.message ?? 'خطا'); return; }
    router.push(routes.order(res.data!.order.id));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">ثبت سفارش جدید</h1>
      <Card>
        <CardHeader><CardTitle>۱. انتخاب مشتری</CardTitle></CardHeader>
        <CardContent className={formFieldStackClass}>
          <AutocompleteSelect
            label="مشتری *"
            value={selectedCustomerId ? String(selectedCustomerId) : ''}
            onChange={(next) => setSelectedCustomerId(next ? Number(next) : null)}
            options={customers.map((c) => ({
              value: String(c.id),
              label: `${[c.firstName, c.lastName].filter(Boolean).join(' ')} — ${c.customerCode}`,
              keywords: [c.customerCode, c.phone, c.companyName].filter(Boolean).join(' '),
            }))}
            placeholder="-- انتخاب مشتری --"
            searchPlaceholder="جستجو (نام، کد، تلفن)"
          />
          {selectedCustomer && <p className="text-sm text-slate-600 mt-2">مشتری: {[selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(' ')}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>۲. آیتم‌ها</CardTitle></CardHeader>
        <CardContent className={formFieldStackClass}>
          {lineItems.map((item, i) => (
            <div key={i} className="flex w-full gap-2 items-center mb-2">
              <AutocompleteSelect
                className="flex-1 min-w-0"
                value={String(item.productId || '')}
                onChange={(next) => updateLine(i, 'productId', Number(next) || 0)}
                options={products.map((p) => ({
                  value: String(p.id),
                  label: `${p.productName} — ${p.price.toLocaleString('fa-IR')}`,
                  keywords: p.productName,
                }))}
                placeholder="-- انتخاب محصول --"
              />
              <div className="w-20 shrink-0">
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateLine(i, 'quantity', Number(e.target.value) || 1)}
                />
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removeLine(i)}
                aria-label="حذف آیتم"
                title="حذف آیتم"
                className="h-10 w-10 p-0 shrink-0"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={!products.length}>افزودن آیتم</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>۳. جمع</CardTitle></CardHeader>
        <CardContent className={formFieldStackClass}>
          <p>جمع جزء: {subtotal.toLocaleString('fa-IR')}</p>
          <Input label="تخفیف" type="number" min={0} value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)} />
          <Input label="مالیات" type="number" min={0} value={taxAmount} onChange={(e) => setTaxAmount(Number(e.target.value) || 0)} />
          <p className="font-semibold">مبلغ نهایی: {finalAmount.toLocaleString('fa-IR')}</p>
        </CardContent>
      </Card>
      <form onSubmit={handleSubmit} className={formFieldStackClass}>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className={formActionsClass}>
          <Button type="submit" disabled={loading}>{loading ? 'در حال ثبت...' : 'ثبت سفارش'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>انصراف</Button>
        </div>
      </form>
    </div>
  );
}
