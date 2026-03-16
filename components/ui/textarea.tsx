import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-3xl border border-[var(--border)] bg-white/75 px-4 py-3 text-sm outline-none ring-0 placeholder:text-[var(--muted)] focus:border-[var(--accent)]',
        props.className,
      )}
    />
  );
}
