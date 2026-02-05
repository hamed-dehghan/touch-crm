# باشگاه مشتریان — فرانت‌اند

پنل مدیریت وفاداری مشتریان با Next.js، Tailwind و داده‌های Mock.

## نصب و اجرا

```bash
cd frontend
bun install
bun run dev
```

مرورگر: [http://localhost:3000](http://localhost:3000)

## ورود (Mock)

- **نام کاربری:** `admin`
- **رمز عبور:** `Admin123!`

## ساختار و سوئیچ به API واقعی

- **`src/types/api.ts`** — تایپ‌های مطابق قرارداد API و اسکیمای دیتابیس.
- **`src/lib/api/client.ts`** — قرارداد کلاینت API (اینترفیس‌ها).
- **`src/lib/api/mock.ts`** — پیاده‌سازی Mock با داده درون‌حافظه.
- **`src/lib/api/index.ts`** — نقطه ورود؛ در حال حاضر `api` از Mock استفاده می‌کند.

برای اتصال به بک‌اند واقعی:

1. یک فایل مثلاً `src/lib/api/real.ts` بسازید و همان اینترفیس `ApiClient` را با `fetch` یا Axios پر کنید.
2. در `src/lib/api/index.ts` به‌جای `mockApiClient` از `realApiClient` استفاده کنید.
3. در `real.ts` توکن را از استور احراز هویت (مثلاً Zustand) بخوانید و در هدر درخواست‌ها بفرستید.

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

## داده Mock

داده‌های اولیه در `src/data/mockDb.ts` تعریف شده و با اسکیمای مایگریشن‌های PostgreSQL هم‌خوان است. با هر درخواست ایجاد (مشتری، سفارش، …) آرایه‌های Mock به‌روز می‌شوند.
