'use client';
import {useDeferredValue,useMemo,useRef,useState} from 'react';
import {PassageRevision} from './passage-revision';
import {selectPassage,type PassageSelection} from '@/lib/modules/writing/passage';
import type {Story} from '@/lib/story';
import {findPassages,textMetrics} from '@/lib/modules/writing/text';
type Props={workspaceId:string;configured:boolean;context:()=>Record<string,unknown>;settings:()=>void;replace:(text:string,expected:string)=>void;story:Story;change:(patch:Partial<Story>)=>void;focus:boolean;toggleFocus:()=>void;saved:string;busy:boolean;generate:()=>void};
export function DraftEditor({workspaceId,configured,context,settings,replace,story,change,focus,toggleFocus,saved,busy,generate}:Props) {
  const editor=useRef<HTMLTextAreaElement>(null);
  const [size,setSize]=useState('comfortable'),[read,setRead]=useState(false),[finding,setFinding]=useState(false),[query,setQuery]=useState(''),[match,setMatch]=useState(-1),[selected,setSelected]=useState(0);
  const [revision,setRevision]=useState<{selection:PassageSelection;id:string}|null>(null),[revisionError,setRevisionError]=useState(''),[undo,setUndo]=useState<{before:string;after:string}|null>(null);
  function revise(){try{const input=editor.current;if(!input)throw Error('Switch to Edit and select a passage.');setRevision({selection:selectPassage(workspaceId,story.scene,input.selectionStart,input.selectionEnd),id:crypto.randomUUID()});setRevisionError('')}catch(e){setRevisionError(e instanceof Error?e.message:'Select a passage first.')}}
  function applyReplacement(text:string){replace(text,story.scene);setUndo({before:story.scene,after:text});setSelected(0)}
  const deferred=useDeferredValue(story.scene),stats=useMemo(()=>textMetrics(deferred),[deferred]);
  const matches=useMemo(()=>findPassages(story.scene,query),[story.scene,query]);
  function jump(index:number){if(!matches.length)return;const next=(index+matches.length)%matches.length;setMatch(next);setRead(false);requestAnimationFrame(()=>{const input=editor.current;if(input){input.focus();input.setSelectionRange(matches[next].start,matches[next].end);setSelected(matches[next].end-matches[next].start)}})}
  return <section className={`draft-studio text-${size}`} aria-label="Manuscript editor">
    <div className="draft-toolbar"><div className="draft-metrics" aria-label="Draft statistics"><span>{stats.words.toLocaleString()} words</span><span>{stats.minutes} min read</span>{selected>0&&<span>{selected.toLocaleString()} characters selected</span>}</div><div className="draft-actions"><label>Text size<select value={size} onChange={e=>setSize(e.target.value)}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label>
      <button disabled={read||busy||selected===0} onClick={revise}>Revise selection</button>
      <button aria-pressed={finding} onClick={()=>setFinding(!finding)}>Find</button>
      <button aria-pressed={read} onClick={()=>{setRead(!read);setSelected(0)}}>{read?'Edit':'Read'}</button>
      <button aria-pressed={focus} onClick={toggleFocus}>{focus?'Exit focus':'Focus writing'}</button>
    </div></div>
    {finding&&<div className="draft-find"><label>Find in draft<input autoFocus value={query} onChange={e=>{setQuery(e.target.value);setMatch(-1)}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();jump(e.shiftKey?(match<0?matches.length-1:match-1):match+1)}}}/></label><span role="status">{query?(matches.length?`${match<0?'':Math.min(match+1,matches.length)+' / '}${matches.length}${matches.length===2000?'+':''} matches`:'No matches'):''}</span><button disabled={!matches.length} onClick={()=>jump(match<0?matches.length-1:match-1)}>Previous match</button><button disabled={!matches.length} onClick={()=>jump(match+1)}>Next match</button><button onClick={()=>{setFinding(false);editor.current?.focus()}}>Close find</button></div>}
    {revisionError&&<p role="alert">{revisionError}</p>}
    {undo&&<div className="passage-undo"><span>Passage replacement applied.</span><button disabled={busy||story.scene!==undo.after} onClick={()=>{try{replace(undo.before,undo.after);setUndo(null);setRevisionError('')}catch(e){setRevisionError(e instanceof Error?e.message:'Undo failed.')}}}>Undo replacement</button>{story.scene!==undo.after&&<small>Your draft has changed. Use revision history to recover earlier text.</small>}</div>}
    {revision&&<PassageRevision key={revision.id} selection={revision.selection} workspaceId={workspaceId} draft={story.scene} configured={configured} context={context} settings={settings} apply={applyReplacement} close={()=>setRevision(null)}/>}
    <div className="manuscript"><label className="manuscript-title"><span className="sr-only">Draft title</span><input placeholder="Untitled draft" value={story.title} onChange={e=>change({title:e.target.value})}/></label>
    {read?<article className="manuscript-reading" aria-label="Draft reading view">{story.scene || 'Your draft is empty. Switch to Edit to begin.'}</article>:<label className="manuscript-body"><span className="sr-only">Story</span><textarea ref={editor} aria-label="Story" value={story.scene} onChange={e=>change({scene:e.target.value})} onSelect={e=>setSelected(e.currentTarget.selectionEnd-e.currentTarget.selectionStart)} placeholder="Start writing…" spellCheck rows={16}/></label>}
    </div>
    <div className="draft-footer"><span role="status">{saved}</span><button disabled={busy} onClick={generate}>{busy?'Writing…':'Rewrite with Director'}</button></div>
  </section>;
}
