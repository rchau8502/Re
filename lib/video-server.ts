import {GoogleGenAI,GenerateVideosOperation} from '@google/genai';
import {OMNI_MODEL,createOmni,readOmni,type VideoOperation} from './modules/video/omni';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {videoEstimate,extensionEstimate,type VideoDuration} from './modules/video/types';
const COOKIE='restory-video-access';
export const VIDEO_MODEL=OMNI_MODEL;
const LEGACY_VIDEO_MODEL='veo-3.1-fast-generate-preview';
export function videoConfigured(){return !!process.env.GEMINI_API_KEY?.trim()&&!!process.env.VIDEO_ACCESS_CODE?.trim()}
function key(){const k=process.env.VIDEO_ACCESS_CODE?.trim();if(!k)throw Error('Video access is not configured');return k}
export function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&x.length>0&&timingSafeEqual(x,y)}
function sign(data:object){const body=Buffer.from(JSON.stringify(data)).toString('base64url');return body+'.'+createHmac('sha256',key()).update(body).digest('base64url')}
export class VideoTicketError extends Error {constructor(message:string,readonly status:400|410){super(message)}}
function verify(value:string):Record<string,unknown>{if(value.length>4096)throw new VideoTicketError('Invalid ticket',400);const [body,sig,...rest]=value.split('.');if(rest.length||!body||!sig||!equal(sig,createHmac('sha256',key()).update(body).digest('base64url')))throw new VideoTicketError('Invalid ticket',400);let data;try{data=JSON.parse(Buffer.from(body,'base64url').toString())}catch{throw new VideoTicketError('Invalid ticket',400)}if(!data||typeof data.expires!=='number')throw new VideoTicketError('Invalid ticket',400);if(data.expires<=Date.now())throw new VideoTicketError('Video ticket expired. Your saved prompt is preserved; this access link cannot be renewed.',410);return data}
export function sameOrigin(request:Request){const url=new URL(request.url),origin=request.headers.get('origin');if(origin===url.origin)return true;
 // Next's local server rewrites 127.0.0.1 request URLs to localhost. Require
 // the original loopback Host and exact port; public hosts get no exception.
 const loopback='127.0.0.1'+(url.port?':'+url.port:'');return url.protocol==='http:'&&url.hostname==='localhost'&&request.headers.get('host')===loopback&&origin==='http://'+loopback;
}
export function videoAuthorized(request:Request){try{const cookie=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!cookie)return false;return verify(cookie).kind==='session'}catch{return false}}
export function accessCookie(request:Request){const token=sign({kind:'session',expires:Date.now()+8*60*60*1000});return `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api/video; Max-Age=28800${new URL(request.url).protocol==='https:'?'; Secure':''}`}
export function jobTicket(name:string,details?:{durationCeiling:number;aspectRatio:'16:9'|'9:16'}){return sign({kind:'job',name,...details,expires:Date.now()+48*60*60*1000})}
function operationName(ticket:string){const d=verify(ticket);if(d.kind!=='job'||typeof d.name!=='string'||!(/^(?:interactions\/[-A-Za-z0-9_]{1,512})$/.test(d.name)||d.name.startsWith('models/'+LEGACY_VIDEO_MODEL+'/operations/')))throw new VideoTicketError('Invalid video ticket',400);return d.name}
function client(){return new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY,httpOptions:{timeout:20000,retryOptions:{attempts:1}}})}
// Metadata only: never submits a generation or checks paid quota by creating a job.
export async function videoConnection(){await client().models.get({model:VIDEO_MODEL});return {accessible:true,model:VIDEO_MODEL,generationTested:false,checkedAt:new Date().toISOString()}}
export function safeError(error:unknown){const e=error as {message?:string};let s=e?.message || 'Video provider request failed';for(const secret of [process.env.GEMINI_API_KEY,process.env.VIDEO_ACCESS_CODE])if(secret)s=s.replaceAll(secret,'[redacted]');return s.slice(0,600)}
export function validateVideoRequest(value:unknown){const v=value as {prompt?:unknown;duration?:unknown;aspectRatio?:unknown;approvedCostUsd?:unknown;requestId?:unknown};if(!v||typeof v.prompt!=='string'||!v.prompt.trim()||v.prompt.length>2000||![4,6,8,10].includes(v.duration as number)||!['16:9','9:16'].includes(v.aspectRatio as string)||typeof v.requestId!=='string'||!/^[A-Za-z0-9-]{1,100}$/.test(v.requestId))throw Error('Provide a shot prompt, duration, framing and request ID');const duration=v.duration as VideoDuration;if(v.approvedCostUsd!==videoEstimate(duration))throw Error('Confirm the current estimated video cost before generating');return {prompt:v.prompt.trim(),duration,aspectRatio:v.aspectRatio as '16:9'|'9:16',requestId:v.requestId}}
export async function startVideo(value:ReturnType<typeof validateVideoRequest>){return jobTicket('interactions/'+await createOmni(value.prompt,value.duration,value.aspectRatio),{durationCeiling:10,aspectRatio:value.aspectRatio})}
export function videoExtensionInfo(ticket:string){
 const name=operationName(ticket),data=verify(ticket);
 if(!name.startsWith('interactions/'))throw new VideoTicketError('Only Omni-generated videos support continuation. The original video remains available.',400);
 // Old Omni tickets predate continuation, so they represent a single <=10s clip.
 const durationCeiling=data.durationCeiling===undefined?10:data.durationCeiling;
 if(typeof durationCeiling!=='number'||![10,20,30,40].includes(durationCeiling))throw new VideoTicketError('Invalid video duration record',400);
 if(data.aspectRatio!==undefined&&!['16:9','9:16'].includes(data.aspectRatio as string))throw new VideoTicketError('Invalid video framing record',400);
 const nextCeiling=durationCeiling<40?durationCeiling+10:null;
 return {canExtend:nextCeiling!==null,durationCeiling,nextCeiling,estimatedCostUsd:nextCeiling===null?null:extensionEstimate(nextCeiling),aspectRatio:data.aspectRatio as '16:9'|'9:16'|undefined};
}
export function validateVideoExtension(value:unknown){
 const v=value as {prompt?:unknown;parentTicket?:unknown;aspectRatio?:unknown;approvedCostUsd?:unknown;requestId?:unknown};
 if(!v||typeof v.prompt!=='string'||!v.prompt.trim()||v.prompt.length>2000||typeof v.parentTicket!=='string'||typeof v.requestId!=='string'||!/^[A-Za-z0-9-]{1,100}$/.test(v.requestId)||!['16:9','9:16'].includes(v.aspectRatio as string))throw Error('Provide a continuation prompt, parent video ticket, framing and request ID.');
 const info=videoExtensionInfo(v.parentTicket);
 if(info.nextCeiling===null)throw Error('This video has reached the 40-second continuation limit.');
 if(info.aspectRatio&&v.aspectRatio!==info.aspectRatio)throw Error('Continuation must preserve the original framing.');
 if(v.approvedCostUsd!==info.estimatedCostUsd)throw Error('Confirm the current continuation cost estimate before generating.');
 return {prompt:v.prompt.trim(),parentTicket:v.parentTicket,aspectRatio:v.aspectRatio as '16:9'|'9:16',requestId:v.requestId,durationCeiling:info.nextCeiling};
}
export async function extendVideo(value:ReturnType<typeof validateVideoExtension>){
 const name=operationName(value.parentTicket);
 return jobTicket('interactions/'+await createOmni(value.prompt,10,value.aspectRatio,{id:name.slice('interactions/'.length),ceiling:value.durationCeiling}),{durationCeiling:value.durationCeiling,aspectRatio:value.aspectRatio});
}
export async function getVideo(ticket:string):Promise<VideoOperation>{const name=operationName(ticket);if(name.startsWith('interactions/')){try{return await readOmni(name.slice('interactions/'.length))}catch(e){if([404,410].includes((e as {status?:number}).status || 0))throw new VideoTicketError('Video result expired or is no longer available. Your prompt is preserved.',410);throw e}}const operation=new GenerateVideosOperation();operation.name=name;const result=await client().operations.getVideosOperation({operation});return {done:result.done===true,...(result.error?{error:{code:String(result.error.code ?? 'unknown'),message:String(result.error.message ?? 'Video provider error')}}:{}),response:result.response}}
export async function downloadVideo(ticket:string){const operation=await getVideo(ticket);if(!operation.done||operation.error)throw Error('Video is not ready');const video=operation.response?.generatedVideos?.[0]?.video;if(video?.data){
 // Chunked delivery avoids serverless buffered-response limits for inline results.
 const bytes=Buffer.from(video.data,'base64');let offset=0;
 return new Response(new ReadableStream<Uint8Array>({pull(controller){if(offset>=bytes.length){controller.close();return}const end=Math.min(offset+65536,bytes.length);controller.enqueue(new Uint8Array(bytes.subarray(offset,end)));offset=end}}),{headers:{'Content-Type':'video/mp4'}});
 }const uri=video?.uri;if(!uri)throw Error('No downloadable video was returned');let target=new URL(uri);for(let i=0;i<5;i++){if(target.protocol!=='https:'||target.port||target.username||target.password||!['generativelanguage.googleapis.com','storage.googleapis.com'].includes(target.hostname))throw Error('Unexpected video download host');const response=await fetch(target,{headers:target.hostname==='generativelanguage.googleapis.com'?{'x-goog-api-key':process.env.GEMINI_API_KEY!}:{},redirect:'manual',signal:AbortSignal.timeout(20000)});if([301,302,303,307,308].includes(response.status)){const location=response.headers.get('location');if(!location)throw Error('Video download redirect is missing');target=new URL(location,target);continue}if(!response.ok)throw Error('Video download failed');return response}throw Error('Too many video download redirects')}
export const privateHeaders={'Cache-Control':'no-store'};
