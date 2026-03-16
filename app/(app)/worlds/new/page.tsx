import { Panel } from '@/components/ui/panel';
import { WorldForm } from '@/components/worlds/world-form';

export default function NewWorldPage() {
  return (
    <section className="mx-auto max-w-4xl">
      <Panel className="p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Create world</p>
        <h1 className="mt-3 font-serif text-5xl">Define the canonical substrate</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Keep the first entry terse but specific. CanonKeep works best when the initial world record names the genre, tone, constraints, and governing logic clearly.
        </p>
        <div className="mt-8">
          <WorldForm />
        </div>
      </Panel>
    </section>
  );
}
