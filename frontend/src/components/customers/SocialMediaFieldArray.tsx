'use client';

import type { CustomerSocialMedia, SocialMediaPlatform } from '@/types/api';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface SocialMediaFieldArrayProps {
  socialMedia: CustomerSocialMedia[];
  onChange: (socialMedia: CustomerSocialMedia[]) => void;
}

const platformOptions = [
  { value: 'INSTAGRAM', label: 'اینستاگرام' },
  { value: 'TELEGRAM', label: 'تلگرام' },
  { value: 'WHATSAPP', label: 'واتساپ' },
  { value: 'LINKEDIN', label: 'لینکدین' },
  { value: 'TWITTER', label: 'توییتر' },
  { value: 'OTHER', label: 'سایر' },
];

const emptySocialMedia: CustomerSocialMedia = {
  platform: 'INSTAGRAM',
  profileUrl: '',
};

export function SocialMediaFieldArray({ socialMedia, onChange }: SocialMediaFieldArrayProps) {
  const addSocialMedia = () => {
    onChange([...socialMedia, { ...emptySocialMedia }]);
  };

  const removeSocialMedia = (index: number) => {
    onChange(socialMedia.filter((_, i) => i !== index));
  };

  const updateSocialMedia = (index: number, field: keyof CustomerSocialMedia, value: any) => {
    const updated = socialMedia.map((s, i) => {
      if (i !== index) return s;
      return { ...s, [field]: value };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {socialMedia.map((sm, index) => (
        <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select
              options={platformOptions}
              value={sm.platform}
              onChange={(e) => updateSocialMedia(index, 'platform', e.target.value as SocialMediaPlatform)}
            />
            <Input
              placeholder="لینک پروفایل"
              value={sm.profileUrl}
              onChange={(e) => updateSocialMedia(index, 'profileUrl', e.target.value)}
              className="sm:col-span-2"
            />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => removeSocialMedia(index)} className="text-red-500 hover:text-red-700 mt-1">
            &times;
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addSocialMedia}>
        + افزودن شبکه اجتماعی
      </Button>
    </div>
  );
}
