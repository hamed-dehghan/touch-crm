// backend/src/utils/errorMessages.ts
const EXACT_MESSAGE_MAP: Record<string, string> = {
  Unauthorized: 'دسترسی شما احراز نشد. لطفا دوباره وارد شوید.',
  Forbidden: 'شما مجوز انجام این عملیات را ندارید.',
  'Internal server error': 'خطای داخلی سرور رخ داد. لطفا دوباره تلاش کنید.',
  'Validation failed': 'اطلاعات ارسالی معتبر نیست.',
  'Email already exists': 'این ایمیل قبلا ثبت شده است.',
  'ids must be a non-empty array': 'لیست شناسه ها باید به صورت آرایه و غیرخالی ارسال شود.',
  'ids must contain valid unique positive integers': 'شناسه ها باید عدد صحیح مثبت و یکتا باشند.',
  'One or more customers were not found': 'یک یا چند مشتری پیدا نشدند.',
  'Customer not found': 'مشتری مورد نظر پیدا نشد.',
  'Product not found': 'محصول مورد نظر پیدا نشد.',
  'Role not found': 'نقش مورد نظر پیدا نشد.',
  'User not found': 'کاربر مورد نظر پیدا نشد.',
  'Task not found': 'وظیفه مورد نظر پیدا نشد.',
  'Project not found': 'پروژه مورد نظر پیدا نشد.',
  'Promotion not found': 'تخفیف مورد نظر پیدا نشد.',
};

const STATUS_DEFAULT_MAP: Record<number, string> = {
  400: 'درخواست نامعتبر است. لطفا اطلاعات را بررسی کنید.',
  401: 'دسترسی شما احراز نشد. لطفا دوباره وارد شوید.',
  403: 'شما مجوز انجام این عملیات را ندارید.',
  404: 'اطلاعات مورد نظر پیدا نشد.',
  409: 'این عملیات با داده های موجود تداخل دارد.',
  422: 'داده های ارسالی معتبر نیست.',
  500: 'خطای داخلی سرور رخ داد. لطفا دوباره تلاش کنید.',
};

export const toPersianErrorMessage = (message: string | undefined, statusCode: number): string => {
  const normalized = (message || '').trim();
  if (!normalized) {
    return STATUS_DEFAULT_MAP[statusCode] || STATUS_DEFAULT_MAP[500];
  }

  if (EXACT_MESSAGE_MAP[normalized]) {
    return EXACT_MESSAGE_MAP[normalized];
  }

  if (/not found$/i.test(normalized)) {
    return 'مورد درخواستی پیدا نشد.';
  }

  if (/already exists/i.test(normalized)) {
    return 'این مقدار قبلا ثبت شده است.';
  }

  return normalized;
};
