// Offline tests only: provider and downloads are stubbed before loading server code.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
let reads=[],modelFailure,calls=[],state={done:false},failure,options;
const load=Module._load;
Module._load=function(name,parent,main){
 if(name==='@google/genai')return {GenerateVideosOperation:class {},GoogleGenAI:class{constructor(o){options=o;this.models={get:async v=>{reads.push(v);if(modelFailure)throw modelFailure;return {name:'models/veo-3.1-fast-generate-preview',displayName:'Veo Fast'}},generateVideos:async v=>{calls.push(v);if(failure)throw failure;return {name:'models/veo-3.1-fast-generate-preview/operations/test'}}};this.operations={getVideosOperation:async()=>state}}}};
 return load.call(this,name.startsWith('@/')?path.resolve(__dirname,'..',name.slice(2)):name,parent,main);
};
process.env.GEMINI_API_KEY='offline-key';process.env.VIDEO_ACCESS_CODE='offline-code';
const server=require('../lib/video-server.ts'),access=require('../app/api/video/access/route.ts'),generate=require('../app/api/video/route.ts'),status=require('../app/api/video/status/route.ts'),connection=require('../app/api/video/connection/route.ts');
const {initialVideo,isVideoSettings}=require('../lib/modules/video/types.ts'),{newWorkspace,isWorkspace}=require('../lib/story.ts');
const base='https://example.test',headers={origin:base,'Content-Type':'application/json'};
function request(route,body,cookie,origin=base){return new Request(base+route,{method:body===undefined?'GET':'POST',headers:{...headers,origin,...(cookie?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})})}
(async()=>{
 assert.equal(server.videoConfigured(),true);
 assert.equal((await generate.POST(request('/api/video',{}))).status,401);
 assert.equal((await access.POST(request('/api/video/access',{code:'wrong'}))).status,401);
 assert.equal((await access.POST(request('/api/video/access',{code:'offline-code'},undefined,'https://other.test'))).status,403);
 const unlocked=await access.POST(request('/api/video/access',{code:'offline-code'}));assert.equal(unlocked.status,200);
 const cookie=unlocked.headers.get('set-cookie').split(';')[0];assert.match(unlocked.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.equal(server.videoAuthorized(request('/api/video',undefined,cookie)),true);
 assert.equal(server.videoAuthorized(request('/api/video',undefined,cookie+'tampered')),false);
 assert.equal((await connection.GET(request('/api/video/connection'))).status,401);assert.equal(reads.length,0);
 let diagnostic=await connection.GET(request('/api/video/connection',undefined,cookie));assert.equal(diagnostic.status,200);assert.equal(diagnostic.headers.get('cache-control'),'no-store');let health=await diagnostic.json();assert.equal(health.accessible,true);assert.equal(health.generationTested,false);assert.equal(reads.length,1);assert.equal(calls.length,0);assert.deepEqual(reads[0],{model:server.VIDEO_MODEL});
 modelFailure=Object.assign(Error('Denied offline-key offline-code'),{status:403});diagnostic=await connection.GET(request('/api/video/connection',undefined,cookie));health=await diagnostic.json();assert.equal(diagnostic.status,502);assert.equal(health.accessible,false);assert.equal(health.providerStatus,403);assert.equal(health.generationTested,false);assert(!JSON.stringify(health).includes('offline-key'));assert(!JSON.stringify(health).includes('offline-code'));assert.equal(calls.length,0);modelFailure=undefined;
 const payload={prompt:'A quiet dawn over the sea',duration:8,aspectRatio:'16:9',requestId:'test-1',approvedCostUsd:.8};
 assert.equal((await generate.POST(request('/api/video',{...payload,approvedCostUsd:0},cookie))).status,400);assert.equal(calls.length,0);
 const response=await generate.POST(request('/api/video',payload,cookie));assert.equal(response.status,200);const {ticket}=await response.json();assert.equal(calls.length,1);assert.equal(calls[0].config.personGeneration,'allow_all');assert.equal(calls[0].config.numberOfVideos,1);assert.equal(options.httpOptions.retryOptions.attempts,1);
 const poll=()=>status.GET(request('/api/video/status?ticket='+encodeURIComponent(ticket),undefined,cookie));
 assert.equal((await (await poll()).json()).status,'pending');
 state={done:true,error:{code:13,message:'Internal server issue'}};const failed=await (await poll()).json();assert.equal(failed.status,'failed');assert.match(failed.error,/13.*Internal server issue/);assert.equal(calls.length,1);
 state={done:true,response:{raiMediaFilteredReasons:['Filtered by provider']}};assert.equal((await (await poll()).json()).status,'failed');
 state={done:true,response:{generatedVideos:[{video:{uri:'https://storage.googleapis.com/example.mp4'}}]}};assert.equal((await (await poll()).json()).status,'ready');
 await assert.rejects(()=>server.getVideo(ticket+'tampered'),/Invalid ticket/);
 state.response.generatedVideos[0].video.uri='https://evil.test/video';await assert.rejects(()=>server.downloadVideo(ticket),/Unexpected video download host/);
 assert.equal(server.safeError(Error('offline-key offline-code')),'[redacted] [redacted]');
 failure=Object.assign(Error('Quota exceeded'),{status:429});let result=await (await generate.POST(request('/api/video',payload,cookie))).json();assert.equal(result.started,false);
 failure=Error('Connection lost');result=await (await generate.POST(request('/api/video',payload,cookie))).json();assert.equal(result.started,true);
 const workspace=newWorkspace("Video test");assert.equal(isWorkspace(workspace),true);workspace.video=initialVideo();assert.equal(isWorkspace(JSON.parse(JSON.stringify(workspace))),true);
 assert.equal(isVideoSettings({...initialVideo(),jobs:[{id:'1',prompt:'test',duration:8,aspectRatio:'16:9',createdAt:'now',status:'ready'}]}),false);
 console.log('PASS: read-only model access (no generation), authentication, denial/redaction, offline video origin, cost guard, corrected parameter, single SDK attempt, pending/ready/provider failure, unknown outcome, ticket integrity, download host restriction, secret redaction and backup compatibility. No live generation performed.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{Module._load=load;delete process.env.GEMINI_API_KEY;delete process.env.VIDEO_ACCESS_CODE});
