import type { Metadata } from 'next';
import './globals.css';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const metadata: Metadata = {
  title: 'باشگاه مشتریان',
  description: 'پنل مدیریت وفاداری مشتریان',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased bg-content-bg font-sans">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
