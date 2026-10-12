import type { Fact, ProjectArchive, WorldContext } from '../core/types';
import { lineage } from '../branches';
export function proposeFact(data: ProjectArchive, context: WorldContext, input: Omit<Fact, 'id' | 'projectId' | 'branchId' | 'createdAt'>): ProjectArchive {
  const chain = lineage(data, context), branch = chain.at(-1)!;
  if (!data.entities.some(e => e.id === input.subjectId) || !data.sources.some(s => s.id === input.sourceId)) throw Error('Fact requires an entity and source in this universe');
  if (!input.predicate.trim() || !Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) throw Error('Invalid fact');
  if ((input.validFrom !== null && !Number.isFinite(input.validFrom)) || (input.validUntil !== null && !Number.isFinite(input.validUntil))) throw Error('Invalid temporal range');
  if (branch.divergenceOrder !== null && (input.validFrom === null || input.validFrom < branch.divergenceOrder)) throw Error('Branch facts must start at or after divergence');
  if (input.validFrom !== null && input.validUntil !== null && input.validUntil <= input.validFrom) throw Error('Invalid temporal range');
  const fact: Fact = {...input, id: crypto.randomUUID(), projectId: context.projectId, branchId: context.branchId, createdAt: new Date().toISOString()};
  return {...data, proposals: [...data.proposals, {id: crypto.randomUUID(), fact, status: 'pending', reviewedAt: null}]};
}
export function reviewProposal(data: ProjectArchive, context: WorldContext, id: string, approve: boolean, approveCanon = false): ProjectArchive {
  lineage(data, context);
  const proposal = data.proposals.find(p => p.id === id && p.fact.branchId === context.branchId);
  if (!proposal || proposal.status !== 'pending') throw Error('Pending proposal not found in this branch');
  if (approve && context.branchId === data.project.canonBranchId && !approveCanon) throw Error('Baseline canon requires explicit approval');
  const now = new Date().toISOString();
  return {...data, facts: approve ? [...data.facts, proposal.fact] : data.facts, proposals: data.proposals.map(p => p.id === id ? {...p, status: approve ? 'approved' : 'rejected', reviewedAt: now} : p), history: [...data.history, {id: crypto.randomUUID(), action: approve ? 'fact.approved' : 'fact.rejected', branchId: context.branchId, recordId: proposal.fact.id, createdAt: now}]};
}

export function editProposal(data:ProjectArchive, context:WorldContext, id:string, changes:Pick<Fact,'predicate'|'value'|'validFrom'|'validUntil'|'removed'>):ProjectArchive {
  lineage(data,context);
  const proposal=data.proposals.find(p=>p.id===id && p.fact.branchId===context.branchId && p.status==='pending');
  if(!proposal)throw Error('Pending proposal not found in this branch');
  const checked=proposeFact(data,context,{...proposal.fact,...changes}).proposals.at(-1)!.fact;
  const fact={...checked,id:proposal.fact.id,createdAt:proposal.fact.createdAt};
  return {...data,proposals:data.proposals.map(p=>p.id===id?{...p,fact}:p),history:[...data.history,{id:crypto.randomUUID(),action:'fact.proposal.edited',branchId:context.branchId,recordId:fact.id,createdAt:new Date().toISOString()}]};
}
export function reviewSelected(data:ProjectArchive,context:WorldContext,ids:string[],approve:boolean,approveCanon=false):ProjectArchive {
  if(!ids.length || new Set(ids).size!==ids.length)throw Error('Select distinct pending proposals');
  return ids.reduce((next,id)=>reviewProposal(next,context,id,approve,approveCanon),data);
}
