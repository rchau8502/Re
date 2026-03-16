import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { CampaignForm } from '@/components/campaigns/campaign-form';
import { getWorldWorkspace } from '@/lib/data/repository';

export default async function CampaignsPage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = await params;
  const workspace = await getWorldWorkspace(worldId);
  if (!workspace) notFound();

  return (
    <section className="space-y-5">
      <Panel className="p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Campaign layer</p>
        <h1 className="mt-3 font-serif text-5xl">Campaigns in this world</h1>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 lg:grid-cols-2">
        {workspace.campaigns.map((campaign) => (
          <Link key={campaign.id} href={`/worlds/${worldId}/campaigns/${campaign.id}` as Route}>
            <Panel className="h-full p-5 transition hover:bg-white/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{campaign.timelineBranch}</p>
                  <h2 className="mt-1 font-serif text-3xl">{campaign.title}</h2>
                </div>
                <Badge>{campaign.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">{campaign.summary}</p>
            </Panel>
          </Link>
        ))}
        </div>
        <Panel className="p-5">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Create campaign</p>
          <h2 className="mt-3 font-serif text-4xl">Spin up a playable branch</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Use campaigns to isolate active play, maintain branch continuity, and separate GM-only state from public canon.
          </p>
          <div className="mt-6">
            <CampaignForm worldId={worldId} />
          </div>
        </Panel>
      </div>
    </section>
  );
}
