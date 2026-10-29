'use client';
import {useState} from 'react';
import type {Story} from '@/lib/story';
import {activeChapter,chapterContinuityCurrent,confirmChapterContinuity,copyLegacyContinuity,continuityFields,emptyContinuity,updateNotebook} from '@/lib/modules/novel';
type Props={story:Story;change:(next:Story,expected:Story)=>void};
const labels:Record<typeof continuityFields[number],string>={position:'Current story position',constraints:'Lasting constraints',activeThreads:'Active clues and unresolved threads',characterState:'Character state',readerKnowledge:'What readers already know',authorTruth:'Author truth · not yet revealed',nextPromise:'Next chapter commitments'};
export function ChapterContinuity({story,change}:Props){
 const novel=story.novel!,chapter=activeChapter(novel),card=chapter.continuity||emptyContinuity(),confirmed=chapterContinuityCurrent(novel,chapter.id);
 const [error,setError]=useState('');
 function perform(action:()=>Story){try{change(action(),story);setError('')}catch(e){setError(e instanceof Error?e.message:'The continuation card could not be saved.')}}
 return <details><summary>Continuation card · this chapter</summary>
  <p>Record the starting state and reveal boundaries for “{chapter.title}”. This card belongs only to this chapter. Chapter AI uses it after your confirmation. Earlier chapter edits or order changes require another review.</p>
  <p role="status">{confirmed?'This chapter’s continuation card is confirmed.':'This chapter’s continuation card needs confirmation.'}</p>
  <div className="novel-fields">{continuityFields.map(key=><label key={key}>{labels[key]}<textarea aria-label={labels[key]} rows={3} value={card[key]} maxLength={3000} onChange={event=>perform(()=>{const next=structuredClone(novel),selected=activeChapter(next);selected.continuity={...card,[key]:event.target.value};delete selected.continuityBasis;return updateNotebook(story,next)})}/></label>)}</div>
  <button disabled={confirmed||!card.position.trim()} onClick={()=>perform(()=>confirmChapterContinuity(story))}>Confirm this chapter’s continuation card</button>
  {continuityFields.some(key=>novel.continuity[key].trim())&&<details><summary>Legacy shared card · preserved notes</summary><p>This older shared card is kept for recovery. It is excluded from AI context until you copy it into a chapter, review it, and confirm that chapter’s card.</p><dl>{continuityFields.map(key=><div key={key}><dt>{labels[key]}</dt><dd>{novel.continuity[key]||'—'}</dd></div>)}</dl>{!chapter.continuity&&<button onClick={()=>perform(()=>copyLegacyContinuity(story))}>Copy legacy shared card into this chapter</button>}</details>}
  {error&&<p role="alert">{error}</p>}
 </details>;
}
