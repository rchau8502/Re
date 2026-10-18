import {videoAuthorized,videoConfigured,videoConnection,VIDEO_MODEL,safeError,privateHeaders} from '@/lib/video-server';
export const dynamic='force-dynamic';export const maxDuration=30;
export async function GET(request:Request){
 if(!videoAuthorized(request))return Response.json({error:'Unlock video access first'},{status:401,headers:privateHeaders});
 if(!videoConfigured())return Response.json({error:'Video access is not configured on the server'},{status:503,headers:privateHeaders});
 try{return Response.json(await videoConnection(),{headers:privateHeaders})}
 catch(e){const code=(e as {status?:unknown})?.status;return Response.json({accessible:false,model:VIDEO_MODEL,generationTested:false,checkedAt:new Date().toISOString(),...(typeof code==='number'?{providerStatus:code}:{}),error:safeError(e)},{status:502,headers:privateHeaders})}
}
