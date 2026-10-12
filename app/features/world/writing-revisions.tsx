'use client';
import {useEffect,useState} from 'react';
import type {Workspace,Story} from '@/lib/story';
import {LocalProjectRepository} from '@/lib/modules/storage';
import {getWriting,saveWriting,restoreRevision} from '@/lib/modules/writing';
export function WritingRevisions({workspace,onRestore,onBefore}:{workspace:Workspace;onBefore?:()=>void;onRestore:(content:Story)=>void}) {
  const [revisions,setRevisions]=useState<ReturnType<typeof getWriting>['revisions']>([]),[error,setError]=useState(''),context=workspace.worldContext;
  function refresh(){if(!context)return;const data=new LocalProjectRepository(localStorage).load(context.projectId);if(data)setRevisions(getWriting(data,context,workspace.id).revisions)}
  useEffect(()=>{try{refresh();setError('')}catch(e){setError(e instanceof Error?e.message:'History unavailable')}},[workspace.worldWritingPending,context?.projectId,context?.branchId]);
  function act(action:()=>void){try{onBefore?.();action();refresh();setError('')}catch(e){setError(e instanceof Error?e.message:'Revision operation failed')}}
  if(!context)return <p className="muted">Connect world memory to keep branch-owned draft revisions.</p>;
  return <details><summary>Draft revisions · {revisions.length}</summary><p>Autosave keeps a checkpoint about every 30 seconds and retains the latest 50 versions. Restoring also preserves the current text.</p>{error&&<p role="alert">{error}</p>}<button disabled={!workspace.story} onClick={()=>act(()=>{const repo=new LocalProjectRepository(localStorage),data=repo.load(context.projectId);if(!data || !workspace.story)throw Error('Draft unavailable');repo.save(saveWriting(data,context,workspace.id,{content:workspace.story},true))})}>Save revision checkpoint</button>{revisions.slice().reverse().map(r=><article key={r.id}><p>{new Date(r.createdAt).toLocaleString()} · {r.content.title}</p><p>{r.content.scene.slice(0,160)}</p><button onClick={()=>act(()=>{const repo=new LocalProjectRepository(localStorage),data=repo.load(context.projectId);if(!data)throw Error('World unavailable');const next=restoreRevision(data,context,workspace.id,r.id,workspace.story ?? undefined);repo.save(next);onRestore(getWriting(next,context,workspace.id).draft!.content)})}>Restore this revision</button></article>)}</details>;
}
