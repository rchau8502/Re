import { CAMPAIGN_STATUSES, CHAT_MODES, CANDIDATE_STATUSES, ENTITY_TYPES, VISIBILITY_OPTIONS } from '@/lib/constants';

export type CanonVisibility = (typeof VISIBILITY_OPTIONS)[number];
export type EntityType = (typeof ENTITY_TYPES)[number];
export type ChatMode = (typeof CHAT_MODES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface World {
  id: string;
  ownerId: string;
  title: string;
  genre: string;
  tone: string;
  techLevel: string;
  systemType: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  worldId: string;
  title: string;
  summary: string;
  status: CampaignStatus;
  timelineBranch: string;
  visibility: CanonVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface Entity {
  id: string;
  worldId: string;
  entityType: EntityType;
  name: string;
  aliases: string[];
  shortDescription: string;
  longDescription: string;
  tags: string[];
  status: string;
  visibility: CanonVisibility;
  sourceConfidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  worldId: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  notes: string;
  visibility: CanonVisibility;
  createdAt: string;
}

export interface Rule {
  id: string;
  worldId: string;
  title: string;
  category: string;
  statement: string;
  exceptions: string[];
  consequences: string[];
  examples: string[];
  visibility: CanonVisibility;
  canonLevel: 'core' | 'provisional' | 'rumored';
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  worldId: string;
  campaignId: string | null;
  title: string;
  summary: string;
  dateInWorld: string;
  orderIndex: number;
  causes: string[];
  consequences: string[];
  participants: string[];
  visibility: CanonVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface Secret {
  id: string;
  worldId: string;
  relatedEntityId: string | null;
  relatedEventId: string | null;
  secretText: string;
  visibility: CanonVisibility;
  revealConditions: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  id: string;
  campaignId: string;
  title: string;
  summary: string;
  recap: string;
  decisions: string[];
  revealedLore: string[];
  changedWorldState: string[];
  nextHooks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangeLogEntry {
  id: string;
  worldId: string;
  objectType: string;
  objectId: string;
  oldValueSummary: string;
  newValueSummary: string;
  reason: string;
  changedBy: string;
  sourceMessageId: string | null;
  createdAt: string;
}

export interface SourceDocument {
  id: string;
  worldId: string;
  title: string;
  fileType: 'markdown' | 'txt' | 'pdf';
  storagePath: string;
  extractedText: string | null;
  accessScope: CanonVisibility;
  parseStatus: 'pending' | 'parsed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface ChatThread {
  id: string;
  worldId: string;
  title: string;
  mode: ChatMode;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata: Record<string, Json>;
  createdAt: string;
}

export type CanonCandidateType =
  | 'world_update'
  | 'entity'
  | 'relationship'
  | 'rule'
  | 'event'
  | 'secret'
  | 'campaign'
  | 'session';

export interface CanonCandidate {
  id: string;
  worldId: string;
  sourceMessageId: string;
  candidateType: CanonCandidateType;
  candidatePayload: Record<string, unknown>;
  reviewStatus: CandidateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictAlert {
  label: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  relatedRecordIds: string[];
}

export interface RetrievalContext {
  worldSummary: string;
  entities: Entity[];
  rules: Rule[];
  events: EventRecord[];
  sessions: SessionRecord[];
  documents: Pick<SourceDocument, 'id' | 'title' | 'extractedText'>[];
  secrets: Secret[];
}

export interface WorldWorkspace {
  world: World;
  threads: ChatThread[];
  messages: ChatMessage[];
  entities: Entity[];
  rules: Rule[];
  events: EventRecord[];
  secrets: Secret[];
  campaigns: Campaign[];
  sessions: SessionRecord[];
  changelog: ChangeLogEntry[];
  documents: SourceDocument[];
  candidates: CanonCandidate[];
  conflicts: ConflictAlert[];
}
