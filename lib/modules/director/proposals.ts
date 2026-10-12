import type {ProjectArchive, WorldContext} from '../core/types';
import {lineage} from '../branches';
import {proposeFact} from '../canon';
export interface FactSuggestion {
  subjectId: string; predicate: string; value: string; evidence: string; confidence: number;
  validFrom: number | null; validUntil: number | null; removed: boolean;
}
export function suggestionSchema(entityIds: string[]) {
  const nullableOrder = {anyOf:[{type:'number'},{type:'null'}]};
  return {type:'object',additionalProperties:false,required:['facts'],properties:{facts:{type:'array',maxItems:20,items:{type:'object',additionalProperties:false,required:['subjectId','predicate','value','evidence','confidence','validFrom','validUntil','removed'],properties:{subjectId:{type:'string',enum:entityIds},predicate:{type:'string',minLength:1,maxLength:120},value:{type:'string',maxLength:4000},evidence:{type:'string',maxLength:2000},confidence:{type:'number',minimum:0,maximum:1},validFrom:nullableOrder,validUntil:nullableOrder,removed:{type:'boolean'}}}}}};
}
export function validateSuggestions(value:unknown, entityIds:string[], sourceText:string, divergenceOrder:number|null): FactSuggestion[] {
  if(!value || typeof value!=='object' || Array.isArray(value))throw Error('Invalid fact extraction');
  const raw=(value as {facts?:unknown}).facts;
  if(!Array.isArray(raw) || raw.length>20)throw Error('Invalid fact extraction');
  const ids=new Set(entityIds), keys=['subjectId','predicate','value','evidence','confidence','validFrom','validUntil','removed'];
  const seen=new Set<string>();
  return raw.map(input=>{
    if(!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).some(k=>!keys.includes(k)))throw Error('Invalid fact suggestion');
    const f=input as FactSuggestion;
    if(typeof f.subjectId!=='string' || !ids.has(f.subjectId) || typeof f.predicate!=='string' || !f.predicate.trim() || f.predicate.length>120 || typeof f.value!=='string' || f.value.length>4000 || typeof f.evidence!=='string' || f.evidence.length>2000 || f.evidence && !sourceText.includes(f.evidence) || !Number.isFinite(f.confidence) || f.confidence<0 || f.confidence>1 || typeof f.removed!=='boolean')throw Error('Invalid fact suggestion or unsupported evidence');
    if(f.validFrom!==null && !Number.isFinite(f.validFrom) || f.validUntil!==null && !Number.isFinite(f.validUntil) || f.validFrom!==null && f.validUntil!==null && f.validUntil<=f.validFrom || divergenceOrder!==null && (f.validFrom===null || f.validFrom<divergenceOrder))throw Error('Invalid suggestion timeline');
    const key=JSON.stringify([f.subjectId,f.predicate.trim(),f.validFrom]);
    if(seen.has(key))throw Error('Duplicate suggested assertion');seen.add(key);
    return {...f,predicate:f.predicate.trim()};
  });
}
export function stageSuggestions(data:ProjectArchive,context:WorldContext,value:unknown,input:{text:string;title:string;requestId:string}):ProjectArchive {
  const branch=lineage(data,context).at(-1)!;
  if(!input.requestId || !input.title.trim() || !input.text.trim() || input.text.length>30000)throw Error('Invalid proposal source');
  // Retry-safe receipt lives with sources, so no separate cache can lose canon ownership.
  const receipt='Director extraction '+input.requestId;
  if(data.sources.some(s=>s.title===receipt))return data;
  const visibleEntities=data.entities.filter(e=>['public','shared'].includes(e.visibility)).map(e=>e.id);
  const facts=validateSuggestions(value,visibleEntities,input.text,branch.divergenceOrder);
  if(!facts.length)return data;
  const source={id:crypto.randomUUID(),projectId:context.projectId,title:receipt,text:input.title+'\n\n'+input.text,kind:'director' as const,visibility:'public' as const};
  let next={...data,sources:[...data.sources,source]};
  for(const fact of facts)next=proposeFact(next,context,{...fact,sourceId:source.id,visibility:'public'});
  return next;
}
