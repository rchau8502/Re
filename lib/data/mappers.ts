import type {
  Campaign,
  CanonCandidate,
  ChangeLogEntry,
  ChatMessage,
  ChatThread,
  Entity,
  EventRecord,
  Rule,
  Secret,
  SessionRecord,
  SourceDocument,
  World,
} from '@/lib/types';

export function mapWorld(row: Record<string, unknown>): World {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    title: String(row.title),
    genre: String(row.genre ?? ''),
    tone: String(row.tone ?? ''),
    techLevel: String(row.tech_level ?? ''),
    systemType: String(row.system_type ?? ''),
    description: String(row.description ?? ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: String(row.id),
    worldId: String(row.world_id),
    title: String(row.title),
    summary: String(row.summary ?? ''),
    status: row.status as Campaign['status'],
    timelineBranch: String(row.timeline_branch ?? 'Prime Continuity'),
    visibility: row.visibility as Campaign['visibility'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapEntity(row: Record<string, unknown>): Entity {
  return {
    id: String(row.id),
    worldId: String(row.world_id),
    entityType: row.entity_type as Entity['entityType'],
    name: String(row.name),
    aliases: Array.isArray(row.aliases) ? (row.aliases as string[]) : [],
    shortDescription: String(row.short_description ?? ''),
    longDescription: String(row.long_description ?? ''),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    status: String(row.status ?? ''),
    visibility: row.visibility as Entity['visibility'],
    sourceConfidence: Number(row.source_confidence ?? 0.5),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapRule(row: Record<string, unknown>): Rule {
  return {
    id: String(row.id),
    worldId: String(row.world_id),
    title: String(row.title),
    category: String(row.category ?? ''),
    statement: String(row.statement ?? ''),
    exceptions: Array.isArray(row.exceptions) ? (row.exceptions as string[]) : [],
    consequences: Array.isArray(row.consequences) ? (row.consequences as string[]) : [],
    examples: Array.isArray(row.examples) ? (row.examples as string[]) : [],
    visibility: row.visibility as Rule['visibility'],
    canonLevel: row.canon_level as Rule['canonLevel'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapEvent(row: Record<string, unknown>): EventRecord {
  return {
    id: String(row.id),
    worldId: String(row.world_id),
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    title: String(row.title),
    summary: String(row.summary ?? ''),
    dateInWorld: String(row.date_in_world ?? ''),
    orderIndex: Number(row.order_index ?? 0),
    causes: Array.isArray(row.causes) ? (row.causes as string[]) : [],
    consequences: Array.isArray(row.consequences) ? (row.consequences as string[]) : [],
    participants: Array.isArray(row.participants) ? (row.participants as string[]) : [],
    visibility: row.visibility as EventRecord['visibility'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapSecret(row: Record<string, unknown>): Secret {
  return {
    id: String(row.id),
    worldId: String(row.world_id),
    relatedEntityId: row.related_entity_id ? String(row.related_entity_id) : null,
    relatedEventId: row.related_event_id ? String(row.related_event_id) : null,
    secretText: String(row.secret_text ?? ''),
    visibility: row.visibility as Secret['visibility'],
    revealConditions: String(row.reveal_conditions ?? ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapSession(row: Record<string, unknown>): SessionRecord {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    title: String(row.title),
    summary: String(row.summary ?? ''),
    recap: String(row.recap ?? ''),
    decisions: Array.isArray(row.decisions) ? (row.decisions as string[]) : [],
    revealedLore: Array.isArray(row.revealed_lore) ? (row.revealed_lore as string[]) : [],
    changedWorldState: Array.isArray(row.changed_world_state) ? (row.changed_world_state as string[]) : [],
    nextHooks: Array.isArray(row.next_hooks) ? (row.next_hooks as string[]) : [],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapChangeLog(row: Record<string, unknown>): ChangeLogEntry {
  return {
    id: String(row.id),
    worldId: String(row.world_id),
    objectType: String(row.object_type),
    objectId: String(row.object_id),
    oldValueSummary: String(row.old_value_summary ?? ''),
    newValueSummary: String(row.new_value_summary ?? ''),
    reason: String(row.reason ?? ''),
    changedBy: String(row.changed_by ?? ''),
    sourceMessageId: row.source_message_id ? String(row.source_message_id) : null,
    createdAt: String(row.created_at),
  };
}

export function mapDocument(row: Record<string, unknown>): SourceDocument {
  return {
    id: String(row.id),
    worldId: String(row.world_id),
    title: String(row.title),
    fileType: row.file_type as SourceDocument['fileType'],
    storagePath: String(row.storage_path),
    extractedText: row.extracted_text ? String(row.extracted_text) : null,
    accessScope: row.access_scope as SourceDocument['accessScope'],
    parseStatus: row.parse_status as SourceDocument['parseStatus'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapThread(row: Record<string, unknown>): ChatThread {
  return {
    id: String(row.id),
    worldId: String(row.world_id),
    title: String(row.title),
    mode: row.mode as ChatThread['mode'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: String(row.id),
    threadId: String(row.thread_id),
    role: row.role as ChatMessage['role'],
    content: String(row.content),
    metadata: (row.metadata as ChatMessage['metadata']) ?? {},
    createdAt: String(row.created_at),
  };
}

export function mapCandidate(row: Record<string, unknown>): CanonCandidate {
  return {
    id: String(row.id),
    worldId: String(row.world_id),
    sourceMessageId: String(row.source_message_id),
    candidateType: row.candidate_type as CanonCandidate['candidateType'],
    candidatePayload: (row.candidate_payload as CanonCandidate['candidatePayload']) ?? {},
    reviewStatus: row.review_status as CanonCandidate['reviewStatus'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
