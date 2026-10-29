import type {NarrativeContent} from '../core/types';
import {isPlotThreads,type PlotThread} from './threads';
import {reviewProse} from './quality';
import {appendCheckpoint,HISTORY_PER_CHAPTER,HISTORY_TOTAL,HISTORY_CHARACTERS,type ChapterCheckpoint} from './history';

export type Blueprint={goal:string;emotion:string;conflict:string;beats:string;ending:string;withhold:string;pov:string;minChars:number;maxChars:number};
export type Continuity={position:string;constraints:string;activeThreads:string;characterState:string;readerKnowledge:string;authorTruth:string;nextPromise:string};
export type NovelChapter={id:string;title:string;body:string;blueprint:Blueprint;bodyRevision?:number;revision:number;committedRevision?:number;summary:string;continuity?:Continuity;continuityBasis?:string};
export type NovelState={threads?:PlotThread[];history?:ChapterCheckpoint[];version:1;outline:string;activeChapterId:string;chapters:NovelChapter[];continuity:Continuity};
export type NovelAction='outline'|'blueprint'|'chapter'|'review'|'polish'|'analyze';
export type NovelSuggestion={action:NovelAction;text?:string;blueprint?:Blueprint};
export const blueprintFields=['goal','emotion','conflict','beats','ending','withhold','pov'] as const;
export const continuityFields=['position','constraints','activeThreads','characterState','readerKnowledge','authorTruth','nextPromise'] as const;
export const emptyBlueprint=():Blueprint=>({goal:'',emotion:'',conflict:'',beats:'',ending:'',withhold:'',pov:'',minChars:1500,maxChars:2500});
const bounded=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function isBlueprint(v:unknown):v is Blueprint{return record(v)&&blueprintFields.every(k=>bounded(v[k],3000))&&Number.isInteger(v.minChars)&&Number.isInteger(v.maxChars)&&Number(v.minChars)>=1&&Number(v.maxChars)>=Number(v.minChars)&&Number(v.maxChars)<=50000}
export const emptyContinuity=():Continuity=>({position:'',constraints:'',activeThreads:'',characterState:'',readerKnowledge:'',authorTruth:'',nextPromise:''});
export function isContinuity(v:unknown):v is Continuity{return record(v)&&continuityFields.every(k=>bounded(v[k],3000))}
export function isNovelState(v:unknown,checkSize=true):v is NovelState {
 if(!record(v)||v.version!==1||!bounded(v.outline,15000)||!bounded(v.activeChapterId,100)||!isContinuity(v.continuity)||!Array.isArray(v.chapters)||!v.chapters.length||v.chapters.length>50)return false;
 const ids=new Set<string>();
 for(const c of v.chapters){if(!record(c)||!bounded(c.id,100)||!c.id.trim()||ids.has(c.id)||!bounded(c.title,200)||!bounded(c.body,100000)||!bounded(c.summary,3000)||!isBlueprint(c.blueprint)||(c.continuity!==undefined&&!isContinuity(c.continuity))||(c.continuityBasis!==undefined&&(!c.continuity||!bounded(c.continuityBasis,10000)))||(c.bodyRevision!==undefined&&(!Number.isSafeInteger(c.bodyRevision)||Number(c.bodyRevision)<0))||!Number.isSafeInteger(c.revision)||Number(c.revision)<0||(c.committedRevision!==undefined&&(!Number.isSafeInteger(c.committedRevision)||Number(c.committedRevision)<0||Number(c.committedRevision)>Number(c.revision))))return false;ids.add(c.id)}
 if(v.threads!==undefined&&!isPlotThreads(v.threads,ids))return false;
 if(v.history!==undefined){
  if(!Array.isArray(v.history)||v.history.length>HISTORY_TOTAL)return false;
  const checkpoints=new Set<string>(),counts=new Map<string,number>();
  for(const h of v.history){if(!record(h)||!bounded(h.id,100)||!h.id.trim()||checkpoints.has(h.id)||typeof h.chapterId!=='string'||!ids.has(h.chapterId)||!bounded(h.title,200)||!bounded(h.body,100000)||!bounded(h.summary,3000)||!isBlueprint(h.blueprint)||(h.continuity!==undefined&&!isContinuity(h.continuity))||typeof h.createdAt!=='string'||!Number.isFinite(Date.parse(h.createdAt))||!['auto','manual','before-apply','before-restore'].includes(String(h.reason)))return false;checkpoints.add(h.id);counts.set(h.chapterId,(counts.get(h.chapterId)||0)+1);if((counts.get(h.chapterId)||0)>HISTORY_PER_CHAPTER)return false}
 }
 return ids.has(v.activeChapterId)&&(!checkSize||(JSON.stringify(v).length<=300000&&JSON.stringify(v.history || []).length<=HISTORY_CHARACTERS));
}
export function activeChapter(novel:NovelState){const chapter=novel.chapters.find(c=>c.id===novel.activeChapterId);if(!chapter)throw Error('Chapter unavailable');return chapter}
function ensure(story:NarrativeContent):NovelState{if(!story.novel||!isNovelState(story.novel))throw Error('Invalid novel notebook');return story.novel}
export function enableNovel(story:NarrativeContent):NarrativeContent {
 if(story.novel)return story;
 const chapter:NovelChapter={id:crypto.randomUUID(),title:story.title||'Chapter 1',body:story.scene,blueprint:emptyBlueprint(),revision:0,summary:'',continuity:emptyContinuity()};
 return updateNotebook(story,{version:1,outline:'',activeChapterId:chapter.id,chapters:[chapter],continuity:emptyContinuity()});
}
export function updateNotebook(story:NarrativeContent,novel:NovelState,options:{autoHistory?:boolean;protect?:string[]}={}):NarrativeContent {
 if(!isNovelState(novel,false))throw Error('Invalid or oversized novel notebook');
 const next=structuredClone(novel),previous=story.novel;
 // Receipts belong to the exact prose and blueprint, not a permanently checked box.
 let changedEarlier=false;
 for(const c of next.chapters){const old=previous?.chapters.find(p=>p.id===c.id);const changed=!!old&&(old.revision!==c.revision||old.body!==c.body||JSON.stringify(old.blueprint)!==JSON.stringify(c.blueprint)||old.title!==c.title||old.summary!==c.summary||JSON.stringify(old.continuity)!==JSON.stringify(c.continuity)||(old.continuityBasis!==undefined&&c.continuityBasis===undefined));
  // Evidence tracks prose separately from title, card and order revisions.
  if(old){if(old.body!==c.body)c.bodyRevision=(old.bodyRevision||0)+1;else if(old.bodyRevision!==undefined)c.bodyRevision=old.bodyRevision;else delete c.bodyRevision;}
  if(old&&JSON.stringify(old.continuity)!==JSON.stringify(c.continuity))delete c.continuityBasis;
  // Later completion receipts need fresh review after an earlier chapter changes.
  if(old&&changed&&options.autoHistory!==false)appendCheckpoint(next,old,'auto');
  if(old&&(changed||changedEarlier))c.revision=Math.max(c.revision,old.revision+1);
  changedEarlier ||= changed;
 }
 const result={...story,novel:next,scene:activeChapter(next).body};
 // Optional history gives way to current prose. Explicit recovery protects the new snapshot.
 while(JSON.stringify(next.history || []).length>HISTORY_CHARACTERS||JSON.stringify(next).length>300000||JSON.stringify(result).length>400000){
  const index=next.history?.findIndex(h=>!options.protect?.includes(h.id)) ?? -1;
  if(index<0)throw Error('Not enough space to preserve the current chapter. Export a backup or split this book before continuing.');
  next.history!.splice(index,1);
 }
 if(!isNovelState(next))throw Error('The notebook exceeds its storage limit.');
 return result;
}
export function editManuscript(story:NarrativeContent,patch:Partial<NarrativeContent>):NarrativeContent {
 const result={...story,...patch};if(!story.novel)return result;
 const novel=structuredClone(story.novel);if(patch.scene!==undefined)activeChapter(novel).body=patch.scene;
 return updateNotebook(result,novel);
}
export function addChapter(story:NarrativeContent):NarrativeContent{const novel=structuredClone(ensure(story));if(novel.chapters.length>=50)throw Error('This notebook supports up to 50 chapters');const chapter:NovelChapter={id:crypto.randomUUID(),title:`Chapter ${novel.chapters.length+1}`,body:'',blueprint:emptyBlueprint(),revision:0,summary:'',continuity:emptyContinuity()};novel.chapters.push(chapter);novel.activeChapterId=chapter.id;return updateNotebook(story,novel)}
export function selectChapter(story:NarrativeContent,id:string):NarrativeContent{const novel=structuredClone(ensure(story));if(!novel.chapters.some(c=>c.id===id))throw Error('Chapter unavailable');novel.activeChapterId=id;return updateNotebook(story,novel)}
export function moveChapter(story:NarrativeContent,id:string,direction:-1|1):NarrativeContent{
 if(direction!==-1&&direction!==1)throw Error('Invalid chapter move');
 const novel=structuredClone(ensure(story)),from=novel.chapters.findIndex(c=>c.id===id),to=from+direction;
 if(from<0)throw Error('Chapter unavailable');
 if(to<0||to>=novel.chapters.length)throw Error('Chapter is already at the boundary');
 const [chapter]=novel.chapters.splice(from,1);novel.chapters.splice(to,0,chapter);
 // Completion depends on predecessor order, including every later chapter.
 for(let i=Math.min(from,to);i<novel.chapters.length;i++)novel.chapters[i].revision+=1;
 return updateNotebook(story,novel,{autoHistory:false});
}
export function visibleCharacters(body:string){return Array.from(body).filter(c=>/[\p{L}\p{N}]/u.test(c)).length}
export function chapterReadiness(novel:NovelState,id:string):string[]{
 const index=novel.chapters.findIndex(c=>c.id===id),chapter=novel.chapters[index];if(!chapter)return ['Chapter unavailable'];
 const errors:string[]=[];
 if(!novel.outline.trim())errors.push('Add the book outline.');
 if(!chapterContinuityCurrent(novel,id))errors.push('Review and confirm the continuation card for this chapter.');
 for(const key of blueprintFields)if(!chapter.blueprint[key].trim())errors.push(`Complete the chapter blueprint: ${key}.`);
 if(novel.chapters.slice(0,index).some(c=>c.committedRevision!==c.revision||!c.summary.trim()))errors.push('Record the previous chapters before drafting this chapter.');
 return errors;
}
export function recordChapter(story:NarrativeContent,id:string,summary:string,acceptWarnings=false):NarrativeContent{
 const novel=structuredClone(ensure(story)),chapter=novel.chapters.find(c=>c.id===id);if(!chapter)throw Error('Chapter unavailable');
 if(!summary.trim()||summary.length>3000)throw Error('A chapter summary of at most 3,000 characters is required');
 const errors=chapterReadiness(novel,id);if(errors.length)throw Error(errors.join(' '));
 if(!chapter.body.trim())throw Error('The chapter is empty');
 const count=visibleCharacters(chapter.body),findings=reviewProse(chapter.body);
 if(!acceptWarnings&&(count<chapter.blueprint.minChars||count>chapter.blueprint.maxChars||findings.some(f=>f.blocking)))throw Error('Review the length and prose warnings, then explicitly accept them or revise the chapter.');
 if(chapter.summary!==summary.trim())chapter.revision+=1;
 chapter.summary=summary.trim();chapter.committedRevision=chapter.revision;return updateNotebook(story,novel);
}
export function applyNovelSuggestion(current:NarrativeContent,expected:NarrativeContent,suggestion:NovelSuggestion):NarrativeContent{
 if(JSON.stringify(current)!==JSON.stringify(expected))throw Error('The story changed. Request a new suggestion to preserve your newer work.');
 const novel=structuredClone(ensure(current));
 let checkpoint:string|undefined;
 if(['blueprint','chapter','polish'].includes(suggestion.action))checkpoint=appendCheckpoint(novel,activeChapter(novel),'before-apply');
 const options={autoHistory:false,protect:checkpoint?[checkpoint]:[]};
 if(suggestion.action==='blueprint'){if(!isBlueprint(suggestion.blueprint))throw Error('Invalid blueprint suggestion');activeChapter(novel).blueprint=suggestion.blueprint;return updateNotebook(current,novel,options)}
 if(typeof suggestion.text!=='string'||!suggestion.text.trim())throw Error('The suggestion is empty');
 if(suggestion.action==='outline'){novel.outline=suggestion.text;return updateNotebook(current,novel)}
 if(suggestion.action==='chapter'||suggestion.action==='polish'){activeChapter(novel).body=suggestion.text;return updateNotebook(current,novel,options)}
 throw Error('Analysis and reviews are advisory; they cannot replace a manuscript');
}

