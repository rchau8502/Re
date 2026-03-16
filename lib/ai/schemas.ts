export const canonExtractionSchema = {
  name: 'canon_candidate_bundle',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      candidates: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            candidateType: {
              type: 'string',
              enum: ['world_update', 'entity', 'relationship', 'rule', 'event', 'secret', 'campaign', 'session'],
            },
            title: { type: 'string' },
            summary: { type: 'string' },
            operation: { type: 'string', enum: ['create', 'update'] },
            visibility: { type: 'string', enum: ['public', 'gm_only', 'private', 'shared'] },
            rationale: { type: 'string' },
            record: {
              type: 'object',
              additionalProperties: true,
            },
          },
          required: ['candidateType', 'title', 'summary', 'operation', 'visibility', 'record'],
        },
      },
    },
    required: ['candidates'],
  },
} as const;
