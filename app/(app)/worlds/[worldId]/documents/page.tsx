import { Upload } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { getWorldWorkspace } from '@/lib/data/repository';

export default async function DocumentsPage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = await params;
  const workspace = await getWorldWorkspace(worldId);
  if (!workspace) notFound();

  return (
    <section className="space-y-5">
      <Panel className="p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Private sources</p>
        <h1 className="mt-3 font-serif text-5xl">World documents</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">
          Upload markdown, text, or PDF references. Extracted text stays private to the world and is only used for retrieval-grounded responses.
        </p>
        <form action="/api/documents" method="post" encType="multipart/form-data" className="mt-6 flex flex-wrap items-center gap-3">
          <input type="hidden" name="worldId" value={worldId} />
          <input name="file" type="file" accept=".md,.txt,.pdf" className="text-sm text-[var(--muted)]" />
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Upload source
          </Button>
        </form>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        {workspace.documents.map((document) => (
          <Panel key={document.id} className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{document.fileType}</p>
            <h2 className="mt-1 font-serif text-3xl">{document.title}</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">Parse status: {document.parseStatus}</p>
            <p className="mt-3 text-sm leading-7">{document.extractedText ?? 'No extracted text available yet.'}</p>
          </Panel>
        ))}
      </div>
    </section>
  );
}
