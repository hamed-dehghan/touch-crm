'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CustomerAddress } from '@/types/api';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { AutocompleteSelect } from '@/components/ui/AutocompleteSelect';
import { Button } from '@/components/ui/Button';
import { TrashIcon } from '@/components/ui/icons';

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
  const [locationTree, setLocationTree] = useState<Array<{ province: string; cities: string[] }>>([]);

  useEffect(() => {
    api.locations.getIranTree().then((res) => {
      if (res.success && res.data) {
        setLocationTree(res.data.locations);
      }
    });
  }, []);

  const cityTreeOptions = useMemo(
    () =>
      locationTree.flatMap((p) => [
        {
          value: `__province__${p.province}`,
          label: p.province,
          keywords: p.province,
          disabled: true,
          level: 0,
          isGroupHeader: true,
        },
        ...p.cities.map((city) => ({
          value: `${p.province}::${city}`,
          label: city,
          keywords: `${p.province} ${city}`,
          level: 1,
        })),
      ]),
    [locationTree]
  );

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

  const updateCityTreeValue = (index: number, value: string) => {
    const [province = '', city = ''] = value.split('::');
    const updated = addresses.map((a, i) => {
      if (i !== index) return a;
      return { ...a, province, city };
    });
    onChange(updated);
  };

  const cityTreeValue = (addr: CustomerAddress): string => {
    if (!addr.province || !addr.city) return '';
    return `${addr.province}::${addr.city}`;
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAddress(index)}
                aria-label="حذف آدرس"
                title="حذف آدرس"
                className="h-10 w-10 p-0 text-red-500 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cityTreeOptions.length > 0 ? (
              <AutocompleteSelect
                label="استان / شهر"
                searchPlaceholder="جستجوی استان یا شهر..."
                value={cityTreeValue(addr)}
                onChange={(next) => updateCityTreeValue(index, next)}
                options={cityTreeOptions}
              />
            ) : (
              <Input
                label="شهر"
                value={addr.city || ''}
                onChange={(e) => updateAddress(index, 'city', e.target.value)}
              />
            )}
            <Input
              label="کد پستی"
              value={addr.postalCode || ''}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) => {
                // Keep digits only so backend validation doesn't fail unexpectedly.
                const digits = String(e.target.value).replace(/\D/g, '').slice(0, 10);
                updateAddress(index, 'postalCode', digits);
              }}
            />
          </div>
          <Input
            label="آدرس دقیق"
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
