import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    fullWidth?: boolean;
  }
>;

const styles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)]',
  secondary: 'bg-[var(--panel)] text-[var(--foreground)] border border-[var(--border)] hover:bg-white/90',
  ghost: 'bg-transparent text-[var(--foreground)] hover:bg-black/5',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90',
};

export function Button({ children, className, variant = 'primary', fullWidth, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
