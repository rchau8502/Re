import Link from 'next/link';

import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/lib/forms/auth-actions';
import type { AppUser } from '@/lib/types';

export function SiteHeader({ user }: { user: AppUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[#f8f1e5]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
          <Link href="/worlds">Worlds</Link>
          <Link href="/auth">Auth</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <form action={signOutAction}>
              <Button variant="secondary">Sign out</Button>
            </form>
          ) : (
            <Link href="/auth">
              <Button>Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
