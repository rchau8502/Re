'use client';
import {useEffect,useState} from 'react';
import type {Story} from '@/lib/story';
import {activeChapter,checkpointChapter,restoreChapterCheckpoint} from '@/lib/modules/novel';
import type {ChapterCheckpoint} from '@/lib/modules/novel/history';
type Props={story:Story;change:(next:Story,expected:Story)=>void};
const labels:Record<ChapterCheckpoint['reason'],string>={auto:'While editing',manual:'Manual checkpoint','before-apply':'Before AI suggestion','before-restore':'Before restore / undo'};
export function ChapterHistory({story,change}:Props){
 const novel=story.novel!,chapter=activeChapter(novel),history=(novel.history || []).filter(h=>h.chapterId===chapter.id).slice().reverse();
 const [selected,setSelected]=useState(''),[base,setBase]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{setSelected('');setBase('');setError('');setNotice('')},[chapter.id]);
 const snapshot=history.find(h=>h.id===selected),stale=!!snapshot&&base!==JSON.stringify(story);
 return <details className="chapter-history"><summary>Chapter history · {history.length} saved {history.length===1?'version':'versions'}</summary>
  <p>Earlier text is captured while editing, at most once per 30 seconds. Save a checkpoint before a larger change. History travels with backups and branches.</p>
  <button onClick={()=>{try{change(checkpointChapter(story,chapter.id),story);setError('');setNotice('A checkpoint of this chapter is saved.')}catch(e){setNotice('');setError(e instanceof Error?e.message:'Checkpoint could not be saved.')}}}>Checkpoint current chapter</button>
  <label>Saved chapter version<select aria-label="Saved chapter version" value={snapshot?selected:''} onChange={e=>{setSelected(e.target.value);setBase(JSON.stringify(story));setError('');setNotice('')}}><option value="">Choose a version to preview</option>{history.map(h=><option key={h.id} value={h.id}>{labels[h.reason]} · {new Date(h.createdAt).toLocaleString()} · {h.title}</option>)}</select></label>
  {snapshot&&<section className="chapter-history-preview" aria-label="Chapter checkpoint preview"><h3>{snapshot.title || 'Untitled chapter'}</h3><label>Saved chapter text<textarea aria-label="Saved chapter text" rows={6} value={snapshot.body} readOnly/></label><details><summary>Saved blueprint and summary</summary><dl>{Object.entries(snapshot.blueprint).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p>{snapshot.summary || 'No completion summary was recorded.'}</p></details><p>Restore replaces this chapter’s title, text, blueprint and summary. Your current chapter is saved first. A saved chapter card is restored when available; older checkpoints keep the current card. Review and confirm the card after restoring. Completion needs a fresh check.</p>{stale&&<p role="alert">The story changed after this preview. Choose the version again before restoring.</p>}<button disabled={stale} onClick={()=>{try{change(restoreChapterCheckpoint(story,chapter.id,snapshot.id),story);setSelected('');setError('');setNotice('Chapter restored. The previous text is retained in history.')}catch(e){setError(e instanceof Error?e.message:'Restore could not be completed.')}}}>Restore this checkpoint</button></section>}
  <small>Up to 8 versions per chapter, 64 per book. Older versions may be pruned to fit draft storage limits; export backups for long-term retention.</small>
  {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
 </details>;
}
