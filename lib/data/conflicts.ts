import type { CanonCandidate, ConflictAlert, Entity, EventRecord, Rule } from '@/lib/types';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function detectConflicts(
  candidates: CanonCandidate[],
  entities: Entity[],
  rules: Rule[],
  events: EventRecord[],
): ConflictAlert[] {
  const alerts: ConflictAlert[] = [];

  for (const candidate of candidates) {
    const record = candidate.candidatePayload.record as Record<string, unknown> | undefined;
    if (!record) continue;

    if (candidate.candidateType === 'entity') {
      const match = entities.find((entity) => normalize(entity.name) === normalize(String(record.name ?? '')));
      if (match && normalize(match.shortDescription) !== normalize(String(record.shortDescription ?? ''))) {
        alerts.push({
          label: `Entity overlap: ${match.name}`,
          severity: 'warning',
          message: `The candidate describes ${match.name} differently from existing canon. Decide whether this is a refinement, retcon, or duplicate.`,
          relatedRecordIds: [match.id, candidate.id],
        });
      }
    }

    if (candidate.candidateType === 'rule') {
      const match = rules.find((rule) => normalize(rule.title) === normalize(String(record.title ?? '')));
      if (match && normalize(match.statement) !== normalize(String(record.statement ?? ''))) {
        alerts.push({
          label: `Rule contradiction: ${match.title}`,
          severity: 'critical',
          message: `The candidate revises the rule statement for ${match.title}. Approving it should create a retcon entry.`,
          relatedRecordIds: [match.id, candidate.id],
        });
      }
    }

    if (candidate.candidateType === 'event') {
      const match = events.find((event) => normalize(event.title) === normalize(String(record.title ?? '')));
      if (match && normalize(match.summary) !== normalize(String(record.summary ?? ''))) {
        alerts.push({
          label: `Event mismatch: ${match.title}`,
          severity: 'warning',
          message: `The candidate redefines an event that already exists in the canon timeline.`,
          relatedRecordIds: [match.id, candidate.id],
        });
      }
    }
  }

  return alerts;
}
