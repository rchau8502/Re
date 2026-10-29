import {videoAuthorized,sameOrigin,videoExtensionInfo,validateVideoExtension,getVideo,extendVideo,safeError,privateHeaders,VideoTicketError} from '@/lib/video-server';
export const dynamic='force-dynamic';export const maxDuration=120;
export function GET(request:Request){
 if(!videoAuthorized(request))return Response.json({error:'Unlock video access first'},{status:401,headers:privateHeaders});
 try{return Response.json(videoExtensionInfo(new URL(request.url).searchParams.get('ticket') || ''),{headers:privateHeaders})}
 catch(e){return Response.json({error:safeError(e)},{status:e instanceof VideoTicketError?e.status:400,headers:privateHeaders})}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Origin not allowed',started:false},{status:403,headers:privateHeaders});
 if(!videoAuthorized(request))return Response.json({error:'Unlock video access first',started:false},{status:401,headers:privateHeaders});
 let input;
 try{const raw=await request.text();if(raw.length>12000)throw Error('Request is too large');input=validateVideoExtension(JSON.parse(raw))}
 catch(e){return Response.json({error:safeError(e),started:false},{status:e instanceof VideoTicketError?e.status:400,headers:privateHeaders})}
 let attempted=false;
 try{
  const parent=await getVideo(input.parentTicket);
  if(!parent.done||parent.error||!parent.response?.generatedVideos?.[0]?.video)return Response.json({error:'The original video must be ready before continuation. No new request was submitted.',started:false},{status:409,headers:privateHeaders});
  attempted=true;
  return Response.json({ticket:await extendVideo(input),requestId:input.requestId,durationCeiling:input.durationCeiling},{headers:privateHeaders});
 }catch(e){
  const status=(e as {status?:number})?.status;
  const rejected=typeof status==='number'&&status>=400&&status<500&&status!==408;
  return Response.json({error:safeError(e),started:attempted&&!rejected},{status:e instanceof VideoTicketError?e.status:502,headers:privateHeaders});
 }
}
