const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {selectPassage,passageContext,validatePassage,applyPassage}=require('../lib/modules/writing/passage.ts');
const {createProject}=require('../lib/modules/core/types.ts');
const {saveWriting,getWriting}=require('../lib/modules/writing/index.ts');
const {newWorkspace}=require('../lib/story.ts');
const draft='😀 Before. Aria waits. Aria waits. After.';
const start=draft.lastIndexOf('Aria waits.'),selection=selectPassage('branch-a',draft,start,start+11);
assert.equal(applyPassage('branch-a',draft,selection,'Aria departs.'),'😀 Before. Aria waits. Aria departs. After.');
assert.throws(()=>applyPassage('branch-b',draft,selection,'Change'),/changed/);
assert.throws(()=>applyPassage('branch-a','New prefix. '+draft,selection,'Change'),/changed/);
assert.throws(()=>applyPassage('branch-a',draft,{...selection,original:'Wrong'},'Change'),/matches/);
assert.throws(()=>applyPassage('branch-a',draft,selection,' '),/Replacement/);
assert.throws(()=>selectPassage('branch-a',draft,0,0),/Select/);
assert.throws(()=>selectPassage('branch-a',draft,0,draft.length+1),/Select/);
assert.throws(()=>selectPassage('branch-a','a'.repeat(12001),0,12001),/12,000/);
const long=selectPassage('branch-a','a'.repeat(5000)+'hello'+'z'.repeat(5000),5000,5005);
assert.equal(passageContext(long).before.length,2000);assert.equal(passageContext(long).after.length,2000);
assert.deepEqual(validatePassage(passageContext(selection)),passageContext(selection));
assert.throws(()=>validatePassage({...passageContext(selection),before:'a'.repeat(2001)}));
const project=createProject('Revision test'),context={projectId:project.project.id,branchId:project.project.canonBranchId};
const story={title:'Chapter',premise:'',divergencePoint:'',changesFromCanon:[],alternateTimeline:[],storySummary:'',scene:draft,storyboard:[]};
let data=saveWriting(project,context,'branch-a',{content:story});
data=saveWriting(data,context,'branch-a',{content:story},true);
data=saveWriting(data,context,'branch-a',{content:{...story,scene:applyPassage('branch-a',draft,selection,'Aria departs.')}});
assert.equal(getWriting(data,context,'branch-a').revisions.at(-1).content.scene,draft);assert.deepEqual(data.facts,project.facts);
const {handle}=require('../lib/engine.ts');
const {GeminiProvider}=require('../lib/modules/ai/gemini.ts');
(async()=>{
 delete process.env.GEMINI_API_KEY;
 const body={title:'Passage test',passage:passageContext(selection),instruction:'Tighten the prose',requestId:'test-request'};
 const request=value=>new Request('http://localhost/api/revise-passage',{method:'POST',body:JSON.stringify(value)});
 let response=await handle('revise-passage',request(body));assert.equal(response.status,503);assert.equal((await response.json()).code,'NOT_CONFIGURED');
 for(const invalid of [{instruction:''},{requestId:''},{passage:{original:'',before:'',after:''}},{world:{context:{projectId:'foreign'}}},{preferences:{}},{bible:{}}]){response=await handle('revise-passage',request({...body,...invalid}));assert.equal(response.status,400)}
 response=await handle('revise-passage',request({...body,instruction:'a'.repeat(4001)}));assert.equal(response.status,400);
 response=await handle('revise-passage',request({...body,extra:'a'.repeat(400001)}));assert.equal(response.status,413);
 // Offline provider stub: validates response handling; never sends a network request.
 const generate=GeminiProvider.prototype.generate;process.env.GEMINI_API_KEY='offline-test-only';
 try{
  GeminiProvider.prototype.generate=async()=>({text:JSON.stringify({replacement:'Aria departs.'}),sources:[]});
  response=await handle('revise-passage',request(body));assert.equal(response.status,200);assert.deepEqual(await response.json(),{requestId:'test-request',replacement:'Aria departs.'});
  for(const output of ['not json',JSON.stringify({replacement:''}),JSON.stringify({replacement:'a'.repeat(24001)})]){GeminiProvider.prototype.generate=async()=>({text:output,sources:[]});response=await handle('revise-passage',request(body));assert.equal(response.status,502);assert.equal((await response.json()).code,'INVALID_RESPONSE')}
  const cancelled=new AbortController();cancelled.abort();response=await handle('revise-passage',new Request('http://localhost/api',{method:'POST',body:JSON.stringify(body),signal:cancelled.signal}));assert.equal(response.status,499);
 }finally{GeminiProvider.prototype.generate=generate;delete process.env.GEMINI_API_KEY}
 console.log('PASS: scoped passage replacement, stale-draft rejection, Unicode/repeated-text offsets, bounded context, checkpoint/canon preservation, endpoint validation, missing-key behavior, offline response validation and cancellation.');
})().catch(e=>{console.error(e);process.exitCode=1});
