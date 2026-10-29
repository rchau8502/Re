'use client';
import {useEffect,useState} from 'react';
import type {VideoJob} from '@/lib/modules/video/types';
export type ContinuationSubmission={parent:VideoJob;prompt:string;durationCeiling:number;approvedCostUsd:number};
type Quote={canExtend:boolean;durationCeiling:number;nextCeiling:number|null;estimatedCostUsd:number|null};
export function VideoContinuation({parent,locked,unlocked,prompt,changePrompt,submit}:{parent:VideoJob;locked:boolean;unlocked:boolean;prompt:string;changePrompt:(prompt:string)=>void;submit:(value:ContinuationSubmission)=>Promise<void>}){
 const [quote,setQuote]=useState<Quote|null>(null),[error,setError]=useState(''),[approved,setApproved]=useState(false);
 useEffect(()=>{
  const abort=new AbortController();setQuote(null);setError('');setApproved(false);
  if(!unlocked)return;
  void (async()=>{try{
   const response=await fetch('/api/video/extend?ticket='+encodeURIComponent(parent.ticket!),{signal:AbortSignal.any([abort.signal,AbortSignal.timeout(15000)])});const value=await response.json();
   if(!response.ok)throw Error(value.error || 'Continuation information unavailable.');
   if(typeof value.canExtend!=='boolean'||![10,20,30,40].includes(value.durationCeiling)||value.canExtend&&(![20,30,40].includes(value.nextCeiling)||typeof value.estimatedCostUsd!=='number'))throw Error('Invalid continuation information.');
   if(!abort.signal.aborted)setQuote(value);
  }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Continuation information unavailable.')}})();
  return()=>abort.abort();
 },[parent.ticket,unlocked]);
 return <section className="video-continuation" aria-label="Continue selected video"><h3>Continue this video</h3>
  {!unlocked?<p>Unlock video access to check continuation options.</p>:error?<p role="alert">{error}</p>:!quote?<p>Checking continuation options…</p>:!quote.canExtend?<p>This clip has reached the 40-second continuation limit. Download it before starting another sequence.</p>:<>
   <p>Append a target 10-second continuation. Conservative total length allowance: {quote.nextCeiling}s. The original stays in history.</p>
   <label>What happens next?<textarea aria-label="Video continuation prompt" rows={4} maxLength={2000} disabled={locked} value={prompt} onChange={e=>{changePrompt(e.target.value);setApproved(false)}} placeholder="Describe only what should happen after the current ending."/></label>
   <p>Estimated new request: <strong>${quote.estimatedCostUsd!.toFixed(2)}</strong>. Estimate allows for the whole returned video, context and prompt overhead. Actual billing may differ; this is not a spending cap. Duration and seamless continuity are not guaranteed.</p>
   <label className="toggle"><input type="checkbox" disabled={locked} checked={approved} onChange={e=>setApproved(e.target.checked)}/>Approve one continuation request estimated at ${quote.estimatedCostUsd!.toFixed(2)}</label>
   <button disabled={locked||!approved||!prompt.trim()} onClick={()=>{setApproved(false);void submit({parent,prompt:prompt.trim(),durationCeiling:quote.nextCeiling!,approvedCostUsd:quote.estimatedCostUsd!})}}>Extend selected video once</button>
  </>}
 </section>;
}
