'use client';

import type { CustomerPhone, PhoneType } from '@/types/api';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TrashIcon } from '@/components/ui/icons';

interface PhoneFieldArrayProps {
  phones: CustomerPhone[];
  onChange: (phones: CustomerPhone[]) => void;
}

const phoneTypeOptions = [
  { value: 'MOBILE', label: 'موبایل' },
  { value: 'LANDLINE', label: 'ثابت' },
];

const emptyPhone: CustomerPhone = {
  phoneNumber: '',
  phoneType: 'MOBILE',
  label: '',
  extension: '',
  isDefault: false,
};

export function PhoneFieldArray({ phones, onChange }: PhoneFieldArrayProps) {
  const addPhone = () => {
    const isFirst = phones.length === 0;
    onChange([...phones, { ...emptyPhone, isDefault: isFirst }]);
  };

  const removePhone = (index: number) => {
    const updated = phones.filter((_, i) => i !== index);
    // If we removed the default, make the first one default
    if (updated.length > 0 && !updated.some((p) => p.isDefault)) {
      updated[0].isDefault = true;
    }
    onChange(updated);
  };

  const updatePhone = (index: number, field: keyof CustomerPhone, value: any) => {
    const updated = phones.map((p, i) => {
      if (i !== index) return p;
      return { ...p, [field]: value };
    });
    onChange(updated);
  };

  const setDefault = (index: number) => {
    const updated = phones.map((p, i) => ({
      ...p,
      isDefault: i === index,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {phones.map((phone, index) => (
        <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
          <Input
            placeholder="عنوان (اختیاری)"
            value={phone.label || ''}
            onChange={(e) => updatePhone(index, 'label', e.target.value)}
            className="w-40 shrink-0"
          />
          <Select
            options={phoneTypeOptions}
            value={phone.phoneType}
            onChange={(e) => updatePhone(index, 'phoneType', e.target.value as PhoneType)}
            className="w-28 shrink-0"
          />
          <Input
            placeholder="شماره تلفن"
            value={phone.phoneNumber}
            onChange={(e) => updatePhone(index, 'phoneNumber', e.target.value)}
            className="flex-1 min-w-[220px]"
          />
          {phone.phoneType === 'LANDLINE' && (
            <Input
              placeholder="داخلی"
              value={phone.extension || ''}
              onChange={(e) => updatePhone(index, 'extension', e.target.value)}
              className="w-24 shrink-0"
            />
          )}
          <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer shrink-0 px-1" title="پیش‌فرض">
            <input
              type="radio"
              name="defaultPhone"
              checked={phone.isDefault}
              onChange={() => setDefault(index)}
              className="accent-[var(--color-accent)]"
            />
            پیش‌فرض
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removePhone(index)}
            aria-label="حذف شماره"
            title="حذف شماره"
            className="h-10 w-10 p-0 text-red-500 hover:text-red-700 shrink-0"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addPhone}>
        + افزودن شماره
      </Button>
    </div>
  );
}
