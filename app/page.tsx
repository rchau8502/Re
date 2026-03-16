import Link from 'next/link';
import { ArrowRight, Database, GitBranchPlus, ShieldEllipsis, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';

const pillars = [
  {
    icon: Sparkles,
    title: 'Conversation-led design',
    body: 'Build settings in natural language while CanonKeep keeps the assistant grounded in current lore and unresolved questions.',
  },
  {
    icon: Database,
    title: 'Structured canon underneath',
    body: 'Every approved fact becomes an entity, rule, event, secret, session note, or relationship tied back to its source.',
  },
  {
    icon: GitBranchPlus,
    title: 'Retcons with receipts',
    body: 'Contradictions are flagged before they poison continuity. Approved changes land in a changelog with provenance.',
  },
  {
    icon: ShieldEllipsis,
    title: 'Visibility-aware lore',
    body: 'Public canon, shared campaign notes, GM-only secrets, and private references all live in the same world model.',
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-12 lg:py-20">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Badge>Production-minded MVP foundation</Badge>
          <h1 className="mt-6 max-w-4xl font-serif text-6xl leading-none tracking-tight md:text-7xl">
            Build worlds by talking. Keep them consistent by design.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            CanonKeep is a conversational worldbuilding and campaign platform that turns chat into structured, retrieval-backed canon with visibility controls, contradiction checks, and change tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/worlds">
              <Button>
                Enter the dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="secondary">Set up auth</Button>
            </Link>
          </div>
        </div>
        <Panel className="overflow-hidden p-6">
          <div className="rounded-[24px] border border-[var(--border)] bg-[#2c1d13] p-5 text-[#f9ebd9]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#d9b48f]">Creator mode</p>
            <p className="mt-4 text-lg leading-8">
              If memory is used as fuel, who decides which recollections are too dangerous to preserve? What material cost keeps that power structure stable?
            </p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Extracted candidates</p>
              <p className="mt-3 font-semibold">Faction: The Kiln Synod</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Controls legal memory-burning infrastructure and narrative legitimacy.</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Conflict alert</p>
              <p className="mt-3 font-semibold">Rule overlap detected</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Candidate rule duplicates an existing furnace law but adds a new civic consequence.</p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Panel key={pillar.title} className="p-5">
              <Icon className="h-5 w-5 text-[var(--accent-strong)]" />
              <h2 className="mt-4 font-serif text-2xl">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{pillar.body}</p>
            </Panel>
          );
        })}
      </section>
    </main>
  );
}
