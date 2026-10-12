const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {createSaveQueue}=require('../lib/modules/writing/save-queue.ts');
const {textMetrics,findPassages}=require('../lib/modules/writing/text.ts');
let now=0,nextId=0;const timers=new Map();
const clock={set(fn,ms){const id=++nextId;timers.set(id,{fn,at:now+ms});return id},clear(id){timers.delete(id)}};
function tick(ms){const end=now+ms;while(true){const due=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn()}now=end}
const saved=[],errors=[];let failing=false;
const queue=createSaveQueue(v=>{if(failing)throw Error('Quota');saved.push(v)},e=>errors.push(e.message),clock);
queue.schedule('parent','first');tick(200);queue.schedule('parent','latest');tick(499);assert.deepEqual(saved,[]);tick(1);assert.deepEqual(saved,['latest']);
queue.schedule('parent','parent text');queue.schedule('child','child text');queue.flush();assert.deepEqual(saved.slice(-2),['parent text','child text']);tick(3000);assert.equal(saved.length,3);
for(let i=0;i<10;i++){queue.schedule('parent','continuous '+i);tick(200)}assert.equal(saved.at(-1),'continuous 9');
failing=true;queue.schedule('parent','recovery text');queue.flush();assert.equal(errors.at(-1),'Quota');failing=false;queue.flush();assert.equal(saved.at(-1),'recovery text');
queue.schedule('parent','final text');queue.flush();queue.dispose();assert.equal(timers.size,0);
assert.equal(textMetrics('Hello, world.').words,2);assert.equal(textMetrics('').minutes,0);assert.equal(textMetrics('😀').characters,1);assert(textMetrics('世界末日旅行社的故事').words>0);
assert.deepEqual(findPassages('Aria aria ARIA','aria'),[{start:0,end:4},{start:5,end:9},{start:10,end:14}]);
assert.deepEqual(findPassages('a.b axb','a.b'),[{start:0,end:3}]);assert.deepEqual(findPassages('İ aria','aria'),[{start:2,end:6}]);assert.deepEqual(findPassages('abc',''),[]);assert.equal(findPassages('a'.repeat(2500),'a').length,2000);
console.log('PASS: coalesced saves, continuous-typing deadline, branch isolation, navigation flush, failure retry, timer cleanup, multilingual metrics and original search offsets.');
