import {isStory} from '../../story';
import type { ProjectArchive } from '../core/types';
import { lineage } from '../branches';
export function validateArchive(value: unknown): ProjectArchive {
  const fail = (): never => { throw Error('Invalid story-world backup'); };
  const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : fail();
  const text = (v: unknown) => typeof v === 'string' && v.length <= 200000 ? v : fail();
  const id = (v: unknown) => text(v).trim() ? text(v) : fail();
  const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : fail();
  const time = (v: unknown) => v === null ? null : number(v);
  const date = (v: unknown) => Number.isFinite(Date.parse(text(v))) ? text(v) : fail();
  const visibility = (v: unknown) => ['public','shared','gm_only','private'].includes(text(v)) ? v : fail();
  const strings = (v: unknown) => Array.isArray(v) && v.every(x => typeof x === 'string') ? v : fail();
  const a = object(value), project = object(a.project);
  if (a.format !== 'story-world' || a.version !== 1) fail();
  id(project.id); id(project.title); id(project.canonBranchId); date(project.createdAt);
  const lists = ['branches','entities','facts','events','sources','proposals','history'] as const;
  for (const key of lists) {
    if (!Array.isArray(a[key]) || a[key].length > 10000) fail();
    const seen = new Set<string>();
    for (const raw of a[key] as unknown[]) { const r = object(raw); const keyId = id(r.id); if(seen.has(keyId)) fail(); seen.add(keyId); }
  }
  const data = a as unknown as ProjectArchive;
  const branches = new Set(data.branches.map(b => b.id)), entities = new Set(data.entities.map(e => e.id)), sources = new Set(data.sources.map(s => s.id));
  const scoped = (r: {projectId: string}) => { if (r.projectId !== project.id) fail(); };
  for (const b of data.branches) { scoped(b); id(b.name); time(b.divergenceOrder); if (b.parentId !== null && !branches.has(b.parentId)) fail(); lineage(data, {projectId: data.project.id, branchId: b.id}); if (b.id === project.canonBranchId ? b.parentId !== null || b.divergenceOrder !== null : b.parentId === null || b.divergenceOrder === null) fail(); const parent = data.branches.find(p => p.id === b.parentId); if(parent?.divergenceOrder != null && b.divergenceOrder! < parent.divergenceOrder) fail(); }
  if (!branches.has(data.project.canonBranchId)) fail();
  for (const e of data.entities) { scoped(e); id(e.name); text(e.description); strings(e.aliases); visibility(e.visibility); if (!['character','location','organization','object','concept','lore','rule'].includes(e.kind)) fail(); }
  for (const s of data.sources) { scoped(s); id(s.title); text(s.text); visibility(s.visibility); if(!['manual','import','research','director'].includes(s.kind)) fail(); }
  const fact = (f: ProjectArchive['facts'][number]) => { scoped(f); id(f.id); id(f.predicate); text(f.value); text(f.evidence); date(f.createdAt); time(f.validFrom); time(f.validUntil); visibility(f.visibility); const confidence = number(f.confidence); if(confidence < 0 || confidence > 1 || typeof f.removed !== 'boolean' || !branches.has(f.branchId) || !entities.has(f.subjectId) || !sources.has(f.sourceId)) fail(); if(f.validFrom !== null && f.validUntil !== null && f.validUntil <= f.validFrom) fail(); const branch = data.branches.find(b => b.id === f.branchId)!; if(branch.divergenceOrder !== null && (f.validFrom === null || f.validFrom < branch.divergenceOrder)) fail(); };
  data.facts.forEach(fact);
  for (const p of data.proposals) { fact(p.fact); if(!['pending','approved','rejected'].includes(p.status)) fail(); if(p.reviewedAt !== null) date(p.reviewedAt); if(p.status === 'pending' && p.reviewedAt !== null || p.status !== 'pending' && p.reviewedAt === null) fail(); if(p.status === 'approved' && !data.facts.some(f => f.id === p.fact.id && JSON.stringify(f) === JSON.stringify(p.fact))) fail(); }
  for (const e of data.events) { scoped(e); id(e.title); text(e.description); number(e.order); strings(e.participants); strings(e.causes); visibility(e.visibility); if(!branches.has(e.branchId) || !sources.has(e.sourceId) || e.participants.some(x => !entities.has(x)) || e.causes.some(x => !data.events.some(y => y.id === x))) fail(); const branch = data.branches.find(b => b.id === e.branchId)!; if(branch.divergenceOrder !== null && e.order < branch.divergenceOrder) fail(); }
  for(const h of data.history) { id(h.action); id(h.recordId); date(h.createdAt); if(!branches.has(h.branchId)) fail(); }
  if(data.imports !== undefined) { if(!Array.isArray(data.imports) || data.imports.length>100) fail(); const seen=new Set<string>(); for(const m of data.imports) { if(!m || !id(m.id) || seen.has(m.id) || m.format!=='canonkeep-world' || m.visibility!=='private' || typeof m.content!=='string' || m.content.length>5*1024*1024) fail(); seen.add(m.id); } }
  if(data.writing !== undefined) {
    const writing=object(data.writing), unique=(records:unknown)=>{
      if(!Array.isArray(records) || records.length>10000)fail();const seen=new Set<string>();
      for(const raw of records as unknown[]){const r=object(raw);const key=id(r.id);if(seen.has(key))fail();seen.add(key)}
    };
    unique(writing.drafts);unique(writing.revisions);unique(writing.conversations);
    const draftIds=new Set(data.writing.drafts.map(d=>d.id)),owned=new Set<string>(),threads=new Set<string>();
    for(const d of data.writing.drafts){scoped(d);id(d.workspaceId);if(!branches.has(d.branchId) || !isStory(d.content) || JSON.stringify(d.content).length>400000)fail();const key=JSON.stringify([d.branchId,d.workspaceId]);if(owned.has(key))fail();owned.add(key)}
    for(const r of data.writing.revisions){if(!draftIds.has(r.draftId) || !isStory(r.content) || JSON.stringify(r.content).length>400000)fail();date(r.createdAt)}
    for(const c of data.writing.conversations){scoped(c);id(c.workspaceId);if(!branches.has(c.branchId) || !Array.isArray(c.messages) || c.messages.length>200)fail();const key=JSON.stringify([c.branchId,c.workspaceId]);if(threads.has(key))fail();threads.add(key);const messages=new Set<string>();for(const m of c.messages){const key=id(m.id);if(messages.has(key) || !['user','assistant'].includes(m.role) || text(m.text).length>12000)fail();messages.add(key)}}
  }
  return structuredClone(data);
}
export function exportProject(data: ProjectArchive): string { const raw=JSON.stringify(validateArchive(data),null,2); if(raw.length>16*1024*1024)throw Error('Backup exceeds 16 MiB'); return raw; }
export function restoreProject(raw: string): ProjectArchive {
  if (raw.length > 16 * 1024 * 1024) throw Error('Backup exceeds 16 MiB');
  return validateArchive(JSON.parse(raw));
}

