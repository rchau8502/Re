import type {NovelState} from './index';
import type {BookMatch} from './search';

export type ThreadEvidence={chapterId:string;start:number;end:number;quote:string;bodyRevision:number};
export type PlotThread={id:string;title:string;notes:string;planted:ThreadEvidence;plannedChapterId?:string;payoff?:ThreadEvidence};
export const THREAD_LIMIT=100;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
function isEvidence(v:unknown,ids:Set<string>):v is ThreadEvidence{
 return object(v)&&typeof v.chapterId==='string'&&ids.has(v.chapterId)&&Number.isSafeInteger(v.start)&&Number(v.start)>=0&&Number.isSafeInteger(v.end)&&Number(v.end)>Number(v.start)&&Number(v.end)<=100000&&Number.isSafeInteger(v.bodyRevision)&&Number(v.bodyRevision)>=0&&text(v.quote,1000)&&!!v.quote.trim()&&Number(v.end)-Number(v.start)===v.quote.length;
}
export function isPlotThreads(value:unknown,chapterIds:Set<string>):value is PlotThread[]{
 if(!Array.isArray(value)||value.length>THREAD_LIMIT)return false;
 const ids=new Set<string>();
 for(const t of value){
  if(!object(t)||!text(t.id,100)||!t.id.trim()||ids.has(t.id)||!text(t.title,200)||!t.title.trim()||!text(t.notes,3000)||!isEvidence(t.planted,chapterIds)||(t.plannedChapterId!==undefined&&(typeof t.plannedChapterId!=='string'||!chapterIds.has(t.plannedChapterId)))||(t.payoff!==undefined&&!isEvidence(t.payoff,chapterIds)))return false;
  ids.add(t.id);
 }
 return true;
}
export function evidenceMatch(novel:NovelState,evidence:ThreadEvidence):BookMatch|null{
 const index=novel.chapters.findIndex(c=>c.id===evidence.chapterId),chapter=novel.chapters[index];
 if(!chapter||(chapter.bodyRevision||0)!==evidence.bodyRevision||chapter.body.slice(evidence.start,evidence.end)!==evidence.quote)return null;
 return {chapterId:chapter.id,chapterTitle:chapter.title,chapterNumber:index+1,start:evidence.start,end:evidence.end,line:chapter.body.slice(0,evidence.start).split('\n').length,before:'',text:evidence.quote,after:''};
}
function afterPlant(novel:NovelState,planted:ThreadEvidence,payoff:ThreadEvidence){
 const from=novel.chapters.findIndex(c=>c.id===planted.chapterId),to=novel.chapters.findIndex(c=>c.id===payoff.chapterId);
 return to>from||to===from&&payoff.start>=planted.end;
}
export function threadState(novel:NovelState,thread:PlotThread){
 const sourceValid=!!evidenceMatch(novel,thread.planted),payoffValid=!thread.payoff||!!evidenceMatch(novel,thread.payoff)&&afterPlant(novel,thread.planted,thread.payoff);
 const planned=thread.plannedChapterId?novel.chapters.findIndex(c=>c.id===thread.plannedChapterId):-1;
 const plant=novel.chapters.findIndex(c=>c.id===thread.planted.chapterId),active=novel.chapters.findIndex(c=>c.id===novel.activeChapterId);
 return {status:!sourceValid||!payoffValid?'needs-review':thread.payoff?'resolved':'open',sourceValid,payoffValid,planInvalid:planned>=0&&planned<plant,due:!thread.payoff&&planned>=0&&active>=planned};
}
function requireEvidence(novel:NovelState,evidence:ThreadEvidence){
 if(!isEvidence(evidence,new Set(novel.chapters.map(c=>c.id)))||!evidenceMatch(novel,evidence))throw Error('The evidence changed or is invalid. Select the exact passage again.');
}
export function saveThread(novel:NovelState,details:{title:string;notes:string;plannedChapterId?:string},planted?:ThreadEvidence,id?:string):NovelState{
 const next=structuredClone(novel),threads=next.threads ||= [],existing=id?threads.find(t=>t.id===id):undefined;
 if(id&&!existing)throw Error('Foreshadowing entry unavailable.');
 if(!id&&threads.length>=THREAD_LIMIT)throw Error('This notebook supports up to 100 foreshadowing entries.');
 if(!details.title.trim()||details.title.length>200||details.notes.length>3000)throw Error('Provide a title of at most 200 characters and notes of at most 3,000.');
 const source=existing?.planted||planted;
 if(!source)throw Error('Select a planted passage first.');
 if(!existing)requireEvidence(novel,source);
 if(details.plannedChapterId){const plan=novel.chapters.findIndex(c=>c.id===details.plannedChapterId),plant=novel.chapters.findIndex(c=>c.id===source.chapterId);if(plan<plant||plan<0)throw Error('Plan the payoff in the planted chapter or a later chapter.');}
 const entry:PlotThread={...(existing||{id:crypto.randomUUID(),planted:structuredClone(source)}),title:details.title.trim(),notes:details.notes,...(details.plannedChapterId?{plannedChapterId:details.plannedChapterId}:{})};
 if(!details.plannedChapterId)delete entry.plannedChapterId;
 if(existing)threads[threads.indexOf(existing)]=entry;else threads.push(entry);
 return next;
}
export function attachThreadEvidence(novel:NovelState,id:string,kind:'planted'|'payoff',evidence:ThreadEvidence):NovelState{
 if(kind!=='planted'&&kind!=='payoff')throw Error('Invalid evidence kind.');
 requireEvidence(novel,evidence);
 const next=structuredClone(novel),thread=next.threads?.find(t=>t.id===id);if(!thread)throw Error('Foreshadowing entry unavailable.');
 if(kind==='payoff'){
  if(!evidenceMatch(novel,thread.planted))throw Error('Relink the planted evidence before recording its payoff.');
  if(!afterPlant(novel,thread.planted,evidence))throw Error('Payoff evidence must follow the planted passage.');
 }else if(thread.payoff&&!afterPlant(novel,evidence,thread.payoff))throw Error('The planted passage must precede its recorded payoff.');
 thread[kind]=structuredClone(evidence);return next;
}
