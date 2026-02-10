'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Customer, Product } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
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

  const filteredCustomers = search ? customers.filter((c) => c.customerCode?.includes(search) || c.lastName?.includes(search) || c.firstName?.includes(search) || c.companyName?.includes(search)) : customers;
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
    router.push(`/orders/${res.data!.order.id}`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">ثبت سفارش جدید</h1>
      <Card>
        <CardHeader><CardTitle>۱. انتخاب مشتری</CardTitle></CardHeader>
        <CardContent>
          <Input placeholder="جستجو (تلفن یا نام)" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="max-h-40 overflow-y-auto border rounded-lg p-2 mt-2">
            {filteredCustomers.slice(0, 20).map((c) => (
              <button key={c.id} type="button" onClick={() => setSelectedCustomerId(c.id)} className={`block w-full text-right py-2 px-3 rounded ${selectedCustomerId === c.id ? 'bg-blue-100' : 'hover:bg-slate-50'}`}>
                {[c.firstName, c.lastName].filter(Boolean).join(' ')} — {c.customerCode}
              </button>
            ))}
          </div>
          {selectedCustomer && <p className="text-sm text-slate-600 mt-2">مشتری: {[selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(' ')}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>۲. آیتم‌ها</CardTitle></CardHeader>
        <CardContent>
          {lineItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-center mb-2">
              <select value={item.productId} onChange={(e) => updateLine(i, 'productId', Number(e.target.value))} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {products.map((p) => <option key={p.id} value={p.id}>{p.productName} — {p.price.toLocaleString('fa-IR')}</option>)}
              </select>
              <Input type="number" min={1} value={item.quantity} onChange={(e) => updateLine(i, 'quantity', Number(e.target.value) || 1)} className="w-20" />
              <Button type="button" variant="danger" size="sm" onClick={() => removeLine(i)}>حذف</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={!products.length}>افزودن آیتم</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>۳. جمع</CardTitle></CardHeader>
        <CardContent>
          <p>جمع جزء: {subtotal.toLocaleString('fa-IR')}</p>
          <Input label="تخفیف" type="number" min={0} value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)} />
          <Input label="مالیات" type="number" min={0} value={taxAmount} onChange={(e) => setTaxAmount(Number(e.target.value) || 0)} />
          <p className="font-semibold mt-2">مبلغ نهایی: {finalAmount.toLocaleString('fa-IR')}</p>
        </CardContent>
      </Card>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? 'در حال ثبت...' : 'ثبت سفارش'}</Button>
        <Button type="button" variant="outline" className="mr-2" onClick={() => router.back()}>انصراف</Button>
      </form>
    </div>
  );
}
