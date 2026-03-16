import { notFound } from 'next/navigation';

import { WorldSidebar } from '@/components/layout/world-sidebar';
import { getWorldWorkspace } from '@/lib/data/repository';

export default async function WorldDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = await params;
  const workspace = await getWorldWorkspace(worldId);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside>
        <WorldSidebar workspace={workspace} />
      </aside>
      <div>{children}</div>
    </div>
  );
}
