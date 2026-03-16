import { notFound } from 'next/navigation';

import { Panel } from '@/components/ui/panel';
import { getWorldWorkspace } from '@/lib/data/repository';

export default async function SessionPage({
  params,
}: {
  params: Promise<{ worldId: string; campaignId: string; sessionId: string }>;
}) {
  const { worldId, campaignId, sessionId } = await params;
  const workspace = await getWorldWorkspace(worldId);
  if (!workspace) notFound();

  const session = workspace.sessions.find((item) => item.id === sessionId && item.campaignId === campaignId);
  if (!session) notFound();

  return (
    <section className="space-y-5">
      <Panel className="p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Session recap</p>
        <h1 className="mt-3 font-serif text-5xl">{session.title}</h1>
        <p className="mt-3 text-[var(--muted)]">{session.recap}</p>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="font-semibold">Decisions</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            {session.decisions.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">Revealed lore</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            {session.revealedLore.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">Changed world state</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            {session.changedWorldState.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">Next hooks</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            {session.nextHooks.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </section>
  );
}
