import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/env';
import { createChangeLogEntry, getWorldById } from '@/lib/data/repository';
import type { CanonCandidate } from '@/lib/types';

interface AppliedCandidateResult {
  objectType: string;
  objectId: string;
  oldValueSummary: string;
  newValueSummary: string;
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function summarizeRecord(candidate: CanonCandidate, record: Record<string, unknown>) {
  return String(
    record.summary ??
      record.statement ??
      record.shortDescription ??
      record.secretText ??
      record.recap ??
      candidate.candidatePayload.summary ??
      candidate.candidatePayload.title ??
      candidate.candidateType,
  );
}

async function resolveChangedBy(worldId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    return user.id;
  }

  const world = await getWorldById(worldId);
  return world?.ownerId ?? null;
}

async function writeChangeLog(candidate: CanonCandidate, result: AppliedCandidateResult) {
  const changedBy = await resolveChangedBy(candidate.worldId);
  if (!changedBy) return null;

  return createChangeLogEntry({
    worldId: candidate.worldId,
    objectType: result.objectType,
    objectId: result.objectId,
    oldValueSummary: result.oldValueSummary,
    newValueSummary: result.newValueSummary,
    reason: String(candidate.candidatePayload.rationale ?? 'Approved from canon candidate review.'),
    changedBy,
    sourceMessageId: candidate.sourceMessageId,
  });
}

