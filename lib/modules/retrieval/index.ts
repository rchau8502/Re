import type { ProjectArchive, WorldContext } from '../core/types';
import { resolveWorldState } from '../branches';
export function retrieveContext(data: ProjectArchive, context: WorldContext, query: string, maxCharacters = 16000) {
  const state = resolveWorldState(data, context);
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const score = (value: string) => words.reduce((n,w) => n + (value.toLowerCase().includes(w) ? 1 : 0), 0);
  const entities = state.entities.filter(e => e.visibility === 'public' || e.visibility === 'shared').sort((a,b) => score(b.name+' '+b.description)-score(a.name+' '+a.description));
  const selected = entities.slice(0,12), ids = new Set(selected.map(e => e.id));
  const visibleSources = new Set(data.sources.filter(s => ['public','shared'].includes(s.visibility)).map(s => s.id));
  const facts = state.facts.filter(f => visibleSources.has(f.sourceId) && ids.has(f.subjectId) && ['public','shared'].includes(f.visibility)).sort((a,b) => score(b.predicate+' '+b.value)-score(a.predicate+' '+a.value));
  const events = state.events.filter(e => ['public','shared'].includes(e.visibility)).slice(-10);
  const result = {context, divergenceOrder:data.branches.find(b=>b.id===context.branchId)!.divergenceOrder, branch: data.branches.find(b => b.id === context.branchId)?.name, entities: selected, facts: facts.slice(0,60), events};
  // Keep complete records, never truncate JSON midway through a fact.
  while (JSON.stringify(result).length > maxCharacters && (result.facts.length || result.events.length || result.entities.length)) {
    if (result.facts.length) result.facts.pop(); else if (result.events.length) result.events.shift(); else result.entities.pop();
  }
  return result;
}

export type RetrievedContext = ReturnType<typeof retrieveContext>;
export function validateRetrievedContext(input: unknown): RetrievedContext {
  const bad = (): never => { throw Error('Invalid branch context'); };
  if (!input || typeof input !== 'object' || Array.isArray(input) || JSON.stringify(input).length > 20000) bad();
  const r = input as RetrievedContext;
  if (!r.context || typeof r.context.projectId !== 'string' || !r.context.projectId || typeof r.context.branchId !== 'string' || !r.context.branchId || (r.context.atOrder !== undefined && !Number.isFinite(r.context.atOrder)) || typeof r.branch !== 'string') bad();
  if(r.divergenceOrder!==null && !Number.isFinite(r.divergenceOrder))bad();
  if (!Array.isArray(r.entities) || r.entities.length > 12 || !Array.isArray(r.facts) || r.facts.length > 60 || !Array.isArray(r.events) || r.events.length > 10) bad();
  const ids = new Set(r.entities.map(e => e.id));
  for (const e of r.entities) if (!e || typeof e.id !== 'string' || e.projectId !== r.context.projectId || typeof e.name !== 'string' || typeof e.description !== 'string' || !['public','shared'].includes(e.visibility) || !Array.isArray(e.aliases) || !e.aliases.every(a => typeof a === 'string')) bad();
  for (const f of r.facts) if (!f || typeof f.id !== 'string' || f.projectId !== r.context.projectId || !ids.has(f.subjectId) || typeof f.predicate !== 'string' || typeof f.value !== 'string' || typeof f.evidence !== 'string' || !['public','shared'].includes(f.visibility) || f.removed !== false || typeof f.branchId !== 'string' || typeof f.sourceId !== 'string') bad();
  for (const e of r.events) if (!e || typeof e.id !== 'string' || e.projectId !== r.context.projectId || typeof e.title !== 'string' || typeof e.description !== 'string' || !Number.isFinite(e.order) || !['public','shared'].includes(e.visibility) || !Array.isArray(e.participants) || !e.participants.every(id => typeof id === 'string')) bad();
  return r;
}
