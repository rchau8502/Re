import type { Route } from 'next';
import Link from 'next/link';
import { ArrowRight, LibraryBig, ScrollText, Swords } from 'lucide-react';
import { notFound } from 'next/navigation';

import { WorldSettingsForm } from '@/components/worlds/world-settings-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { getWorldWorkspace } from '@/lib/data/repository';

export default async function WorldDetailPage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = await params;
  const workspace = await getWorldWorkspace(worldId);
  if (!workspace) notFound();

  const stats = [
    { label: 'Entities', value: workspace.entities.length, icon: LibraryBig },
    { label: 'Rules', value: workspace.rules.length, icon: ScrollText },
    { label: 'Campaigns', value: workspace.campaigns.length, icon: Swords },
  ];

  return (
    <section className="space-y-5">
      <Panel className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">World overview</p>
            <h1 className="mt-3 font-serif text-5xl">{workspace.world.title}</h1>
            <p className="mt-3 max-w-3xl text-[var(--muted)]">{workspace.world.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge>{workspace.world.genre}</Badge>
            <Badge>{workspace.world.tone}</Badge>
            <Badge>{workspace.world.techLevel}</Badge>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Panel key={stat.label} className="p-5">
              <Icon className="h-5 w-5 text-[var(--accent-strong)]" />
              <p className="mt-3 text-sm uppercase tracking-[0.16em] text-[var(--muted)]">{stat.label}</p>
              <p className="mt-2 font-serif text-5xl">{stat.value}</p>
            </Panel>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">World metadata</p>
          <h2 className="mt-3 font-serif text-4xl">Edit canonical world settings</h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            This is the stable substrate used by retrieval and extraction. Keep it sharp and concrete.
          </p>
          <div className="mt-6">
            <WorldSettingsForm world={workspace.world} />
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Next actions</p>
            <div className="mt-4 space-y-3">
              <Link href={`/worlds/${worldId}/chat` as Route}>
                <Button fullWidth>
                  Open chat <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/worlds/${worldId}/campaigns` as Route}>
                <Button fullWidth variant="secondary">
                  Manage campaigns
                </Button>
              </Link>
              <Link href={`/worlds/${worldId}/documents` as Route}>
                <Button fullWidth variant="secondary">
                  Upload sources
                </Button>
              </Link>
            </div>
          </Panel>

          <Panel className="p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Recent canon activity</p>
            <div className="mt-4 space-y-3">
              {workspace.changelog.slice(0, 4).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-[var(--border)] bg-white/55 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{entry.objectType}</p>
                  <p className="mt-2 text-sm font-medium">{entry.newValueSummary}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{entry.reason}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}