export async function applyCandidate(candidate: CanonCandidate) {
  if (isDemoMode) {
    return null;
  }

  const record = (candidate.candidatePayload.record ?? {}) as Record<string, unknown>;
  const operation = String(candidate.candidatePayload.operation ?? 'create');
  const targetId = record.id ? String(record.id) : null;
  const supabase = await createServerSupabaseClient();

  async function insertOrUpdate(table: string, payload: Record<string, unknown>, objectType: string) {
    let oldSummary = 'Created from pending canon candidate.';

    if (operation === 'update' && targetId) {
      const { data: existing, error: fetchError } = await supabase.from(table).select('*').eq('id', targetId).maybeSingle();
      if (fetchError) throw fetchError;
      if (existing) {
        oldSummary = summarizeRecord(candidate, existing as Record<string, unknown>);
      }

      const { data, error } = await supabase.from(table).update(payload).eq('id', targetId).select('*').single();
      if (error) throw error;

      const result = {
        objectType,
        objectId: String(data.id),
        oldValueSummary: oldSummary,
        newValueSummary: summarizeRecord(candidate, data as Record<string, unknown>),
      } satisfies AppliedCandidateResult;

      await writeChangeLog(candidate, result);
      return result;
    }

    const { data, error } = await supabase.from(table).insert(payload).select('*').single();
    if (error) throw error;

    const result = {
      objectType,
      objectId: String(data.id),
      oldValueSummary: oldSummary,
      newValueSummary: summarizeRecord(candidate, data as Record<string, unknown>),
    } satisfies AppliedCandidateResult;

    await writeChangeLog(candidate, result);
    return result;
  }

  switch (candidate.candidateType) {
    case 'world_update': {
      const { data: existing, error: fetchError } = await supabase
        .from('worlds')
        .select('*')
        .eq('id', candidate.worldId)
        .single();
      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('worlds')
        .update({
          title: String(record.title ?? existing.title),
          genre: String(record.genre ?? existing.genre),
          tone: String(record.tone ?? existing.tone),
          tech_level: String(record.techLevel ?? existing.tech_level),
          system_type: String(record.systemType ?? existing.system_type),
          description: String(record.description ?? candidate.candidatePayload.summary ?? existing.description),
        })
        .eq('id', candidate.worldId)
        .select('*')
        .single();
      if (error) throw error;

      const result = {
        objectType: 'world',
        objectId: String(data.id),
        oldValueSummary: summarizeRecord(candidate, existing as Record<string, unknown>),
        newValueSummary: summarizeRecord(candidate, data as Record<string, unknown>),
      } satisfies AppliedCandidateResult;

      await writeChangeLog(candidate, result);
      return result;
    }
    case 'entity': {
      return insertOrUpdate(
        'entities',
        {
          world_id: candidate.worldId,
          entity_type: String(record.entityType ?? 'character'),
          name: String(record.name ?? candidate.candidatePayload.title ?? 'Untitled entity'),
          aliases: toArray(record.aliases),
          short_description: String(record.shortDescription ?? candidate.candidatePayload.summary ?? ''),
          long_description: String(record.longDescription ?? ''),
          tags: toArray(record.tags),
          status: String(record.status ?? 'active'),
          visibility: String(record.visibility ?? 'public'),
          source_confidence: Number(record.sourceConfidence ?? 0.75),
        },
        'entity',
      );
    }
    case 'relationship': {
      return insertOrUpdate(
        'relationships',
        {
          world_id: candidate.worldId,
          from_entity_id: String(record.fromEntityId ?? ''),
          to_entity_id: String(record.toEntityId ?? ''),
          relation_type: String(record.relationType ?? 'related_to'),
          notes: String(record.notes ?? candidate.candidatePayload.summary ?? ''),
          visibility: String(record.visibility ?? 'public'),
        },
        'relationship',
      );
    }
    case 'rule': {
      return insertOrUpdate(
        'rules',
        {
          world_id: candidate.worldId,
          title: String(record.title ?? candidate.candidatePayload.title ?? 'Untitled rule'),
          category: String(record.category ?? 'General'),
          statement: String(record.statement ?? candidate.candidatePayload.summary ?? ''),
          exceptions: toArray(record.exceptions),
          consequences: toArray(record.consequences),
          examples: toArray(record.examples),
          visibility: String(record.visibility ?? 'public'),
          canon_level: String(record.canonLevel ?? 'provisional'),
        },
        'rule',
      );
    }
    case 'event': {
      return insertOrUpdate(
        'events',
        {
          world_id: candidate.worldId,
          campaign_id: record.campaignId ? String(record.campaignId) : null,
          title: String(record.title ?? candidate.candidatePayload.title ?? 'Untitled event'),
          summary: String(record.summary ?? candidate.candidatePayload.summary ?? ''),
          date_in_world: String(record.dateInWorld ?? ''),
          order_index: Number(record.orderIndex ?? 0),
          causes: toArray(record.causes),
          consequences: toArray(record.consequences),
          participants: toArray(record.participants),
          visibility: String(record.visibility ?? 'public'),
        },
        'event',
      );
    }
    case 'secret': {
      return insertOrUpdate(
        'secrets',
        {
          world_id: candidate.worldId,
          related_entity_id: record.relatedEntityId ? String(record.relatedEntityId) : null,
          related_event_id: record.relatedEventId ? String(record.relatedEventId) : null,
          secret_text: String(record.secretText ?? candidate.candidatePayload.summary ?? ''),
          visibility: String(record.visibility ?? 'gm_only'),
          reveal_conditions: String(record.revealConditions ?? ''),
        },
        'secret',
      );
    }
    case 'campaign': {
      return insertOrUpdate(
        'campaigns',
        {
          world_id: candidate.worldId,
          title: String(record.title ?? candidate.candidatePayload.title ?? 'Untitled campaign'),
          summary: String(record.summary ?? candidate.candidatePayload.summary ?? ''),
          status: String(record.status ?? 'planning'),
          timeline_branch: String(record.timelineBranch ?? 'Prime Continuity'),
          visibility: String(record.visibility ?? 'shared'),
        },
        'campaign',
      );
    }
    case 'session': {
      return insertOrUpdate(
        'sessions',
        {
          campaign_id: String(record.campaignId ?? ''),
          title: String(record.title ?? candidate.candidatePayload.title ?? 'Untitled session'),
          summary: String(record.summary ?? candidate.candidatePayload.summary ?? ''),
          recap: String(record.recap ?? ''),
          decisions: toArray(record.decisions),
          revealed_lore: toArray(record.revealedLore),
          changed_world_state: toArray(record.changedWorldState),
          next_hooks: toArray(record.nextHooks),
        },
        'session',
      );
    }
    default:
      return null;
  }
}
