export type NarrativeContent = {
  title: string;
  premise: string;
  divergencePoint: string;
  changesFromCanon: string[];
  alternateTimeline: string[];
  storySummary: string;
  scene: string;
  storyboard: { shot: string; action: string; dialogue: string }[];
};
// Portable contracts: no framework, provider SDK, or database dependency.
export type Visibility = 'public' | 'shared' | 'gm_only' | 'private';
export type WorldContext = { projectId: string; branchId: string; atOrder?: number };
export type EntityKind = 'character' | 'location' | 'organization' | 'object' | 'concept' | 'lore' | 'rule';
export interface Project { id: string; title: string; canonBranchId: string; createdAt: string }
export interface Entity { id: string; projectId: string; kind: EntityKind; name: string; description: string; aliases: string[]; visibility: Visibility }
export type Character = Entity & { kind: 'character' };
export type Location = Entity & { kind: 'location' };
export type Organization = Entity & { kind: 'organization' };
export interface Branch { id: string; projectId: string; parentId: string | null; name: string; divergenceOrder: number | null }
export interface Source { id: string; projectId: string; title: string; text: string; kind: 'manual' | 'import' | 'research' | 'director'; visibility: Visibility }
export interface Fact { id: string; projectId: string; branchId: string; subjectId: string; predicate: string; value: string; sourceId: string; evidence: string; confidence: number; visibility: Visibility; validFrom: number | null; validUntil: number | null; removed: boolean; createdAt: string }
export interface Relationship extends Fact { targetId: string }
export interface Rule extends Fact { exceptions: string[] }
export interface WorldEvent { id: string; projectId: string; branchId: string; title: string; description: string; order: number; participants: string[]; causes: string[]; sourceId: string; visibility: Visibility }
export interface Timeline { context: WorldContext; events: WorldEvent[] }
export interface Proposal { id: string; fact: Fact; status: 'pending' | 'approved' | 'rejected'; reviewedAt: string | null }
export interface Message { id: string; role: 'user' | 'assistant'; text: string }
export interface Conversation { id: string; projectId: string; branchId: string; workspaceId: string; messages: Message[] }
export interface Draft { id: string; projectId: string; branchId: string; workspaceId: string; content: NarrativeContent }
export interface Chapter { id: string; draftId: string; title: string; order: number }
export interface Scene { id: string; chapterId: string; text: string; order: number }
export interface Revision { id: string; draftId: string; content: NarrativeContent; createdAt: string }
export interface Attachment { id: string; projectId: string; entityId: string | null; sourceId: string; mediaType: string }
export interface Change { id: string; action: string; branchId: string; recordId: string; createdAt: string }
export interface ImportedMaterial { id: string; format: 'canonkeep-world'; content: string; visibility: 'private' }
export interface WritingState { drafts: Draft[]; revisions: Revision[]; conversations: Conversation[] }
export interface ProjectArchive { writing?: WritingState; imports?: ImportedMaterial[]; format: 'story-world'; version: 1; project: Project; branches: Branch[]; entities: Entity[]; facts: Fact[]; events: WorldEvent[]; sources: Source[]; proposals: Proposal[]; history: Change[] }
export interface WorldState { context: WorldContext; entities: Entity[]; facts: Fact[]; events: WorldEvent[] }
export function createProject(title: string): ProjectArchive {
  const id = crypto.randomUUID(), branchId = crypto.randomUUID();
  return { format: 'story-world', version: 1, project: { id, title, canonBranchId: branchId, createdAt: new Date().toISOString() }, branches: [{id: branchId, projectId: id, parentId: null, name: 'Canon', divergenceOrder: null}], entities: [], facts: [], events: [], sources: [], proposals: [], history: [] };
}
