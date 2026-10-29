const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {exportManuscript,enableNovel,editManuscript,updateNotebook,addChapter,selectChapter,moveChapter,chapterReadiness,confirmChapterContinuity,recordChapter,applyNovelSuggestion}=require('../lib/modules/novel/index.ts');
const {reviewProse}=require('../lib/modules/novel/quality.ts');
const {newWorkspace,isWorkspace,isStory}=require('../lib/story.ts');
const original={title:'原稿',premise:'故事',divergencePoint:'',changesFromCanon:[],alternateTimeline:[],storySummary:'',scene:'信封留在了门边。',storyboard:[]};
let story=enableNovel(original);assert.equal(story.scene,original.scene);assert.equal(story.novel.chapters[0].body,original.scene);assert.equal(original.novel,undefined);assert(isStory(story));
const first=story.novel.activeChapterId;
assert(chapterReadiness(story.novel,first).length>0);
let notebook=structuredClone(story.novel);notebook.outline='调查门边的信';notebook.chapters[0].continuity.position='门边';notebook.chapters[0].blueprint={goal:'找出寄件人',emotion:'不安变为好奇',conflict:'信上没有署名',beats:'看见信，辨认笔迹，决定寻人',ending:'带信出门',withhold:'寄件人的身份',pov:'沈航',minChars:3,maxChars:100};
story=confirmChapterContinuity(updateNotebook(story,notebook));assert.deepEqual(chapterReadiness(story.novel,first),[]);
story=recordChapter(story,first,'发现一封无署名的信');assert.equal(story.novel.chapters[0].committedRevision,story.novel.chapters[0].revision);
let branch=structuredClone(story);story=addChapter(story);const second=story.novel.activeChapterId;assert.notEqual(first,second);assert.equal(story.scene,'');assert.equal(branch.novel.chapters.length,1);
story=editManuscript(story,{scene:'雨水打湿了信纸。'});story=selectChapter(story,first);assert.equal(story.scene,original.scene);story=selectChapter(story,second);assert.equal(story.scene,'雨水打湿了信纸。');
assert(exportManuscript(story).includes(original.scene));assert(exportManuscript(story).includes('雨水打湿了信纸。'));assert.equal(exportManuscript(original),'# 原稿\n\n故事\n\n信封留在了门边。');
const before=structuredClone(story);story=editManuscript(story,{scene:'新写的正文。'});assert.throws(()=>applyNovelSuggestion(story,before,{action:'chapter',text:'旧建议。'}),/changed/);assert.equal(story.scene,'新写的正文。');
story=selectChapter(story,first);story=editManuscript(story,{scene:'他拿走了那封信。'});assert.notEqual(story.novel.chapters[0].committedRevision,story.novel.chapters[0].revision);assert(chapterReadiness(story.novel,second).some(x=>/previous/i.test(x)));
assert.throws(()=>recordChapter(story,first,''),/summary/i);
let chain=enableNovel(original),chainState=structuredClone(chain.novel);chainState.outline='Outline';chainState.chapters[0].continuity.position='Door';chainState.chapters[0].blueprint=structuredClone(story.novel.chapters[0].blueprint);chain=confirmChapterContinuity(updateNotebook(chain,chainState));chain=recordChapter(chain,chain.novel.activeChapterId,'First result');const chainFirst=chain.novel.activeChapterId;
chain=addChapter(chain);chainState=structuredClone(chain.novel);chainState.chapters[1].blueprint=structuredClone(chainState.chapters[0].blueprint);chainState.chapters[1].body='雨水打湿了信纸。';chainState.chapters[1].continuity.position='车站';chain=confirmChapterContinuity(updateNotebook(chain,chainState));chain=recordChapter(chain,chain.novel.activeChapterId,'Second result');chain=selectChapter(chain,chainFirst);chain=editManuscript(chain,{scene:'他推开了门。'});assert.notEqual(chain.novel.chapters[1].committedRevision,chain.novel.chapters[1].revision);
// Chapter order is a dependency, not a change to the prose or recovery history.
let ordered=enableNovel(original);
for(let i=0;i<4;i++){
 if(i)ordered=addChapter(ordered);
 const next=structuredClone(ordered.novel),c=next.chapters[i];
 next.outline='依次调查四封信';c.continuity.position='门边';
 c.title=`第${i+1}章`;c.body=`第${i+1}封信留在了门边。`;
 c.blueprint=structuredClone(story.novel.chapters[0].blueprint);
 ordered=confirmChapterContinuity(updateNotebook(ordered,next));
 ordered=recordChapter(ordered,c.id,`发现第${i+1}封信`);
}
const savedOrder=structuredClone(ordered),ids=ordered.novel.chapters.map(c=>c.id);
ordered=selectChapter(ordered,ids[2]);const beforeMove=structuredClone(ordered);
const moved=moveChapter(ordered,ids[2],-1);
assert.deepEqual(moved.novel.chapters.map(c=>c.id),[ids[0],ids[2],ids[1],ids[3]]);
assert.equal(moved.novel.activeChapterId,ids[2]);assert.equal(moved.scene,beforeMove.scene);
assert.deepEqual(moved.novel.history,beforeMove.novel.history);
assert.deepEqual(moved.novel.continuity,beforeMove.novel.continuity);
assert.deepEqual(moved.novel.chapters[0],beforeMove.novel.chapters[0]);
for(const c of moved.novel.chapters.slice(1)){
 const old=beforeMove.novel.chapters.find(p=>p.id===c.id);
 assert.equal(c.body,old.body);assert.deepEqual(c.blueprint,old.blueprint);assert.equal(c.summary,old.summary);
 assert.equal(c.revision,old.revision+1);assert.notEqual(c.committedRevision,c.revision);
}
assert.deepEqual(ordered,beforeMove);assert.deepEqual(savedOrder.novel.chapters.map(c=>c.id),ids);
const prose=exportManuscript(moved);assert(prose.indexOf('## 第3章')<prose.indexOf('## 第2章'));
assert(isStory(JSON.parse(JSON.stringify(moved))));
const movedBack=moveChapter(moved,ids[2],1);assert.deepEqual(movedBack.novel.chapters.map(c=>c.id),ids);
assert(chapterReadiness(moved.novel,ids[1]).some(x=>/previous/i.test(x)));
assert.throws(()=>moveChapter(ordered,ids[0],-1),/boundary/);
assert.throws(()=>moveChapter(ordered,ids[3],1),/boundary/);
assert.throws(()=>moveChapter(ordered,'foreign',1),/unavailable/);
assert.throws(()=>moveChapter(ordered,ids[0],2),/Invalid/);
assert.throws(()=>applyNovelSuggestion(moved,beforeMove,{action:'chapter',text:'旧顺序的建议。'}),/changed/);
const revisedSummary=recordChapter(savedOrder,ids[1],'新的第二章摘要');
assert.equal(revisedSummary.novel.chapters[1].committedRevision,revisedSummary.novel.chapters[1].revision);
assert.deepEqual(revisedSummary.novel.chapters[0],savedOrder.novel.chapters[0]);
for(const c of revisedSummary.novel.chapters.slice(2))assert.notEqual(c.committedRevision,c.revision);
assert(revisedSummary.novel.history.length>=savedOrder.novel.history.length);
assert.deepEqual(recordChapter(savedOrder,ids[1],savedOrder.novel.chapters[1].summary),savedOrder);
// Book search shares the editor's literal Unicode search and original offsets.
const {findBookPassages,BOOK_SEARCH_LIMIT}=require('../lib/modules/novel/search.ts');
const searchBook=structuredClone(savedOrder.novel);
searchBook.outline='NOTES-ONLY';searchBook.continuity.authorTruth='NOTES-ONLY';searchBook.chapters[0].summary='NOTES-ONLY';
searchBook.chapters[0].body='😀沈航拾信。\nİ ARIA a.b 沈航。';searchBook.chapters[1].body='aria 沈航';searchBook.chapters[2].body='无关正文';searchBook.chapters[3].body='另一章';
const beforeSearch=JSON.stringify(searchBook),hits=findBookPassages(searchBook,'沈航');assert.equal(hits.matches.length,3);assert.equal(hits.hasMore,false);
assert.deepEqual(hits.matches.map(m=>[m.chapterNumber,m.line]),[[1,1],[1,2],[2,1]]);
for(const m of hits.matches)assert.equal(searchBook.chapters.find(c=>c.id===m.chapterId).body.slice(m.start,m.end),m.text);
assert.equal(hits.matches[0].start,2);assert.equal(hits.matches[0].before,'😀');
assert.equal(findBookPassages(searchBook,'a.b').matches.length,1);assert.equal(findBookPassages(searchBook,'aria').matches.length,2);
assert.equal(findBookPassages(searchBook,'NOTES-ONLY').matches.length,0);assert.equal(findBookPassages(searchBook,'').matches.length,0);
assert.equal(JSON.stringify(searchBook),beforeSearch);assert.throws(()=>findBookPassages(searchBook,'x'.repeat(201)),/200/);
searchBook.chapters[0].body='信'.repeat(BOOK_SEARCH_LIMIT);assert.equal(findBookPassages(searchBook,'信').hasMore,false);
searchBook.chapters[0].body+='信';assert.equal(findBookPassages(searchBook,'信').matches.length,BOOK_SEARCH_LIMIT);assert.equal(findBookPassages(searchBook,'信').hasMore,true);
searchBook.chapters.reverse();assert.equal(findBookPassages(searchBook,'沈航').matches[0].chapterId,searchBook.chapters[2].id);
const secrets=structuredClone(chain);secrets.novel.continuity.authorTruth='AUTHOR-ONLY SECRET';assert(!exportManuscript(secrets).includes('AUTHOR-ONLY SECRET'));
const workspace={...newWorkspace('Test'),story};assert(isWorkspace(JSON.parse(JSON.stringify(workspace))));assert(isWorkspace(newWorkspace('Legacy')));
const invalid=structuredClone(story);invalid.novel.chapters.push({...invalid.novel.chapters[0]});assert(!isStory(invalid));
const mismatch=structuredClone(story);mismatch.scene='different';assert(!isStory(mismatch));
assert(reviewProse('风吹过门口，留下半张纸。').length===0);assert(reviewProse('他打开了').some(x=>x.type==='truncated'));
assert(reviewProse('他的任务是完成细纲。').some(x=>x.type==='meta-leak'));
assert(!reviewProse('“我的细纲还没写。”她说。').some(x=>x.blocking));
assert(reviewProse('这不是一次相遇，而是一场命运的安排。').some(x=>x.type==='style-pattern'));
assert(reviewProse('他低下头把门边那封无署名的信捡了起来。\n他低下头把门边那封无署名的信捡了起来。').some(x=>x.type==='repetition'));
const {createProject}=require('../lib/modules/core/types.ts'),{saveWriting}=require('../lib/modules/writing/index.ts'),{exportProject,restoreProject,reidentifyProject}=require('../lib/modules/backup/index.ts');
let project=createProject('Book');project=saveWriting(project,{projectId:project.project.id,branchId:project.project.canonBranchId},workspace.id,{content:story});const restored=restoreProject(exportProject(project));assert.deepEqual(restored.writing.drafts[0].content,story);assert.deepEqual(reidentifyProject(restored).archive.writing.drafts[0].content,story);
(async()=>{
 const {handle}=require('../lib/engine.ts');delete process.env.GEMINI_API_KEY;
 const body={title:'Book',notebook:story.novel,chapterId:first,requestId:'offline',action:'review',instruction:'审查连续性'};
 const req=v=>new Request('http://localhost/api/novel',{method:'POST',body:JSON.stringify(v)});
 let result=await handle('novel',req(body));assert.equal(result.status,503);assert.equal((await result.json()).code,'NOT_CONFIGURED');
 result=await handle('novel',req({...body,notebook:{}}));assert.equal(result.status,400);
 result=await handle('novel',req({...body,action:'chapter',chapterId:second}));assert.equal(result.status,400);
 result=await handle('novel',req({...body,action:'unsupported'}));assert.equal(result.status,400);
 const {GeminiProvider}=require('../lib/modules/ai/gemini.ts');const savedGenerate=GeminiProvider.prototype.generate;let prompt='',responseText=JSON.stringify({text:'A bounded opening outline.'});let providerCalls=0;
 GeminiProvider.prototype.generate=async function(request){providerCalls++;prompt=request.prompt;return {text:responseText,sources:[]}};process.env.GEMINI_API_KEY='offline-not-a-key';
 try {
  const notebook=structuredClone(story.novel);notebook.chapters[1].body='OTHER CHAPTER BODY MUST NOT BE SENT';notebook.chapters[0].continuity.authorTruth='Unrevealed sender identity';notebook.continuity.authorTruth='LEGACY FUTURE MUST NOT BE SENT';
  const input={...body,notebook};
  for(const action of ['outline','chapter','review','polish']){result=await handle('novel',req({...input,action}));assert.equal(result.status,200);assert.equal((await result.json()).action,action);assert(!prompt.includes('OTHER CHAPTER BODY MUST NOT BE SENT'));assert(prompt.includes('Unrevealed sender identity'));assert(!prompt.includes('LEGACY FUTURE MUST NOT BE SENT'));}
  result=await handle('novel',req({...input,action:'analyze',reference:'A letter lay by the door.'}));assert.equal(result.status,200);
  responseText=JSON.stringify({blueprint:notebook.chapters[0].blueprint});result=await handle('novel',req({...input,action:'blueprint'}));assert.equal(result.status,200);
  responseText=JSON.stringify({blueprint:{...notebook.chapters[0].blueprint,goal:''}});result=await handle('novel',req({...input,action:'blueprint'}));assert.equal(result.status,502);
  const count=providerCalls;result=await handle('novel',req({...input,world:{context:{projectId:'foreign'}}}));assert.equal(result.status,400);assert.equal(providerCalls,count);
  assert.equal(story.scene,'他拿走了那封信。');
  for(const fault of [{status:429},{status:503},{name:'TimeoutError'},{status:403}]){
   let attempts=0;
   GeminiProvider.prototype.generate=async()=>{attempts++;throw Object.assign(new Error('offline provider failure'),fault)};
   const snapshot=JSON.stringify(input);
   result=await handle('novel',req({...input,action:'outline'}));
   assert.equal(result.status,fault.status===429?429:fault.status===403?502:fault.name==='TimeoutError'?504:503);
   assert.equal(attempts,1,'An ambiguous or refused text generation must not retry automatically');
   assert.equal(JSON.stringify(input),snapshot,'Provider failure must preserve the submitted notebook');
  }
 }finally{GeminiProvider.prototype.generate=savedGenerate;delete process.env.GEMINI_API_KEY;}
 const originalFetch=global.fetch;let transportAttempts=0;
 process.env.GEMINI_API_KEY='offline-private-marker';
 try{
  const cases=[[400,502,'PROVIDER_REJECTED_REQUEST'],[401,502,'AUTHENTICATION_FAILED'],[403,502,'AUTHENTICATION_FAILED'],[404,502,'MODEL_UNAVAILABLE'],[408,504,'TIMED_OUT'],[422,502,'PROVIDER_REJECTED_REQUEST'],[429,429,'RATE_LIMITED'],[500,503,'PROVIDER_UNAVAILABLE'],[503,503,'PROVIDER_UNAVAILABLE'],[504,504,'TIMED_OUT']];
  for(const [status,expectedStatus,expectedCode] of cases){
   transportAttempts=0;
   global.fetch=async(url,options)=>{transportAttempts++;assert.equal(new Headers(options.headers).get('x-server-timeout'),'60');return new Response(JSON.stringify({error:{code:status,message:'offline-private-marker sensitive provider body',status:'UNAVAILABLE'}}),{status,headers:{'Content-Type':'application/json'}})};
   const snapshot=JSON.stringify(body);
   result=await handle('novel',req({...body,action:'outline'}));const payload=await result.json();
   assert.equal(result.status,expectedStatus);assert.equal(payload.code,expectedCode);assert.equal(payload.providerStatus,status);
   assert.equal(transportAttempts,1,'The actual SDK transport must not retry a billable request');
   assert(!JSON.stringify(payload).includes('offline-private-marker'));assert(!JSON.stringify(payload).includes('sensitive provider body'));
   assert.equal(JSON.stringify(body),snapshot);
  }
  for(const [fault,expectedCode] of [[new DOMException('offline','TimeoutError'),'TIMED_OUT'],[new TypeError('offline',{cause:{code:'UND_ERR_CONNECT_TIMEOUT'}}),'TIMED_OUT'],[new TypeError('offline',{cause:{code:'ENOTFOUND'}}),'NETWORK_ERROR']]){
   transportAttempts=0;global.fetch=async()=>{transportAttempts++;throw fault};
   result=await handle('novel',req({...body,action:'outline'}));assert.equal((await result.json()).code,expectedCode);assert.equal(transportAttempts,1);
  }
  for(const [reason,status,code] of [[new DOMException('deadline','TimeoutError'),504,'TIMED_OUT'],[new DOMException('cancelled','AbortError'),499,'CANCELLED']]){
   transportAttempts=0;
   result=await handle('novel',new Request('http://localhost/api/novel',{method:'POST',body:JSON.stringify({...body,action:'outline'}),signal:AbortSignal.abort(reason)}));
   assert.equal(result.status,status);assert.equal((await result.json()).code,code);assert.equal(transportAttempts,0);
  }
  transportAttempts=0;
  global.fetch=async()=>{transportAttempts++;return new Response(JSON.stringify({candidates:[{content:{role:'model',parts:[{text:JSON.stringify({text:'一次真实 SDK 解析的离线建议。'})}]},finishReason:'STOP'}]}),{status:200,headers:{'Content-Type':'application/json'}})};
  result=await handle('novel',req({...body,action:'outline'}));assert.equal(result.status,200);assert.equal((await result.json()).text,'一次真实 SDK 解析的离线建议。');assert.equal(transportAttempts,1);
  for(const [reason,status,code] of [[new DOMException('deadline','TimeoutError'),504,'TIMED_OUT'],[new DOMException('cancelled','AbortError'),499,'CANCELLED']]){
   const controller=new AbortController();transportAttempts=0;
   global.fetch=async(url,options)=>{transportAttempts++;return new Promise((resolve,reject)=>{options.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true});controller.abort(reason)})};
   result=await handle('novel',new Request('http://localhost/api/novel',{method:'POST',body:JSON.stringify({...body,action:'outline'}),signal:controller.signal}));
   assert.equal(result.status,status);assert.equal((await result.json()).code,code);assert.equal(transportAttempts,1);
  }
 }finally{global.fetch=originalFetch;delete process.env.GEMINI_API_KEY}
 console.log('PASS: actual SDK transport preserves HTTP error status, secret-safe classifications, 60-second request timeout, success parsing, caller cancellation and deadline distinctions with no automatic retries.');
 console.log('PASS: legacy compatibility, exact manuscript preservation, blueprint gate, chapter switching/reordering, bounded cross-chapter Unicode search, order and summary dependency invalidation, previous-chapter gate, stale AI rejection, branch isolation, prose diagnostics, workspace/world archive roundtrip, and missing-key validation. No live generation.');
})().catch(e=>{console.error(e);process.exitCode=1});
