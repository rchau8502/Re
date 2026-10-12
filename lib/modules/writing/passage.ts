export interface PassageSelection {workspaceId:string;draft:string;start:number;end:number;original:string}
export function selectPassage(workspaceId:string,draft:string,start:number,end:number):PassageSelection {
  if(!workspaceId || !Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>draft.length)throw Error('Select a passage in the draft first.');
  if(end-start>12000)throw Error('Select a passage of at most 12,000 characters.');
  if(!draft.slice(start,end).trim())throw Error('Select text rather than whitespace.');
  return {workspaceId,draft,start,end,original:draft.slice(start,end)};
}
export function passageContext(selection:PassageSelection) {
  return {original:selection.original,before:selection.draft.slice(Math.max(0,selection.start-2000),selection.start),after:selection.draft.slice(selection.end,selection.end+2000)};
}
export function validatePassage(value:unknown) {
  const p=value as ReturnType<typeof passageContext>;
  if(!p || typeof p.original!=='string'||!p.original.trim()||p.original.length>12000||typeof p.before!=='string'||p.before.length>2000||typeof p.after!=='string'||p.after.length>2000)throw Error('Invalid selected passage.');
  return {original:p.original,before:p.before,after:p.after};
}
export function applyPassage(workspaceId:string,draft:string,selection:PassageSelection,replacement:string) {
  if(workspaceId!==selection.workspaceId || draft!==selection.draft)throw Error('The draft changed since this passage was selected. Select it again to preserve your newer writing.');
  const valid=selectPassage(workspaceId,draft,selection.start,selection.end);
  if(valid.original!==selection.original)throw Error('The selected passage no longer matches.');
  if(typeof replacement!=='string'||!replacement.trim()||replacement.length>24000)throw Error('Replacement must contain text under 24,000 characters.');
  return draft.slice(0,selection.start)+replacement+draft.slice(selection.end);
}
