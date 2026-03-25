// frontend/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { api } from '@/lib/api';
import { loadAllOrders, loadAllProjects, loadTransactionsForDashboard } from '@/lib/loadAllPaged';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Order, Task, TaskStatus } from '@/types/api';
import { formatGregorianToJalali } from '@/utils/date';
import { routes } from '@/lib/routes';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function formatFa(n: number): string {
  return n.toLocaleString('fa-IR');
}

const TASK_STATUS_FA: Record<TaskStatus, string> = {
  PENDING: 'در انتظار',
  IN_PROGRESS: 'در حال انجام',
  COMPLETED: 'انجام شده',
  CANCELLED: 'لغو شده',
};

function taskBadgeVariant(s: TaskStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (s) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'default';
  }
}

function buildMonthlyRevenue(orders: Order[]): { month: string; مبلغ: number }[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const byMonth = new Map<string, number>();
  keys.forEach((k) => byMonth.set(k, 0));
  orders.forEach((o) => {
    const key = o.orderDate.slice(0, 7);
    if (byMonth.has(key)) {
      byMonth.set(key, (byMonth.get(key) ?? 0) + o.finalAmount);
    }
  });
  return keys.map((month) => ({ month, مبلغ: byMonth.get(month) ?? 0 }));
}

function pickOpenTasks(tasks: Task[]): Task[] {
  const open = tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  return open
    .sort((a, b) => {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    })
    .slice(0, 6);
}

function taskStatusCounts(tasks: Task[]): { name: string; تعداد: number }[] {
  const m: Record<string, number> = {};
  tasks.forEach((t) => {
    const label = TASK_STATUS_FA[t.status] ?? t.status;
    m[label] = (m[label] ?? 0) + 1;
  });
  return Object.entries(m).map(([name, تعداد]) => ({ name, تعداد }));
}

const quickLinks: { href: string; label: string; hint: string }[] = [
  { href: routes.transactions, label: 'تراکنش‌ها', hint: 'پرداخت‌ها و دریافت‌ها' },
  { href: routes.campaigns, label: 'کمپین‌ها', hint: 'پیام‌رسانی' },
  { href: routes.tasks, label: 'وظایف', hint: 'تابلو کار' },
  { href: routes.projects, label: 'پروژه‌ها', hint: 'پیگیری پروژه' },
  { href: routes.worklogs, label: 'گزارش کار', hint: 'زمان‌ثبت' },
  { href: routes.products, label: 'محصولات', hint: 'کاتالوگ' },
  { href: routes.promotions, label: 'تخفیف‌ها', hint: 'پروموشن' },
];

function CartPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386a1.5 1.5 0 0 1 1.464 1.175l.51 2.04m0 0h13.14a1.5 1.5 0 0 1 1.455 1.868l-1.05 4.2a1.5 1.5 0 0 1-1.455 1.132H8.24a1.5 1.5 0 0 1-1.455-1.132L5.61 6.215ZM9 19.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm9 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 9v3m-1.5-1.5h3" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0-3-.478c-1.07 0-2.098.179-3 .478m6-10.878a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 8.25v4.5m2.25-2.25h-4.5M4.5 19.5a8.25 8.25 0 1 1 15 0" />
    </svg>
  );
}

