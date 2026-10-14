export type VideoDuration=4|6|8;
export type VideoJob={id:string;prompt:string;duration:VideoDuration;aspectRatio:'16:9'|'9:16';createdAt:string;status:'submitting'|'pending'|'ready'|'failed'|'unknown';ticket?:string;error?:string;acknowledged?:boolean};
export type VideoSettings={prompt:string;duration:VideoDuration;aspectRatio:'16:9'|'9:16';jobs:VideoJob[]};
export const initialVideo=():VideoSettings=>({prompt:'',duration:4,aspectRatio:'16:9',jobs:[]});
export const videoEstimate=(seconds:VideoDuration)=>seconds/10;
export function isVideoSettings(value:unknown):value is VideoSettings{
 if(!value||typeof value!=='object')return false;const v=value as VideoSettings;
 return typeof v.prompt==='string'&&v.prompt.length<=2000&&[4,6,8].includes(v.duration)&&['16:9','9:16'].includes(v.aspectRatio)&&Array.isArray(v.jobs)&&v.jobs.length<=12&&v.jobs.every(j=>j&&typeof j.id==='string'&&typeof j.prompt==='string'&&j.prompt.length<=2000&&[4,6,8].includes(j.duration)&&['16:9','9:16'].includes(j.aspectRatio)&&typeof j.createdAt==='string'&&['submitting','pending','ready','failed','unknown'].includes(j.status)&&(j.ticket===undefined||typeof j.ticket==='string'&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(j.ticket)&&j.ticket.length<=4096)&&(j.error===undefined||typeof j.error==='string')&&(j.acknowledged===undefined||typeof j.acknowledged==='boolean')&&(!['pending','ready'].includes(j.status)||!!j.ticket));
}
