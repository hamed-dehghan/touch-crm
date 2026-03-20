'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type {
  Customer,
  CustomerType,
  Gender,
  RelationshipType,
  AcquisitionChannel,
  CustomerStatus,
  CustomerPhone,
  CustomerAddress,
  CustomerSocialMedia,
  CustomerRelatedPersonnel,
  CustomerLevel,
} from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { PersianDatePicker } from '@/components/ui/DatePicker';
import { PhoneFieldArray } from './PhoneFieldArray';
import { AddressFieldArray } from './AddressFieldArray';
import { SocialMediaFieldArray } from './SocialMediaFieldArray';

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  /** If provided, the form is in edit mode */
  customerId?: number;
  onSaved: () => void;
}

const tabs = [
  { id: 'identity', label: 'اطلاعات پایه' },
  { id: 'contact', label: 'اطلاعات تماسی' },
  { id: 'address', label: 'آدرس' },
  { id: 'marketing', label: 'اطلاعات تکمیلی' },
  { id: 'psychology', label: 'روانشناسی' },
  { id: 'documents', label: 'اسناد' },
];

const customerTypeOptions = [
  { value: 'NATURAL', label: 'حقیقی' },
  { value: 'LEGAL', label: 'حقوقی' },
];

const genderOptions = [
  { value: '', label: 'انتخاب کنید' },
  { value: 'MALE', label: 'مرد' },
  { value: 'FEMALE', label: 'زن' },
];

const prefixOptions = [
  { value: '', label: 'بدون پیشوند' },
  { value: 'جناب آقای', label: 'جناب آقای' },
  { value: 'سرکار خانم', label: 'سرکار خانم' },
  { value: 'دکتر', label: 'دکتر' },
  { value: 'مهندس', label: 'مهندس' },
];

const statusOptions = [
  { value: 'LEAD', label: 'سرنخ (Lead)' },
  { value: 'OPPORTUNITY', label: 'فرصت (Opportunity)' },
  { value: 'CUSTOMER', label: 'مشتری قطعی' },
  { value: 'LOST', label: 'از دست رفته' },
];

const relationshipTypeOptions = [
  { value: 'CUSTOMER', label: 'مشتری' },
  { value: 'SUPPLIER', label: 'تأمین‌کننده' },
  { value: 'AGENT', label: 'نماینده' },
  { value: 'COMPETITOR', label: 'رقیب' },
  { value: 'INTERNAL_STAFF', label: 'پرسنل داخلی' },
];

const acquisitionChannelOptions = [
  { value: '', label: 'انتخاب کنید' },
  { value: 'INSTAGRAM', label: 'اینستاگرام' },
  { value: 'EXHIBITION', label: 'نمایشگاه' },
  { value: 'WEBSITE', label: 'وب‌سایت' },
  { value: 'REFERRAL', label: 'معرفی دیگران' },
  { value: 'EVENT', label: 'رویداد' },
  { value: 'PREVIOUS_ACQUAINTANCE', label: 'آشنایی قبلی' },
  { value: 'OTHER', label: 'سایر' },
];

interface FormState {
  customerType: CustomerType;
  firstName: string;
  lastName: string;
  companyName: string;
  brandName: string;
  isActive: boolean;
  prefix: string;
  gender: string;
  email: string;
  website: string;
  status: CustomerStatus;
  relationshipType: RelationshipType;
  acquisitionChannel: string;
  customerLevelId: string;
  referredByCustomerId: string;
  interests: string;
  psychology: string;
  catchphrases: string;
  notablePoints: string;
  birthDate: string;
  weddingAnniversary: string;
  description: string;
  phones: CustomerPhone[];
  addresses: CustomerAddress[];
  socialMedia: CustomerSocialMedia[];
  relatedPersonnel: CustomerRelatedPersonnel[];
}

const defaultForm: FormState = {
  customerType: 'NATURAL',
  firstName: '',
  lastName: '',
  companyName: '',
  brandName: '',
  isActive: true,
  prefix: '',
  gender: '',
  email: '',
  website: '',
  status: 'LEAD',
  relationshipType: 'CUSTOMER',
  acquisitionChannel: '',
  customerLevelId: '',
  referredByCustomerId: '',
  interests: '',
  psychology: '',
  catchphrases: '',
  notablePoints: '',
  birthDate: '',
  weddingAnniversary: '',
  description: '',
  phones: [],
  addresses: [],
  socialMedia: [],
  relatedPersonnel: [],
};

