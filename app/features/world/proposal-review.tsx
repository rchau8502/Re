'use client';
import {useState} from 'react';
import type {Fact,ProjectArchive,WorldContext} from '@/lib/modules/core/types';
import {editProposal,reviewSelected} from '@/lib/modules/canon';
import {checkFact} from '@/lib/modules/continuity';
export function ProposalReview({data,context,save,latest}:{data:ProjectArchive;context:WorldContext;latest?:()=>ProjectArchive;save:(next:ProjectArchive)=>void}) {
  const [selected,setSelected]=useState<string[]>([]),[error,setError]=useState(''),[editing,setEditing]=useState<string|null>(null);
  const [form,setForm]=useState<Pick<Fact,'predicate'|'value'|'validFrom'|'validUntil'|'removed'>>({predicate:'',value:'',validFrom:null,validUntil:null,removed:false});
  const pending=data.proposals.filter(p=>p.status==='pending' && p.fact.branchId===context.branchId);
  const ids=selected.filter(id=>pending.some(p=>p.id===id));
  function attempt(action:()=>void){try{action();setError('')}catch(e){setError(e instanceof Error?e.message:'Review failed')}}
  function review(target:string[],approve:boolean){attempt(()=>{save(reviewSelected(latest?.() ?? data,context,target,approve,context.branchId===data.project.canonBranchId));setSelected([]);setEditing(null)})}
  if(!pending.length)return <p className="muted">No pending changes in this branch.</p>;
  return <section aria-label="Proposed world changes"><h3>Proposed changes · {pending.length}</h3>{error&&<p role="alert">{error}</p>}
    <button onClick={()=>setSelected(pending.map(p=>p.id))}>Select all</button>{' '}<button disabled={!ids.length} onClick={()=>review(ids,true)}>{context.branchId===data.project.canonBranchId?'Approve selected baseline changes':'Accept selected branch changes'}</button>{' '}<button disabled={!ids.length} onClick={()=>review(ids,false)}>Reject selected</button>
    {pending.map(p=><article className="message" key={p.id}><label className="toggle"><input type="checkbox" checked={ids.includes(p.id)} onChange={e=>setSelected(all=>e.target.checked?[...all,p.id]:all.filter(id=>id!==p.id))}/>Select {data.entities.find(e=>e.id===p.fact.subjectId)?.name} · {p.fact.predicate}</label><strong>{p.fact.removed?'Remove assertion':p.fact.value}</strong><p>Effective order: {p.fact.validFrom ?? 'Always'}{p.fact.validUntil!==null?` to ${p.fact.validUntil}`:''} · confidence {Math.round(p.fact.confidence*100)}% · {p.fact.visibility}</p><p>{p.fact.evidence || 'Inferred or manually entered; no quoted evidence.'}</p>{checkFact(data,context,p.fact).map(w=><p key={w}>{w}</p>)}
      <button onClick={()=>review([p.id],true)}>{context.branchId===data.project.canonBranchId?'Approve baseline canon':'Approve branch fact'}</button>{' '}<button onClick={()=>review([p.id],false)}>Reject</button>{' '}<button onClick={()=>{setEditing(p.id);setForm({predicate:p.fact.predicate,value:p.fact.value,validFrom:p.fact.validFrom,validUntil:p.fact.validUntil,removed:p.fact.removed})}}>Edit proposal</button>
      {editing===p.id&&<div><label>Predicate<input aria-label="Edit predicate" value={form.predicate} onChange={e=>setForm({...form,predicate:e.target.value})}/></label><label>Proposed value<textarea aria-label="Edit proposed value" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label><label>Effective from<input type="number" value={form.validFrom??''} onChange={e=>setForm({...form,validFrom:e.target.value===''?null:Number(e.target.value)})}/></label><label>Effective until<input type="number" value={form.validUntil??''} onChange={e=>setForm({...form,validUntil:e.target.value===''?null:Number(e.target.value)})}/></label><label className="toggle"><input type="checkbox" checked={form.removed} onChange={e=>setForm({...form,removed:e.target.checked})}/>Remove inherited assertion</label><button onClick={()=>attempt(()=>{save(editProposal(latest?.() ?? data,context,p.id,form));setEditing(null)})}>Save proposal edits</button>{' '}<button onClick={()=>setEditing(null)}>Cancel edits</button></div>}
    </article>)}
  </section>;
}
