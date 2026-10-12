import { createProject, type ProjectArchive, type EntityKind } from '../core/types';
import { proposeFact } from '../canon';
import { validateArchive } from '../backup';
// Import prose as private sources and pending assertions. Never infer canon from prose.
export function importCanonKeepWorld(raw: string): ProjectArchive {
  if (raw.length > 5 * 1024 * 1024) throw Error('CanonKeep world package exceeds 5 MiB');
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error('Invalid CanonKeep world package');
  const p = parsed as Record<string, unknown>;
  if (p.format !== 'canonkeep-world' || ![1,2].includes(p.version as number) || !p.world || typeof p.world !== 'object') throw Error('Import an exported CanonKeep world package (version 1 or 2)');
  const w = p.world as Record<string, unknown>;
  if (typeof w.title !== 'string' || !w.title.trim() || w.title.length > 200 || typeof w.description !== 'string' || w.description.length > 200000 || !Array.isArray(w.entries) || w.entries.length > 10000) throw Error('Invalid CanonKeep world');
  type Entry = {id:string; kind:string; title:string; body:string; gmNotes:string; links:string[]; images?:{id:string;name:string;dataUrl:string}[]};
  const entries = w.entries as Entry[];
  for (const e of entries) {
    if (!e || typeof e.id !== 'string' || typeof e.title !== 'string' || !e.title.trim() || e.title.length>200 || !['location','character','clue','scene','note'].includes(e.kind) || typeof e.body !== 'string' || e.body.length>200000 || typeof e.gmNotes !== 'string' || e.gmNotes.length>200000 || !Array.isArray(e.links) || !e.links.every(id=>typeof id==='string')) throw Error('Invalid CanonKeep entry');
    if(e.images !== undefined && (!Array.isArray(e.images) || e.images.length>4 || e.images.some(i=> !i || typeof i.id!=='string' || typeof i.name!=='string' || typeof i.dataUrl!=='string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(i.dataUrl)))) throw Error('Invalid image material');
  }
  const ids = new Map(entries.map(e=>[e.id,crypto.randomUUID()]));
  if(ids.size !== entries.length || entries.some(e=>e.links.some(id=>!ids.has(id)))) throw Error('Duplicate or dangling CanonKeep entry references');
  let data=createProject(w.title);
  // Preserve the original bytes for a lossless return to the legacy app, including maps,
  // image metadata, links and GM notes. Opaque imported images are never rendered here.
  data.imports=[{id:crypto.randomUUID(),format:'canonkeep-world',content:raw,visibility:'private'}];
  const context={projectId:data.project.id,branchId:data.project.canonBranchId};
  const sourceId=crypto.randomUUID();
  data.sources.push({id:sourceId,projectId:context.projectId,title:'Imported world description',text:w.description,kind:'import',visibility:'private'});
  const kinds:Record<string,EntityKind>={location:'location',character:'character',clue:'object',scene:'lore',note:'lore'};
  data.entities=entries.map(e=>({id:ids.get(e.id)!,projectId:context.projectId,kind:kinds[e.kind],name:e.title,description:'',aliases:[],visibility:'private'}));
  for(const e of entries) {
    const source={id:crypto.randomUUID(),projectId:context.projectId,title:e.title,text:e.body,kind:'import' as const,visibility:'private' as const};
    data.sources.push(source);
    if(e.gmNotes) data.sources.push({id:crypto.randomUUID(),projectId:context.projectId,title:e.title+' — GM notes',text:e.gmNotes,kind:'import',visibility:'gm_only'});
    if(e.body) data=proposeFact(data,context,{subjectId:ids.get(e.id)!,predicate:'description',value:e.body,sourceId:source.id,evidence:e.body,confidence:1,visibility:'private',validFrom:null,validUntil:null,removed:false});
  }
  return validateArchive(data);
}
