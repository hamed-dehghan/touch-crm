'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Customer, CustomerRfmResponse, Transaction, WorkLog } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatGregorianToJalali } from '@/utils/date';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';

type Tab = 'profile' | 'contact' | 'marketing' | 'psychology' | 'documents' | 'transactions' | 'worklogs';

const statusLabel = (s: string) => {
  switch (s) {
    case 'LEAD': return 'سرنخ';
    case 'OPPORTUNITY': return 'فرصت';
    case 'CUSTOMER': return 'مشتری';
    case 'LOST': return 'از دست رفته';
    default: return s;
  }
};

const relationshipLabel = (r: string) => {
  switch (r) {
    case 'CUSTOMER': return 'مشتری';
    case 'SUPPLIER': return 'تأمین‌کننده';
    case 'AGENT': return 'نماینده';
    case 'COMPETITOR': return 'رقیب';
    case 'INTERNAL_STAFF': return 'پرسنل داخلی';
    default: return r;
  }
};

const channelLabel = (c?: string) => {
  switch (c) {
    case 'INSTAGRAM': return 'اینستاگرام';
    case 'EXHIBITION': return 'نمایشگاه';
    case 'WEBSITE': return 'وب‌سایت';
    case 'REFERRAL': return 'معرفی دیگران';
    case 'EVENT': return 'رویداد';
    case 'PREVIOUS_ACQUAINTANCE': return 'آشنایی قبلی';
    case 'OTHER': return 'سایر';
    default: return '-';
  }
};

