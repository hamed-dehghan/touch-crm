'use client';

import type { CustomerAddress } from '@/types/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface AddressFieldArrayProps {
  addresses: CustomerAddress[];
  onChange: (addresses: CustomerAddress[]) => void;
}

const emptyAddress: CustomerAddress = {
  province: '',
  city: '',
  address: '',
  postalCode: '',
  isDefault: false,
};

export function AddressFieldArray({ addresses, onChange }: AddressFieldArrayProps) {
  const addAddress = () => {
    const isFirst = addresses.length === 0;
    onChange([...addresses, { ...emptyAddress, isDefault: isFirst }]);
  };

  const removeAddress = (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    onChange(updated);
  };

  const updateAddress = (index: number, field: keyof CustomerAddress, value: any) => {
    const updated = addresses.map((a, i) => {
      if (i !== index) return a;
      return { ...a, [field]: value };
    });
    onChange(updated);
  };

  const setDefault = (index: number) => {
    const updated = addresses.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {addresses.map((addr, index) => (
        <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">آدرس {index + 1}</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                <input
                  type="radio"
                  name="defaultAddress"
                  checked={addr.isDefault}
                  onChange={() => setDefault(index)}
                  className="accent-[var(--color-accent)]"
                />
                پیش‌فرض
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeAddress(index)} className="text-red-500 hover:text-red-700">
                &times;
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              placeholder="استان"
              value={addr.province || ''}
              onChange={(e) => updateAddress(index, 'province', e.target.value)}
            />
            <Input
              placeholder="شهر"
              value={addr.city || ''}
              onChange={(e) => updateAddress(index, 'city', e.target.value)}
            />
            <Input
              placeholder="کد پستی"
              value={addr.postalCode || ''}
              onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
            />
          </div>
          <Input
            placeholder="آدرس دقیق"
            value={addr.address || ''}
            onChange={(e) => updateAddress(index, 'address', e.target.value)}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addAddress}>
        + افزودن آدرس
      </Button>
    </div>
  );
}
