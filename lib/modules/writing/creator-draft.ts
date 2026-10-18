export const CREATOR_DRAFT_KEY='restory-creator-draft-v1';
export type CreatorDraft={title:string;text:string;kind:'draft'|'notes'|'video';direction:string;duration:4|6|8;ratio:'16:9'|'9:16'};
type DraftStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
function valid(value:unknown):value is CreatorDraft {
 const v=value as CreatorDraft|null;
 return !!v&&typeof v.title==='string'&&v.title.length<=200&&typeof v.text==='string'&&v.text.length<=100000&&['draft','notes','video'].includes(v.kind)&&typeof v.direction==='string'&&v.direction.length<=10000&&[4,6,8].includes(v.duration)&&['16:9','9:16'].includes(v.ratio);
}
export function loadCreatorDraft(storage:Pick<DraftStorage,'getItem'>):CreatorDraft|null {
 const raw=storage.getItem(CREATOR_DRAFT_KEY);if(raw===null)return null;
 const value:unknown=JSON.parse(raw);if(!valid(value))throw Error('Invalid composer recovery data');return value;
}
export function saveCreatorDraft(storage:Pick<DraftStorage,'setItem'>,value:CreatorDraft){
 if(!valid(value))throw Error('Invalid composer recovery data');storage.setItem(CREATOR_DRAFT_KEY,JSON.stringify(value));
}
export function clearCreatorDraft(storage:Pick<DraftStorage,'removeItem'>){storage.removeItem(CREATOR_DRAFT_KEY)}
