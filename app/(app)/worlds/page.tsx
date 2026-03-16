import Link from 'next/link';
import { Plus } from 'lucide-react';

import { getCurrentUser } from '@/lib/auth';
import { listWorlds } from '@/lib/data/repository';
import { WorldCard } from '@/components/worlds/world-card';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';

export default async function WorldsPage() {
  const user = await getCurrentUser();
  const worlds = await listWorlds(user?.id);

  return (
    <section className="space-y-8">
      <Panel className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">World dashboard</p>
          <h1 className="mt-3 font-serif text-5xl">Persistent worlds, not disposable chat threads</h1>
          <p className="mt-3 max-w-3xl text-[var(--muted)]">
            Each world stores its own chat threads, structured canon, campaigns, session history, source documents, and retcon trail.
          </p>
        </div>
        <Link href="/worlds/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create world
          </Button>
        </Link>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {worlds.map((world) => (
          <WorldCard key={world.id} world={world} />
        ))}
      </div>
    </section>
  );
}
