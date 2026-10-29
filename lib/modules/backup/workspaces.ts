import {isWorkspace,type Workspace} from '../../story';
import type {ProjectArchive} from '../core/types';
import type {KeyValueStore} from '../storage';
import {restoreProject,reidentifyProject} from './index';

export const WORKSPACE_STORAGE_KEY='restory-workspaces-v2';
export const BACKUP_BYTES=100*1024*1024;
type Bundle={format:'story-world-workspaces';version:1;workspaces:Workspace[];projects:ProjectArchive[]};
export type PreparedWorkspaceImport={workspaces:Workspace[];projects:ProjectArchive[]};
function checkSize(raw:string){if(raw.length>BACKUP_BYTES||new TextEncoder().encode(raw).length>BACKUP_BYTES)throw Error('Backup exceeds 100 MiB.');}
function validateBundle(raw:unknown):Bundle{
 const packaged=!!raw&&typeof raw==='object'&&!Array.isArray(raw)&&'format' in raw;
 if(packaged&&((raw as Bundle).format!=='story-world-workspaces'||(raw as Bundle).version!==1))throw Error('Unsupported workspace backup format or version.');
 const list:unknown=packaged?(raw as Bundle).workspaces:Array.isArray(raw)?raw:[raw];
 if(!Array.isArray(list)||!list.length||!list.every(isWorkspace)||list.some(w=>!w.id.trim()))throw Error('Invalid writing workspace backup.');
 if(new Set(list.map(w=>w.id)).size!==list.length)throw Error('Duplicate workspace IDs.');
 if(packaged&&!Array.isArray((raw as Bundle).projects))throw Error('Missing world archives.');
 const projects:ProjectArchive[]=packaged?(raw as Bundle).projects.map(p=>restoreProject(JSON.stringify(p))):[];
 const worlds=new Map<string,ProjectArchive>();
 for(const p of projects){if(worlds.has(p.project.id))throw Error('Duplicate universe IDs.');worlds.set(p.project.id,p);}
 for(const w of list)if(w.worldContext){const p=worlds.get(w.worldContext.projectId);if(!p||!p.branches.some(b=>b.id===w.worldContext!.branchId))throw Error('This backup references missing world memory. Import a combined workspace/world backup.');}
 return {format:'story-world-workspaces',version:1,workspaces:structuredClone(list),projects};
}
export function serializeWorkspaceBackup(workspaces:Workspace[],projects:ProjectArchive[]):string{
 const bundle=validateBundle({format:'story-world-workspaces',version:1,workspaces,projects});
 const raw=JSON.stringify(bundle,null,2);checkSize(raw);return raw;
}
export function prepareWorkspaceImport(raw:string):PreparedWorkspaceImport{
 checkSize(raw);
 const bundle=validateBundle(JSON.parse(raw)),ids=new Map(bundle.workspaces.map(w=>[w.id,crypto.randomUUID()]));
 const rootWorkspaceIds=new Set(bundle.workspaces.map(w=>w.id));
 const restored=new Map(bundle.projects.map(p=>[p.project.id,reidentifyProject(p,ids)]));
 const workspaces=bundle.workspaces.map(w=>({...w,id:ids.get(w.id)!,parentId:w.parentId&&rootWorkspaceIds.has(w.parentId)?ids.get(w.parentId)!:null,worldContext:w.worldContext?{...w.worldContext,projectId:restored.get(w.worldContext.projectId)!.archive.project.id,branchId:restored.get(w.worldContext.projectId)!.branches.get(w.worldContext.branchId)!}:undefined}));
 return {workspaces,projects:[...restored.values()].map(p=>p.archive)};
}
// Write new world keys first and publish the workspace index last. A crash before
// publication can leave unreferenced copies, but cannot expose a partial import.
export function commitWorkspaceImport(storage:KeyValueStore&{removeItem(key:string):void},prepared:PreparedWorkspaceImport,existing:Workspace[]):Workspace[]{
 const validated=validateBundle({format:'story-world-workspaces',version:1,...prepared});
 const existingIds=new Set(existing.map(w=>w.id));
 if(validated.workspaces.some(w=>existingIds.has(w.id)))throw Error('Imported workspace identity already exists. Prepare the backup again.');
 const writes=validated.projects.map(p=>({key:'story-world-v1:'+p.project.id,value:JSON.stringify(p)}));
 for(const {key} of writes)if(storage.getItem(key)!==null)throw Error('Imported world identity already exists. Prepare the backup again.');
 const all=[...validated.workspaces,...existing],index=JSON.stringify(all),attempted:string[]=[];
 try{
  for(const {key,value} of writes){attempted.push(key);storage.setItem(key,value);}
  storage.setItem(WORKSPACE_STORAGE_KEY,index);
 }catch(error){
  let cleanupFailed=false;
  for(const key of attempted.reverse())try{storage.removeItem(key)}catch{cleanupFailed=true}
  const reason=error instanceof Error?error.message:'Storage is unavailable.';
  throw Error(`Backup import was not saved. ${reason}${cleanupFailed?' Some unreferenced world copies could not be removed.':''}`);
 }
 return all;
}
