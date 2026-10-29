export type VideoDuration=4|6|8|10;
export type VideoJob={id:string;prompt:string;duration:VideoDuration;aspectRatio:'16:9'|'9:16';createdAt:string;status:'submitting'|'pending'|'ready'|'failed'|'unknown';ticket?:string;error?:string;acknowledged?:boolean;kind?:'extension';parentId?:string;durationCeiling?:number};
export type VideoSettings={prompt:string;duration:VideoDuration;aspectRatio:'16:9'|'9:16';jobs:VideoJob[];continuationDraft?:{parentId:string;prompt:string}};
export const initialVideo=():VideoSettings=>({prompt:'',duration:4,aspectRatio:'16:9',jobs:[]});
// Omni uses token billing and prompt-directed length, so reserve for a 10s 720p clip.
// This is an estimate including prompt overhead, not a provider-enforced spending cap.
export const videoEstimate=(_seconds:VideoDuration)=>1.10;
// Reserve against the whole returned video, not only the newly appended tail.
export const extensionEstimate=(ceiling:number)=>Math.ceil(ceiling*11)/100;
export function retainVideoJobs(existing:VideoJob[],next:VideoJob):VideoJob[]{
 const keep=new Set<string>();let id=next.parentId;
 while(id&&!keep.has(id)){keep.add(id);id=existing.find(j=>j.id===id)?.parentId}
 const parents=existing.filter(j=>keep.has(j.id));
 return [next,...existing.filter(j=>!keep.has(j.id)).slice(0,Math.max(0,11-parents.length)),...parents].sort((a,b)=>a===next?-1:b===next?1:existing.indexOf(a)-existing.indexOf(b));
}
export function isVideoSettings(value:unknown):value is VideoSettings{
 if(!value||typeof value!=='object')return false;const v=value as VideoSettings;
 if(v.continuationDraft!==undefined&&(!v.continuationDraft||typeof v.continuationDraft.parentId!=='string'||!v.continuationDraft.parentId||v.continuationDraft.parentId.length>100||typeof v.continuationDraft.prompt!=='string'||v.continuationDraft.prompt.length>2000))return false;
 return typeof v.prompt==='string'&&v.prompt.length<=2000&&[4,6,8,10].includes(v.duration)&&['16:9','9:16'].includes(v.aspectRatio)&&Array.isArray(v.jobs)&&v.jobs.length<=12&&v.jobs.every(j=>j&&typeof j.id==='string'&&typeof j.prompt==='string'&&j.prompt.length<=2000&&[4,6,8,10].includes(j.duration)&&['16:9','9:16'].includes(j.aspectRatio)&&typeof j.createdAt==='string'&&['submitting','pending','ready','failed','unknown'].includes(j.status)&&(j.ticket===undefined||typeof j.ticket==='string'&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(j.ticket)&&j.ticket.length<=4096)&&(j.error===undefined||typeof j.error==='string')&&(j.acknowledged===undefined||typeof j.acknowledged==='boolean')&&(j.kind===undefined||j.kind==='extension')&&(j.parentId===undefined||typeof j.parentId==='string'&&j.parentId.length>0&&j.parentId.length<=100)&&(j.durationCeiling===undefined||[10,20,30,40].includes(j.durationCeiling))&&(j.kind!=='extension'||j.duration===10&&!!j.parentId&&[20,30,40].includes(j.durationCeiling!))&&(!['pending','ready'].includes(j.status)||!!j.ticket));
}
