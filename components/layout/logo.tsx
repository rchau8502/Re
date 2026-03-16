import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[linear-gradient(135deg,#5f2f16,#c98658)] text-lg font-bold text-white">
        CK
      </div>
      <div>
        <p className="font-serif text-2xl tracking-tight text-[var(--foreground)]">CanonKeep</p>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Conversation-first canon engine</p>
      </div>
    </Link>
  );
}
