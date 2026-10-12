import {isStory} from '../../story';
import type {ProjectArchive,WorldContext,NarrativeContent,Message,WritingState} from '../core/types';
import {lineage} from '../branches';
export function getWriting(data:ProjectArchive,context:WorldContext,workspaceId:string) {
  lineage(data,context);
  const writing=data.writing;
  const draft=writing?.drafts.find(d=>d.workspaceId===workspaceId && d.branchId===context.branchId);
  const conversation=writing?.conversations.find(c=>c.workspaceId===workspaceId && c.branchId===context.branchId);
  return {draft,conversation,revisions:writing?.revisions.filter(r=>r.draftId===draft?.id) ?? []};
}
export function saveWriting(data:ProjectArchive,context:WorldContext,workspaceId:string,input:{content?:NarrativeContent;messages?:Message[]},checkpoint=false):ProjectArchive {
  lineage(data,context);
  if(!workspaceId.trim())throw Error('A writing workspace is required');
  const original=getWriting(data,context,workspaceId), now=new Date().toISOString();
  const writing:WritingState=structuredClone(data.writing ?? {drafts:[],revisions:[],conversations:[]});
  let changed=false;
  if(input.content!==undefined) {
    if(!isStory(input.content) || JSON.stringify(input.content).length>400000)throw Error('Draft exceeds the writing limit');
    if(!original.draft) { writing.drafts.push({id:crypto.randomUUID(),projectId:context.projectId,branchId:context.branchId,workspaceId,content:structuredClone(input.content)});changed=true; }
    else if(JSON.stringify(original.draft.content)!==JSON.stringify(input.content) || checkpoint) {
      const last=original.revisions.at(-1);
      // Preserve a useful autosave checkpoint, rather than one revision per keystroke.
      if(checkpoint || !last || Date.now()-Date.parse(last.createdAt)>=30000)writing.revisions.push({id:crypto.randomUUID(),draftId:original.draft.id,content:structuredClone(original.draft.content),createdAt:now});
      const draft=writing.drafts.find(d=>d.id===original.draft!.id)!;draft.content=structuredClone(input.content);
      const revisions=writing.revisions.filter(r=>r.draftId===draft.id);
      const keep=new Set(revisions.slice(-50).map(r=>r.id));writing.revisions=writing.revisions.filter(r=>r.draftId!==draft.id || keep.has(r.id));changed=true;
    }
  }
  if(input.messages!==undefined && JSON.stringify(original.conversation?.messages)!==JSON.stringify(input.messages)) {
    if(input.messages.length>200 || input.messages.some(m=>!m.id || !['user','assistant'].includes(m.role) || typeof m.text!=='string' || m.text.length>12000))throw Error('Invalid writing conversation');
    if(original.conversation)writing.conversations.find(c=>c.id===original.conversation!.id)!.messages=structuredClone(input.messages);
    else writing.conversations.push({id:crypto.randomUUID(),projectId:context.projectId,branchId:context.branchId,workspaceId,messages:structuredClone(input.messages)});
    changed=true;
  }
  return changed ? {...data,writing,history:[...data.history,{id:crypto.randomUUID(),action:'writing.saved',branchId:context.branchId,recordId:writing.drafts.find(d=>d.workspaceId===workspaceId && d.branchId===context.branchId)?.id ?? writing.conversations.find(c=>c.workspaceId===workspaceId && c.branchId===context.branchId)?.id ?? workspaceId,createdAt:now}].slice(-10000)} : data;
}
export function restoreRevision(data:ProjectArchive,context:WorldContext,workspaceId:string,revisionId:string,currentContent?:NarrativeContent):ProjectArchive {
  const current=getWriting(data,context,workspaceId),revision=current.revisions.find(r=>r.id===revisionId);
  if(!revision || !current.draft)throw Error('Revision not found in this writing branch');
  const prepared=currentContent?saveWriting(data,context,workspaceId,{content:currentContent}):data;
  return saveWriting(prepared,context,workspaceId,{content:revision.content},true);
}
