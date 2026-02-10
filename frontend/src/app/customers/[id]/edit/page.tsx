'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Redirect to customer detail page.
 * Editing is now handled via the modal on the detail page.
 */
export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/customers/${params.id}`);
  }, [params.id, router]);

  return <div className="text-slate-500">در حال انتقال...</div>;
}