// Fresh identities keep restored worlds safe for future repositories with global PKs.
export function reidentifyProject(input: ProjectArchive, workspaceMapping?: Map<string,string>) {
  const data=validateArchive(input), projectId=crypto.randomUUID();
  const remap=<T extends {id:string}>(records:T[])=>new Map(records.map(r=>[r.id,crypto.randomUUID()]));
  const branches=remap(data.branches),entities=remap(data.entities),sources=remap(data.sources),facts=remap(data.facts),events=remap(data.events),proposals=remap(data.proposals);
  // Pending/rejected facts are not present in the approved fact collection.
  for(const p of data.proposals)if(!facts.has(p.fact.id))facts.set(p.fact.id,crypto.randomUUID());
  const fact=(f:ProjectArchive['facts'][number])=>({...f,id:facts.get(f.id)!,projectId,branchId:branches.get(f.branchId)!,subjectId:entities.get(f.subjectId)!,sourceId:sources.get(f.sourceId)!});
  const workspaceIds=workspaceMapping ?? new Map<string,string>();
  for(const record of [...(data.writing?.drafts ?? []),...(data.writing?.conversations ?? [])])if(!workspaceIds.has(record.workspaceId))workspaceIds.set(record.workspaceId,crypto.randomUUID());
  const drafts=remap(data.writing?.drafts ?? []),conversations=remap(data.writing?.conversations ?? []);
  const writing=data.writing?{drafts:data.writing.drafts.map(d=>({...d,id:drafts.get(d.id)!,projectId,branchId:branches.get(d.branchId)!,workspaceId:workspaceIds.get(d.workspaceId)!})),revisions:data.writing.revisions.map(r=>({...r,id:crypto.randomUUID(),draftId:drafts.get(r.draftId)!})),conversations:data.writing.conversations.map(c=>({...c,id:conversations.get(c.id)!,projectId,branchId:branches.get(c.branchId)!,workspaceId:workspaceIds.get(c.workspaceId)!,messages:c.messages.map(m=>({...m,id:crypto.randomUUID()}))}))}:undefined;
  const archive:ProjectArchive={...data,...(writing?{writing}:{}),project:{...data.project,id:projectId,canonBranchId:branches.get(data.project.canonBranchId)!},branches:data.branches.map(b=>({...b,id:branches.get(b.id)!,projectId,parentId:b.parentId===null?null:branches.get(b.parentId)!})),entities:data.entities.map(e=>({...e,id:entities.get(e.id)!,projectId})),sources:data.sources.map(s=>({...s,id:sources.get(s.id)!,projectId})),facts:data.facts.map(fact),events:data.events.map(e=>({...e,id:events.get(e.id)!,projectId,branchId:branches.get(e.branchId)!,sourceId:sources.get(e.sourceId)!,participants:e.participants.map(id=>entities.get(id)!),causes:e.causes.map(id=>events.get(id)!)})),proposals:data.proposals.map(p=>({...p,id:proposals.get(p.id)!,fact:fact(p.fact)})),history:data.history.map(h=>({...h,id:crypto.randomUUID(),branchId:branches.get(h.branchId)!,recordId:drafts.get(h.recordId)??conversations.get(h.recordId)??facts.get(h.recordId)??events.get(h.recordId)??branches.get(h.recordId)??entities.get(h.recordId)??h.recordId})),...(data.imports?{imports:data.imports.map(m=>({...m,id:crypto.randomUUID()}))}:{})};
  return {archive:validateArchive(archive),branches,workspaceIds};
}
