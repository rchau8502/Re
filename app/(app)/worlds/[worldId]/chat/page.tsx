import { notFound } from 'next/navigation';

import { ChatWorkspace } from '@/components/chat/chat-workspace';
import { buildRetrievalContext, getWorldWorkspace } from '@/lib/data/repository';

export default async function WorldChatPage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = await params;
  const workspace = await getWorldWorkspace(worldId);
  if (!workspace) notFound();

  const thread = workspace.threads[0];
  const retrievalContext = await buildRetrievalContext(worldId);
  if (!thread || !retrievalContext) notFound();

  return (
    <ChatWorkspace
      worldId={worldId}
      threadId={thread.id}
      initialMessages={workspace.messages}
      initialCandidates={workspace.candidates}
      initialConflicts={workspace.conflicts}
      initialContext={retrievalContext}
      initialMode={thread.mode}
    />
  );
}
