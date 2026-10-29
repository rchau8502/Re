const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {preserveUnreadableWorkspaces,UNREADABLE_STORAGE_KEY}=require('../lib/modules/backup/recovery.ts');
const {WORKSPACE_STORAGE_KEY,prepareWorkspaceImport,commitWorkspaceImport}=require('../lib/modules/backup/workspaces.ts');
const {newWorkspace}=require('../lib/story.ts');
function fixture(raw){const map=new Map(raw===null?[]:[[WORKSPACE_STORAGE_KEY,raw]]);return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}}
for(const raw of [null,'[]',JSON.stringify([newWorkspace('有效稿件')])]){const storage=fixture(raw);assert.equal(preserveUnreadableWorkspaces(storage),null);assert.equal(storage.map.size,raw===null?0:1)}
for(const raw of ['', '{broken 中文 📝', '{}','null',JSON.stringify([{title:'Invalid workspace'}])]){
 const storage=fixture(raw),key=preserveUnreadableWorkspaces(storage);
 assert.equal(storage.getItem(key),raw);assert.equal(storage.getItem(WORKSPACE_STORAGE_KEY),raw);
 assert.equal(preserveUnreadableWorkspaces(storage),key);assert.equal(storage.map.size,2);
 const prepared=prepareWorkspaceImport(JSON.stringify(newWorkspace('恢复后的项目')));
 commitWorkspaceImport(storage,prepared,[]);
 assert.equal(storage.getItem(key),raw);assert.equal(JSON.parse(storage.getItem(WORKSPACE_STORAGE_KEY))[0].title,'恢复后的项目');
}
const storage=fixture('first invalid record');preserveUnreadableWorkspaces(storage);storage.setItem(WORKSPACE_STORAGE_KEY,'second invalid record');
const key=preserveUnreadableWorkspaces(storage);assert.notEqual(key,UNREADABLE_STORAGE_KEY);assert.equal(storage.getItem(UNREADABLE_STORAGE_KEY),'first invalid record');assert.equal(storage.getItem(key),'second invalid record');
for(const setItem of [()=>{throw Error('Quota exceeded')},()=>{}]){
 const refused=fixture('precious unreadable record');refused.setItem=setItem;
 assert.throws(()=>preserveUnreadableWorkspaces(refused),/could not be preserved/);
 assert.equal(refused.getItem(WORKSPACE_STORAGE_KEY),'precious unreadable record');
}
assert.throws(()=>preserveUnreadableWorkspaces({getItem:()=>{throw Error('Access denied')},setItem:()=>assert.fail('Must not write')}),/Access denied/);
console.log('PASS: unreadable workspace preservation, repeated recovery, prior-copy retention, import recovery, refused writes and read denial. No existing records replaced.');
