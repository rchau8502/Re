import OpenAI from 'openai';

import { env, isOpenAiConfigured } from '@/lib/env';
import { demoCandidates } from '@/lib/data/demo';
import { detectConflicts } from '@/lib/data/conflicts';
import { buildModeInstructions, buildRetrievalBrief, extractionSystemPrompt } from '@/lib/ai/prompts';
import { canonExtractionSchema } from '@/lib/ai/schemas';
import type {
  CanonCandidate,
  ChatMessage,
  ChatMode,
  ConflictAlert,
  Entity,
  EventRecord,
  RetrievalContext,
  Rule,
  World,
} from '@/lib/types';

let client: OpenAI | null = null;

function getClient() {
  if (!isOpenAiConfigured || !env.openAiApiKey) return null;
  client ??= new OpenAI({ apiKey: env.openAiApiKey });
  return client;
}

function fallbackAssistantReply(mode: ChatMode, world: World, message: string, retrievalContext: RetrievalContext) {
  const contextHint = retrievalContext.entities[0]?.name ?? retrievalContext.rules[0]?.title ?? 'the current canon';

  switch (mode) {
    case 'archivist':
      return `Archivist summary: your latest note should probably become structured canon tied to ${contextHint}. I would store the claim explicitly, avoid duplication, and clarify whether it changes public lore, GM-only knowledge, or both.`;
    case 'consistency_checker':
      return `Consistency check: this adds pressure to ${contextHint}. Before approving it, define what existing rule, event, or entity it modifies and whether the older canon should be preserved, replaced, or marked unresolved.`;
    case 'gm_assistant':
      return `GM assistant: this has campaign consequences. I would track who learns it, what world state changes immediately, and which next hook it unlocks. What is the most concrete scene this creates for the table?`;
    case 'creator':
    default:
      return `This sharpens ${world.title}. The next useful move is to make the implication operational: who enforces it, who profits from it, and what breaks when someone violates it?`;
  }
}

function fallbackCandidates(worldId: string, sourceMessageId: string, message: string): CanonCandidate[] {
  const lower = message.toLowerCase();
  const candidates: CanonCandidate[] = [];

  if (lower.includes('faction') || lower.includes('order') || lower.includes('guild') || lower.includes('synod')) {
    candidates.push({
      ...demoCandidates[0],
      id: `fallback-entity-${Date.now()}`,
      worldId,
      sourceMessageId,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  candidates.push({
    id: `fallback-rule-${Date.now()}`,
    worldId,
    sourceMessageId,
    candidateType: 'rule',
    candidatePayload: {
      title: 'Candidate rule from latest chat turn',
      summary: message.slice(0, 180),
      operation: 'create',
      visibility: 'public',
      record: {
        title: 'Candidate rule from latest chat turn',
        category: 'Emergent canon',
        statement: message,
        visibility: 'public',
      },
    },
    reviewStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return candidates;
}

export async function generateAssistantReply({
  world,
  mode,
  messages,
  latestUserMessage,
  retrievalContext,
}: {
  world: World;
  mode: ChatMode;
  messages: ChatMessage[];
  latestUserMessage: string;
  retrievalContext: RetrievalContext;
}) {
  const openai = getClient();
  if (!openai) {
    return fallbackAssistantReply(mode, world, latestUserMessage, retrievalContext);
  }

  const instructions = `${buildModeInstructions(mode)}\n\n${buildRetrievalBrief(world, retrievalContext)}`;
  const input = messages.slice(-8).map((message) => ({ role: message.role, content: [{ type: 'input_text', text: message.content }] }));
  input.push({ role: 'user', content: [{ type: 'input_text', text: latestUserMessage }] });

  const response = await openai.responses.create({
    model: env.openAiModel,
    instructions,
    input,
    reasoning: { effort: env.openAiReasoningEffort as 'low' | 'medium' | 'high' },
  } as never);

  const outputText = 'output_text' in response && typeof response.output_text === 'string' ? response.output_text : fallbackAssistantReply(mode, world, latestUserMessage, retrievalContext);
  return outputText.trim();
}

export async function extractCanonCandidates({
  world,
  sourceMessageId,
  latestUserMessage,
  assistantReply,
  retrievalContext,
  entities,
  rules,
  events,
}: {
  world: World;
  sourceMessageId: string;
  latestUserMessage: string;
  assistantReply: string;
  retrievalContext: RetrievalContext;
  entities: Entity[];
  rules: Rule[];
  events: EventRecord[];
}) {
  const openai = getClient();
  let extracted: CanonCandidate[];

  if (!openai) {
    extracted = fallbackCandidates(world.id, sourceMessageId, latestUserMessage);
  } else {
    const response = await openai.responses.create({
      model: env.openAiExtractionModel,
      instructions: `${extractionSystemPrompt}\n\n${buildRetrievalBrief(world, retrievalContext)}`,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `User message:\n${latestUserMessage}\n\nAssistant reply:\n${assistantReply}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: canonExtractionSchema.name,
          schema: canonExtractionSchema.schema,
          strict: true,
        },
      },
    } as never);

    const raw = 'output_text' in response && typeof response.output_text === 'string' ? response.output_text : '{"candidates":[]}';
    const parsed = JSON.parse(raw) as {
      candidates: Array<{
        candidateType: CanonCandidate['candidateType'];
        title: string;
        summary: string;
        operation: 'create' | 'update';
        visibility: CanonCandidate['candidatePayload']['visibility'];
        rationale?: string;
        record: Record<string, unknown>;
      }>;
    };

    extracted = parsed.candidates.map((candidate, index) => ({
      id: `candidate-${Date.now()}-${index}`,
      worldId: world.id,
      sourceMessageId,
      candidateType: candidate.candidateType,
      candidatePayload: {
        title: candidate.title,
        summary: candidate.summary,
        operation: candidate.operation,
        visibility: candidate.visibility,
        rationale: candidate.rationale ?? '',
        record: candidate.record,
      },
      reviewStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  const conflicts = detectConflicts(extracted, entities, rules, events);
  return { candidates: extracted, conflicts };
}

export async function runWorldTurn(input: {
  world: World;
  threadMessages: ChatMessage[];
  latestUserMessage: string;
  sourceMessageId: string;
  mode: ChatMode;
  retrievalContext: RetrievalContext;
  entities: Entity[];
  rules: Rule[];
  events: EventRecord[];
}): Promise<{ assistantReply: string; candidates: CanonCandidate[]; conflicts: ConflictAlert[] }> {
  const assistantReply = await generateAssistantReply({
    world: input.world,
    mode: input.mode,
    messages: input.threadMessages,
    latestUserMessage: input.latestUserMessage,
    retrievalContext: input.retrievalContext,
  });

  const extraction = await extractCanonCandidates({
    world: input.world,
    sourceMessageId: input.sourceMessageId,
    latestUserMessage: input.latestUserMessage,
    assistantReply,
    retrievalContext: input.retrievalContext,
    entities: input.entities,
    rules: input.rules,
    events: input.events,
  });

  return {
    assistantReply,
    candidates: extraction.candidates,
    conflicts: extraction.conflicts,
  };
}