export function CustomerFormModal({ open, onClose, customerId, onSaved }: CustomerFormModalProps) {
  const [activeTab, setActiveTab] = useState('identity');
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [levels, setLevels] = useState<CustomerLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!customerId;

  // Load customer levels
  useEffect(() => {
    if (open) {
      api.customerLevels.list().then((res) => {
        if (res.success && res.data) {
          setLevels(res.data.customerLevels);
        }
      });
    }
  }, [open]);

  // Load customer data for editing
  useEffect(() => {
    if (open && customerId) {
      setLoading(true);
      api.customers.getById(customerId).then((res) => {
        setLoading(false);
        if (res.success && res.data) {
          const c = res.data.customer;
          setForm({
            customerType: c.customerType,
            firstName: c.firstName || '',
            lastName: c.lastName || '',
            companyName: c.companyName || '',
            brandName: c.brandName || '',
            isActive: c.isActive,
            prefix: c.prefix || '',
            gender: c.gender || '',
            email: c.email || '',
            website: c.website || '',
            status: c.status,
            relationshipType: c.relationshipType,
            acquisitionChannel: c.acquisitionChannel || '',
            customerLevelId: c.customerLevelId ? String(c.customerLevelId) : '',
            referredByCustomerId: c.referredByCustomerId ? String(c.referredByCustomerId) : '',
            interests: c.interests || '',
            psychology: c.psychology || '',
            catchphrases: c.catchphrases || '',
            notablePoints: c.notablePoints || '',
            birthDate: c.birthDate || '',
            weddingAnniversary: c.weddingAnniversary || '',
            description: c.description || '',
            phones: c.phones || [],
            addresses: c.addresses || [],
            socialMedia: c.socialMedia || [],
            relatedPersonnel: c.relatedPersonnel || [],
          });
        }
      });
    } else if (open) {
      setForm({ ...defaultForm });
      setActiveTab('identity');
    }
  }, [open, customerId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError('');

    // Basic validation
    if (form.customerType === 'NATURAL' && !form.lastName.trim()) {
      setError('نام خانوادگی الزامی است.');
      setActiveTab('identity');
      return;
    }
    if (form.customerType === 'LEGAL' && !form.companyName.trim()) {
      setError('نام شرکت الزامی است.');
      setActiveTab('identity');
      return;
    }

    setSaving(true);

    const body: any = {
      customerType: form.customerType,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      companyName: form.companyName || undefined,
      brandName: form.brandName || undefined,
      isActive: form.isActive,
      prefix: form.prefix || undefined,
      gender: form.gender || undefined,
      email: form.email || undefined,
      website: form.website || undefined,
      status: form.status,
      relationshipType: form.relationshipType,
      acquisitionChannel: form.acquisitionChannel || undefined,
      customerLevelId: form.customerLevelId ? Number(form.customerLevelId) : undefined,
      referredByCustomerId: form.referredByCustomerId ? Number(form.referredByCustomerId) : undefined,
      interests: form.interests || undefined,
      psychology: form.psychology || undefined,
      catchphrases: form.catchphrases || undefined,
      notablePoints: form.notablePoints || undefined,
      birthDate: form.birthDate || undefined,
      weddingAnniversary: form.weddingAnniversary || undefined,
      description: form.description || undefined,
      phones: form.phones,
      addresses: form.addresses,
      socialMedia: form.socialMedia,
      relatedPersonnel: form.relatedPersonnel,
    };

    let res;
    if (isEdit) {
      res = await api.customers.update(customerId!, body);
    } else {
      res = await api.customers.create(body);
    }

    setSaving(false);

    if (!res.success) {
      setError(res.error?.message ?? 'خطا در ذخیره‌سازی');
      return;
    }

    onSaved();
    onClose();
  };

  const levelOptions = [
    { value: '', label: 'بدون سطح' },
    ...levels.map((l) => ({ value: String(l.id), label: l.levelName })),
  ];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'ویرایش مشتری' : 'ثبت مشتری جدید'} maxWidth="max-w-5xl">
      {loading ? (
        <p className="text-slate-500 py-8 text-center">در حال بارگذاری...</p>
      ) : (
        <div>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            {/* Tab 1: Identity */}
            {activeTab === 'identity' && (
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <Select
                    label="نوع مشتری"
                    options={customerTypeOptions}
                    value={form.customerType}
                    onChange={(e) => setField('customerType', e.target.value as CustomerType)}
                  />
                  <div className="pt-5">
                    <Switch
                      label={form.isActive ? 'فعال' : 'غیرفعال'}
                      checked={form.isActive}
                      onChange={(v) => setField('isActive', v)}
                    />
                  </div>
                </div>

                {form.customerType === 'NATURAL' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="پیشوند"
                      options={prefixOptions}
                      value={form.prefix}
                      onChange={(e) => setField('prefix', e.target.value)}
                    />
                    <Select
                      label="جنسیت"
                      options={genderOptions}
                      value={form.gender}
                      onChange={(e) => setField('gender', e.target.value)}
                    />
                    <Input
                      label="نام"
                      value={form.firstName}
                      onChange={(e) => setField('firstName', e.target.value)}
                    />
                    <Input
                      label="نام خانوادگی *"
                      value={form.lastName}
                      onChange={(e) => setField('lastName', e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="نام شرکت *"
                      value={form.companyName}
                      onChange={(e) => setField('companyName', e.target.value)}
                    />
                    <Input
                      label="نام برند"
                      value={form.brandName}
                      onChange={(e) => setField('brandName', e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Contact */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">شماره‌های تماس</h3>
                  <PhoneFieldArray
                    phones={form.phones}
                    onChange={(phones) => setField('phones', phones)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="ایمیل"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                  />
                  <Input
                    label="وب‌سایت"
                    value={form.website}
                    onChange={(e) => setField('website', e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">شبکه‌های اجتماعی</h3>
                  <SocialMediaFieldArray
                    socialMedia={form.socialMedia}
                    onChange={(sm) => setField('socialMedia', sm)}
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Address */}
            {activeTab === 'address' && (
              <div>
                <AddressFieldArray
                  addresses={form.addresses}
                  onChange={(addresses) => setField('addresses', addresses)}
                />
              </div>
            )}

            {/* Tab 4: Marketing */}
            {activeTab === 'marketing' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="نوع ارتباط"
                  options={relationshipTypeOptions}
                  value={form.relationshipType}
                  onChange={(e) => setField('relationshipType', e.target.value as RelationshipType)}
                />
                <Select
                  label="روش آشنایی"
                  options={acquisitionChannelOptions}
                  value={form.acquisitionChannel}
                  onChange={(e) => setField('acquisitionChannel', e.target.value)}
                />
                <Input
                  label="معرف (کد یا شناسه مشتری)"
                  value={form.referredByCustomerId}
                  onChange={(e) => setField('referredByCustomerId', e.target.value)}
                  placeholder="اختیاری"
                />
                <Select
                  label="وضعیت در قیف فروش"
                  options={statusOptions}
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value as CustomerStatus)}
                />
                <Select
                  label="سطح وفاداری"
                  options={levelOptions}
                  value={form.customerLevelId}
                  onChange={(e) => setField('customerLevelId', e.target.value)}
                />
              </div>
            )}

            {/* Tab 5: Psychology */}
            {activeTab === 'psychology' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PersianDatePicker
                    label="تاریخ تولد"
                    value={form.birthDate}
                    onChange={(v) => setField('birthDate', v)}
                  />
                  <PersianDatePicker
                    label="سالگرد ازدواج"
                    value={form.weddingAnniversary}
                    onChange={(v) => setField('weddingAnniversary', v)}
                  />
                </div>
                <Textarea
                  label="علاقه‌مندی‌ها"
                  value={form.interests}
                  onChange={(e) => setField('interests', e.target.value)}
                  placeholder="مثلاً: طبیعت‌گردی، تکنولوژی، ..."
                />
                <Textarea
                  label="روانشناسی فرد"
                  value={form.psychology}
                  onChange={(e) => setField('psychology', e.target.value)}
                  placeholder="مثلاً: حساس به قیمت، جزئی‌نگر، ..."
                />
                <Textarea
                  label="تکیه‌کلام‌ها"
                  value={form.catchphrases}
                  onChange={(e) => setField('catchphrases', e.target.value)}
                />
                <Textarea
                  label="نکات قابل توجه"
                  value={form.notablePoints}
                  onChange={(e) => setField('notablePoints', e.target.value)}
                  placeholder="مثلاً: عاشق شکلات تلخ است"
                />
              </div>
            )}

            {/* Tab 6: Documents */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <Textarea
                  label="توضیحات کلی"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-slate-400">
                  آپلود تصویر پروفایل و فایل‌های پیوست پس از ذخیره‌سازی مشتری از صفحه جزئیات امکان‌پذیر است.
                </p>
              </div>
            )}
          </Tabs>

          {/* Error & Actions */}
          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="button" disabled={saving} onClick={handleSubmit}>
              {saving ? 'در حال ذخیره...' : isEdit ? 'بروزرسانی' : 'ثبت مشتری'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
