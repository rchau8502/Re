import type { Route } from 'next';
import Link from 'next/link';
import { BookOpen, CalendarRange, Files, History, MessageSquare, ScrollText, Swords } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import type { WorldWorkspace } from '@/lib/types';

const items = [
  { href: '', label: 'Overview', icon: ScrollText },
  { href: 'chat', label: 'Chat', icon: MessageSquare },
  { href: 'entities', label: 'Encyclopedia', icon: BookOpen },
  { href: 'timeline', label: 'Timeline', icon: CalendarRange },
  { href: 'campaigns', label: 'Campaigns', icon: Swords },
  { href: 'changes', label: 'Change Log', icon: History },
  { href: 'documents', label: 'Documents', icon: Files },
];

export function WorldSidebar({ workspace }: { workspace: WorldWorkspace }) {
  return (
    <Panel className="p-5">
      <div className="space-y-4">
        <div>
          <Badge>{workspace.world.genre}</Badge>
          <h2 className="mt-3 font-serif text-3xl">{workspace.world.title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{workspace.world.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-[var(--muted)]">
          <div>
            <p className="font-medium text-[var(--foreground)]">Tone</p>
            <p>{workspace.world.tone}</p>
          </div>
          <div>
            <p className="font-medium text-[var(--foreground)]">Tech</p>
            <p>{workspace.world.techLevel}</p>
          </div>
          <div className="col-span-2">
            <p className="font-medium text-[var(--foreground)]">System</p>
            <p>{workspace.world.systemType}</p>
          </div>
        </div>
        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={(item.href
                  ? `/worlds/${workspace.world.id}/${item.href}`
                  : `/worlds/${workspace.world.id}`) as Route}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--muted)] transition hover:bg-white/70 hover:text-[var(--foreground)]"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-white/50 p-4 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <ScrollText className="h-4 w-4" />
            <span className="font-medium">Live canon state</span>
          </div>
          <p className="mt-2">{workspace.entities.length} entities, {workspace.rules.length} rules, {workspace.events.length} events, {workspace.candidates.filter((candidate) => candidate.reviewStatus === 'pending').length} pending candidates.</p>
        </div>
      </div>
    </Panel>
  );
}
