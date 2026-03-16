import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import { signInAction, signUpAction } from '@/lib/forms/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Panel } from '@/components/ui/panel';

export default async function AuthPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (user) {
    redirect('/worlds');
  }

  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : null;

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr]">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Authentication</p>
        <h1 className="mt-4 font-serif text-5xl">Establish a keeper identity</h1>
        <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">
          CanonKeep uses email and password auth for the MVP. Backend ownership is world-scoped today and extensible to shared roles later.
        </p>
        {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Panel className="p-6">
          <h2 className="font-serif text-3xl">Sign in</h2>
          <form action={signInAction} className="mt-6 grid gap-4">
            <Input type="email" name="email" placeholder="Email" required />
            <Input type="password" name="password" placeholder="Password" required />
            <Button>Sign in</Button>
          </form>
        </Panel>
        <Panel className="p-6">
          <h2 className="font-serif text-3xl">Create account</h2>
          <form action={signUpAction} className="mt-6 grid gap-4">
            <Input name="displayName" placeholder="Display name" required />
            <Input type="email" name="email" placeholder="Email" required />
            <Input type="password" name="password" placeholder="Password" required />
            <Button>Create account</Button>
          </form>
        </Panel>
      </div>
    </main>
  );
}
