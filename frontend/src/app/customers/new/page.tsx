'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect to customers list page.
 * Customer creation is now handled via the modal on the list page.
 */
export default function NewCustomerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customers');
  }, [router]);

  return <div className="text-slate-500">در حال انتقال...</div>;
}
