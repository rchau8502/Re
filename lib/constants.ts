export const ENTITY_TYPES = [
  'character',
  'faction',
  'location',
  'item',
  'creature',
  'religion',
  'organization',
  'nation',
  'resource',
  'class_or_job',
  'power_system_element',
] as const;

export const VISIBILITY_OPTIONS = ['public', 'gm_only', 'private', 'shared'] as const;
export const CHAT_MODES = ['creator', 'archivist', 'consistency_checker', 'gm_assistant'] as const;
export const CAMPAIGN_STATUSES = ['planning', 'active', 'paused', 'completed'] as const;
export const CANDIDATE_STATUSES = ['pending', 'approved', 'rejected', 'needs_revision'] as const;
