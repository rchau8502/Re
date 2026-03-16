export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-7xl px-6 py-8 lg:py-10">{children}</main>;
}
