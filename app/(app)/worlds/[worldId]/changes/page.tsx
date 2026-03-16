import { notFound } from 'next/navigation';

import { Panel } from '@/components/ui/panel';
import { formatDateTime } from '@/lib/utils';
import { getWorldWorkspace } from '@/lib/data/repository';

export default async function ChangeLogPage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = await params;
  const workspace = await getWorldWorkspace(worldId);
  if (!workspace) notFound();

  return (
    <section className="space-y-5">
      <Panel className="p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Retcon tracking</p>
        <h1 className="mt-3 font-serif text-5xl">Change log</h1>
      </Panel>
      <div className="space-y-4">
        {workspace.changelog.map((entry) => (
          <Panel key={entry.id} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{entry.objectType}</p>
                <h2 className="mt-1 text-lg font-semibold">{entry.oldValueSummary} → {entry.newValueSummary}</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">{formatDateTime(entry.createdAt)}</p>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">{entry.reason}</p>
          </Panel>
        ))}
      </div>
    </section>
  );
}
