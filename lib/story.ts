import {isVideoSettings,type VideoSettings} from './modules/video/types';
import type { WorldContext,NarrativeContent } from './modules/core/types';
export type Message = { id: string; role: 'user' | 'director'; text: string };
export type Bible = {
  title: string;
  mediaType: string;
  summary: string;
  characters: { name: string; personality: string; goals: string[]; relationships: string[]; status: string }[];
  relationships: string[];
  timeline: string[];
  worldRules: string[];
  powerSystem: string[];
  factions: string[];
  majorEvents: string[];
  themes: string[];
  ending: string;
  importantCanonRules: string[];
  majorDecisionPoints: string[];
  uncertainties: string[];
  sources: { title: string; url: string }[];
};
export type Preferences = {
  targetChange: string;
  startingPoint: string;
  desiredTone: string;
  outputMedium: 'Prose' | 'Outline' | 'Storyboard';
  outputLength: 'Short scene' | 'Full chapter' | 'Story outline';
  controls: Record<string, number>;
  toggles: Record<string, boolean>;
};
export type Plan = {
  premise: string;
  divergencePoint: string;
  alternateTimeline: string[];
  consequences: string[];
  keep: string[];
  change: string[];
};
export type Story = NarrativeContent;
export type Workspace = {
  video?: VideoSettings;
  worldContext?: WorldContext;
  worldWritingPending?: boolean;
  id: string;
  title: string;
  mediaType: string;
  edition: string;
  notes: string;
  bible: Bible | null;
  researchSource: 'notes' | 'research' | null;
  researchedAt: string | null;
  preferences: Preferences;
  conversation: Message[];
  suggestions: string[];
  plan: Plan | null;
  story: Story | null;
  parentId: string | null;
  updatedAt: string;
};
export function initialPreferences(): Preferences {
  return {
    targetChange: '', startingPoint: '', desiredTone: 'Match the original',
    outputMedium: 'Prose', outputLength: 'Short scene',
    controls: { 'Character personalities': 100, 'World rules': 100, 'Power system': 100, Relationships: 100, Timeline: 50, 'Original ending': 100 },
    toggles: { 'Allow new characters': false, 'Allow canon contradictions': false },
  };
}
export function newWorkspace(title: string, mediaType = 'Story'): Workspace {
  return {
    id: crypto.randomUUID(), title: title.trim() || 'Untitled story', mediaType, edition: '', notes: '',
    bible: null, researchSource: null, researchedAt: null, preferences: initialPreferences(),
    conversation: [], suggestions: [], plan: null, story: null, parentId: null, updatedAt: new Date().toISOString(),
  };
}
export function bibleFromNotes(title: string, mediaType: string, notes: string): Bible {
  return {
    title, mediaType, summary: notes.trim(), characters: [], relationships: [], timeline: [],
    worldRules: [], powerSystem: [], factions: [], majorEvents: [], themes: [], ending: '',
    importantCanonRules: [], majorDecisionPoints: [], uncertainties: [], sources: [],
  };
}
export function isBible(value: unknown): value is Bible {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  const list = ['relationships', 'timeline', 'worldRules', 'powerSystem', 'factions', 'majorEvents', 'themes', 'importantCanonRules', 'majorDecisionPoints', 'uncertainties'];
  return ['title', 'mediaType', 'summary', 'ending'].every(k => typeof b[k] === 'string')
    && list.every(k => Array.isArray(b[k]) && (b[k] as unknown[]).every(v => typeof v === 'string'))
    && Array.isArray(b.characters) && b.characters.every(c => c && typeof c.name === 'string' && typeof c.personality === 'string' && typeof c.status === 'string' && ['goals','relationships'].every(k => Array.isArray(c[k]) && c[k].every((v: unknown) => typeof v === 'string')))
    && Array.isArray(b.sources) && b.sources.every(s => s && typeof s.title === 'string' && typeof s.url === 'string' && /^https?:\/\//i.test(s.url));
}
export function isPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== 'object') return false;
  const p = value as Preferences;
  const defaults = initialPreferences();
  return ['targetChange', 'startingPoint', 'desiredTone'].every(k => typeof (p as unknown as Record<string, unknown>)[k] === 'string')
    && ['Prose', 'Outline', 'Storyboard'].includes(p.outputMedium)
    && ['Short scene', 'Full chapter', 'Story outline'].includes(p.outputLength)
    && !!p.controls && Object.keys(defaults.controls).every(k => typeof p.controls[k] === 'number' && p.controls[k] >= 0 && p.controls[k] <= 100)
    && !!p.toggles && Object.keys(defaults.toggles).every(k => typeof p.toggles[k] === 'boolean');
}
export function isPlan(value: unknown): value is Plan {
  if (!value || typeof value !== 'object') return false;
  const p = value as Plan;
  return typeof p.premise === 'string' && typeof p.divergencePoint === 'string'
    && ['alternateTimeline','consequences','keep','change'].every(k => Array.isArray((p as unknown as Record<string,unknown>)[k]) && ((p as unknown as Record<string,string[]>)[k]).every(v => typeof v === 'string'));
}
export function isStory(value: unknown): value is Story {
  if (!value || typeof value !== 'object') return false;
  const s = value as Story;
  return ['title','premise','divergencePoint','storySummary','scene'].every(k => typeof (s as unknown as Record<string,unknown>)[k] === 'string')
    && ['changesFromCanon','alternateTimeline'].every(k => Array.isArray((s as unknown as Record<string,unknown>)[k]) && (s as unknown as Record<string,string[]>)[k].every(v => typeof v === 'string'))
    && Array.isArray(s.storyboard) && s.storyboard.every(p => p && ['shot','action','dialogue'].every(k => typeof (p as unknown as Record<string,unknown>)[k] === 'string'));
}
export function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false;
  const w = value as Workspace;
  return (w.video===undefined || isVideoSettings(w.video)) && (w.worldWritingPending === undefined || typeof w.worldWritingPending === 'boolean') && (w.worldContext === undefined || (w.worldContext !== null && typeof w.worldContext.projectId === 'string' && typeof w.worldContext.branchId === 'string' && (w.worldContext.atOrder === undefined || Number.isFinite(w.worldContext.atOrder))))
    && ['id','title','mediaType','edition','notes','updatedAt'].every(k => typeof (w as unknown as Record<string,unknown>)[k] === 'string')
    && isPreferences(w.preferences) && (w.bible === null || isBible(w.bible))
    && (w.plan === null || isPlan(w.plan)) && (w.story === null || isStory(w.story))
    && [null,'notes','research'].includes(w.researchSource) && (w.parentId === null || typeof w.parentId === 'string')
    && (w.researchedAt === null || typeof w.researchedAt === 'string')
    && Array.isArray(w.suggestions) && w.suggestions.every(s => typeof s === 'string')
    && Array.isArray(w.conversation) && w.conversation.every(m => m && typeof m.id === 'string' && ['user','director'].includes(m.role) && typeof m.text === 'string');
}
