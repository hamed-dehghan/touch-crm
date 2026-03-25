'use client';

import type { CustomerSocialMedia, SocialMediaPlatform } from '@/types/api';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TrashIcon } from '@/components/ui/icons';

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

const socialMediaUrlPlaceholders: Record<SocialMediaPlatform, string> = {
  INSTAGRAM: 'https://instagram.com/username',
  TELEGRAM: 'https://t.me/username',
  WHATSAPP: 'https://wa.me/989121234567',
  LINKEDIN: 'https://linkedin.com/in/username',
  TWITTER: 'https://x.com/username',
  OTHER: 'https://example.com/profile',
};

const socialMediaUrlPrefixes: Partial<Record<SocialMediaPlatform, string>> = {
  INSTAGRAM: 'https://instagram.com/',
  TELEGRAM: 'https://t.me/',
  WHATSAPP: 'https://wa.me/',
  LINKEDIN: 'https://linkedin.com/in/',
  TWITTER: 'https://x.com/',
};

const emptySocialMedia: CustomerSocialMedia = {
  platform: 'INSTAGRAM',
  profileUrl: '',
};

function extractProfileIdentifier(platform: SocialMediaPlatform, profileUrl: string): string {
  const value = profileUrl.trim();
  if (!value) return '';

  switch (platform) {
    case 'INSTAGRAM':
      return value.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').split(/[/?#]/)[0] ?? '';
    case 'TELEGRAM':
      return value.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').split(/[/?#]/)[0] ?? '';
    case 'WHATSAPP': {
      const waMatch = value.match(/^https?:\/\/wa\.me\/([0-9+]+)/i);
      if (waMatch?.[1]) return waMatch[1];
      const sendMatch = value.match(/[?&]phone=([0-9+]+)/i);
      if (sendMatch?.[1]) return sendMatch[1];
      return value.replace(/\D/g, '');
    }
    case 'LINKEDIN':
      return value.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '').split(/[/?#]/)[0] ?? '';
    case 'TWITTER':
      return value.replace(/^https?:\/\/(x\.com|twitter\.com)\//i, '').split(/[/?#]/)[0] ?? '';
    default:
      return value;
  }
}

function buildProfileUrl(platform: SocialMediaPlatform, identifier: string): string {
  const raw = identifier.trim().replace(/^@+/, '');
  if (!raw) return '';

  switch (platform) {
    case 'WHATSAPP':
      return `${socialMediaUrlPrefixes.WHATSAPP}${raw.replace(/\D/g, '')}`;
    case 'INSTAGRAM':
    case 'TELEGRAM':
    case 'LINKEDIN':
    case 'TWITTER':
      return `${socialMediaUrlPrefixes[platform]}${raw}`;
    default:
      return raw;
  }
}

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
            <div className="sm:col-span-2 flex items-center gap-2" dir="ltr">
              {socialMediaUrlPrefixes[sm.platform] && (
                <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                  {socialMediaUrlPrefixes[sm.platform]}
                </span>
              )}
              <Input
                type="text"
                name="username"
                dir="ltr"
                placeholder={
                  sm.platform === 'WHATSAPP'
                    ? '989121234567'
                    : socialMediaUrlPrefixes[sm.platform]
                      ? 'username'
                      : socialMediaUrlPlaceholders.OTHER
                }
                value={extractProfileIdentifier(sm.platform, sm.profileUrl)}
                onChange={(e) =>
                  updateSocialMedia(index, 'profileUrl', buildProfileUrl(sm.platform, e.target.value))
                }
                className="sm:col-span-2"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeSocialMedia(index)}
            aria-label="حذف شبکه اجتماعی"
            title="حذف شبکه اجتماعی"
            className="h-10 w-10 p-0 text-red-500 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addSocialMedia}>
        + افزودن شبکه اجتماعی
      </Button>
    </div>
  );
}
