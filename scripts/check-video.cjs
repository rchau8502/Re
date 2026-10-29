// Offline tests only: provider and downloads are stubbed before loading server code.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
let polls=0,reads=[],modelFailure,calls=[],state={done:false},failure,options;
const originalFetch=global.fetch;
let interaction={id:'v1_offline',status:'in_progress'},requests=[],fileState='ACTIVE',pollHttpStatus=200;
global.fetch=async(url,init={})=>{
 requests.push({url:String(url),...init});
 if(init.method==='POST'){
  calls.push(JSON.parse(init.body));
  if(failure){if(failure.status)return Response.json({error:{message:failure.message}},{status:failure.status});throw failure;}
  return Response.json({id:'v1_offline',status:'in_progress'});
 }
 if(String(url).includes('/interactions/'))return Response.json(interaction,{status:pollHttpStatus});
 if(String(url).includes(':download'))return new Response('offline-video',{headers:{'Content-Type':'video/mp4'}});
 if(String(url).includes('/files/'))return Response.json({state:fileState});
 throw Error('Unexpected fetch '+url);
};
const load=Module._load;
Module._load=function(name,parent,main){
 if(name==='@google/genai')return {GenerateVideosOperation:class {},GoogleGenAI:class{constructor(o){options=o;this.models={get:async v=>{reads.push(v);if(modelFailure)throw modelFailure;return {name:'models/veo-3.1-fast-generate-preview',displayName:'Veo Fast'}},generateVideos:async v=>{calls.push(v);if(failure)throw failure;return {name:'models/veo-3.1-fast-generate-preview/operations/test'}}};this.operations={getVideosOperation:async()=>{polls++;return state}}}}};
 return load.call(this,name.startsWith('@/')?path.resolve(__dirname,'..',name.slice(2)):name,parent,main);
};
process.env.GEMINI_API_KEY='offline-key';process.env.VIDEO_ACCESS_CODE='offline-code';
const server=require('../lib/video-server.ts'),access=require('../app/api/video/access/route.ts'),generate=require('../app/api/video/route.ts'),status=require('../app/api/video/status/route.ts'),connection=require('../app/api/video/connection/route.ts'),download=require('../app/api/video/download/route.ts');
const {initialVideo,isVideoSettings}=require('../lib/modules/video/types.ts'),{newWorkspace,isWorkspace}=require('../lib/story.ts');
const base='https://example.test',headers={origin:base,'Content-Type':'application/json'};
function request(route,body,cookie,origin=base){return new Request(base+route,{method:body===undefined?'GET':'POST',headers:{...headers,origin,...(cookie?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})})}
(async()=>{
 assert.equal(server.videoConfigured(),true);
 const localRequest=(origin,host='127.0.0.1:3006')=>new Request('http://localhost:3006/api/video/access',{headers:{origin,host}});
 assert.equal(server.sameOrigin(localRequest('http://127.0.0.1:3006')),true);
 assert.equal(server.sameOrigin(localRequest('http://127.0.0.1:3007')),false);
 assert.equal(server.sameOrigin(localRequest('https://evil.test')),false);
 assert.equal(server.sameOrigin(localRequest('http://127.0.0.1:3006','evil.test')),false);

 assert.equal((await generate.POST(request('/api/video',{}))).status,401);
 assert.equal((await access.POST(request('/api/video/access',{code:'wrong'}))).status,401);
 assert.equal((await access.POST(request('/api/video/access',{code:'offline-code'},undefined,'https://other.test'))).status,403);
 const unlocked=await access.POST(request('/api/video/access',{code:'offline-code'}));assert.equal(unlocked.status,200);
 const cookie=unlocked.headers.get('set-cookie').split(';')[0];assert.match(unlocked.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.equal(server.videoAuthorized(request('/api/video',undefined,cookie)),true);
 assert.equal(server.videoAuthorized(request('/api/video',undefined,cookie+'tampered')),false);
 assert.equal((await connection.GET(request('/api/video/connection'))).status,401);assert.equal(reads.length,0);
 let diagnostic=await connection.GET(request('/api/video/connection',undefined,cookie));assert.equal(diagnostic.status,200);assert.equal(diagnostic.headers.get('cache-control'),'no-store');let health=await diagnostic.json();assert.equal(health.accessible,true);assert.equal(health.generationTested,false);assert.equal(reads.length,1);assert.equal(calls.length,0);assert.deepEqual(reads[0],{model:server.VIDEO_MODEL});
 modelFailure=Object.assign(Error('Denied offline-key offline-code'),{status:403});diagnostic=await connection.GET(request('/api/video/connection',undefined,cookie));health=await diagnostic.json();assert.equal(diagnostic.status,502);assert.equal(health.accessible,false);assert.equal(health.providerStatus,403);assert.equal(health.generationTested,false);assert(!JSON.stringify(health).includes('offline-key'));assert(!JSON.stringify(health).includes('offline-code'));assert.equal(calls.length,0);modelFailure=undefined;
 const payload={prompt:'A quiet dawn over the sea',duration:8,aspectRatio:'16:9',requestId:'test-1',approvedCostUsd:1.10};
 assert.equal((await generate.POST(request('/api/video',{...payload,approvedCostUsd:0},cookie))).status,400);assert.equal(calls.length,0);
 const response=await generate.POST(request('/api/video',payload,cookie));assert.equal(response.status,200);const {ticket}=await response.json();assert.equal(calls.length,1);assert.equal(calls[0].model,'gemini-omni-1.1-flash');assert.equal(calls[0].background,true);assert.equal(calls[0].store,true);assert.equal(calls[0].stream,false);assert.deepEqual(calls[0].response_format,{type:'video',resolution:'720p',aspect_ratio:'16:9',delivery:'uri'});assert.match(calls[0].input,/8 seconds/);assert.equal(requests.filter(r=>r.method==='POST').length,1);
 const omniTicket=ticket;
 assert.equal(requests[0].headers['Api-Revision'],'2026-05-20');
 pollHttpStatus=404;let gone=await status.GET(request('/api/video/status?ticket='+encodeURIComponent(omniTicket),undefined,cookie));assert.equal(gone.status,410);assert.equal((await gone.json()).status,'failed');
 pollHttpStatus=503;assert.equal((await status.GET(request('/api/video/status?ticket='+encodeURIComponent(omniTicket),undefined,cookie))).status,502);pollHttpStatus=200;
 
 interaction={status:'failed',error:{code:13,message:'Internal server issue'}};
 assert.equal((await (await status.GET(request('/api/video/status?ticket='+encodeURIComponent(omniTicket),undefined,cookie))).json()).status,'failed');
 interaction={status:'completed',steps:[{type:'user_input',content:[{type:'video',data:'aW5wdXQ='}]},{type:'model_output',content:[{type:'video',mime_type:'video/mp4',data:'b2ZmbGluZS12aWRlbw=='}]}]};
 const omniPoll=()=>status.GET(request('/api/video/status?ticket='+encodeURIComponent(omniTicket),undefined,cookie));
 assert.equal((await (await omniPoll()).json()).status,'ready');
 let clip=await server.downloadVideo(omniTicket);assert.equal(await clip.text(),'offline-video');
 const large=Buffer.alloc(150000,97);interaction.steps[1].content[0].data=large.toString('base64');
 const streamed=await server.downloadVideo(omniTicket),reader=streamed.body.getReader();let received=0;for(;;){const chunk=await reader.read();if(chunk.done)break;assert(chunk.value.length<=65536);received+=chunk.value.length}assert.equal(received,large.length);
 
 interaction={status:'completed',steps:[{type:'model_output',content:[{type:'video',mime_type:'video/mp4',uri:'https://generativelanguage.googleapis.com/v1beta/files/test:download?alt=media'}]}]};
 fileState='PROCESSING';assert.equal((await (await omniPoll()).json()).status,'pending');fileState='FAILED';assert.equal((await (await omniPoll()).json()).status,'failed');fileState='ACTIVE';assert.equal((await (await omniPoll()).json()).status,'ready');
 clip=await server.downloadVideo(omniTicket);assert.equal(await clip.text(),'offline-video');
 interaction={status:'completed',steps:[{type:'user_input',content:[{type:'video',data:'aW5wdXQ='}]}]};assert.equal((await (await omniPoll()).json()).status,'failed');
 interaction={status:'completed',steps:[{type:'model_output',content:[{type:'video',mime_type:'video/mp4',data:'invalid!'}]}]};await assert.rejects(()=>server.downloadVideo(omniTicket),/Invalid or oversized/);
 interaction={status:'requires_action'};assert.equal((await (await omniPoll()).json()).status,'failed');
 interaction={status:'completed',steps:[{type:'model_output',content:[{type:'video',mime_type:'video/mp4',uri:'https://evil.test/video'}]}]};await assert.rejects(()=>server.downloadVideo(omniTicket),/Unexpected video download host/);
 interaction={status:'completed',steps:[{type:'model_output',content:[{type:'video',mime_type:'image/png',data:'b2ZmbGluZS12aWRlbw=='}]}]};assert.equal((await (await omniPoll()).json()).status,'failed');
 // Existing signed Veo jobs remain readable; new requests never use Veo.
 const legacyTicket=server.jobTicket('models/veo-3.1-fast-generate-preview/operations/test');
 const poll=()=>status.GET(request('/api/video/status?ticket='+encodeURIComponent(legacyTicket),undefined,cookie));
 assert.equal((await (await poll()).json()).status,'pending');
 state={done:true,error:{code:13,message:'Internal server issue'}};const failed=await (await poll()).json();assert.equal(failed.status,'failed');assert.match(failed.error,/13.*Internal server issue/);assert.equal(calls.length,1);
 state={done:true,response:{raiMediaFilteredReasons:['Filtered by provider']}};assert.equal((await (await poll()).json()).status,'failed');
 state={done:true,response:{generatedVideos:[{video:{uri:'https://storage.googleapis.com/example.mp4'}}]}};assert.equal((await (await poll()).json()).status,'ready');
 await assert.rejects(()=>server.getVideo(ticket+'tampered'),/Invalid ticket/);
 const now=Date.now;let expiredTicket;try{Date.now=()=>now()-49*60*60*1000;expiredTicket=server.jobTicket('models/'+server.VIDEO_MODEL+'/operations/expired')}finally{Date.now=now}
 const pollCount=polls;
 let invalid=await status.GET(request('/api/video/status?ticket='+encodeURIComponent(ticket+'tampered'),undefined,cookie));assert.equal(invalid.status,400);assert.equal((await invalid.json()).status,'failed');
 let expired=await status.GET(request('/api/video/status?ticket='+encodeURIComponent(expiredTicket),undefined,cookie));assert.equal(expired.status,410);assert.match((await expired.json()).error,/expired/i);assert.equal(polls,pollCount);
 const expiredDownload=await download.GET(request('/api/video/download?ticket='+encodeURIComponent(expiredTicket),undefined,cookie));assert.equal(expiredDownload.status,410);assert.equal(polls,pollCount);

 state.response.generatedVideos[0].video.uri='https://evil.test/video';await assert.rejects(()=>server.downloadVideo(legacyTicket),/Unexpected video download host/);
 assert.equal(server.safeError(Error('offline-key offline-code')),'[redacted] [redacted]');
 failure=Object.assign(Error('Quota exceeded'),{status:429});let result=await (await generate.POST(request('/api/video',payload,cookie))).json();assert.equal(result.started,false);
 failure=Error('Connection lost');const creationsBefore=calls.length;result=await (await generate.POST(request('/api/video',payload,cookie))).json();assert.equal(result.started,true);assert.equal(calls.length,creationsBefore+1);
 const {videoPollResult,videoFailureHelp}=require('../lib/modules/video/recovery.ts');
 assert.deepEqual(videoPollResult(410,{error:'Video ticket expired'}),{status:'failed',error:'Video ticket expired'});
 assert.equal(videoPollResult(400,{error:'Invalid ticket'}).status,'failed');
 assert.deepEqual(videoPollResult(200,{status:'ready'}),{status:'ready'});
 assert.deepEqual(videoPollResult(200,{status:'pending'}),{status:'pending'});
 assert.throws(()=>videoPollResult(502,{error:'Connection lost'}),/Connection lost/);
 assert.throws(()=>videoPollResult(200,{}),/Unrecognized/);
 assert.equal(videoFailureHelp('Video ticket expired').title,'Video access link expired');
 assert.equal(videoFailureHelp('Provider error 13: Internal server issue').title,'Video provider error');
 assert.equal(videoFailureHelp('Quota exceeded').title,'Video quota or rate limit reached');
 assert.equal(videoFailureHelp('Permission denied').title,'Video access denied');
 assert.equal(videoFailureHelp('Unrecognized failure').title,'This clip could not be generated');
 assert(!videoFailureHelp('Provider error 13: Internal server issue').next.includes('enable billing'));
 const workspace=newWorkspace("Video test");assert.equal(isWorkspace(workspace),true);workspace.video=initialVideo();assert.equal(isWorkspace(JSON.parse(JSON.stringify(workspace))),true);
 assert.equal(isVideoSettings({...initialVideo(),jobs:[{id:'1',prompt:'test',duration:8,aspectRatio:'16:9',createdAt:'now',status:'ready'}]}),false);
 // Continuation uses signed ancestry allowances and verifies readiness before POST.
 const extend=require('../app/api/video/extend/route.ts');
 const {extensionEstimate,retainVideoJobs}=require('../lib/modules/video/types.ts');
 failure=undefined;pollHttpStatus=200;
 const readyInteraction=()=>({model:server.VIDEO_MODEL,status:'completed',steps:[{type:'model_output',content:[{type:'video',mime_type:'video/mp4',data:'b2ZmbGluZS12aWRlbw=='}]}]});
 interaction=readyInteraction();
 const extensionPayload={prompt:'Continue walking into the dawn',parentTicket:omniTicket,aspectRatio:'16:9',requestId:'extend-1',approvedCostUsd:2.20};
 let count=calls.length,fetchCount=requests.length;
 assert.equal((await extend.POST(request('/api/video/extend',extensionPayload))).status,401);
 assert.equal((await extend.POST(request('/api/video/extend',extensionPayload,cookie,'https://evil.test'))).status,403);
 assert.equal(calls.length,count);assert.equal(requests.length,fetchCount);
 assert.equal((await extend.GET(request('/api/video/extend?ticket='+encodeURIComponent(omniTicket),undefined))).status,401);
 let quote=await (await extend.GET(request('/api/video/extend?ticket='+encodeURIComponent(omniTicket),undefined,cookie))).json();
 assert.deepEqual(quote,{canExtend:true,durationCeiling:10,nextCeiling:20,estimatedCostUsd:2.20,aspectRatio:'16:9'});assert.equal(requests.length,fetchCount);
 for(const bad of [{approvedCostUsd:1.10},{aspectRatio:'9:16'},{parentTicket:omniTicket+'bad'},{parentTicket:legacyTicket},{prompt:''},{prompt:'x'.repeat(2001)},{requestId:'bad/id'}])assert.equal((await extend.POST(request('/api/video/extend',{...extensionPayload,...bad},cookie))).status,400);
 assert.equal(calls.length,count);assert.equal(requests.length,fetchCount);
 let expiredOmni;try{Date.now=()=>now()-49*60*60*1000;expiredOmni=server.jobTicket('interactions/expired')}finally{Date.now=now}
 assert.equal((await extend.POST(request('/api/video/extend',{...extensionPayload,parentTicket:expiredOmni},cookie))).status,410);assert.equal(requests.length,fetchCount);
 interaction={status:'in_progress'};let continuation=await extend.POST(request('/api/video/extend',extensionPayload,cookie));assert.equal(continuation.status,409);assert.equal((await continuation.json()).started,false);assert.equal(calls.length,count);
 interaction={status:'failed',error:{message:'Provider refused original'}};assert.equal((await extend.POST(request('/api/video/extend',extensionPayload,cookie))).status,409);assert.equal(calls.length,count);
 pollHttpStatus=503;continuation=await extend.POST(request('/api/video/extend',extensionPayload,cookie));assert.equal(continuation.status,502);assert.equal((await continuation.json()).started,false);assert.equal(calls.length,count);pollHttpStatus=200;
 interaction=readyInteraction();
 continuation=await extend.POST(request('/api/video/extend',{...extensionPayload,durationCeiling:1},cookie));assert.equal(continuation.status,200);
 let extended=await continuation.json();assert.equal(extended.durationCeiling,20);assert.equal(calls.length,count+1);
 assert.equal(calls.at(-1).previous_interaction_id,'v1_offline');assert.match(calls.at(-1).input,/appending.*10 seconds/);assert.match(calls.at(-1).input,/at most 20 seconds/);assert.equal(calls.at(-1).store,true);assert.equal(calls.at(-1).response_format.delivery,'uri');
 assert.equal(server.videoExtensionInfo(omniTicket).durationCeiling,10,'Parent ticket must not change');
 const firstExtensionTicket=extended.ticket;
 for(const ceiling of [30,40]){
  continuation=await extend.POST(request('/api/video/extend',{...extensionPayload,parentTicket:extended.ticket,approvedCostUsd:extensionEstimate(ceiling)},cookie));assert.equal(continuation.status,200);extended=await continuation.json();assert.equal(extended.durationCeiling,ceiling);
 }
 quote=await (await extend.GET(request('/api/video/extend?ticket='+encodeURIComponent(extended.ticket),undefined,cookie))).json();assert.equal(quote.canExtend,false);assert.equal(quote.nextCeiling,null);assert.equal(quote.estimatedCostUsd,null);
 count=calls.length;fetchCount=requests.length;
 assert.equal((await extend.POST(request('/api/video/extend',{...extensionPayload,parentTicket:extended.ticket,approvedCostUsd:5.5},cookie))).status,400);assert.equal(calls.length,count);assert.equal(requests.length,fetchCount);
 // Legacy single-turn Omni tickets have no allowance/framing metadata.
 const oldOmni=server.jobTicket('interactions/old_single');assert.equal(server.videoExtensionInfo(oldOmni).nextCeiling,20);
 failure=Error('Connection lost offline-key');continuation=await extend.POST(request('/api/video/extend',extensionPayload,cookie));let uncertain=await continuation.json();assert.equal(uncertain.started,true);assert(!uncertain.error.includes('offline-key'));assert.equal(calls.length,count+1);
 count=calls.length;failure=Object.assign(Error('Quota exceeded'),{status:429});continuation=await extend.POST(request('/api/video/extend',extensionPayload,cookie));assert.equal((await continuation.json()).started,false);assert.equal(calls.length,count+1);failure=undefined;
 const originalJob={id:'original',prompt:'first shot',duration:8,aspectRatio:'16:9',createdAt:'now',status:'ready',ticket:omniTicket,durationCeiling:10};
 const childJob={...originalJob,id:'child',duration:10,kind:'extension',parentId:'original',ticket:firstExtensionTicket,durationCeiling:20};
 assert(isVideoSettings({...initialVideo(),jobs:[childJob,originalJob]}));
 assert(!isVideoSettings({...initialVideo(),jobs:[{...childJob,durationCeiling:50}]}));
 assert(!isVideoSettings({...initialVideo(),jobs:[{...childJob,parentId:undefined}]}));
 const {serializeWorkspaceBackup,prepareWorkspaceImport}=require('../lib/modules/backup/workspaces.ts');workspace.video={...initialVideo(),jobs:[childJob,originalJob]};
 assert.deepEqual(prepareWorkspaceImport(serializeWorkspaceBackup([workspace],[])).workspaces[0].video.jobs,[childJob,originalJob]);
 workspace.video.continuationDraft={parentId:'child',prompt:'下一幕，镜头跟随两人走向楼梯。'};
 assert.deepEqual(prepareWorkspaceImport(serializeWorkspaceBackup([workspace],[])).workspaces[0].video.continuationDraft,workspace.video.continuationDraft);
 assert(!isVideoSettings({...workspace.video,continuationDraft:{parentId:'child',prompt:'x'.repeat(2001)}}));
 const history=Array.from({length:11},(_,i)=>({...originalJob,id:'unrelated-'+i})).concat(originalJob);
 const retained=retainVideoJobs(history,childJob);assert.equal(retained.length,12);assert.equal(retained[0].id,'child');assert(retained.some(j=>j.id==='original'));
 assert.deepEqual(server.validateVideoRequest({...payload,duration:10}).duration,10);
 console.log('PASS: continuation quote/readiness, signed 10→20→30→40 allowance, cap/framing/price tampering, single paid POST, ambiguous failure recovery, parent retention, legacy Omni and backup lineage. Offline only; no live continuation.');
 console.log('PASS: expired/invalid ticket terminal responses, no provider calls for expired status/download, transient poll preservation, failure guidance, read-only model access (no generation), authentication, denial/redaction, offline video origin, cost guard, Omni background REST creation without retries, inline/URI output, file processing, unavailable interactions, legacy Veo compatibility, pending/ready/provider failure, unknown outcome, ticket integrity, download host restriction, secret redaction and backup compatibility. No live generation performed.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{Module._load=load;global.fetch=originalFetch;delete process.env.GEMINI_API_KEY;delete process.env.VIDEO_ACCESS_CODE});
