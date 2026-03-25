// frontend/src/lib/api/messages.ts
import type { ApiResponse } from '@/types/api';

type ApiError = NonNullable<ApiResponse<unknown>['error']>;

const STATUS_FALLBACK_FA: Record<number, string> = {
  400: 'درخواست نامعتبر است. لطفا اطلاعات را بررسی کنید.',
  401: 'نشست شما منقضی شده است. لطفا دوباره وارد شوید.',
  403: 'شما مجوز انجام این عملیات را ندارید.',
  404: 'مورد درخواستی پیدا نشد.',
  409: 'این عملیات با داده های موجود تداخل دارد.',
  422: 'داده های واردشده معتبر نیست.',
  500: 'خطای داخلی سرور رخ داد. لطفا دوباره تلاش کنید.',
};

const extractDetailLines = (details: ApiError['details']): string[] => {
  if (!details) return [];

  if (Array.isArray(details)) {
    return details
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'message' in item && typeof item.message === 'string') {
          const field = typeof item.field === 'string' && item.field.trim() ? `(${item.field}) ` : '';
          return `${field}${item.message}`;
        }
        return '';
      })
      .filter(Boolean);
  }

  if (typeof details === 'object') {
    return Object.entries(details).map(([key, value]) => `${key}: ${String(value)}`);
  }

  return [];
};

export const getApiErrorMessage = (error: ApiError | undefined, fallback = 'عملیات انجام نشد.'): string => {
  if (!error) return fallback;

  const base = (error.message || '').trim() || STATUS_FALLBACK_FA[error.statusCode] || fallback;
  const detailLines = extractDetailLines(error.details);

  if (detailLines.length === 0) {
    return base;
  }

  return `${base}\n- ${detailLines.join('\n- ')}`;
};
