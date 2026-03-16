import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 py-3 text-sm outline-none ring-0 placeholder:text-[var(--muted)] focus:border-[var(--accent)]',
        props.className,
      )}
    />
  );
}
