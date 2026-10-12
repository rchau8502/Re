'use client';
import {useEffect,useRef,useState} from 'react';
import {STATIC_HOST} from '@/lib/hosting';
import type {Workspace} from '@/lib/story';
import type {ProjectArchive} from '@/lib/modules/core/types';
import {LocalProjectRepository} from '@/lib/modules/storage';
import {retrieveContext} from '@/lib/modules/retrieval';
import {stageSuggestions} from '@/lib/modules/director/proposals';
import {ProposalReview} from './proposal-review';
export function DirectorProposals({workspace,sourceText,sourceTitle}:{workspace:Workspace;sourceText:string;sourceTitle:string}) {
  const [data,setData]=useState<ProjectArchive|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const controller=useRef<AbortController|null>(null),context=workspace.worldContext;
  useEffect(()=>{try{setData(context?new LocalProjectRepository(localStorage).load(context.projectId):null);setError('')}catch(e){setData(null);setError(e instanceof Error?e.message:'World unavailable')}setBusy(false);return()=>{controller.current?.abort();controller.current=null}},[context?.projectId,context?.branchId]);
  function save(next:ProjectArchive){new LocalProjectRepository(localStorage).save(next);setData(next)}
  async function extract(){
    if(!context || busy || STATIC_HOST)return;
    const abort=new AbortController();controller.current=abort;setBusy(true);setError('');
    const timer=setTimeout(()=>abort.abort(),75000);
    try {
      const repo=new LocalProjectRepository(localStorage),latest=repo.load(context.projectId);
      if(!latest)throw Error('World memory is missing. Restore its backup before extracting facts.');
      const world=retrieveContext(latest,context,sourceText);
      const requestId=crypto.randomUUID();
      const response=await fetch('/api/proposals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:workspace.title,world,sourceText,requestId}),signal:abort.signal});
      const result=await response.json();
      if(!response.ok)throw Error(result.error || 'Fact extraction failed');
      if(abort.signal.aborted)return;
      if(result.context?.projectId!==context.projectId || result.context?.branchId!==context.branchId || result.requestId!==requestId)throw Error('The extraction belongs to another branch. Nothing was saved.');
      const current=repo.load(context.projectId);
      if(!current)throw Error('World memory is missing. Nothing was saved.');
      const next=stageSuggestions(current,context,{facts:result.facts},{text:sourceText,title:sourceTitle,requestId});save(next);
      if(!result.facts.length)setError('No supported factual changes were found.');
    }catch(e){if(controller.current===abort)setError(abort.signal.aborted?'Extraction cancelled. No changes were approved.':e instanceof Error?e.message:'Fact extraction failed')}
    finally{clearTimeout(timer);if(controller.current===abort){controller.current=null;setBusy(false)}}
  }
  if(!context)return <p className="muted">Connect world memory in Universe to propose factual changes from this text.</p>;
  return <section className="context-details"><h2>World change review</h2><p>Extract proposed facts from {sourceTitle.toLowerCase()}. Only approved changes affect this branch.</p>{error&&<p role="alert">{error}</p>}<button disabled={STATIC_HOST||busy||!sourceText.trim()||sourceText.length>30000||!data} onClick={()=>void extract()}>{busy?'Extracting facts…':'Suggest world changes'}</button>{STATIC_HOST&&<p className="muted">AI fact extraction needs the full server app. You can review existing proposals and add facts manually in Universe.</p>}{busy&&<button onClick={()=>controller.current?.abort()}>Cancel extraction</button>}{sourceText.length>30000&&<p>Select a shorter passage before extracting facts (30,000 characters maximum).</p>}{data&&<ProposalReview data={data} context={context} save={save} latest={()=>{const current=new LocalProjectRepository(localStorage).load(context.projectId);if(!current)throw Error("World memory unavailable");return current}}/>}</section>;
}
