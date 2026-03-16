import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';

import '@/app/globals.css';
import { getCurrentUser } from '@/lib/auth';
import { SiteHeader } from '@/components/layout/site-header';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['500', '600', '700'],
});

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'CanonKeep',
  description: 'Persistent canon engine for worldbuilders, GMs, and campaign creators.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-[family-name:var(--font-sans)] text-[var(--foreground)] antialiased">
        <SiteHeader user={user} />
        {children}
      </body>
    </html>
  );
}
