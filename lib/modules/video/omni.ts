// REST avoids coupling the video protocol to the installed SDK version.
export const OMNI_MODEL='gemini-omni-1.1-flash';
const ROOT='https://generativelanguage.googleapis.com/v1beta';
type Video={uri?:string;data?:string};
export type VideoOperation={done:boolean;error?:{code?:string|number;message?:string};response?:{generatedVideos?:{video?:Video}[];raiMediaFilteredReasons?:string[]}};
export async function videoApi(path:string,body?:object):Promise<Record<string,unknown>> {
 const response=await fetch(ROOT+'/'+path,{method:body?'POST':'GET',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY || '','Content-Type':'application/json','Api-Revision':'2026-05-20'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(30000)});
 if(!response.ok){let message='Video provider request failed';try{const data=await response.json();if(typeof data?.error?.message==='string')message=data.error.message}catch{}throw Object.assign(Error(message),{status:response.status})}
 const result:unknown=await response.json();if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Invalid video provider response');return result as Record<string,unknown>;
}
export async function createOmni(prompt:string,duration:number,aspectRatio:string,previous?:{id:string;ceiling:number}){
 // A lost POST response is ambiguous. Never retry a paid creation automatically.
 const result=await videoApi('interactions',{model:OMNI_MODEL,...(previous?{previous_interaction_id:previous.id}:{}),input:previous?`Extend the previous video by appending a continuation with a target length of ${duration} seconds, keeping the total at most ${previous.ceiling} seconds. Return the combined original plus continuation. Preserve characters, visual style and sound continuity. Do not restart, prepend or replace earlier scenes.\n\n${prompt}`:`Create a video with a target length of ${duration} seconds.\n\n${prompt}`,background:true,store:true,stream:false,response_format:{type:'video',resolution:'720p',aspect_ratio:aspectRatio,delivery:'uri'}});
 if(typeof result.id!=='string'||!/^[-A-Za-z0-9_]{1,512}$/.test(result.id))throw Error('No interaction ID returned. The request may have started; do not automatically retry.');
 return result.id;
}
export function videoFile(uri:string){
 const url=new URL(uri);
 if(url.protocol!=='https:'||url.hostname!=='generativelanguage.googleapis.com'||url.port||url.username||url.password)throw Error('Unexpected video download host');
 const match=url.pathname.match(/^\/v1beta\/files\/([-A-Za-z0-9_]+)(?::download)?$/);
 if(!match)throw Error('Invalid provider video file');return 'files/'+match[1];
}
export async function readOmni(id:string):Promise<VideoOperation>{
 const result=await videoApi('interactions/'+encodeURIComponent(id));
 if(result.model!==undefined&&result.model!==OMNI_MODEL)throw Error('Unexpected video model');
 if(['in_progress','queued'].includes(String(result.status)))return {done:false};
 if(result.status!=='completed'){
  if(!['failed','cancelled','incomplete','requires_action'].includes(String(result.status)))throw Error('Unrecognized video interaction status');
  const fault=result.error as {code?:string|number;message?:string}|undefined;
  return {done:true,error:{code:fault?.code,message:typeof fault?.message==='string'?fault.message:'Video interaction '+result.status}};
 }
 // Only model output is eligible; uploaded input and thought steps are not media results.
 const steps=Array.isArray(result.steps)?result.steps:[];
 const output=steps.filter(s=>s?.type==='model_output').flatMap(s=>Array.isArray(s.content)?s.content:[]);
 const video=output.find(v=>v?.type==='video'&&v.mime_type==='video/mp4'&&(typeof v.uri==='string'||typeof v.data==='string'));
 if(!video)return {done:true,response:{raiMediaFilteredReasons:['The provider completed without returning an MP4 video']}};
 if(typeof video.uri==='string'){
  const file=await videoApi(videoFile(video.uri));
  if(file.state==='PROCESSING')return {done:false};
  if(file.state==='FAILED')return {done:true,error:{message:'Video file processing failed'}};
  if(file.state!=='ACTIVE')throw Error('Unrecognized video file state');
  return {done:true,response:{generatedVideos:[{video:{uri:video.uri}}]}};
 }
 if(!video.data.length||video.data.length>48*1024*1024||video.data.length%4!==0||/[^A-Za-z0-9+/]/.test(video.data.replace(/={1,2}$/, '')))throw Error('Invalid or oversized inline video');
 return {done:true,response:{generatedVideos:[{video:{data:video.data}}]}};
}
