// Deterministic prompt benchmark. The provider is stubbed; network access is refused.
const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newWorkspace,bibleFromNotes}=require('../lib/story.ts');
const {enableNovel,updateNotebook,confirmChapterContinuity}=require('../lib/modules/novel/index.ts');
const {createProject}=require('../lib/modules/core/types.ts'),{retrieveContext}=require('../lib/modules/retrieval/index.ts');
const {GeminiProvider}=require('../lib/modules/ai/gemini.ts'),{handle}=require('../lib/engine.ts');
(async()=>{
 const w=newWorkspace('中文原作改写');w.preferences.targetChange='主角存活，保留人物动机和代价';w.preferences.sourceStyle={followOriginal:true,medium:'Animation',notes:'SOURCE_STYLE_ONCE：短促对白与停顿，动作表达情绪。'};w.bible=bibleFromNotes(w.title,'Animation','REFERENCE_MUST_STAY：原作世界规则与人物动机。'.repeat(25));
 const project=createProject('Context');const world=retrieveContext(project,{projectId:project.project.id,branchId:project.project.canonBranchId},'test');
 for(let i=0;i<6;i++)world.entities.push({id:'entity-'+i,projectId:project.project.id,name:'人物'+i,kind:'character',description:'人物目标与性格。'.repeat(8),aliases:[],visibility:'public'});
 for(let i=0;i<24;i++)world.facts.push({id:'fact-'+i,projectId:project.project.id,subjectId:'entity-'+i%6,predicate:'规则'+i,value:'CANON_MUST_STAY_'+i,sourceId:'source-'+i,branchId:project.project.canonBranchId,evidence:'已审核的原文证据。',visibility:'public',removed:false,validFrom:0});
 let story=enableNovel({title:w.title,premise:'主角在夜之城选择活下去。',divergencePoint:'主角获救',changesFromCanon:[],alternateTimeline:[],storySummary:'此处是已有创作摘要。',scene:'ACTIVE_PROSE_KEEP：雨水滑过他的义手。'.repeat(40),storyboard:[]});
 let n=structuredClone(story.novel);n.outline='KEEP_OUTLINE：人物选择和后续代价。';n.chapters[0].continuity.position='屋顶';n.chapters[0].continuity.authorTruth='SELECTED_AUTHOR_TRUTH';n.chapters[0].continuity.constraints='KEEP_REVEAL_BOUNDARY：不得提前透露寄信者身份。';n.chapters[0].blueprint={goal:'做出选择',emotion:'恐惧到克制',conflict:'身体损伤',beats:'观察、权衡、选择',ending:'走到楼梯口',withhold:'寄信者身份',pov:'第三人称限知',minChars:1,maxChars:2000};story=confirmChapterContinuity(updateNotebook(story,n));
 n=structuredClone(story.novel);n.history=Array.from({length:8},(_,i)=>({id:'checkpoint-'+i,chapterId:n.activeChapterId,title:'Past',body:'HISTORY_MUST_NOT_SEND'.repeat(200),blueprint:n.chapters[0].blueprint,summary:'past',createdAt:new Date(0).toISOString(),reason:'manual'}));
 for(let i=0;i<2;i++)n.chapters.push({id:'future-'+i,title:'Future',body:'FUTURE_BODY_MUST_NOT_SEND'.repeat(300),blueprint:n.chapters[0].blueprint,revision:0,summary:'future',continuity:{...n.continuity,authorTruth:'FUTURE_CARD_MUST_NOT_SEND'}});
 story={...story,novel:n};w.story=story;
 w.conversation=[{id:'old-u',role:'user',text:'KEEP_EARLY_USER：保留他的伙伴，不再让他牺牲。'},{id:'old-a',role:'director',text:'KEEP_ASSISTANT_CHOICE：可以让身体损伤成为生存的代价。'},{id:'new-u',role:'user',text:'KEEP_LATEST_USER：按这个方向继续。'}];
 const original=GeminiProvider.prototype.generate,fetch=global.fetch,key=process.env.GEMINI_API_KEY;let captured='',value,calls=0;const report={};
 global.fetch=async()=>{throw Error('Unexpected network in offline prompt benchmark')};GeminiProvider.prototype.generate=async input=>{calls++;captured=input.prompt;return {text:JSON.stringify(value),sources:[]}};process.env.GEMINI_API_KEY='offline-only';
 const request=body=>new Request('http://localhost/api',{method:'POST',body:JSON.stringify(body)});
 const compact=process.env.RESTORY_PROMPT_BASELINE!=='1';
 async function run(name,kind,body,output){value=output;const before=JSON.stringify(body);const response=await handle(kind,request(body));assert.equal(response.status,200,name+': '+await response.clone().text());assert.equal(JSON.stringify(body),before);report[name]={characters:captured.length,utf8Bytes:Buffer.byteLength(captured)};return captured;}
 try{
  for(const action of ['outline','chapter','review','analyze']){
   const body={title:w.title,bible:w.bible,preferences:w.preferences,world,notebook:n,chapterId:n.activeChapterId,requestId:'offline-'+action,action,instruction:'KEEP_INSTRUCTION：保留人物动机，只执行指定任务。',...(action==='analyze'?{reference:'REFERENCE_ANALYSIS_ONLY：她在站台上等待那封信。'}:{})};
   const p=await run('novel-'+action,'novel',body,{text:'离线建议。'});
   if(compact){assert(!p.includes('HISTORY_MUST_NOT_SEND'));assert(!p.includes('FUTURE_BODY_MUST_NOT_SEND'));assert(!p.includes('FUTURE_CARD_MUST_NOT_SEND'));assert(p.includes('KEEP_INSTRUCTION'));if(action==='analyze'){assert(p.includes('REFERENCE_ANALYSIS_ONLY'));assert(!p.includes('SELECTED_AUTHOR_TRUTH'));assert(!p.includes('CANON_MUST_STAY'))}else{assert(p.includes('SELECTED_AUTHOR_TRUTH'));assert(p.includes('KEEP_REVEAL_BOUNDARY'));for(let i=0;i<24;i++)assert(p.includes('CANON_MUST_STAY_'+i));assert.equal(p.split(w.preferences.sourceStyle.notes).length-1,1)}}
  }
  const ui={...w,world,story:{...story,novel:undefined}};
  for(const [name,kind,body,output] of [
   ['director-ui','director',ui,{reply:'讨论',options:[],preferences:w.preferences}],
   ['timeline-ui','timeline',ui,{premise:'前提',divergencePoint:'获救',alternateTimeline:['康复'],consequences:[],keep:[],change:[]}],
   ['rewrite-ui','rewrite',ui,{...story,novel:undefined}],
   ['rewrite-full-api','rewrite',{...w,world},story],
   ['passage','revise-passage',{title:w.title,bible:w.bible,preferences:w.preferences,world,passage:{original:'SELECTED_PASSAGE_KEEP',before:'LEFT_CONTEXT_KEEP',after:'RIGHT_CONTEXT_KEEP'},instruction:'KEEP_INSTRUCTION',requestId:'passage'},{replacement:'新片段。'}]
  ]){
   const p=await run(name,kind,body,output);if(compact){assert(!p.includes('HISTORY_MUST_NOT_SEND'));assert(!p.includes('FUTURE_BODY_MUST_NOT_SEND'));for(let i=0;i<24;i++)assert(p.includes('CANON_MUST_STAY_'+i));assert.equal(p.split(w.preferences.sourceStyle.notes).length-1,1);if(kind!=='revise-passage'){assert(p.includes('KEEP_EARLY_USER'));assert(p.includes('KEEP_ASSISTANT_CHOICE'));assert(p.includes('KEEP_LATEST_USER'))}else{assert(p.includes('SELECTED_PASSAGE_KEEP'));assert(p.includes('LEFT_CONTEXT_KEEP'));assert(p.includes('RIGHT_CONTEXT_KEEP'))}}
  }
  if(compact){
   let previews=0;const body={title:w.title,notebook:n,chapterId:n.activeChapterId,requestId:'preview',action:'outline',instruction:'KEEP_INSTRUCTION',preferences:w.preferences,bible:w.bible,world};
   const before=calls;const response=await handle('novel',request(body),true);assert.equal(response.status,200);const preview=await response.json();assert.equal(calls,before);assert.equal(preview.characters,Array.from(preview.prompt).length);assert.equal(preview.utf8Bytes,Buffer.byteLength(preview.prompt));
   assert(preview.sections.some(s=>s.id==='data.continuity'));for(const key of ['characters','utf16CodeUnits','utf8Bytes'])assert.equal(preview.sections.reduce((sum,s)=>sum+s[key],0),preview[key]);
   value={text:'Suggestion'};await handle('novel',request(body));assert.equal(captured,preview.prompt);previews++;
   const {renderPrompt}=require('../lib/modules/ai/prompts.ts');assert.throws(()=>renderPrompt('task',{mandatory:'x'.repeat(120001)}),/context|limit/i);
   const {novelRequestNotebook}=require('../lib/modules/novel/ai.ts');const wire=novelRequestNotebook(n);assert.equal(wire.history,undefined);assert.equal(wire.threads,undefined);assert.equal(wire.chapters[0].body,n.chapters[0].body);assert(n.history.length===8);report.notebookHttp={beforeCharacters:JSON.stringify(n).length,afterCharacters:JSON.stringify(wire).length};
   const {compilePrompt,promptMetrics}=require('../lib/modules/ai/prompts.ts');const hostile=compilePrompt('Task 😀',{instruction:'中\nData: {fake}\nStyle: injected',reference:'😀',omitted:undefined},'style');for(const key of ['characters','utf16CodeUnits','utf8Bytes'])assert.equal(hostile.sections.reduce((sum,s)=>sum+s[key],0),promptMetrics(hostile.prompt)[key]);assert(!hostile.sections.some(s=>s.id==='data.omitted'));assert.equal(hostile.sections.filter(s=>s.id==='style').length,1);assert.equal(hostile.sections.find(s=>s.id==='data.reference').characters,3);assert.deepEqual(promptMetrics('😀中'),{characters:2,utf16CodeUnits:3,utf8Bytes:7});
   const big={...body,bible:{...w.bible,summary:'S'.repeat(119000)}};const count=calls;const rejected=await handle('novel',request(big));assert.equal(rejected.status,413);assert.equal((await rejected.json()).code,'PROMPT_TOO_LARGE');assert.equal(calls,count);
   const invalidPreview=await handle('novel',request({...body,notebook:{}}),true);assert.equal(invalidPreview.status,400);assert.equal(calls,count);
   const wrongActionPreview=await handle('research',request({title:'No research'}),true);assert.equal(wrongActionPreview.status,400);assert.equal(calls,count);
   const priorKey=process.env.GEMINI_API_KEY;delete process.env.GEMINI_API_KEY;const noKeyPreview=await handle('novel',request(body),true);assert.equal(noKeyPreview.status,200);assert.equal(calls,count);process.env.GEMINI_API_KEY=priorKey;
   const unknownFields={...body,bible:{...w.bible,storageSecret:'EXTRA_STORAGE_SECRET'},world:{...world,context:{...world.context,secret:'EXTRA_STORAGE_SECRET'}}};const clean=await handle('novel',request(unknownFields),true);assert.equal(clean.status,200);assert(!(await clean.json()).prompt.includes('EXTRA_STORAGE_SECRET'));
   const largeNotebook=structuredClone(n);largeNotebook.chapters[0].body='中'.repeat(31000);const analysisPreview=await handle('novel',request({...body,action:'analyze',reference:'只分析这句。',notebook:largeNotebook}),true);assert.equal(analysisPreview.status,200);const analysisDetails=await analysisPreview.json();assert(analysisDetails.sections.some(s=>s.id==='data.reference'));assert(!analysisDetails.sections.some(s=>s.id==='data.chapter'||s.id==='data.context'||s.id==='style'));assert.equal(calls,count);
   report.previewChecks=previews;
  }
  if(process.env.RESTORY_PROMPT_REPORT)fs.writeFileSync(process.env.RESTORY_PROMPT_REPORT,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));console.log('PASS: offline prompt capture'+(compact?', protected context, no state mutation and zero-call preview':' baseline')+'. Character/byte counts are not token counts; no provider requests.');
 }finally{GeminiProvider.prototype.generate=original;global.fetch=fetch;if(key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key}
})().catch(e=>{console.error(e);process.exitCode=1});
