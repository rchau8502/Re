import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export function Panel({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('rounded-[28px] border border-[var(--border)] bg-[var(--panel)] backdrop-blur-sm shadow-[var(--shadow)]', className)}>
      {children}
    </div>
  );
}
