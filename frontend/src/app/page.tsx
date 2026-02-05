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
} from 'recharts';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const [customersCount, setCustomersCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [ordersByCustomer, setOrdersByCustomer] = useState<{ name: string; تعداد: number }[]>([]);
  const [levelDistribution, setLevelDistribution] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [custRes, ordRes] = await Promise.all([
        api.customers.list({ limit: 1 }),
        api.orders.list(),
      ]);
      if (custRes.success && custRes.data) setCustomersCount(custRes.data.pagination.total);
      if (ordRes.success && ordRes.data) {
        const orders = ordRes.data.orders;
        setOrdersCount(orders.length);
        const byCustomer: Record<string, number> = {};
        orders.forEach((o) => {
          const name = o.customer?.lastName ?? `مشتری ${o.customerId}`;
          byCustomer[name] = (byCustomer[name] ?? 0) + 1;
        });
        setOrdersByCustomer(
          Object.entries(byCustomer).map(([name, count]) => ({ name, تعداد: count }))
        );
        const levels: Record<string, number> = {};
        orders.forEach((o) => {
          const level = o.customer?.customerLevel?.levelName ?? 'بدون سطح';
          levels[level] = (levels[level] ?? 0) + 1;
        });
        setLevelDistribution(
          Object.entries(levels).map(([name, value]) => ({ name, value }))
        );
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">داشبورد</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">تعداد مشتریان</p>
            <p className="text-2xl font-bold text-slate-900">{customersCount}</p>
            <Link href="/customers">
              <Button variant="ghost" size="sm" className="mt-2">
                مشاهده لیست
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">تعداد سفارشات</p>
            <p className="text-2xl font-bold text-slate-900">{ordersCount}</p>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="mt-2">
                مشاهده لیست
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">ثبت سفارش جدید</p>
            <Link href="/orders/new">
              <Button size="sm" className="mt-2">
                ثبت سفارش
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">ثبت مشتری جدید</p>
            <Link href="/customers/new">
              <Button size="sm" className="mt-2">
                ثبت مشتری
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>سفارشات به تفکیک مشتری</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersByCustomer.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ordersByCustomer}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="تعداد" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm">داده‌ای موجود نیست</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>توزیع سطح وفاداری</CardTitle>
          </CardHeader>
          <CardContent>
            {levelDistribution.length > 0 ? (
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
              <p className="text-slate-500 text-sm">داده‌ای موجود نیست</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