export function exportManuscript(story:NarrativeContent):string{
 const header=`# ${story.title}\n\n${story.premise}`;
 return story.novel?header+'\n\n'+story.novel.chapters.map(c=>`## ${c.title}\n\n${c.body}`).join('\n\n'):header+'\n\n'+story.scene;
}

export function checkpointChapter(story:NarrativeContent,chapterId:string):NarrativeContent{
 const novel=structuredClone(ensure(story)),chapter=novel.chapters.find(c=>c.id===chapterId);if(!chapter)throw Error('Chapter unavailable');
 const id=appendCheckpoint(novel,chapter,'manual');return updateNotebook(story,novel,{autoHistory:false,protect:id?[id]:[]});
}
export function restoreChapterCheckpoint(story:NarrativeContent,chapterId:string,checkpointId:string):NarrativeContent{
 const novel=structuredClone(ensure(story)),chapter=activeChapter(novel);
 if(chapter.id!==chapterId)throw Error('Select this chapter before restoring it');
 const saved=novel.history?.find(h=>h.id===checkpointId&&h.chapterId===chapterId);if(!saved)throw Error('Checkpoint is not available in this chapter');
 const snapshot=structuredClone(saved),preserved=appendCheckpoint(novel,chapter,'before-restore');
 Object.assign(chapter,{title:snapshot.title,body:snapshot.body,blueprint:snapshot.blueprint,summary:snapshot.summary});
 if(snapshot.continuity)chapter.continuity=structuredClone(snapshot.continuity);
 delete chapter.continuityBasis;chapter.revision+=1;delete chapter.committedRevision;
 return updateNotebook(story,novel,{autoHistory:false,protect:preserved?[preserved]:[]});
}
export function undoNovelSuggestion(current:NarrativeContent,before:NarrativeContent,after:NarrativeContent):NarrativeContent{
 if(JSON.stringify(current)!==JSON.stringify(after))throw Error('The story changed. Use chapter history to recover earlier prose.');
 const novel=structuredClone(ensure(current)),original=ensure(before);
 if(JSON.stringify(novel.chapters.map(c=>c.id))!==JSON.stringify(original.chapters.map(c=>c.id)))throw Error('The chapter collection changed');
 const preserved=appendCheckpoint(novel,activeChapter(novel),'before-restore');
 return updateNotebook(current,{...structuredClone(original),history:novel.history},{autoHistory:false,protect:preserved?[preserved]:[]});
}

