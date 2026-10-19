import type {VideoJob} from './types';
export function videoPollResult(httpStatus:number,value:unknown):Pick<VideoJob,'status'|'error'> {
 const v=value as {status?:unknown;error?:unknown}|null;
 const error=typeof v?.error==='string'?v.error:undefined;
 if(httpStatus===400||httpStatus===410)return {status:'failed',error:error || 'Invalid or expired video ticket'};
 if(httpStatus<200||httpStatus>=300)throw Error(error || 'Status check failed');
 if(!v||!['pending','ready','failed'].includes(v.status as string))throw Error('Unrecognized video status response');
 return {status:v.status as 'pending'|'ready'|'failed',...(error?{error}:{})};
}
// Guidance describes the reported failure; it cannot establish billing or charges.
export function videoFailureHelp(error=''):{title:string;next:string} {
 if(/ticket expired|expired video ticket/i.test(error))return {title:'Video access link expired',next:'This app’s two-day access ticket has expired. Your prompt is saved. Use an MP4 you already downloaded, or review costs before approving a new request.'};
 if(/invalid.*ticket/i.test(error))return {title:'Saved video ticket is invalid',next:'The saved job cannot be verified. Try its original workspace backup or a downloaded MP4. Your prompt is preserved.'};
 if(/billing|payment/i.test(error))return {title:'Provider reported a billing issue',next:'Review billing for the Google project that owns this API key. This message does not establish whether a prior request incurred a charge.'};
 if(/quota|rate.?limit|resource.exhausted|provider error (8|429)\b/i.test(error))return {title:'Video quota or rate limit reached',next:'Review the video model’s quota and provider activity. Model metadata access does not confirm generation quota. No new request was sent automatically.'};
 if(/permission.denied|unauthenticated|provider error (7|16|401|403)\b/i.test(error))return {title:'Video access denied',next:'Open Video access and check model access. Review the server key’s restrictions and project permissions if the provider still denies access.'};
 if(/provider error (5|404)\b|model.*not.found/i.test(error))return {title:'Video model or job unavailable',next:'Check model access and the provider’s availability schedule. A missing job or model cannot be recovered by repeatedly polling the same ticket.'};
 if(/filtered|safety|blocked by provider/i.test(error))return {title:'Video request was filtered',next:'Review the provider’s reason in Technical details before editing your prompt. No replacement request was submitted.'};
 if(/provider error (13|500|503)\b|internal server|internal error/i.test(error))return {title:'Video provider error',next:'Google reported an internal failure. Your prompt is saved. Review provider activity before deciding whether to approve another paid attempt; billing is unverified.'};
 return {title:'This clip could not be generated',next:'Your prompt is saved. Review Technical details and check model access before deciding whether to approve a new request.'};
}
