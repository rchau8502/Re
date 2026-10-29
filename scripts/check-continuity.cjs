const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {enableNovel,updateNotebook,activeChapter,addChapter,selectChapter,moveChapter,editManuscript,recordChapter,confirmChapterContinuity,copyLegacyContinuity,chapterContinuityCurrent,checkpointChapter,restoreChapterCheckpoint,exportManuscript}=require('../lib/modules/novel/index.ts');
const {validateNovelRequest,novelPrompt}=require('../lib/modules/novel/ai.ts');
const {isStory}=require('../lib/story.ts');
const original={title:'接续测试',premise:'一封来自明天的信',divergencePoint:'',changesFromCanon:[],alternateTimeline:[],storySummary:'',scene:'沈航拾起信，走向车站。',storyboard:[]};
let story=enableNovel(original),first=story.novel.activeChapterId;
const blueprint={goal:'找人',emotion:'好奇',conflict:'没有署名',beats:'拾信，离开',ending:'到车站',withhold:'寄件人身份',pov:'沈航',minChars:1,maxChars:1000};
const request=(s,action='review')=>({notebook:s.novel,chapterId:s.novel.activeChapterId,requestId:'offline',action,instruction:'检查当前章'});
assert(!chapterContinuityCurrent(story.novel,first));
for(const action of ['blueprint','chapter','review','polish'])assert.throws(()=>validateNovelRequest(request(story,action)),/confirm/i);
let n=structuredClone(story.novel);n.outline='调查信件';n.continuity.authorTruth='LEGACY FUTURE SECRET';n.chapters[0].continuity.position='第一章开始';n.chapters[0].continuity.readerKnowledge='FIRST CHAPTER KNOWLEDGE';n.chapters[0].blueprint=blueprint;
story=updateNotebook(story,n);story=confirmChapterContinuity(story);assert(chapterContinuityCurrent(story.novel,first));
story=recordChapter(story,first,'拾信出门');story=addChapter(story);const second=story.novel.activeChapterId;
assert.equal(activeChapter(story.novel).continuity.readerKnowledge,'');assert(!chapterContinuityCurrent(story.novel,second));
n=structuredClone(story.novel);n.chapters[1].body='车站的钟停在六点。';n.chapters[1].blueprint=blueprint;n.chapters[1].continuity.position='第二章开始';n.chapters[1].continuity.readerKnowledge='SECOND CHAPTER REVEALED SECRET';story=confirmChapterContinuity(updateNotebook(story,n));story=recordChapter(story,second,'到达车站');
const complete=structuredClone(story);
const implicitEdit=structuredClone(story.novel);implicitEdit.chapters[1].continuity.readerKnowledge='Changed through the service';assert(!chapterContinuityCurrent(updateNotebook(story,implicitEdit).novel,second));
story=selectChapter(story,first);const prompt=novelPrompt(validateNovelRequest(request(story)),{});
assert(prompt.includes('FIRST CHAPTER KNOWLEDGE'));assert(!prompt.includes('SECOND CHAPTER REVEALED SECRET'));assert(!prompt.includes('LEGACY FUTURE SECRET'));assert(!prompt.includes('continuityBasis'));
const legacy=structuredClone(story);for(const c of legacy.novel.chapters){delete c.continuity;delete c.continuityBasis}
assert(isStory(legacy));assert.throws(()=>validateNovelRequest(request(legacy)),/confirm/i);
for(const action of ['outline','analyze']){const input={...request(legacy,action),reference:'A reference.'};assert(!novelPrompt(validateNovelRequest(input),{}).includes('LEGACY FUTURE SECRET'))}
const migrated=copyLegacyContinuity(legacy);assert.equal(migrated.novel.chapters[0].continuity.authorTruth,'LEGACY FUTURE SECRET');assert.equal(migrated.novel.chapters[1].continuity,undefined);assert.equal(legacy.novel.chapters[0].continuity,undefined);assert(!chapterContinuityCurrent(migrated.novel,first));assert.throws(()=>copyLegacyContinuity(story),/already/);
let changed=editManuscript(story,{scene:'沈航决定折返家中。'});assert(!chapterContinuityCurrent(changed.novel,second));assert(chapterContinuityCurrent(changed.novel,first));
changed=recordChapter(changed,first,'折返家中');changed=selectChapter(changed,second);assert.throws(()=>validateNovelRequest(request(changed)),/confirm/i);changed=confirmChapterContinuity(changed);assert(chapterContinuityCurrent(changed.novel,second));
const summaryChanged=recordChapter(complete,first,'改为强调寄件人线索');assert(!chapterContinuityCurrent(summaryChanged.novel,second));
const reordered=moveChapter(complete,second,-1);assert(!chapterContinuityCurrent(reordered.novel,first));assert(!chapterContinuityCurrent(reordered.novel,second));
let branch=structuredClone(story),edited=structuredClone(branch.novel);edited.chapters[0].continuity.position='分支接续位置';delete edited.chapters[0].continuityBasis;branch=updateNotebook(branch,edited);assert.equal(story.novel.chapters[0].continuity.position,'第一章开始');assert(!chapterContinuityCurrent(branch.novel,first));
story=checkpointChapter(story,first);const saved=story.novel.history.at(-1);edited=structuredClone(story.novel);edited.chapters[0].continuity.position='恢复前新位置';delete edited.chapters[0].continuityBasis;story=confirmChapterContinuity(updateNotebook(story,edited));const restored=restoreChapterCheckpoint(story,first,saved.id);
assert.equal(restored.novel.chapters[0].continuity.position,'第一章开始');assert(restored.novel.history.some(h=>h.continuity?.position==='恢复前新位置'));assert(!chapterContinuityCurrent(restored.novel,first));
const oldCheckpoint=structuredClone(story);for(const h of oldCheckpoint.novel.history)delete h.continuity;assert(isStory(oldCheckpoint));const oldRestored=restoreChapterCheckpoint(oldCheckpoint,first,saved.id);assert.equal(oldRestored.novel.chapters[0].continuity.position,'恢复前新位置');assert(!chapterContinuityCurrent(oldRestored.novel,first));
assert(!exportManuscript(story).includes('FIRST CHAPTER KNOWLEDGE'));assert(!exportManuscript(story).includes('LEGACY FUTURE SECRET'));
for(const mutate of [v=>v.novel.chapters[0].continuity.position='x'.repeat(3001),v=>v.novel.chapters[0].continuity=null,v=>v.novel.chapters[0].continuityBasis='x'.repeat(10001),v=>v.novel.history[0].continuity={position:'incomplete'}]){const invalid=structuredClone(story);mutate(invalid);assert(!isStory(invalid))}
const {createProject}=require('../lib/modules/core/types.ts'),{saveWriting}=require('../lib/modules/writing/index.ts'),{exportProject,restoreProject}=require('../lib/modules/backup/index.ts');let project=createProject('Continuity');project=saveWriting(project,{projectId:project.project.id,branchId:project.project.canonBranchId},'workspace',{content:story});assert.deepEqual(restoreProject(exportProject(project)).writing.drafts[0].content,story);
console.log('PASS: chapter card isolation, explicit legacy migration, confirmation/dependency gates, future-card exclusion in AI context, summary/order invalidation, branch isolation, new/legacy history recovery, validation and archive roundtrip. No provider calls.');
