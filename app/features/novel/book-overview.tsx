'use client';
import {useMemo,useState} from 'react';
import type {Story} from '@/lib/story';
import {selectChapter,visibleCharacters,chapterContinuityCurrent} from '@/lib/modules/novel';

type Props={story:Story;change:(next:Story,expected:Story)=>void};
export function BookOverview({story,change}:Props){
 const novel=story.novel!;
 const [open,setOpen]=useState(false),[unrecordedOnly,setUnrecordedOnly]=useState(false),[error,setError]=useState('');
 // Counting the whole manuscript is only needed while the overview is open.
 const rows=useMemo(()=>open?novel.chapters.map((chapter,index)=>{
  const recorded=chapter.committedRevision===chapter.revision&&!!chapter.summary.trim()&&!!chapter.body.trim()&&chapterContinuityCurrent(novel,chapter.id);
  const status=recorded?'Recorded':chapter.committedRevision!==undefined||chapter.summary.trim()?'Needs review':chapter.body.trim()?'Draft':'Empty';
  return {chapter,index,recorded,status,characters:visibleCharacters(chapter.body)};
 }):[],[novel,open]);
 const recorded=rows.filter(row=>row.recorded).length,review=rows.filter(row=>row.status==='Needs review').length,total=rows.reduce((sum,row)=>sum+row.characters,0);
 const visible=unrecordedOnly?rows.filter(row=>!row.recorded):rows;
 return <details className="book-overview" onToggle={event=>setOpen(event.currentTarget.open)}><summary>Book overview · {novel.chapters.length} {novel.chapters.length===1?'chapter':'chapters'}</summary>
  {open&&<>
   <p>{recorded} of {rows.length} chapters recorded · {review} need review · {total.toLocaleString()} visible characters.</p>
   <p className="muted">Recorded means the author accepted this revision. It does not certify plot consistency. Counts exclude punctuation and whitespace. Summaries are author notes and stay out of manuscript exports.</p>
   <label className="toggle"><input type="checkbox" checked={unrecordedOnly} onChange={event=>setUnrecordedOnly(event.target.checked)}/>Show unrecorded chapters only</label>
   {visible.length>0?<div className="book-overview-scroll" tabIndex={0} role="region" aria-label="Chapter overview table"><table><caption>Chapters in manuscript order</caption><thead><tr><th scope="col">Chapter</th><th scope="col">Status</th><th scope="col">Characters</th><th scope="col">Completion summary</th></tr></thead><tbody>{visible.map(({chapter,index,status,characters,recorded})=><tr key={chapter.id} aria-current={chapter.id===novel.activeChapterId?'true':undefined}><th scope="row"><button aria-label={`Open chapter ${index+1}: ${chapter.title || 'Untitled chapter'}`} onClick={()=>{try{change(selectChapter(story,chapter.id),story);setError('')}catch(e){setError(e instanceof Error?e.message:'Chapter could not be opened.')}}}>{index+1}. {chapter.title || 'Untitled chapter'}</button>{chapter.id===novel.activeChapterId&&<small>Current chapter</small>}</th><td>{status}</td><td>{characters.toLocaleString()}</td><td>{chapter.summary.trim()?<details><summary>{recorded?'Recorded summary':'Previous summary · needs review'}</summary><p>{chapter.summary}</p></details>:<span className="muted">No recorded summary</span>}</td></tr>)}</tbody></table></div>:<p role="status">All chapters are recorded. Clear the filter to view them.</p>}
   {error&&<p role="alert">{error}</p>}
  </>}
 </details>;
}
