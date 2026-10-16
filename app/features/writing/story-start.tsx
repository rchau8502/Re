'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Upload,Film,BookOpen,Globe,ChevronDown} from 'lucide-react';
import type {Starter} from '../studio/catalog';
import {initialVideo,videoEstimate,type VideoDuration} from '@/lib/modules/video/types';
import {STATIC_HOST} from '@/lib/hosting';
import {bibleFromNotes,newWorkspace,type Workspace} from '@/lib/story';

export function StoryStart({ready,configured,open,seed}:{ready:boolean;configured:boolean;seed?:Starter|null;open:(workspace:Workspace,tab:'Universe'|'Draft'|'Video')=>void}) {
 const [title,setTitle]=useState(''),[text,setText]=useState(''),[kind,setKind]=useState<'draft'|'notes'|'video'>('video'),[direction,setDirection]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const file=useRef<HTMLInputElement>(null);
 const [duration,setDuration]=useState<VideoDuration>(4),[ratio,setRatio]=useState<'16:9'|'9:16'>('16:9'),[pendingSeed,setPendingSeed]=useState<Starter|null>(null);
 function applySeed(s:Starter){setTitle(s.title);setText(s.text);setKind(s.mode);setDirection(s.direction || '');setError('');setPendingSeed(null)}
 useEffect(()=>{if(!seed)return;if(text.trim()&&text!==seed.text)setPendingSeed(seed);else applySeed(seed)},[seed]);
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
  if(kind==='video'){next.video={...initialVideo(),prompt:text,duration,aspectRatio:ratio};open(next,'Video');return}
  if(text.trim()){
   if(kind==='notes'){next.notes=text;next.bible=bibleFromNotes(next.title,next.mediaType,text);next.researchSource='notes'}
   else next.story={title:next.title,premise:'',divergencePoint:'',changesFromCanon:[],alternateTimeline:[],storySummary:'',scene:text,storyboard:[]};
  }
  open(next,kind==='draft'?'Draft':'Universe');
 }
 return <section className="creation-home" aria-label="Create a project"><div className="creator-heading"><span className="micro-label">YOUR IMAGINATION, IN MOTION</span><h1>A story worth <br/><em>bringing to life.</em></h1><p>Write another possibility. See a moment unfold.</p></div>
 <div className="creator-composer"><div className="creator-mode-bar" role="group" aria-label="Creation mode">{([{id:'draft',label:'Novel',Icon:BookOpen},{id:'video',label:'Video',Icon:Film},{id:'notes',label:'Story context',Icon:Globe}] as const).map(({id,label,Icon})=><button key={id} aria-pressed={kind===id} onClick={()=>{setKind(id);setError('')}}><Icon size={16}/>{label}</button>)}</div>
 {pendingSeed&&<div className="template-confirm" role="status"><strong>Use “{pendingSeed.title}”?</strong><p>Your current input will be replaced. Saved projects are unaffected.</p><button type="button" onClick={()=>applySeed(pendingSeed)}>Use this starter</button><button type="button" onClick={()=>setPendingSeed(null)}>Keep my input</button></div>}
 <form onSubmit={e=>{e.preventDefault();start()}}><label className="creator-input"><span className="sr-only">{kind==='video'?'Describe your shot':kind==='notes'?'Story context':'Your manuscript'}</span><textarea aria-label="Story input" rows={5} value={text} onChange={e=>setText(e.target.value)} placeholder={kind==='video'?'Describe a scene. A character, a little motion, a world beyond the frame…':kind==='notes'?'Set the scene: characters, rules, the turning point. Your story begins with what you know.':'Your first line, your next chapter, or a whole manuscript. Bring your own words.'} maxLength={kind==='video'?2000:100000}/></label>
 <div className="creator-toolbar"><div className="creator-settings"><span className="creator-model">{kind==='video'?<Film size={14}/>:<BookOpen size={14}/>} {kind==='video'?'Veo Fast':'Your words'}<span>{kind==='video'?'720p · audio':'Local editing'}</span></span>{kind==='video'&&<><label><span className="sr-only">Initial clip duration</span><select aria-label="Initial clip duration" value={duration} onChange={e=>setDuration(Number(e.target.value) as VideoDuration)}><option value={4}>4 seconds</option><option value={6}>6 seconds</option><option value={8}>8 seconds</option></select></label><label><span className="sr-only">Initial aspect ratio</span><select aria-label="Initial aspect ratio" value={ratio} onChange={e=>setRatio(e.target.value as '16:9'|'9:16')}><option value="16:9">16:9</option><option value="9:16">9:16</option></select></label></>}</div><button className="primary creator-submit" disabled={!ready||loading}>{kind==='video'?'Open video studio':kind==='notes'?'Build story context':'Start writing'}<ArrowUpRight size={18}/></button></div>
 <div className="creator-utility"><button type="button" disabled={loading} onClick={()=>file.current?.click()}><Upload size={13}/>{loading?'Reading…':'Import text'}</button><small>{text.length.toLocaleString()} / {kind==='video'?'2,000':'100,000'}</small><input ref={file} type="file" aria-label="Import story text" accept=".txt,.md,.markdown,text/plain,text/markdown" hidden onChange={e=>{if(e.target.files?.[0])void readFile(e.target.files[0]);e.target.value=''}}/></div>
 <details className="creator-details"><summary>Project details <ChevronDown size={13}/></summary><label>Project title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Untitled story" maxLength={200}/></label>{kind!=='video'&&<label>Story direction <small>Optional</small><textarea aria-label="Initial direction" rows={2} value={direction} onChange={e=>setDirection(e.target.value)} maxLength={10000} placeholder="The choice or change you want to explore."/></label>}</details>{error&&<p className="studio-error" role="alert">{error}</p>}</form></div>
 <div className="creator-reassurance"><span>{kind==='video'?`Estimated clip cost $${videoEstimate(duration).toFixed(2)} · review and approve inside the studio`:'Exact-text editing · no AI request when opening a project'}</span><span>{STATIC_HOST?'Local edition':configured?'Gemini configured':'Local writing available'} · projects save in this browser</span></div>
 </section>
}
