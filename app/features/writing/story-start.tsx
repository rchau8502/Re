'use client';
import {useRef,useState} from 'react';
import {initialVideo} from '@/lib/modules/video/types';
import {STATIC_HOST} from '@/lib/hosting';
import {bibleFromNotes,newWorkspace,type Workspace} from '@/lib/story';

export function StoryStart({ready,configured,open}:{ready:boolean;configured:boolean;open:(workspace:Workspace,tab:'Universe'|'Draft'|'Video')=>void}) {
 const [title,setTitle]=useState(''),[text,setText]=useState(''),[kind,setKind]=useState<'draft'|'notes'|'video'>('draft'),[direction,setDirection]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const file=useRef<HTMLInputElement>(null);
 async function readFile(input:File){
  setLoading(true);setError('');
  try{
   if(!/\.(txt|md|markdown)$/i.test(input.name))throw Error('Choose a UTF-8 .txt or .md file. PDF, Word, images and audio are not supported here.');
   if(input.size>400000)throw Error('File exceeds 400 KB. Import a shorter passage.');
   const value=new TextDecoder('utf-8',{fatal:true}).decode(await input.arrayBuffer());
   if(value.includes('\0'))throw Error('This file contains binary data. Choose a plain-text file.');
   if(value.length>100000)throw Error('Text exceeds 100,000 characters. Import a shorter passage.');
   setText(value);if(!title.trim())setTitle(input.name.replace(/\.[^.]+$/,'').slice(0,200));
  }catch(e){setError(e instanceof Error?e.message:'The file could not be read. Your current input is preserved.')}finally{setLoading(false)}
 }
 function start(){
  if(loading)return;
  if(kind==='video'&&text.length>2000){setError('Video prompts allow up to 2,000 characters. Shorten the prompt; your original input is preserved.');return}
  const next=newWorkspace(title);next.preferences.targetChange=direction;
  if(kind==='video'){next.video={...initialVideo(),prompt:text};open(next,'Video');return}
  if(text.trim()){
   if(kind==='notes'){next.notes=text;next.bible=bibleFromNotes(next.title,next.mediaType,text);next.researchSource='notes'}
   else next.story={title:next.title,premise:'',divergencePoint:'',changesFromCanon:[],alternateTimeline:[],storySummary:'',scene:text,storyboard:[]};
  }
  open(next,kind==='draft'?'Draft':'Universe');
 }
 return <section className="start story-start"><span className="eyebrow">RE:STORY</span><h1>What will you create?</h1><p>A novel, a new ending, a scene in motion. Start with an idea or bring your own story.</p><div className="creation-modes" role="group" aria-label="Creation mode">{([{id:'draft',label:'Novel'},{id:'video',label:'Video'},{id:'notes',label:'Story context'}] as const).map(v=><button key={v.id} aria-pressed={kind===v.id} onClick={()=>{setKind(v.id);setError('')}}>{v.label}</button>)}</div><div className="connection-status" role="status">{STATIC_HOST?'GitHub Pages · local writing ready · AI unavailable on this site':configured?'AI configured · requests use Gemini':'Local writing ready · AI needs a Gemini server key'}</div><form onSubmit={e=>{e.preventDefault();start()}}><label>Story title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Untitled story" maxLength={200}/></label><label>{kind==='video'?'Describe your shot':kind==='notes'?'Story context':'Your manuscript'}<textarea aria-label="Story input" rows={8} value={text} onChange={e=>setText(e.target.value)} placeholder={kind==='video'?'Describe the scene, camera movement, visual style, and sound.':'Paste your own text, import a file, or leave blank to start writing.'} maxLength={kind==='video'?2000:100000}/></label><div className="input-actions"><button type="button" disabled={loading} onClick={()=>file.current?.click()}>{loading?'Reading…':'Import text file'}</button><small>{text.length.toLocaleString()} / {kind==='video'?'2,000':'100,000'} characters</small></div><input ref={file} type="file" aria-label="Import story text" accept=".txt,.md,.markdown,text/plain,text/markdown" hidden onChange={e=>{if(e.target.files?.[0])void readFile(e.target.files[0]);e.target.value=''}}/>{kind!=='video'&&<label>What would you like to explore? <small>Optional</small><textarea aria-label="Initial direction" rows={2} value={direction} onChange={e=>setDirection(e.target.value)} maxLength={10000} placeholder="Describe the choice or change you want to try."/></label>}{error&&<p role="alert">{error}</p>}<button className="primary" disabled={!ready||loading}>{kind==='video'?'Open video studio':'Open workspace'}</button></form><small>Text files: UTF-8 .txt / .md, up to 100,000 characters. Writing, manual revision, branching and backup work locally. AI research and generation require Gemini. Work saves in this browser.</small></section>
}