function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25h6m-6 3h6m-6 3h3m-4.5 9h9a2.25 2.25 0 0 0 2.25-2.25V5.25A2.25 2.25 0 0 0 16.5 3h-1.064a2.25 2.25 0 0 1-1.591-.659l-.53-.53A2.25 2.25 0 0 0 11.724 1.5h-.448a2.25 2.25 0 0 0-1.591.659l-.53.53A2.25 2.25 0 0 1 7.564 3H6.5A2.25 2.25 0 0 0 4.25 5.25v12.75A2.25 2.25 0 0 0 6.5 20.25Z" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.5A2.25 2.25 0 0 1 4.5 5.25h13.11a2.25 2.25 0 0 1 2.186 1.72l.509 2.03M3 8.25h15A2.25 2.25 0 0 1 20.25 10.5v6A2.25 2.25 0 0 1 18 18.75H5.25A2.25 2.25 0 0 1 3 16.5v-8.25Zm12.75 5.25h.008v.008h-.008V13.5Z" />
    </svg>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [customersCount, setCustomersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [ordersRevenue, setOrdersRevenue] = useState(0);
  const [ordersByCustomer, setOrdersByCustomer] = useState<{ name: string; تعداد: number }[]>([]);
  const [levelDistribution, setLevelDistribution] = useState<{ name: string; value: number }[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; مبلغ: number }[]>([]);
  const [projectsActive, setProjectsActive] = useState(0);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [promotionsActive, setPromotionsActive] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [transactionSum, setTransactionSum] = useState(0);
  const [transactionSampleNote, setTransactionSampleNote] = useState(false);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [taskStatusChart, setTaskStatusChart] = useState<{ name: string; تعداد: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [
        custRes,
        prodRes,
        orders,
        projects,
        campRes,
        promRes,
        txAgg,
        tasksRes,
      ] = await Promise.all([
        api.customers.list({ limit: 1 }),
        api.products.list({ limit: 1 }),
        loadAllOrders(),
        loadAllProjects(),
        api.campaigns.list(),
        api.promotions.list(),
        loadTransactionsForDashboard(),
        api.tasks.getMyTasks(),
      ]);

      if (custRes.success && custRes.data) setCustomersCount(custRes.data.pagination.total);
      if (prodRes.success && prodRes.data) setProductsCount(prodRes.data.pagination.total);

      setOrdersCount(orders.length);
      setOrdersRevenue(orders.reduce((s, o) => s + o.finalAmount, 0));
      setMonthlyRevenue(buildMonthlyRevenue(orders));

      const byCustomer: Record<string, number> = {};
      orders.forEach((o) => {
        const name = o.customer?.lastName ?? `مشتری ${o.customerId}`;
        byCustomer[name] = (byCustomer[name] ?? 0) + 1;
      });
      setOrdersByCustomer(Object.entries(byCustomer).map(([name, تعداد]) => ({ name, تعداد })));

      const levels: Record<string, number> = {};
      orders.forEach((o) => {
        const level = o.customer?.customerLevel?.levelName ?? 'بدون سطح';
        levels[level] = (levels[level] ?? 0) + 1;
      });
      setLevelDistribution(Object.entries(levels).map(([name, value]) => ({ name, value })));

      setProjectsTotal(projects.length);
      setProjectsActive(projects.filter((p) => p.status === 'OPEN' || p.status === 'IN_PROGRESS').length);

      if (campRes.success && campRes.data) setCampaignsCount(campRes.data.campaigns.length);
      if (promRes.success && promRes.data) {
        setPromotionsActive(promRes.data.promotions.filter((p) => p.isActive).length);
      }

      const { transactions: txRows, totalCount } = txAgg;
      setTransactionCount(totalCount);
      setTransactionSum(txRows.reduce((s, t) => s + t.amount, 0));
      setTransactionSampleNote(totalCount > txRows.length);

      if (tasksRes.success && tasksRes.data) {
        const tasks = tasksRes.data.tasks;
        setOpenTasksCount(
          tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length,
        );
        setMyTasks(pickOpenTasks(tasks));
        setTaskStatusChart(taskStatusCounts(tasks));
      }

      const sortedOrders = [...orders].sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
      );
      setRecentOrders(sortedOrders.slice(0, 5));

      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">داشبورد</h1>
          <p className="text-sm text-foreground/70 mt-1">خلاصه وضعیت CRM و میانبرهای پرکاربرد</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="h-4 w-24 bg-foreground/10 rounded animate-pulse mb-3" />
                <div className="h-8 w-16 bg-foreground/10 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-foreground/70">مشتریان</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{formatFa(customersCount)}</p>
              <Link href={routes.customers} className="text-xs text-primary hover:underline mt-1 inline-block">
                لیست مشتریان
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-foreground/70">محصولات</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{formatFa(productsCount)}</p>
              <Link href={routes.products} className="text-xs text-primary hover:underline mt-1 inline-block">
                کاتالوگ
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-foreground/70">سفارشات</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{formatFa(ordersCount)}</p>
              <p className="text-xs text-foreground/70 mt-1">جمع فروش: {formatFa(Math.round(ordersRevenue))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-foreground/70">تراکنش‌ها</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{formatFa(transactionCount)}</p>
              <p className="text-xs text-foreground/70 mt-1">
                جمع دریافتی: {formatFa(Math.round(transactionSum))}
                {transactionSampleNote ? ' (نمونه تا ۱۰۰۰ رکورد)' : ''}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-foreground/70">پروژه‌های فعال</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{formatFa(projectsActive)}</p>
              <p className="text-xs text-foreground/70 mt-1">از {formatFa(projectsTotal)} پروژه</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-foreground/70">کمپین‌ها</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{formatFa(campaignsCount)}</p>
              <Link href={routes.campaigns} className="text-xs text-primary hover:underline mt-1 inline-block">
                مدیریت کمپین
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-foreground/70">تخفیف فعال</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{formatFa(promotionsActive)}</p>
              <Link href={routes.promotions} className="text-xs text-primary hover:underline mt-1 inline-block">
                پروموشن‌ها
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-foreground/70">وظایف من (باز)</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{formatFa(openTasksCount)}</p>
              <Link href={routes.tasks} className="text-xs text-primary hover:underline mt-1 inline-block">
                رفتن به تابلو وظایف
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">میانبرها</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition-colors hover:bg-active-bg/30 hover:border-primary/30">
                <CardContent className="py-3 px-4">
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-foreground/70 mt-0.5">{item.hint}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">ثبت سریع</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={routes.orderNew} className="inline-flex">
                <Button size="sm" variant="outline" className="h-9 min-w-[128px] justify-center inline-flex items-center gap-1.5">
                  <CartPlusIcon className="h-4 w-4" />
                  ثبت سفارش
                </Button>
              </Link>
              <Link href={routes.customerNew} className="inline-flex">
                <Button size="sm" variant="outline" className="h-9 min-w-[128px] justify-center inline-flex items-center gap-1.5">
                  <UserPlusIcon className="h-4 w-4" />
                  مشتری جدید
                </Button>
              </Link>
              <Link href={routes.tasks} className="inline-flex">
                <Button size="sm" variant="outline" className="h-9 min-w-[128px] justify-center inline-flex items-center gap-1.5">
                  <ClipboardListIcon className="h-4 w-4" />
                  وظایف
                </Button>
              </Link>
              <Link href={routes.transactionNew} className="inline-flex">
                <Button size="sm" variant="outline" className="h-9 min-w-[128px] justify-center inline-flex items-center gap-1.5">
                  <WalletIcon className="h-4 w-4" />
                  ثبت تراکنش
                </Button>
              </Link>
            </div>
            <p className="mt-2 text-xs text-foreground/60">
              میانبرهای پرتکرار برای ثبت سریع عملیات روزانه
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base">آخرین سفارشات</CardTitle>
            <Link href={routes.orders} className="text-xs text-primary hover:underline">
              همه
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-foreground/70">سفارشی ثبت نشده است.</p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] text-sm">
                {recentOrders.map((o) => {
                  const cust =
                    [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ') ||
                    o.customer?.companyName ||
                    `مشتری ${o.customerId}`;
                  return (
                    <li key={o.id} className="py-2 flex justify-between gap-2">
                      <Link href={routes.order(o.id)} className="text-primary hover:underline truncate">
                        سفارش #{o.id} — {cust}
                      </Link>
                      <span className="shrink-0 text-foreground/70 tabular-nums">
                        {formatFa(Math.round(o.finalAmount))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>روند فروش (۶ ماه اخیر)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[280px] bg-foreground/5 rounded animate-pulse" />
            ) : monthlyRevenue.some((r) => r.مبلغ > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [formatFa(Math.round(v)), 'مبلغ']} />
                  <Line type="monotone" dataKey="مبلغ" stroke="#3b82f6" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-foreground/70 text-sm">داده‌ای برای نمودار موجود نیست</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>وضعیت وظایف من</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[280px] bg-foreground/5 rounded animate-pulse" />
            ) : taskStatusChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={taskStatusChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="تعداد" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-foreground/70 text-sm">وظیفه‌ای برای شما ثبت نشده است</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>وظایف پیشِ رو</CardTitle>
            <Link href="/tasks" className="text-xs text-primary hover:underline">
              همه
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 bg-foreground/5 rounded animate-pulse" />
                ))}
              </div>
            ) : myTasks.length === 0 ? (
              <p className="text-sm text-foreground/70">وظیفه بازیابی نشد یا همه تکمیل شده‌اند.</p>
            ) : (
              <ul className="space-y-2">
                {myTasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={routes.tasks}
                      className="block rounded-lg border border-[var(--color-border)] p-3 hover:bg-active-bg/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm text-foreground line-clamp-2">{t.title}</span>
                        <Badge variant={taskBadgeVariant(t.status)}>{TASK_STATUS_FA[t.status]}</Badge>
                      </div>
                      {t.dueDate && (
                        <p className="text-xs text-foreground/70 mt-1">
                          سررسید: {formatGregorianToJalali(t.dueDate)}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>سفارشات به تفکیک مشتری</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[280px] bg-foreground/5 rounded animate-pulse" />
              ) : ordersByCustomer.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ordersByCustomer}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="تعداد" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-foreground/70 text-sm">داده‌ای موجود نیست</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>توزیع سطح وفاداری</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[280px] bg-foreground/5 rounded animate-pulse" />
              ) : levelDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={levelDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {levelDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-foreground/70 text-sm">داده‌ای موجود نیست</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
