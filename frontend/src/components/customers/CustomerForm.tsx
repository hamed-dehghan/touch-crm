// frontend/src/components/customers/CustomerForm.tsx
'use client';

import { useState, useEffect, type ReactNode } from 'react';
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
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RadioToggleGroup } from '@/components/ui/RadioToggleGroup';
import { AutocompleteSelect } from '@/components/ui/AutocompleteSelect';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { PersianDatePicker } from '@/components/ui/DatePicker';
import { PhoneFieldArray } from './PhoneFieldArray';
import { AddressFieldArray } from './AddressFieldArray';
import { SocialMediaFieldArray } from './SocialMediaFieldArray';
import { FormMessageBox, type FormMessageVariant } from '@/components/ui/FormMessageBox';
import { formActionsClass, formFieldStackClass, formGroupedFieldGridOuter } from '@/lib/formLayout';
import { fieldErrorsFromApiDetails, type FieldErrorMap } from '@/lib/validation';

export interface CustomerFormProps {
  /** If provided, the form loads and updates that customer */
  customerId?: number;
  onCancel: () => void;
  /** After create, passes new id so the parent can redirect */
  onSaved: (payload?: { customerId: number }) => void;
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

interface FieldGroupProps {
  label: string;
  children: ReactNode;
  multiline?: boolean;
  /** When set, FieldGroup applies danger/error border styling to both sides. */
  error?: string;
  warning?: string;
}

function FieldGroup({ label, children, multiline = false, error, warning }: FieldGroupProps) {
  const hasError = Boolean(error);
  const hasWarning = !hasError && Boolean(warning);
  // Use items-start (not center): left column can grow with validation messages below the control;
  // items-center would vertically center the label beside that text block.
  return (
    <div
      dir="ltr"
      className={`${formGroupedFieldGridOuter} ${
        multiline ? 'items-stretch' : 'items-start'
      }`}
    >
      <div
        dir="rtl"
        className={
          'col-start-1 ' +
          '[&_input:not([data-dropdown-search])]:!border-t [&_input:not([data-dropdown-search])]:!border-l [&_input:not([data-dropdown-search])]:!border-b ' +
          '[&_input:not([data-dropdown-search])]:!border-r-0 [&_input:not([data-dropdown-search])]:!border-[var(--color-border)] ' +
          '[&_input:not([data-dropdown-search])]:!rounded-l-lg [&_input:not([data-dropdown-search])]:!rounded-r-none ' +
          '[&_input:not([data-dropdown-search])]:!bg-white [&_input:not([data-dropdown-search])]:!shadow-none ' +
          '[&_input:not([data-dropdown-search])]:focus:!border-accent [&_input:not([data-dropdown-search])]:focus:!outline-none ' +
          '[&_input:not([data-dropdown-search])]:focus:!ring-1 [&_input:not([data-dropdown-search])]:focus:!ring-accent ' +
          '[&_select]:!border-t [&_select]:!border-l [&_select]:!border-b [&_select]:!border-r-0 [&_select]:!border-[var(--color-border)] ' +
          '[&_select]:!rounded-l-lg [&_select]:!rounded-r-none [&_select]:!bg-white [&_select]:!shadow-none ' +
          '[&_select]:focus:!border-accent [&_select]:focus:!outline-none [&_select]:focus:!ring-1 [&_select]:focus:!ring-accent ' +
          '[&_textarea]:!border-t [&_textarea]:!border-l [&_textarea]:!border-b [&_textarea]:!border-r-0 [&_textarea]:!border-[var(--color-border)] ' +
          '[&_textarea]:!rounded-l-lg [&_textarea]:!rounded-r-none [&_textarea]:!bg-white [&_textarea]:!shadow-none ' +
          '[&_textarea]:focus:!border-accent [&_textarea]:focus:!outline-none [&_textarea]:focus:!ring-1 [&_textarea]:focus:!ring-accent ' +
          '[&>div>button]:!border-t [&>div>button]:!border-l [&>div>button]:!border-b [&>div>button]:!border-r-0 [&>div>button]:!border-[var(--color-border)] ' +
          '[&>div>button]:!rounded-l-lg [&>div>button]:!rounded-r-none [&>div>button]:!bg-white [&>div>button]:!text-right ' +
          '[&>div>button]:focus:!border-accent [&>div>button]:focus:!outline-none [&>div>button]:focus:!ring-1 [&>div>button]:focus:!ring-accent ' +
          // When the parent has an error (or the child control is aria-invalid), override the FieldGroup forced border color.
          (hasError
            ? '[&_input:not([data-dropdown-search])]:!border-red-500 [&_select]:!border-red-500 [&_textarea]:!border-red-500 [&>div>button]:!border-red-500 '
            : hasWarning
              ? '[&_input:not([data-dropdown-search])]:!border-amber-500 [&_select]:!border-amber-500 [&_textarea]:!border-amber-500 [&>div>button]:!border-amber-500 '
              : '') +
          '[&_input:not([data-dropdown-search])][aria-invalid=true]:!border-red-500 ' +
          '[&_select][aria-invalid=true]:!border-red-500 ' +
          '[&_textarea][aria-invalid=true]:!border-red-500 ' +
          '[&>div>button][aria-invalid=true]:!border-red-500'
        }
      >
        {children}
      </div>
      <div
        dir="rtl"
        className={`col-start-2 ${multiline ? 'self-stretch' : 'self-start'} border-t border-r border-b rounded-r-lg bg-[#f8f8f8] px-3 text-sm font-medium text-right ${
          hasError
            ? 'border-red-500 text-red-700'
            : hasWarning
              ? 'border-amber-500 text-amber-800'
              : 'border-[var(--color-border)] text-foreground/80'
        } ${
          multiline ? 'py-2 flex items-start justify-end h-full' : 'h-10 flex items-center justify-end'
        }`}
      >
        {label}
      </div>
    </div>
  );
}

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

type FormBanner = { variant: FormMessageVariant; message: string };

export function CustomerForm({ customerId, onCancel, onSaved }: CustomerFormProps) {
  const [activeTab, setActiveTab] = useState('identity');
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [levels, setLevels] = useState<CustomerLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<FormBanner | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});

  const isEdit = !!customerId;

  useEffect(() => {
    api.customerLevels.list().then((res) => {
      if (res.success && res.data) {
        setLevels(res.data.customerLevels);
      }
    });
  }, []);

  useEffect(() => {
    if (customerId) {
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
    } else {
      setForm({ ...defaultForm });
      setActiveTab('identity');
      setLoading(false);
    }
  }, [customerId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const k = String(key);
    setFieldErrors((prev) => {
      if (!(k in prev)) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setBanner(null);
    setFieldErrors({});

    // Basic validation
    if (form.customerType === 'NATURAL' && !form.lastName.trim()) {
      setFieldErrors({ lastName: 'نام خانوادگی الزامی است.' });
      setBanner({ variant: 'error', message: 'لطفا موارد الزامی را تکمیل کنید.' });
      setActiveTab('identity');
      return;
    }
    if (form.customerType === 'LEGAL' && !form.companyName.trim()) {
      setFieldErrors({ companyName: 'نام شرکت الزامی است.' });
      setBanner({ variant: 'error', message: 'لطفا موارد الزامی را تکمیل کنید.' });
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
      setFieldErrors(fieldErrorsFromApiDetails(res.error?.details));
      setBanner({
        variant: 'error',
        message: res.error?.message ?? 'خطا در ذخیره‌سازی',
      });
      return;
    }

    if (isEdit) {
      onSaved();
    } else if (res.data?.customer?.id != null) {
      onSaved({ customerId: res.data.customer.id });
    } else {
      onSaved();
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {loading ? (
        <p className="text-slate-500 py-8 text-center">در حال بارگذاری...</p>
      ) : (
        <div>
          {banner ? (
            <div className="mb-4">
              <FormMessageBox
                variant={banner.variant}
                message={banner.message}
                onDismiss={() => setBanner(null)}
              />
            </div>
          ) : null}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            {/* Tab 1: Identity */}
            {activeTab === 'identity' && (
              <div className={formFieldStackClass}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RadioToggleGroup
                    options={customerTypeOptions}
                    value={form.customerType}
                    onChange={(next) => setField('customerType', next as CustomerType)}
                  />
                  <div dir="rtl" className="h-10 w-full flex items-center justify-start">
                    <Switch
                      label={form.isActive ? 'فعال' : 'غیرفعال'}
                      checked={form.isActive}
                      onChange={(v) => setField('isActive', v)}
                    />
                  </div>
                </div>

                {form.customerType === 'NATURAL' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="پیشوند">
                      <Select
                        options={prefixOptions}
                        value={form.prefix}
                        onChange={(e) => setField('prefix', e.target.value)}
                      />
                    </FieldGroup>
                    <FieldGroup label="جنسیت">
                      <Select
                        options={genderOptions}
                        value={form.gender}
                        onChange={(e) => setField('gender', e.target.value)}
                      />
                    </FieldGroup>
                    <FieldGroup label="نام">
                      <Input
                        value={form.firstName}
                        onChange={(e) => setField('firstName', e.target.value)}
                      />
                    </FieldGroup>
                    <FieldGroup label="نام خانوادگی *" error={fieldErrors.lastName}>
                      <Input
                        value={form.lastName}
                        onChange={(e) => setField('lastName', e.target.value)}
                        error={fieldErrors.lastName}
                      />
                    </FieldGroup>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="نام شرکت *" error={fieldErrors.companyName}>
                      <Input
                        value={form.companyName}
                        onChange={(e) => setField('companyName', e.target.value)}
                        error={fieldErrors.companyName}
                      />
                    </FieldGroup>
                    <FieldGroup label="نام برند">
                      <Input
                        value={form.brandName}
                        onChange={(e) => setField('brandName', e.target.value)}
                      />
                    </FieldGroup>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Contact */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldGroup label="ایمیل" error={fieldErrors.email}>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      error={fieldErrors.email}
                    />
                  </FieldGroup>
                  <FieldGroup label="وب‌سایت">
                    <Input
                      value={form.website}
                      onChange={(e) => setField('website', e.target.value)}
                      placeholder="https://"
                    />
                  </FieldGroup>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">شماره‌های تماس</h3>
                  <PhoneFieldArray
                    phones={form.phones}
                    onChange={(phones) => setField('phones', phones)}
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
                <FieldGroup label="نوع ارتباط">
                  <Select
                    options={relationshipTypeOptions}
                    value={form.relationshipType}
                    onChange={(e) => setField('relationshipType', e.target.value as RelationshipType)}
                  />
                </FieldGroup>
                <FieldGroup label="روش آشنایی">
                  <Select
                    options={acquisitionChannelOptions}
                    value={form.acquisitionChannel}
                    onChange={(e) => setField('acquisitionChannel', e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="معرف (کد/شناسه)">
                  <Input
                    value={form.referredByCustomerId}
                    onChange={(e) => setField('referredByCustomerId', e.target.value)}
                    placeholder="اختیاری"
                  />
                </FieldGroup>
                <FieldGroup label="وضعیت قیف فروش">
                  <Select
                    options={statusOptions}
                    value={form.status}
                    onChange={(e) => setField('status', e.target.value as CustomerStatus)}
                  />
                </FieldGroup>
                <FieldGroup label="سطح وفاداری">
                  <AutocompleteSelect
                    value={form.customerLevelId}
                    onChange={(next) => setField('customerLevelId', next)}
                    grouped
                    options={levels.map((l) => ({
                      value: String(l.id),
                      label: l.levelName,
                      keywords: '',
                    }))}
                    emptyOptionLabel="بدون سطح"
                  />
                </FieldGroup>
              </div>
            )}

            {/* Tab 5: Psychology */}
            {activeTab === 'psychology' && (
              <div className={formFieldStackClass}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldGroup label="تاریخ تولد">
                    <PersianDatePicker
                      value={form.birthDate}
                      onChange={(v) => setField('birthDate', v)}
                    />
                  </FieldGroup>
                  <FieldGroup label="سالگرد ازدواج">
                    <PersianDatePicker
                      value={form.weddingAnniversary}
                      onChange={(v) => setField('weddingAnniversary', v)}
                    />
                  </FieldGroup>
                </div>
                <FieldGroup label="علاقه‌مندی‌ها" multiline>
                  <Textarea
                    value={form.interests}
                    onChange={(e) => setField('interests', e.target.value)}
                    placeholder="مثلاً: طبیعت‌گردی، تکنولوژی، ..."
                  />
                </FieldGroup>
                <FieldGroup label="روانشناسی فرد" multiline>
                  <Textarea
                    value={form.psychology}
                    onChange={(e) => setField('psychology', e.target.value)}
                    placeholder="مثلاً: حساس به قیمت، جزئی‌نگر، ..."
                  />
                </FieldGroup>
                <FieldGroup label="تکیه‌کلام‌ها" multiline>
                  <Textarea
                    value={form.catchphrases}
                    onChange={(e) => setField('catchphrases', e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="نکات قابل توجه" multiline>
                  <Textarea
                    value={form.notablePoints}
                    onChange={(e) => setField('notablePoints', e.target.value)}
                    placeholder="مثلاً: عاشق شکلات تلخ است"
                  />
                </FieldGroup>
              </div>
            )}

            {/* Tab 6: Documents */}
            {activeTab === 'documents' && (
              <div className={formFieldStackClass}>
                <FieldGroup label="توضیحات کلی" multiline>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
                    rows={4}
                  />
                </FieldGroup>
                <p className="text-xs text-slate-400">
                  آپلود تصویر پروفایل و فایل‌های پیوست پس از ذخیره‌سازی مشتری از صفحه جزئیات امکان‌پذیر است.
                </p>
              </div>
            )}
          </Tabs>

          {/* Actions */}
          <div className={`${formActionsClass} justify-end mt-6 pt-4 border-t border-[var(--color-border)]`}>
            <Button type="button" variant="outline" onClick={onCancel}>
              انصراف
            </Button>
            <Button type="button" disabled={saving} onClick={handleSubmit}>
              {saving ? 'در حال ذخیره...' : isEdit ? 'بروزرسانی' : 'ثبت مشتری'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
