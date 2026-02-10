'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Customer } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<number | undefined>();

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    const res = await api.customers.list({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
    });
    setLoading(false);
    if (res.success && res.data) {
      setCustomers(res.data.customers);
      setPagination(res.data.pagination);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = () => fetchCustomers(1);

  const openCreateModal = () => {
    setEditCustomerId(undefined);
    setModalOpen(true);
  };

  const openEditModal = (id: number) => {
    setEditCustomerId(id);
    setModalOpen(true);
  };

  const statusVariant = (s: string) =>
    s === 'CUSTOMER' ? 'success' : s === 'OPPORTUNITY' ? 'warning' : s === 'LOST' ? 'danger' : 'default';

  const statusLabel = (s: string) => {
    switch (s) {
      case 'LEAD': return 'سرنخ';
      case 'OPPORTUNITY': return 'فرصت';
      case 'CUSTOMER': return 'مشتری';
      case 'LOST': return 'از دست رفته';
      default: return s;
    }
  };

  const typeLabel = (t: string) => (t === 'NATURAL' ? 'حقیقی' : 'حقوقی');

  const getDisplayName = (c: Customer) => {
    if (c.customerType === 'LEGAL') {
      return c.companyName || c.brandName || '-';
    }
    return [c.firstName, c.lastName].filter(Boolean).join(' ') || '-';
  };

  const getDefaultPhone = (c: Customer) => {
    if (!c.phones || c.phones.length === 0) return '-';
    const defaultPhone = c.phones.find((p) => p.isDefault) || c.phones[0];
    return defaultPhone.phoneNumber;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">مشتریان</h1>
        <Button onClick={openCreateModal}>ثبت مشتری جدید</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>لیست مشتریان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Input placeholder="جستجو (نام، شرکت، کد)" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">همه وضعیت‌ها</option>
              <option value="LEAD">سرنخ</option>
              <option value="OPPORTUNITY">فرصت</option>
              <option value="CUSTOMER">مشتری</option>
              <option value="LOST">از دست رفته</option>
            </select>
            <select value={customerType} onChange={(e) => setCustomerType(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">همه انواع</option>
              <option value="NATURAL">حقیقی</option>
              <option value="LEGAL">حقوقی</option>
            </select>
            <Button variant="secondary" onClick={handleSearch}>جستجو</Button>
          </div>
          {loading ? <p className="text-slate-500">در حال بارگذاری...</p> : customers.length === 0 ? <p className="text-slate-500">مشتریی یافت نشد.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3">کد</th>
                    <th className="py-2 px-3">نوع</th>
                    <th className="py-2 px-3">نام</th>
                    <th className="py-2 px-3">تلفن</th>
                    <th className="py-2 px-3">وضعیت</th>
                    <th className="py-2 px-3">سطح</th>
                    <th className="py-2 px-3">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className={`border-b border-slate-100 hover:bg-slate-50 ${!c.isActive ? 'opacity-50' : ''}`}>
                      <td className="py-2 px-3 font-mono text-xs">{c.customerCode}</td>
                      <td className="py-2 px-3">
                        <Badge variant={c.customerType === 'LEGAL' ? 'info' : 'default'}>
                          {typeLabel(c.customerType)}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">{getDisplayName(c)}</td>
                      <td className="py-2 px-3">{getDefaultPhone(c)}</td>
                      <td className="py-2 px-3"><Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge></td>
                      <td className="py-2 px-3">{c.customerLevel?.levelName ?? '-'}</td>
                      <td className="py-2 px-3">
                        <Link href={`/customers/${c.id}`}><Button variant="ghost" size="sm">مشاهده</Button></Link>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(c.id)}>ویرایش</Button>
                        <Button variant="danger" size="sm" onClick={async () => {
                          if (!confirm('آیا از حذف این مشتری مطمئنید؟')) return;
                          const res = await api.customers.delete(c.id);
                          if (res.success) fetchCustomers(pagination.page);
                        }}>حذف</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchCustomers(pagination.page - 1)}>قبلی</Button>
              <span className="py-2 text-sm text-slate-600">صفحه {pagination.page} از {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchCustomers(pagination.page + 1)}>بعدی</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Form Modal */}
      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customerId={editCustomerId}
        onSaved={() => fetchCustomers(pagination.page)}
      />
    </div>
  );
}