function continuityBasis(novel:NovelState,id:string){
 const index=novel.chapters.findIndex(c=>c.id===id);if(index<0)throw Error('Chapter unavailable');
 return JSON.stringify(novel.chapters.slice(0,index).map(c=>[c.id,c.revision]));
}
export function chapterContinuityCurrent(novel:NovelState,id:string):boolean{
 const index=novel.chapters.findIndex(c=>c.id===id),chapter=novel.chapters[index];
 return !!chapter?.continuity?.position.trim()&&chapter.continuityBasis===continuityBasis(novel,id)&&novel.chapters.slice(0,index).every(c=>c.committedRevision===c.revision&&!!c.summary.trim());
}
export function confirmChapterContinuity(story:NarrativeContent):NarrativeContent{
 const novel=structuredClone(ensure(story)),chapter=activeChapter(novel),index=novel.chapters.indexOf(chapter);
 if(!chapter.continuity?.position.trim())throw Error('Record this chapter’s starting story position before confirming its card.');
 if(novel.chapters.slice(0,index).some(c=>c.committedRevision!==c.revision||!c.summary.trim()))throw Error('Record the previous chapters before confirming this continuation card.');
 chapter.continuityBasis=continuityBasis(novel,chapter.id);
 return updateNotebook(story,novel);
}
export function copyLegacyContinuity(story:NarrativeContent):NarrativeContent{
 const novel=structuredClone(ensure(story)),chapter=activeChapter(novel);
 if(chapter.continuity)throw Error('This chapter already has its own card. The legacy card is preserved separately.');
 chapter.continuity=structuredClone(novel.continuity);delete chapter.continuityBasis;
 return updateNotebook(story,novel);
}
