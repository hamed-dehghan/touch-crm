'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Campaign } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CampaignDetailLoadingSkeleton } from '@/components/layout/LoadingSkeletons';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: idParam } = use(params);
  const id = Number(idParam);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (Number.isNaN(id)) return;
    api.campaigns.getById(id).then((res) => {
      if (res.success && res.data) setCampaign(res.data.campaign);
      setLoading(false);
    });
  }, [id]);

  const handleExecute = async () => {
    if (!campaign) return;
    setExecuting(true);
    const res = await api.campaigns.execute(id);
    setExecuting(false);
    if (res.success && res.data) {
      setCampaign((c) => (c ? { ...c, status: 'SENT' } : null));
    }
  };

  if (loading || !campaign) return <CampaignDetailLoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
        <Button variant="ghost" onClick={() => router.back()}>بازگشت</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>اطلاعات کمپین</CardTitle></CardHeader>
        <CardContent>
          <p><span className="text-slate-500">وضعیت:</span> <Badge>{campaign.status}</Badge></p>
          <p className="mt-2"><span className="text-slate-500">قالب پیام:</span></p>
          <pre className="bg-slate-100 p-3 rounded text-sm mt-1">{campaign.messageTemplate}</pre>
        </CardContent>
      </Card>
      {campaign.status === 'DRAFT' && (
        <Button onClick={handleExecute} disabled={executing}>{executing ? 'در حال ارسال...' : 'اجرای کمپین'}</Button>
      )}
    </div>
  );
}
