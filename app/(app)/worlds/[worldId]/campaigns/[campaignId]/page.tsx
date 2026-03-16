import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { SessionForm } from '@/components/campaigns/session-form';
import { getWorldWorkspace } from '@/lib/data/repository';

export default async function CampaignPage({ params }: { params: Promise<{ worldId: string; campaignId: string }> }) {
  const { worldId, campaignId } = await params;
  const workspace = await getWorldWorkspace(worldId);
  if (!workspace) notFound();

  const campaign = workspace.campaigns.find((item) => item.id === campaignId);
  if (!campaign) notFound();

  const sessions = workspace.sessions.filter((session) => session.campaignId === campaignId);

  return (
    <section className="space-y-5">
      <Panel className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Campaign</p>
            <h1 className="mt-3 font-serif text-5xl">{campaign.title}</h1>
            <p className="mt-3 max-w-3xl text-[var(--muted)]">{campaign.summary}</p>
          </div>
          <Badge>{campaign.visibility}</Badge>
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Link key={session.id} href={`/worlds/${worldId}/campaigns/${campaignId}/sessions/${session.id}` as Route}>
              <Panel className="p-5 transition hover:bg-white/80">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Session</p>
                <h2 className="mt-1 font-serif text-3xl">{session.title}</h2>
                <p className="mt-3 text-sm text-[var(--muted)]">{session.summary}</p>
              </Panel>
            </Link>
          ))}
        </div>
        <Panel className="p-5">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Create session</p>
          <h2 className="mt-3 font-serif text-4xl">Track the next table night</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Store recaps, decisions, revealed lore, world-state changes, and next hooks as structured session canon.
          </p>
          <div className="mt-6">
            <SessionForm worldId={worldId} campaignId={campaignId} />
          </div>
        </Panel>
      </div>
    </section>
  );
}
