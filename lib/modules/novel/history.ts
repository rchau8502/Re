import type {Blueprint,Continuity,NovelChapter,NovelState} from './index';
export type ChapterCheckpoint={id:string;chapterId:string;title:string;body:string;blueprint:Blueprint;summary:string;continuity?:Continuity;createdAt:string;reason:'auto'|'manual'|'before-apply'|'before-restore'};
export const HISTORY_PER_CHAPTER=8,HISTORY_TOTAL=64,HISTORY_CHARACTERS=150000;
export function sameChapter(a:Pick<NovelChapter,'title'|'body'|'blueprint'|'summary'|'continuity'>,b:Pick<NovelChapter,'title'|'body'|'blueprint'|'summary'|'continuity'>){return a.title===b.title&&a.body===b.body&&a.summary===b.summary&&JSON.stringify(a.blueprint)===JSON.stringify(b.blueprint)&&JSON.stringify(a.continuity)===JSON.stringify(b.continuity)}
export function appendCheckpoint(novel:NovelState,chapter:NovelChapter,reason:ChapterCheckpoint['reason']){
 const history=novel.history || [],last=history.filter(h=>h.chapterId===chapter.id).at(-1);
 if(last&&sameChapter(last,chapter))return last.id;
 if(reason==='auto'&&last&&Date.now()-Date.parse(last.createdAt)<30000)return undefined;
 const checkpoint:ChapterCheckpoint={id:crypto.randomUUID(),chapterId:chapter.id,title:chapter.title,body:chapter.body,blueprint:structuredClone(chapter.blueprint),summary:chapter.summary,...(chapter.continuity?{continuity:structuredClone(chapter.continuity)}:{}),createdAt:new Date(Date.now()).toISOString(),reason};
 const next=[...history,checkpoint],owned=next.filter(h=>h.chapterId===chapter.id),keep=new Set(owned.slice(-HISTORY_PER_CHAPTER).map(h=>h.id));
 novel.history=next.filter(h=>h.chapterId!==chapter.id||keep.has(h.id)).slice(-HISTORY_TOTAL);
 return checkpoint.id;
}
