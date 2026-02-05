'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await api.auth.login(username, password);
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? 'خطا در ورود');
      return;
    }
    setAuth(res.data.token, res.data.user);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <Logo className="mb-8" iconClassName="text-[#DD1B62]" />

      <div className="w-full max-w-md">
        <h2 className="text-lg font-bold text-foreground mb-6">ورود به حساب کاربری</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-placeholder w-5 h-5 pointer-events-none">
              <EnvelopeIcon className="w-5 h-5" />
            </span>
            <Input
              label=""
              placeholder="ایمیل"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="pr-10"
            />
          </div>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-placeholder w-5 h-5 pointer-events-none">
              <EyeIcon className="w-5 h-5" />
            </span>
            <Input
              label=""
              placeholder="گذر واژه"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-10"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading}>
            <ArrowLeftIcon className="w-5 h-5" />
            {loading ? 'در حال ورود...' : 'ورود به حساب'}
          </Button>
        </form>

        <div className="mt-6 space-y-3 text-right">
          <p className="flex items-center justify-end gap-2 text-sm text-foreground">
            <LockIcon className="w-4 h-4 text-placeholder shrink-0" />
            <Link href="/forgot-password" className="hover:text-primary">
              فراموشی کلمه عبور
            </Link>
          </p>
          <p className="flex items-center justify-end gap-2 text-sm text-foreground">
            <UserIcon className="w-4 h-4 text-placeholder shrink-0" />
            حساب کاربری ندارید؟
          </p>
          <div className="flex justify-end">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border-2 border-accent text-accent hover:bg-accent/5 transition-colors"
            >
              ثبت نام
            </Link>
          </div>
        </div>

        <p className="mt-4 text-xs text-placeholder text-right">
          Mock: نام کاربری admin، رمز Admin123!
        </p>
      </div>
    </div>
  );
}
