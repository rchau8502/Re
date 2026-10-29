'use client';
import {useMemo,useState} from 'react';
import type {Story} from '@/lib/story';
import {updateNotebook} from '@/lib/modules/novel';
import {findPassages} from '@/lib/modules/writing/text';
import type {BookMatch} from '@/lib/modules/novel/search';
import {attachThreadEvidence,evidenceMatch,saveThread,threadState,type ThreadEvidence} from '@/lib/modules/novel/threads';
type Props={story:Story;change:(next:Story,expected:Story)=>void;locate:(match:BookMatch,expected:Story)=>void};
export function PlotThreads({story,change,locate}:Props){
 const novel=story.novel!,threads=novel.threads||[];
 const [open,setOpen]=useState(false),[title,setTitle]=useState(''),[notes,setNotes]=useState(''),[planned,setPlanned]=useState(''),[editing,setEditing]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [chapterId,setChapterId]=useState(novel.activeChapterId),[query,setQuery]=useState(''),[evidence,setEvidence]=useState<ThreadEvidence|null>(null);
 const chapter=novel.chapters.find(c=>c.id===chapterId)||novel.chapters[0];
 const matches=useMemo(()=>open&&query?findPassages(chapter.body,query).slice(0,50):[],[open,chapter.body,query]);
 const validEvidence=!!evidence&&!!evidenceMatch(novel,evidence);
 function perform(action:()=>Story,message:string){try{change(action(),story);setError('');setNotice(message);return true}catch(e){setNotice('');setError(e instanceof Error?e.message:'The foreshadowing change could not be saved.');return false}}
 function reset(){setTitle('');setNotes('');setPlanned('');setEditing('')}
 function jump(anchor:ThreadEvidence){try{const match=evidenceMatch(novel,anchor);if(!match)throw Error('The source no longer matches. Select and relink the passage first.');locate(match,story);setError('')}catch(e){setError(e instanceof Error?e.message:'Evidence could not be opened.')}}
 return <details className="plot-threads" onToggle={event=>setOpen(event.currentTarget.open)}><summary>Foreshadowing ledger · {threads.length} {threads.length===1?'entry':'entries'}</summary>
  {open&&<>
   <p>Author-managed clues and payoffs, linked to exact manuscript passages. Entries travel with backups and branches. These notes are excluded from AI context and manuscript exports; recording a payoff is your judgment. Editing linked chapter prose requires relinking its evidence.</p>
   <fieldset><legend>Select manuscript evidence</legend>
    <label>Evidence chapter<select aria-label="Evidence chapter" value={chapter.id} onChange={event=>{setChapterId(event.target.value);setEvidence(null);setError('')}}>{novel.chapters.map((c,i)=><option key={c.id} value={c.id}>{i+1}. {c.title||'Untitled chapter'}</option>)}</select></label>
    <label>Evidence phrase<input aria-label="Evidence phrase" value={query} maxLength={200} onChange={event=>{setQuery(event.target.value);setEvidence(null);setError('')}} placeholder="Enter an exact phrase from the chapter"/></label>
    <label>Matching evidence<select aria-label="Matching evidence" value={evidence&&validEvidence&&evidence.chapterId===chapter.id&&matches.some(m=>m.start===evidence.start)?String(evidence.start):''} onChange={event=>{const match=event.target.value===''?undefined:matches.find(m=>String(m.start)===event.target.value);setEvidence(match?{chapterId:chapter.id,...match,quote:chapter.body.slice(match.start,match.end),bodyRevision:chapter.bodyRevision||0}:null)}}><option value="">Choose an occurrence</option>{matches.map(m=><option key={m.start} value={m.start}>Line {chapter.body.slice(0,m.start).split('\n').length} · offset {m.start} · {chapter.body.slice(Math.max(0,m.start-12),Math.min(chapter.body.length,m.end+24))}</option>)}</select></label>
    {query&&<small>{matches.length?`Showing up to 50 occurrences in this chapter.`:'No matching passage in this chapter.'}</small>}
    {evidence&&<p>{validEvidence?'Selected evidence: ':'Evidence changed; select it again: '}<q>{evidence.quote}</q></p>}
   </fieldset>
   <fieldset><legend>{editing?'Edit foreshadowing details':'Add a foreshadowing entry'}</legend>
    <label>Foreshadowing title<input aria-label="Foreshadowing title" value={title} maxLength={200} onChange={event=>setTitle(event.target.value)}/></label>
    <label>Author notes<textarea aria-label="Foreshadowing author notes" value={notes} maxLength={3000} rows={2} onChange={event=>setNotes(event.target.value)}/></label>
    <label>Planned payoff chapter<select aria-label="Planned payoff chapter" value={planned} onChange={event=>setPlanned(event.target.value)}><option value="">No target chapter</option>{novel.chapters.map((c,i)=><option key={c.id} value={c.id}>{i+1}. {c.title||'Untitled chapter'}</option>)}</select></label>
    <div className="novel-actions"><button disabled={!title.trim()||!editing&&!validEvidence} onClick={()=>{if(perform(()=>updateNotebook(story,saveThread(novel,{title,notes,plannedChapterId:planned||undefined},evidence||undefined,editing||undefined)),editing?'Foreshadowing details saved.':'Foreshadowing entry saved.'))reset()}}>{editing?'Save foreshadowing details':'Add foreshadowing'}</button>{editing&&<button onClick={reset}>Cancel details edit</button>}</div>
   </fieldset>
   {threads.length===0?<p>No foreshadowing entries yet.</p>:<ul className="plot-thread-list">{threads.map(thread=>{
    const state=threadState(novel,thread),source=evidenceMatch(novel,thread.planted),payoff=thread.payoff?evidenceMatch(novel,thread.payoff):null,target=novel.chapters.find(c=>c.id===thread.plannedChapterId);
    return <li key={thread.id}><h3>{thread.title}</h3><p>{state.status==='resolved'?'Resolved':state.status==='open'?'Open':'Needs evidence review'}{state.due?' · Planned payoff is due by this chapter':''}</p>
     {thread.notes&&<p className="thread-notes">{thread.notes}</p>}
     <p>Planted: <q>{thread.planted.quote}</q></p>{thread.payoff&&<p>Payoff: <q>{thread.payoff.quote}</q></p>}{target&&<p>Planned payoff: {target.title||'Untitled chapter'}</p>}
     {!state.sourceValid&&<p role="alert">The planted chapter text changed or its saved passage no longer matches. Select the intended passage above and relink it.</p>}
     {!state.payoffValid&&<p role="alert">The payoff chapter text changed, or its evidence now precedes its planting. Review and relink it.</p>}
     {state.planInvalid&&<p role="alert">The planned payoff chapter now precedes its planting. Edit the target chapter.</p>}
     <div className="novel-actions"><button disabled={!source} onClick={()=>jump(thread.planted)}>Open planted evidence</button>{thread.payoff&&<button disabled={!payoff} onClick={()=>jump(thread.payoff!)}>Open payoff evidence</button>}
      <button disabled={!validEvidence} onClick={()=>perform(()=>updateNotebook(story,attachThreadEvidence(novel,thread.id,'planted',evidence!)),'Planted evidence relinked.')}>Replace planted evidence with selection</button>
      <button disabled={!validEvidence||!state.sourceValid} onClick={()=>perform(()=>updateNotebook(story,attachThreadEvidence(novel,thread.id,'payoff',evidence!)),'Payoff evidence saved.')}>Use selection as payoff</button>
      <button onClick={()=>{setEditing(thread.id);setTitle(thread.title);setNotes(thread.notes);setPlanned(thread.plannedChapterId||'');setNotice('Editing details in the form above.');setError('')}}>Edit foreshadowing details</button>
     </div>
    </li>;
   })}</ul>}
   {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
  </>}
 </details>;
}
