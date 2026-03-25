# باشگاه مشتریان — فرانت‌اند

پنل مدیریت وفاداری مشتریان با Next.js، Tailwind و اتصال مستقیم به API بک‌اند.

## نصب و اجرا

```bash
cd frontend
bun install
bun run dev
```

مرورگر: [http://localhost:3000](http://localhost:3000)

## ورود

- **نام کاربری:** `admin`
- **رمز عبور:** `Admin123!`

## ساختار API

- **`src/types/api.ts`** — تایپ‌های مطابق قرارداد API و اسکیمای دیتابیس.
- **`src/lib/api/client.ts`** — قرارداد کلاینت API (اینترفیس‌ها).
- **`src/lib/api/real.ts`** — پیاده‌سازی Axios برای ارتباط با بک‌اند.
- **`src/lib/api/index.ts`** — نقطه ورود API و export کلاینت فعال.

## صفحات و مسیرها

- `/login` — ورود
- `/` — داشبورد (نمودارها با Recharts)
- `/customers` — لیست مشتریان، جستجو، صفحه‌بندی
- `/customers/new` — ثبت مشتری (حداقل: نام، تلفن، تاریخ تولد)
- `/customers/[id]` — جزئیات مشتری، RFM، تراکنش‌ها
- `/customers/[id]/edit` — ویرایش مشتری
- `/orders` — لیست سفارشات
- `/orders/new` — ثبت سفارش (انتخاب مشتری، آیتم‌ها، تخفیف/مالیات)
- `/orders/[id]` — جزئیات سفارش
- `/products` — لیست محصولات
- `/promotions` — لیست تخفیف‌ها
- `/campaigns` — لیست کمپین‌ها، مشاهده و اجرا
- `/campaigns/[id]` — جزئیات و دکمه اجرای کمپین
- `/transactions` — لیست تراکنش‌ها
- `/settings/levels` — سطوح وفاداری (RFM)

## ابزارها

- **Next.js 16** (App Router)
- **Tailwind CSS**
- **Zustand** — وضعیت احراز هویت (با persist)
- **Recharts** — نمودار در داشبورد
- **react-multi-date-picker** و **react-date-object** — برای تقویم شمسی (فعلاً از input تاریخ استفاده شده؛ می‌توان با کامپوننت تقویم فارسی جایگزین کرد)

## پیکربندی API

برای تعیین آدرس بک‌اند، مقدار `NEXT_PUBLIC_API_URL` را تنظیم کنید.
