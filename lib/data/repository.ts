import 'server-only';

import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/env';
import {
  demoCampaign,
  demoCandidates,
  demoWorkspace,
  demoWorld,
  demoWorlds,
} from '@/lib/data/demo';
import {
  mapCampaign,
  mapCandidate,
  mapChangeLog,
  mapDocument,
  mapEntity,
  mapEvent,
  mapMessage,
  mapRule,
  mapSecret,
  mapSession,
  mapThread,
  mapWorld,
} from '@/lib/data/mappers';
import type {
  Campaign,
  CanonCandidate,
  CandidateStatus,
  ChangeLogEntry,
  ChatMode,
  ChatMessage,
  ChatThread,
  ConflictAlert,
  Entity,
  SessionRecord,
  RetrievalContext,
  World,
  WorldWorkspace,
} from '@/lib/types';
import { detectConflicts } from '@/lib/data/conflicts';

export const listWorlds = cache(async (ownerId?: string): Promise<World[]> => {
  if (isDemoMode) {
    return demoWorlds;
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase.from('worlds').select('*').order('updated_at', { ascending: false });
  if (ownerId) query = query.eq('owner_id', ownerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapWorld);
});

export const getWorldWorkspace = cache(async (worldId: string): Promise<WorldWorkspace | null> => {
  if (isDemoMode) {
    return worldId === demoWorld.id ? demoWorkspace : null;
  }

  const supabase = await createServerSupabaseClient();
  const [
    worldsResult,
    threadsResult,
    messagesResult,
    entitiesResult,
    rulesResult,
    eventsResult,
    secretsResult,
    campaignsResult,
    sessionsResult,
    changelogResult,
    documentsResult,
    candidatesResult,
  ] = await Promise.all([
    supabase.from('worlds').select('*').eq('id', worldId).single(),
    supabase.from('chat_threads').select('*').eq('world_id', worldId).order('updated_at', { ascending: false }),
    supabase
      .from('chat_messages')
      .select('*, chat_threads!inner(world_id)')
      .eq('chat_threads.world_id', worldId)
      .order('created_at', { ascending: true })
      .limit(60),
    supabase.from('entities').select('*').eq('world_id', worldId).order('updated_at', { ascending: false }),
    supabase.from('rules').select('*').eq('world_id', worldId).order('updated_at', { ascending: false }),
    supabase.from('events').select('*').eq('world_id', worldId).order('order_index', { ascending: true }),
    supabase.from('secrets').select('*').eq('world_id', worldId).order('updated_at', { ascending: false }),
    supabase.from('campaigns').select('*').eq('world_id', worldId).order('updated_at', { ascending: false }),
    supabase
      .from('sessions')
      .select('*, campaigns!inner(world_id)')
      .eq('campaigns.world_id', worldId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('changelog').select('*').eq('world_id', worldId).order('created_at', { ascending: false }).limit(30),
    supabase.from('source_documents').select('*').eq('world_id', worldId).order('updated_at', { ascending: false }),
    supabase.from('canon_candidates').select('*').eq('world_id', worldId).order('created_at', { ascending: false }).limit(20),
  ]);

  if (worldsResult.error) throw worldsResult.error;
  if (!worldsResult.data) return null;

  const workspace: WorldWorkspace = {
    world: mapWorld(worldsResult.data),
    threads: (threadsResult.data ?? []).map(mapThread),
    messages: (messagesResult.data ?? []).map((row) => mapMessage(row as unknown as Record<string, unknown>)),
    entities: (entitiesResult.data ?? []).map(mapEntity),
    rules: (rulesResult.data ?? []).map(mapRule),
    events: (eventsResult.data ?? []).map(mapEvent),
    secrets: (secretsResult.data ?? []).map(mapSecret),
    campaigns: (campaignsResult.data ?? []).map(mapCampaign),
    sessions: (sessionsResult.data ?? []).map((row) => mapSession(row as unknown as Record<string, unknown>)),
    changelog: (changelogResult.data ?? []).map(mapChangeLog),
    documents: (documentsResult.data ?? []).map(mapDocument),
    candidates: (candidatesResult.data ?? []).map(mapCandidate),
    conflicts: [],
  };

  workspace.conflicts = detectConflicts(workspace.candidates, workspace.entities, workspace.rules, workspace.events);
  return workspace;
});

export async function getWorldById(worldId: string): Promise<World | null> {
  const workspace = await getWorldWorkspace(worldId);
  return workspace?.world ?? null;
}

export async function getCampaign(worldId: string, campaignId: string): Promise<Campaign | null> {
  if (isDemoMode) {
    return worldId === demoWorld.id && campaignId === demoCampaign.id ? demoCampaign : null;
  }
  const workspace = await getWorldWorkspace(worldId);
  return workspace?.campaigns.find((campaign) => campaign.id === campaignId) ?? null;
}

export async function buildRetrievalContext(worldId: string, visibility: Entity['visibility'][] = ['public', 'shared', 'gm_only', 'private']): Promise<RetrievalContext | null> {
  const workspace = await getWorldWorkspace(worldId);
  if (!workspace) return null;

  const allow = new Set(visibility);

  return {
    worldSummary: `${workspace.world.title}: ${workspace.world.description}`,
    entities: workspace.entities.filter((entity) => allow.has(entity.visibility)).slice(0, 8),
    rules: workspace.rules.filter((rule) => allow.has(rule.visibility)).slice(0, 6),
    events: workspace.events.filter((event) => allow.has(event.visibility)).slice(-5),
    sessions: workspace.sessions.slice(0, 3),
    documents: workspace.documents
      .filter((document) => allow.has(document.accessScope))
      .map((document) => ({ id: document.id, title: document.title, extractedText: document.extractedText }))
      .slice(0, 3),
    secrets: workspace.secrets.filter((secret) => allow.has(secret.visibility)).slice(0, 4),
  };
}

export async function createWorld(ownerId: string, input: Omit<World, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
  if (isDemoMode) {
    return demoWorld;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('worlds')
    .insert({
      owner_id: ownerId,
      title: input.title,
      genre: input.genre,
      tone: input.tone,
      tech_level: input.techLevel,
      system_type: input.systemType,
      description: input.description,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapWorld(data);
}

export async function updateWorld(
  worldId: string,
  input: Pick<World, 'title' | 'genre' | 'tone' | 'techLevel' | 'systemType' | 'description'>,
) {
  if (isDemoMode) {
    return {
      ...demoWorld,
      ...input,
      updatedAt: new Date().toISOString(),
    } satisfies World;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('worlds')
    .update({
      title: input.title,
      genre: input.genre,
      tone: input.tone,
      tech_level: input.techLevel,
      system_type: input.systemType,
      description: input.description,
    })
    .eq('id', worldId)
    .select('*')
    .single();

  if (error) throw error;
  return mapWorld(data);
}

export async function createCampaign(
  worldId: string,
  input: Pick<Campaign, 'title' | 'summary' | 'status' | 'timelineBranch' | 'visibility'>,
) {
  if (isDemoMode) {
    return {
      ...demoCampaign,
      ...input,
      worldId,
      id: `demo-campaign-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Campaign;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      world_id: worldId,
      title: input.title,
      summary: input.summary,
      status: input.status,
      timeline_branch: input.timelineBranch,
      visibility: input.visibility,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapCampaign(data);
}

export async function createSession(
  campaignId: string,
  input: Pick<SessionRecord, 'title' | 'summary' | 'recap' | 'decisions' | 'revealedLore' | 'changedWorldState' | 'nextHooks'>,
) {
  if (isDemoMode) {
    return {
      ...demoWorkspace.sessions[0],
      ...input,
      id: `demo-session-${Date.now()}`,
      campaignId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies SessionRecord;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      campaign_id: campaignId,
      title: input.title,
      summary: input.summary,
      recap: input.recap,
      decisions: input.decisions,
      revealed_lore: input.revealedLore,
      changed_world_state: input.changedWorldState,
      next_hooks: input.nextHooks,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapSession(data);
}

export async function appendMessage(threadId: string, role: ChatMessage['role'], content: string, metadata: ChatMessage['metadata'] = {}) {
  if (isDemoMode) {
    return {
      id: `demo-${Date.now()}`,
      threadId,
      role,
      content,
      metadata,
      createdAt: new Date().toISOString(),
    } satisfies ChatMessage;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      role,
      content,
      metadata,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapMessage(data);
}

export async function upsertThread(worldId: string, title: string, mode: ChatMode): Promise<ChatThread> {
  if (isDemoMode) {
    return demoWorkspace.threads[0];
  }

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase.from('chat_threads').select('*').eq('world_id', worldId).limit(1).maybeSingle();
  if (existing) {
    return mapThread(existing);
  }

  const { data, error } = await supabase
    .from('chat_threads')
    .insert({
      world_id: worldId,
      title,
      mode,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapThread(data);
}

export async function saveCandidates(worldId: string, sourceMessageId: string, candidates: CanonCandidate[]) {
  if (isDemoMode) {
    return candidates;
  }

  const supabase = await createServerSupabaseClient();
  const rows = candidates.map((candidate) => ({
    world_id: worldId,
    source_message_id: sourceMessageId,
    candidate_type: candidate.candidateType,
    candidate_payload: candidate.candidatePayload,
    review_status: candidate.reviewStatus,
  }));
  const { data, error } = await supabase.from('canon_candidates').insert(rows).select('*');
  if (error) throw error;
  return (data ?? []).map(mapCandidate);
}

export async function updateCandidateStatus(candidateId: string, reviewStatus: CandidateStatus) {
  if (isDemoMode) {
    return demoCandidates.find((candidate) => candidate.id === candidateId) ?? null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('canon_candidates')
    .update({ review_status: reviewStatus })
    .eq('id', candidateId)
    .select('*')
    .single();
  if (error) throw error;
  return mapCandidate(data);
}

export async function getCandidateById(candidateId: string): Promise<CanonCandidate | null> {
  if (isDemoMode) {
    return demoCandidates.find((candidate) => candidate.id === candidateId) ?? null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('canon_candidates').select('*').eq('id', candidateId).maybeSingle();
  if (error) throw error;
  return data ? mapCandidate(data) : null;
}

export async function updateCandidate(
  candidateId: string,
  updates: Partial<Pick<CanonCandidate, 'candidatePayload' | 'reviewStatus'>>,
): Promise<CanonCandidate | null> {
  if (isDemoMode) {
    const candidate = demoCandidates.find((item) => item.id === candidateId);
    if (!candidate) return null;
    return {
      ...candidate,
      ...updates,
      candidatePayload: updates.candidatePayload ?? candidate.candidatePayload,
      reviewStatus: updates.reviewStatus ?? candidate.reviewStatus,
      updatedAt: new Date().toISOString(),
    } satisfies CanonCandidate;
  }

  const supabase = await createServerSupabaseClient();
  const payload: Record<string, unknown> = {};
  if (updates.candidatePayload) payload.candidate_payload = updates.candidatePayload;
  if (updates.reviewStatus) payload.review_status = updates.reviewStatus;

  const { data, error } = await supabase
    .from('canon_candidates')
    .update(payload)
    .eq('id', candidateId)
    .select('*')
    .single();
  if (error) throw error;
  return mapCandidate(data);
}

export async function createChangeLogEntry(
  input: Omit<ChangeLogEntry, 'id' | 'createdAt'>,
): Promise<ChangeLogEntry | null> {
  if (isDemoMode) {
    return {
      id: `demo-changelog-${Date.now()}`,
      ...input,
      createdAt: new Date().toISOString(),
    } satisfies ChangeLogEntry;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('changelog')
    .insert({
      world_id: input.worldId,
      object_type: input.objectType,
      object_id: input.objectId,
      old_value_summary: input.oldValueSummary,
      new_value_summary: input.newValueSummary,
      reason: input.reason,
      changed_by: input.changedBy,
      source_message_id: input.sourceMessageId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapChangeLog(data);
}

export async function listWorldCandidates(worldId: string): Promise<CanonCandidate[]> {
  if (isDemoMode) {
    return demoCandidates;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('canon_candidates')
    .select('*')
    .eq('world_id', worldId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map(mapCandidate);
}

export async function listRelatedEntities(worldId: string): Promise<Entity[]> {
  const workspace = await getWorldWorkspace(worldId);
  return workspace?.entities ?? [];
}

export async function listConflictAlerts(worldId: string): Promise<ConflictAlert[]> {
  if (isDemoMode) {
    return demoWorkspace.conflicts;
  }
  const workspace = await getWorldWorkspace(worldId);
  return workspace?.conflicts ?? [];
}
