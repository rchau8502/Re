import type { ChatMode, RetrievalContext, World } from '@/lib/types';

const sharedGuardrails = `You are CanonKeep, an AI partner for worldbuilding and campaign canon management.
The product is conversation-first, but you must stay grounded in retrieved canon rather than pretending to remember everything.
Use only the provided retrieval context and the current conversation.
If canon is missing or ambiguous, say so clearly and ask a focused follow-up question.
Avoid generic fantasy fluff. Push on consequences, constraints, incentives, edge cases, and long-term continuity.`;

const modeGuidance: Record<ChatMode, string> = {
  creator: `Creator mode.
Goal: expand the setting intelligently, ask strong follow-up questions, and help the user define consequential details.
Prioritize tensions, institutions, tradeoffs, and failure modes.
End with one sharp next question when useful.`,
  archivist: `Archivist mode.
Goal: summarize canon crisply, reduce redundancy, and propose cleaner structured descriptions.
Be organized, specific, and conservative about claims.`,
  consistency_checker: `Consistency checker mode.
Goal: identify contradictions, vague assumptions, missing connective tissue, and areas that need confirmation.
Do not silently rewrite canon. Surface the conflict and propose options.`,
  gm_assistant: `GM assistant mode.
Goal: support campaign prep, faction continuity, session management, recap generation, and hidden lore handling.
Keep public and GM-only knowledge boundaries explicit.`,
};

export function buildModeInstructions(mode: ChatMode) {
  return `${sharedGuardrails}\n\n${modeGuidance[mode]}`;
}

export function buildRetrievalBrief(world: World, retrievalContext: RetrievalContext) {
  return [`World: ${world.title}`, `Description: ${world.description}`, `Genre: ${world.genre}`, `Tone: ${world.tone}`, `Tech level: ${world.techLevel}`, `System type: ${world.systemType}`, '', 'Retrieved canon context:', `- World summary: ${retrievalContext.worldSummary}`, `- Entities: ${retrievalContext.entities.map((entity) => `${entity.name} (${entity.entityType}): ${entity.shortDescription}`).join(' | ') || 'None'}`, `- Rules: ${retrievalContext.rules.map((rule) => `${rule.title}: ${rule.statement}`).join(' | ') || 'None'}`, `- Events: ${retrievalContext.events.map((event) => `${event.title}: ${event.summary}`).join(' | ') || 'None'}`, `- Sessions: ${retrievalContext.sessions.map((session) => `${session.title}: ${session.summary}`).join(' | ') || 'None'}`, `- Documents: ${retrievalContext.documents.map((document) => `${document.title}: ${document.extractedText ?? 'No extract available'}`).join(' | ') || 'None'}`, `- Visible secrets: ${retrievalContext.secrets.map((secret) => secret.secretText).join(' | ') || 'None visible'}`].join('\n');
}

export const extractionSystemPrompt = `You extract structured canon proposals from a user message and an assistant reply.
Return only candidate facts that are explicit, strongly implied, or operationally necessary.
Do not invent fields beyond the evidence.
Prefer fewer high-confidence candidates over many weak ones.
When a proposal might conflict with existing canon, include a short note in rationale.`;
