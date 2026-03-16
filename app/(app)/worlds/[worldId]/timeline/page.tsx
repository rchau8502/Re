import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { getWorldWorkspace } from '@/lib/data/repository';

export default async function TimelinePage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = await params;
  const workspace = await getWorldWorkspace(worldId);
  if (!workspace) notFound();

  return (
    <section className="space-y-5">
      <Panel className="p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Timeline</p>
        <h1 className="mt-3 font-serif text-5xl">Events and consequences</h1>
      </Panel>
      {workspace.events.map((event) => (
        <Panel key={event.id} className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{event.dateInWorld}</p>
              <h2 className="mt-1 font-serif text-3xl">{event.title}</h2>
            </div>
            <Badge>{event.visibility}</Badge>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">{event.summary}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-[var(--muted)]">
            <div>
              <p className="font-medium text-[var(--foreground)]">Causes</p>
              <p>{event.causes.join(', ')}</p>
            </div>
            <div>
              <p className="font-medium text-[var(--foreground)]">Consequences</p>
              <p>{event.consequences.join(', ')}</p>
            </div>
            <div>
              <p className="font-medium text-[var(--foreground)]">Participants</p>
              <p>{event.participants.join(', ')}</p>
            </div>
          </div>
        </Panel>
      ))}
    </section>
  );
}
