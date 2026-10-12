'use client';
import {useEffect,useRef,useState} from 'react';
import {applyPassage,passageContext,type PassageSelection} from '@/lib/modules/writing/passage';
type Props={selection:PassageSelection;workspaceId:string;draft:string;configured:boolean;context:()=>Record<string,unknown>;settings:()=>void;apply:(text:string)=>void;close:()=>void};
export function PassageRevision({selection,workspaceId,draft,configured,context,settings,apply,close}:Props) {
  const [instruction,setInstruction]=useState(''),[replacement,setReplacement]=useState(selection.original),[error,setError]=useState(''),[busy,setBusy]=useState(false),[suggested,setSuggested]=useState(false);
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>()=>controller.current?.abort(),[]);
  const stale=draft!==selection.draft || workspaceId!==selection.workspaceId;
  async function suggest(){
    if(busy || stale || !instruction.trim())return;
    const abort=new AbortController();controller.current=abort;setBusy(true);setError('');
    const timer=setTimeout(()=>abort.abort('timeout'),75000);
    try{
      const requestId=crypto.randomUUID();
      const response=await fetch('/api/revise-passage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...context(),passage:passageContext(selection),instruction,requestId}),signal:abort.signal});
      const result=await response.json();
      if(abort.signal.aborted)return;
      if(!response.ok)throw Error(result.error || 'Passage revision failed.');
      if(result.requestId!==requestId || typeof result.replacement!=='string'||!result.replacement.trim()||result.replacement.length>24000)throw Error('The suggestion was incomplete. Your draft is intact.');
      setReplacement(result.replacement);setSuggested(true);
    }catch(e){if(controller.current===abort)setError(abort.signal.aborted?(abort.signal.reason==='timeout'?'Request timed out. Your draft is unchanged.':'Request cancelled. Your draft is unchanged.'):e instanceof Error?e.message:'Passage revision failed.')}
    finally{clearTimeout(timer);if(controller.current===abort){controller.current=null;setBusy(false)}}
  }
  return <section className="passage-revision" aria-label="Review passage revision">
    <div className="section-head"><div><h2>Revise this passage</h2><p>Review the replacement before applying it. The rest of your draft stays intact.</p></div><button onClick={close}>Close revision</button></div>
    {stale&&<p role="alert">The draft changed. Select the passage again before applying a replacement.</p>}
    {error&&<p role="alert">{error}</p>}
    <label>Revision instruction<textarea disabled={busy} rows={2} value={instruction} onChange={e=>setInstruction(e.target.value)} maxLength={4000} placeholder="Describe the change you want, such as tightening the prose or clarifying a character’s motivation."/></label>
    <div className="passage-controls">{configured?<button disabled={busy||stale||!instruction.trim()} onClick={()=>void suggest()}>{busy?'Revising passage…':suggested?'Try another suggestion':'Suggest replacement'}</button>:<><p>AI needs Gemini. You can write the replacement yourself.</p><button onClick={settings}>AI settings</button></>}{busy&&<button onClick={()=>controller.current?.abort()}>Cancel suggestion</button>}</div>
    <div className="passage-comparison"><div><h3>Original</h3><p>{selection.original}</p></div><label>Replacement<textarea disabled={busy} aria-label="Passage replacement" rows={8} value={replacement} onChange={e=>setReplacement(e.target.value)} maxLength={24000}/></label></div>
    <div className="passage-controls"><button className="primary" disabled={busy||stale||!replacement.trim()||replacement===selection.original} onClick={()=>{try{apply(applyPassage(workspaceId,draft,selection,replacement));close()}catch(e){setError(e instanceof Error?e.message:'Replacement failed.')}}}>Apply replacement</button><button onClick={close}>Discard revision</button><small>{suggested?'AI suggestion · editable before applying':'Manual replacement · editable before applying'}</small></div>
  </section>;
}
