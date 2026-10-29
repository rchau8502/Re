const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {initialPreferences,newWorkspace,isPreferences,bibleFromNotes}=require('../lib/story.ts');
const {sourceMedia,defaultSourceStyle,sourceStyleGuidance}=require('../lib/modules/writing/source-style.ts');
const {serializeWorkspaceBackup,prepareWorkspaceImport}=require('../lib/modules/backup/workspaces.ts');
const {enableNovel,updateNotebook,confirmChapterContinuity}=require('../lib/modules/novel/index.ts');
const {GeminiProvider}=require('../lib/modules/ai/gemini.ts');
const {handle}=require('../lib/engine.ts');
(async()=>{
 const sourceStyle={followOriginal:true,medium:'Animation',notes:'短促对白、动作表达情绪；保留夜之城的压迫感，但大卫存活。'};
 const workspace=newWorkspace('Source style test');workspace.preferences.sourceStyle=sourceStyle;workspace.preferences.targetChange='David survives';workspace.bible=bibleFromNotes(workspace.title,'Animation','Author-supplied reference');
 assert(isPreferences(initialPreferences()));assert(isPreferences(workspace.preferences));
 for(const medium of sourceMedia)assert(isPreferences({...workspace.preferences,sourceStyle:{...sourceStyle,medium}}));
 for(const invalid of [null,[],{},'match',{...sourceStyle,medium:'Unknown'},{...sourceStyle,followOriginal:'yes'},{...sourceStyle,notes:'x'.repeat(3001)}])assert(!isPreferences({...workspace.preferences,sourceStyle:invalid}));
 const recovered=prepareWorkspaceImport(serializeWorkspaceBackup([workspace],[]));assert.deepEqual(recovered.workspaces[0].preferences.sourceStyle,sourceStyle);
 const legacy=structuredClone(workspace);delete legacy.preferences.sourceStyle;assert(isPreferences(legacy.preferences));assert(prepareWorkspaceImport(JSON.stringify(legacy)).workspaces[0]);
 assert(sourceStyleGuidance().includes('Follow the identified source'));
 assert(sourceStyleGuidance({...sourceStyle,followOriginal:false}).includes('matching is disabled'));
 const comic=sourceStyleGuidance({...sourceStyle,medium:'Comics'},'Prose');assert(comic.includes('panel rhythm'));assert(comic.includes('rather than inserting camera/panel commands'));
 assert(sourceStyleGuidance(undefined,'Storyboard','Film / TV').includes('Film / TV'));
 let story=enableNovel({title:'Test',premise:'A choice',divergencePoint:'',changesFromCanon:[],alternateTimeline:[],storySummary:'',scene:'他放下了信。',storyboard:[]});
 const notebook=structuredClone(story.novel);notebook.outline='One chapter';notebook.chapters[0].continuity.position='Door';story=confirmChapterContinuity(updateNotebook(story,notebook));workspace.story=story;
 const original=GeminiProvider.prototype.generate;let calls=0,prompt='',value;
 GeminiProvider.prototype.generate=async request=>{calls++;prompt=request.prompt;return {text:JSON.stringify(value),sources:[]}};process.env.GEMINI_API_KEY='offline-test-only';
 const req=body=>new Request('http://localhost/api',{method:'POST',body:JSON.stringify(body)});
 try{
  value={action:'ignored',text:'Suggestion'};
  for(const action of ['outline','blueprint','chapter','review','polish']){
   // Outline/review/polish cover prompts; chapter/blueprint require complete gates.
   const n=structuredClone(story.novel);n.chapters[0].blueprint={goal:'Protect letter',emotion:'Uneasy to resolved',conflict:'Rain',beats:'Find, choose, leave',ending:'Board train',withhold:'Sender',pov:'Limited',minChars:1,maxChars:100};
   value=action==='blueprint'?{blueprint:n.chapters[0].blueprint}:{text:'Suggestion'};
   const response=await handle('novel',req({title:workspace.title,preferences:workspace.preferences,bible:workspace.bible,action,notebook:n,chapterId:n.activeChapterId,requestId:'style',instruction:'Follow the source'}));
   assert.equal(response.status,200);assert(prompt.includes(sourceStyle.notes));assert(prompt.includes('requested alternate outcome'));assert(prompt.includes('knowledge/reveal boundaries'));
  }
  value={replacement:'他收起了信。'};
  let response=await handle('revise-passage',req({title:workspace.title,preferences:workspace.preferences,bible:workspace.bible,passage:{original:'他放下了信。',before:'',after:''},instruction:'Keep voice',requestId:'style'}));assert.equal(response.status,200);assert(prompt.includes(sourceStyle.notes));
  value={premise:'Choice',divergencePoint:'Survival',alternateTimeline:['Recover'],consequences:[],keep:[],change:[]};
  response=await handle('timeline',req(workspace));assert.equal(response.status,200);assert(prompt.includes(sourceStyle.notes));
  value=story;response=await handle('rewrite',req(workspace));assert.equal(response.status,200);assert(prompt.includes(sourceStyle.notes));
  value={reply:'Plan',options:[],preferences:initialPreferences()};response=await handle('director',req({...workspace,conversation:[{id:'u',role:'user',text:'Keep original style'}]}));assert.equal(response.status,200);assert.deepEqual((await response.json()).preferences.sourceStyle,sourceStyle);
  value={reply:'Plan',options:[],preferences:{...initialPreferences(),sourceStyle:defaultSourceStyle()}};response=await handle('director',req({...legacy,conversation:[{id:'u',role:'user',text:'Keep existing settings'}]}));assert.equal(response.status,200);assert.equal((await response.json()).preferences.sourceStyle,undefined);
  const snapshot=JSON.stringify(workspace),before=calls;
  response=await handle('rewrite',req({...workspace,preferences:{...workspace.preferences,sourceStyle:{...sourceStyle,notes:'x'.repeat(3001)}}}));assert.equal(response.status,400);assert.equal(calls,before);assert.equal(JSON.stringify(workspace),snapshot);
 }finally{GeminiProvider.prototype.generate=original;delete process.env.GEMINI_API_KEY}
 console.log('PASS: legacy preferences, bounded source profile, combined backup, prose/storyboard media adaptation, all writing prompt paths, author-owned Director profile and invalid-input rejection. Offline provider stubs only; no fidelity guarantee or paid calls.');
})().catch(e=>{console.error(e);process.exitCode=1});
