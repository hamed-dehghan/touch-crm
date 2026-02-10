'use client';

import type { CustomerPhone, PhoneType } from '@/types/api';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

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
        <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Input
              placeholder="شماره تلفن"
              value={phone.phoneNumber}
              onChange={(e) => updatePhone(index, 'phoneNumber', e.target.value)}
              className="sm:col-span-2"
            />
            <Select
              options={phoneTypeOptions}
              value={phone.phoneType}
              onChange={(e) => updatePhone(index, 'phoneType', e.target.value as PhoneType)}
            />
            {phone.phoneType === 'LANDLINE' && (
              <Input
                placeholder="داخلی"
                value={phone.extension || ''}
                onChange={(e) => updatePhone(index, 'extension', e.target.value)}
              />
            )}
          </div>
          <div className="flex items-center gap-1 pt-1">
            <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer" title="پیش‌فرض">
              <input
                type="radio"
                name="defaultPhone"
                checked={phone.isDefault}
                onChange={() => setDefault(index)}
                className="accent-[var(--color-accent)]"
              />
              پیش‌فرض
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={() => removePhone(index)} className="text-red-500 hover:text-red-700">
              &times;
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addPhone}>
        + افزودن شماره
      </Button>
    </div>
  );
}
