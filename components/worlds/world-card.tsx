import type { Route } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Layers3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import type { World } from '@/lib/types';

export function WorldCard({ world }: { world: World }) {
  return (
    <Link href={`/worlds/${world.id}` as Route}>
      <Panel className="h-full p-5 transition hover:-translate-y-1 hover:bg-white/85">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge>{world.genre}</Badge>
            <h3 className="mt-3 font-serif text-2xl">{world.title}</h3>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[var(--muted)]" />
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">{world.description}</p>
        <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4" />
            <span>{world.systemType}</span>
          </div>
          <span>{world.tone}</span>
        </div>
      </Panel>
    </Link>
  );
}
