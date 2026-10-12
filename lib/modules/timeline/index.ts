import type {ProjectArchive, WorldContext, WorldEvent} from '../core/types';
import {lineage} from '../branches';
export function createEvent(data:ProjectArchive, context:WorldContext, input:Omit<WorldEvent,'id'|'projectId'|'branchId'>):ProjectArchive {
  const branch=lineage(data,context).at(-1)!;
  if(!input.title.trim() || !Number.isFinite(input.order) || branch.divergenceOrder !== null && input.order<branch.divergenceOrder)throw Error('Event requires a title and order at or after divergence');
  if(!data.sources.some(s=>s.id===input.sourceId) || input.participants.some(id=>!data.entities.some(e=>e.id===id)) || input.causes.some(id=>!data.events.some(e=>e.id===id)))throw Error('Event references missing world material');
  const event={...input,id:crypto.randomUUID(),projectId:context.projectId,branchId:context.branchId};
  return {...data,events:[...data.events,event],history:[...data.history,{id:crypto.randomUUID(),action:'event.created',branchId:context.branchId,recordId:event.id,createdAt:new Date().toISOString()}]};
}
