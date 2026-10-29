import {isWorkspace} from '../../story';
import type {KeyValueStore} from '../storage';
import {WORKSPACE_STORAGE_KEY} from './workspaces';

export const UNREADABLE_STORAGE_KEY='restory-unreadable-backup';

// Preserve exact bytes before new projects or imports can replace an invalid index.
export function preserveUnreadableWorkspaces(storage:KeyValueStore):string|null{
 const raw=storage.getItem(WORKSPACE_STORAGE_KEY);
 if(raw===null)return null;
 try{const parsed:unknown=JSON.parse(raw);if(Array.isArray(parsed)&&parsed.every(isWorkspace))return null}catch{}
 const previous=storage.getItem(UNREADABLE_STORAGE_KEY);
 if(previous===raw)return UNREADABLE_STORAGE_KEY;
 const key=previous===null?UNREADABLE_STORAGE_KEY:`${UNREADABLE_STORAGE_KEY}:${crypto.randomUUID()}`;
 try{
  storage.setItem(key,raw);
  if(storage.getItem(key)!==raw)throw Error('Recovery copy could not be verified.');
 }catch{throw Error('The unreadable workspace record could not be preserved. Export the original storage record before retrying; existing data has not been replaced.')}
 return key;
}
