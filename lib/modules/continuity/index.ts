import type { ProjectArchive, WorldContext, Fact } from '../core/types';
import { resolveWorldState } from '../branches';
export function checkFact(data: ProjectArchive, context: WorldContext, proposed: Fact): string[] {
  const current = resolveWorldState(data, {...context, atOrder: proposed.validFrom ?? context.atOrder}).facts.find(f => f.subjectId === proposed.subjectId && f.predicate === proposed.predicate);
  return current && current.value !== proposed.value ? [`Possible continuity conflict: ${proposed.predicate} changes from “${current.value}” to “${proposed.value}”. Approve only if this change is intentional.`] : [];
}
export function checkTimeline(data: ProjectArchive, context: WorldContext): string[] {
  return resolveWorldState(data, context).events.flatMap(event => {
    const state = resolveWorldState(data, {...context, atOrder: event.order});
    return event.participants.filter(id => state.facts.some(f => f.subjectId === id && f.predicate === 'status' && f.value.toLowerCase() === 'dead')).map(id => `Possible continuity conflict: ${state.entities.find(e => e.id === id)?.name ?? id} is dead at event “${event.title}”.`);
  });
}