const platformLabel = (p: string) => {
  switch (p) {
    case 'INSTAGRAM': return 'اینستاگرام';
    case 'TELEGRAM': return 'تلگرام';
    case 'WHATSAPP': return 'واتساپ';
    case 'LINKEDIN': return 'لینکدین';
    case 'TWITTER': return 'توییتر';
    default: return p;
  }
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rfm, setRfm] = useState<CustomerRfmResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('profile');
  const [deleting, setDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadData = async () => {
    if (Number.isNaN(id)) return;
    setLoading(true);
    const [custRes, rfmRes, transRes, wlRes] = await Promise.all([
      api.customers.getById(id),
      api.customers.getRfm(id),
      api.customers.getTransactions(id),
      api.workLogs.getByCustomer(id),
    ]);
    setLoading(false);
    if (custRes.success && custRes.data) setCustomer(custRes.data.customer);
    if (rfmRes.success && rfmRes.data) setRfm(rfmRes.data);
    if (transRes.success && transRes.data) setTransactions(transRes.data.transactions);
    if (wlRes.success && wlRes.data) setWorkLogs(wlRes.data.workLogs);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این مشتری مطمئنید؟')) return;
    setDeleting(true);
    const res = await api.customers.delete(id);
    setDeleting(false);
    if (res.success) router.push('/customers');
  };

  if (loading || !customer) return <div className="text-slate-500">در حال بارگذاری...</div>;

  const statusVariant = customer.status === 'CUSTOMER' ? 'success' : customer.status === 'OPPORTUNITY' ? 'warning' : customer.status === 'LOST' ? 'danger' : 'default';

  const displayName = customer.customerType === 'LEGAL'
    ? (customer.companyName || customer.brandName || '-')
    : [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '-';

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${tab === t ? 'bg-white border border-b-0 border-slate-200 text-primary' : 'text-slate-500 hover:text-slate-700'}`;

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <p><span className="text-slate-500">{label}:</span> {value}</p>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
          <p className="text-sm text-slate-500 mt-1">
            <Badge variant={customer.customerType === 'LEGAL' ? 'info' : 'default'}>
              {customer.customerType === 'NATURAL' ? 'حقیقی' : 'حقوقی'}
            </Badge>
            <span className="mx-2">|</span>
            <span className="font-mono">{customer.customerCode}</span>
            {!customer.isActive && (
              <Badge variant="danger" className="mr-2">غیرفعال</Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditModalOpen(true)}>ویرایش</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'در حال حذف...' : 'حذف'}</Button>
          <Button variant="ghost" onClick={() => router.back()}>بازگشت</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        <button type="button" className={tabClass('profile')} onClick={() => setTab('profile')}>پروفایل</button>
        <button type="button" className={tabClass('contact')} onClick={() => setTab('contact')}>تماس</button>
        <button type="button" className={tabClass('marketing')} onClick={() => setTab('marketing')}>تکمیلی</button>
        <button type="button" className={tabClass('psychology')} onClick={() => setTab('psychology')}>روانشناسی</button>
        <button type="button" className={tabClass('documents')} onClick={() => setTab('documents')}>اسناد</button>
        <button type="button" className={tabClass('transactions')} onClick={() => setTab('transactions')}>تراکنش‌ها ({transactions.length})</button>
        <button type="button" className={tabClass('worklogs')} onClick={() => setTab('worklogs')}>گزارش کار ({workLogs.length})</button>
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>اطلاعات پایه</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {customer.customerType === 'NATURAL' ? (
                <>
                  <InfoRow label="پیشوند" value={customer.prefix} />
                  <InfoRow label="نام" value={customer.firstName} />
                  <InfoRow label="نام خانوادگی" value={customer.lastName} />
                  <InfoRow label="جنسیت" value={customer.gender === 'MALE' ? 'مرد' : customer.gender === 'FEMALE' ? 'زن' : undefined} />
                </>
              ) : (
                <>
                  <InfoRow label="نام شرکت" value={customer.companyName} />
                  <InfoRow label="نام برند" value={customer.brandName} />
                </>
              )}
              <p><span className="text-slate-500">وضعیت:</span> <Badge variant={statusVariant}>{statusLabel(customer.status)}</Badge></p>
              <p><span className="text-slate-500">سطح وفاداری:</span> {customer.customerLevel?.levelName ?? '-'}</p>
            </CardContent>
          </Card>
          {rfm && (
            <Card>
              <CardHeader><CardTitle>امتیاز RFM</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Recency: {rfm.rfm.recency}</p>
                  <p>Frequency: {rfm.rfm.frequency}</p>
                  <p>Monetary: {rfm.rfm.monetary}</p>
                  <p>میانگین: {rfm.rfm.averageScore}</p>
                  {rfm.customerLevel && <p className="col-span-2">سطح: {rfm.customerLevel.levelName}</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Contact */}
      {tab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>شماره‌های تماس</CardTitle></CardHeader>
            <CardContent>
              {(!customer.phones || customer.phones.length === 0) ? (
                <p className="text-sm text-slate-400">شماره‌ای ثبت نشده</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {customer.phones.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-mono">{p.phoneNumber}</span>
                      <Badge variant="default">{p.phoneType === 'MOBILE' ? 'موبایل' : 'ثابت'}</Badge>
                      {p.extension && <span className="text-slate-400">داخلی: {p.extension}</span>}
                      {p.isDefault && <Badge variant="success">پیش‌فرض</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>اطلاعات تماس دیگر</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow label="ایمیل" value={customer.email} />
              <InfoRow label="وب‌سایت" value={customer.website} />
              {customer.socialMedia && customer.socialMedia.length > 0 && (
                <div className="mt-3">
                  <p className="text-slate-500 mb-1">شبکه‌های اجتماعی:</p>
                  {customer.socialMedia.map((sm, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="info">{platformLabel(sm.platform)}</Badge>
                      <a href={sm.profileUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate">
                        {sm.profileUrl}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {customer.addresses && customer.addresses.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>آدرس‌ها</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {customer.addresses.map((addr, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {addr.isDefault && <Badge variant="success">پیش‌فرض</Badge>}
                        {addr.province && <span>{addr.province}</span>}
                        {addr.city && <span>- {addr.city}</span>}
                      </div>
                      {addr.address && <p className="text-slate-600">{addr.address}</p>}
                      {addr.postalCode && <p className="text-slate-400">کد پستی: {addr.postalCode}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Marketing */}
      {tab === 'marketing' && (
        <Card>
          <CardHeader><CardTitle>اطلاعات تکمیلی و بازاریابی</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="نوع ارتباط" value={relationshipLabel(customer.relationshipType)} />
            <InfoRow label="روش آشنایی" value={channelLabel(customer.acquisitionChannel)} />
            <InfoRow label="معرف" value={customer.referredByCustomerId ? `مشتری #${customer.referredByCustomerId}` : undefined} />
            <p><span className="text-slate-500">وضعیت قیف فروش:</span> <Badge variant={statusVariant}>{statusLabel(customer.status)}</Badge></p>
            <InfoRow label="سطح وفاداری" value={customer.customerLevel?.levelName} />
          </CardContent>
        </Card>
      )}

      {/* Psychology */}
      {tab === 'psychology' && (
        <Card>
          <CardHeader><CardTitle>روانشناسی و نکات ظریف</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {customer.birthDate && <InfoRow label="تاریخ تولد" value={formatGregorianToJalali(customer.birthDate)} />}
            {customer.weddingAnniversary && <InfoRow label="سالگرد ازدواج" value={formatGregorianToJalali(customer.weddingAnniversary)} />}
            {customer.interests && (
              <div>
                <p className="text-slate-500 mb-1">علاقه‌مندی‌ها:</p>
                <p className="bg-slate-50 p-2 rounded">{customer.interests}</p>
              </div>
            )}
            {customer.psychology && (
              <div>
                <p className="text-slate-500 mb-1">روانشناسی فرد:</p>
                <p className="bg-slate-50 p-2 rounded">{customer.psychology}</p>
              </div>
            )}
            {customer.catchphrases && (
              <div>
                <p className="text-slate-500 mb-1">تکیه‌کلام‌ها:</p>
                <p className="bg-slate-50 p-2 rounded">{customer.catchphrases}</p>
              </div>
            )}
            {customer.notablePoints && (
              <div>
                <p className="text-slate-500 mb-1">نکات قابل توجه:</p>
                <p className="bg-slate-50 p-2 rounded">{customer.notablePoints}</p>
              </div>
            )}
            {!customer.interests && !customer.psychology && !customer.catchphrases && !customer.notablePoints && !customer.birthDate && !customer.weddingAnniversary && (
              <p className="text-slate-400">اطلاعاتی ثبت نشده</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {tab === 'documents' && (
        <div className="space-y-6">
          {customer.description && (
            <Card>
              <CardHeader><CardTitle>توضیحات</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{customer.description}</p></CardContent>
            </Card>
          )}
          {customer.attachments && customer.attachments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>فایل‌های پیوست</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {customer.attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                      <span>{att.fileName}</span>
                      {att.description && <span className="text-slate-400">- {att.description}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {customer.customerType === 'LEGAL' && customer.relatedPersonnel && customer.relatedPersonnel.length > 0 && (
            <Card>
              <CardHeader><CardTitle>پرسنل مرتبط</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {customer.relatedPersonnel.map((rp, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                      <span>{rp.naturalCustomer ? `${rp.naturalCustomer.firstName || ''} ${rp.naturalCustomer.lastName || ''}`.trim() : `#${rp.naturalCustomerId}`}</span>
                      {rp.position && <Badge variant="default">{rp.position}</Badge>}
                      {rp.naturalCustomer?.customerCode && <span className="font-mono text-xs text-slate-400">{rp.naturalCustomer.customerCode}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Transactions */}
      {tab === 'transactions' && (
        <Card>
          <CardHeader><CardTitle>تراکنش‌های اخیر</CardTitle></CardHeader>
          <CardContent>
            {transactions.length === 0 ? <p className="text-slate-500">تراکنشی یافت نشد.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-3">تاریخ</th>
                      <th className="py-2 px-3">مبلغ</th>
                      <th className="py-2 px-3">روش پرداخت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100">
                        <td className="py-2 px-3">{formatGregorianToJalali(t.transactionDate)}</td>
                        <td className="py-2 px-3">{t.amount.toLocaleString('fa-IR')}</td>
                        <td className="py-2 px-3">{t.paymentMethod === 'CASH' ? 'نقد' : 'چک'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Work Logs */}
      {tab === 'worklogs' && (
        <Card>
          <CardHeader><CardTitle>گزارش کار</CardTitle></CardHeader>
          <CardContent>
            {workLogs.length === 0 ? <p className="text-slate-500">گزارش کاری یافت نشد.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-3">تاریخ</th>
                      <th className="py-2 px-3">کاربر</th>
                      <th className="py-2 px-3">مدت (دقیقه)</th>
                      <th className="py-2 px-3">شرح</th>
                      <th className="py-2 px-3">نتیجه</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workLogs.map((w) => (
                      <tr key={w.id} className="border-b border-slate-100">
                        <td className="py-2 px-3">{formatGregorianToJalali(w.logDate)}</td>
                        <td className="py-2 px-3">{w.loggedBy?.fullName ?? '-'}</td>
                        <td className="py-2 px-3">{w.durationMinutes ?? '-'}</td>
                        <td className="py-2 px-3">{w.description}</td>
                        <td className="py-2 px-3">{w.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <CustomerFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        customerId={id}
        onSaved={loadData}
      />
    </div>
  );
}
