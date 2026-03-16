import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { getWorldWorkspace } from '@/lib/data/repository';

export default async function EntitiesPage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = await params;
  const workspace = await getWorldWorkspace(worldId);
  if (!workspace) notFound();

  return (
    <section className="space-y-5">
      <Panel className="p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Entity encyclopedia</p>
        <h1 className="mt-3 font-serif text-5xl">Structured entities</h1>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        {workspace.entities.map((entity) => (
          <Panel key={entity.id} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{entity.entityType.replaceAll('_', ' ')}</p>
                <h2 className="mt-1 font-serif text-3xl">{entity.name}</h2>
              </div>
              <Badge>{entity.visibility}</Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">{entity.shortDescription}</p>
            <p className="mt-4 text-sm leading-7">{entity.longDescription}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {entity.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}
