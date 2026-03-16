import { NextResponse } from 'next/server';

import { appendMessage, buildRetrievalContext, getWorldWorkspace, saveCandidates, upsertThread } from '@/lib/data/repository';
import { runWorldTurn } from '@/lib/ai/orchestrator';
import type { ChatMessage, ChatMode } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      worldId?: string;
      threadId?: string;
      message?: string;
      mode?: ChatMode;
    };

    if (!body.worldId || !body.message) {
      return NextResponse.json({ error: 'worldId and message are required.' }, { status: 400 });
    }

    const workspace = await getWorldWorkspace(body.worldId);
    if (!workspace) {
      return NextResponse.json({ error: 'World not found.' }, { status: 404 });
    }

    const thread = body.threadId
      ? workspace.threads.find((item) => item.id === body.threadId) ?? workspace.threads[0]
      : await upsertThread(body.worldId, 'Primary thread', body.mode ?? 'creator');

    if (!thread) {
      return NextResponse.json({ error: 'No thread available.' }, { status: 400 });
    }

    const userMessage = await appendMessage(thread.id, 'user', body.message, {});
    const retrievalContext = await buildRetrievalContext(body.worldId);

    if (!retrievalContext) {
      return NextResponse.json({ error: 'Failed to build retrieval context.' }, { status: 500 });
    }

    const { assistantReply, candidates, conflicts } = await runWorldTurn({
      world: workspace.world,
      threadMessages: workspace.messages,
      latestUserMessage: body.message,
      sourceMessageId: userMessage.id,
      mode: body.mode ?? thread.mode,
      retrievalContext,
      entities: workspace.entities,
      rules: workspace.rules,
      events: workspace.events,
    });

    const assistantMessage = (await appendMessage(thread.id, 'assistant', assistantReply, { mode: body.mode ?? thread.mode })) as ChatMessage;
    await saveCandidates(body.worldId, userMessage.id, candidates);

    return NextResponse.json({
      assistantMessage,
      candidates,
      conflicts,
      retrievalContext,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process chat turn.' }, { status: 500 });
  }
}
