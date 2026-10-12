import type { Branch, ProjectArchive, WorldContext, WorldState } from '../core/types';
export function lineage(data: ProjectArchive, context: WorldContext): Branch[] {
  if (context.projectId !== data.project.id) throw Error('Universe mismatch');
  const result: Branch[] = [], seen = new Set<string>();
  let id: string | null = context.branchId;
  while (id !== null) {
    if (seen.has(id)) throw Error('Branch cycle');
    seen.add(id);
    const branch = data.branches.find(b => b.id === id && b.projectId === context.projectId);
    if (!branch) throw Error('Branch not found in universe');
    result.unshift(branch); id = branch.parentId;
  }
  if (result[0]?.id !== data.project.canonBranchId) throw Error('Branch must descend from canon');
  return result;
}
export function createBranch(data: ProjectArchive, context: WorldContext, name: string, divergenceOrder: number): ProjectArchive {
  const parents = lineage(data, context);
  if (!name.trim() || !Number.isFinite(divergenceOrder)) throw Error('Enter a branch name and a numeric divergence point');
  const last = parents.at(-1)!;
  if (last.divergenceOrder !== null && divergenceOrder < last.divergenceOrder) throw Error('Divergence precedes parent branch');
  return {...data, branches: [...data.branches, {id: crypto.randomUUID(), projectId: context.projectId, parentId: context.branchId, name: name.trim(), divergenceOrder}]};
}
// Ancestors stay live before the fork; their future changes do not leak past it.
export function resolveWorldState(data: ProjectArchive, context: WorldContext): WorldState {
  const chain = lineage(data, context), facts = new Map<string, ProjectArchive['facts'][number]>(), events = new Map<string, ProjectArchive['events'][number]>();
  const point = context.atOrder ?? Infinity;
  if (Number.isNaN(point)) throw Error('Invalid timeline point');
  chain.forEach((branch, index) => {
    const next = chain[index + 1];
    const cutoff = Math.min(point, next?.divergenceOrder ?? Infinity);
    const active = branch.divergenceOrder === null || point >= branch.divergenceOrder;
    if (!active) return;
    const candidates = data.facts.filter(f => f.branchId === branch.id && (f.validFrom === null || f.validFrom <= cutoff));
    candidates.sort((a,b) => (a.validFrom ?? -Infinity) - (b.validFrom ?? -Infinity) || a.createdAt.localeCompare(b.createdAt));
    for (const fact of candidates) {
      const key = JSON.stringify([fact.subjectId, fact.predicate]);
      if (fact.validUntil !== null && fact.validUntil <= cutoff) continue;
      facts.set(key, fact);
    }
    for (const event of data.events.filter(e => e.branchId === branch.id && e.order <= cutoff)) events.set(event.id, event);
  });
  return {context, entities: data.entities, facts: [...facts.values()].filter(f => !f.removed), events: [...events.values()].sort((a,b) => a.order-b.order || a.id.localeCompare(b.id))};
}
export function compareBranches(data: ProjectArchive, left: WorldContext, right: WorldContext) {
  const key = (f: WorldState['facts'][number]) => JSON.stringify([f.subjectId, f.predicate]);
  const a = new Map(resolveWorldState(data,left).facts.map(f => [key(f), f]));
  const b = new Map(resolveWorldState(data,right).facts.map(f => [key(f), f]));
  return [...new Set([...a.keys(), ...b.keys()])].map(k => ({left: a.get(k), right: b.get(k), status: !a.has(k) ? 'new' : !b.has(k) ? 'removed' : a.get(k)!.value === b.get(k)!.value ? 'unchanged' : 'overridden'}));
}
