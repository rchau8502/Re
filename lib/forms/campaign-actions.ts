'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth';
import { createCampaign, createChangeLogEntry, createSession, getCampaign, getWorldById } from '@/lib/data/repository';
import { CAMPAIGN_STATUSES, VISIBILITY_OPTIONS } from '@/lib/constants';

export interface CampaignActionState {
  error: string | null;
  success?: string | null;
}

function splitList(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createCampaignAction(_: CampaignActionState, formData: FormData): Promise<CampaignActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to create a campaign.' };
  }

  const worldId = String(formData.get('worldId') ?? '');
  const title = String(formData.get('title') ?? '');
  const summary = String(formData.get('summary') ?? '');
  const status = String(formData.get('status') ?? 'planning');
  const timelineBranch = String(formData.get('timelineBranch') ?? 'Prime Continuity');
  const visibility = String(formData.get('visibility') ?? 'shared');

  if (!worldId || !title || !summary) {
    return { error: 'World, title, and summary are required.' };
  }

  if (!CAMPAIGN_STATUSES.includes(status as (typeof CAMPAIGN_STATUSES)[number])) {
    return { error: 'Invalid campaign status.' };
  }

  if (!VISIBILITY_OPTIONS.includes(visibility as (typeof VISIBILITY_OPTIONS)[number])) {
    return { error: 'Invalid visibility.' };
  }

  const campaign = await createCampaign(worldId, {
    title,
    summary,
    status: status as (typeof CAMPAIGN_STATUSES)[number],
    timelineBranch,
    visibility: visibility as (typeof VISIBILITY_OPTIONS)[number],
  });

  await createChangeLogEntry({
    worldId,
    objectType: 'campaign',
    objectId: campaign.id,
    oldValueSummary: 'Campaign not yet created.',
    newValueSummary: `${campaign.title}: ${campaign.summary}`,
    reason: 'Campaign created from campaign index.',
    changedBy: user.id,
    sourceMessageId: null,
  });

  revalidatePath(`/worlds/${worldId}/campaigns`);
  revalidatePath(`/worlds/${worldId}`);
  return { error: null, success: 'Campaign created.' };
}

export async function createSessionAction(_: CampaignActionState, formData: FormData): Promise<CampaignActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to create a session.' };
  }

  const worldId = String(formData.get('worldId') ?? '');
  const campaignId = String(formData.get('campaignId') ?? '');
  const title = String(formData.get('title') ?? '');
  const summary = String(formData.get('summary') ?? '');
  const recap = String(formData.get('recap') ?? '');

  if (!worldId || !campaignId || !title || !summary || !recap) {
    return { error: 'Campaign, title, summary, and recap are required.' };
  }

  const campaign = await getCampaign(worldId, campaignId);
  const world = await getWorldById(worldId);
  if (!campaign || !world) {
    return { error: 'Campaign not found.' };
  }

  const session = await createSession(campaignId, {
    title,
    summary,
    recap,
    decisions: splitList(String(formData.get('decisions') ?? '')),
    revealedLore: splitList(String(formData.get('revealedLore') ?? '')),
    changedWorldState: splitList(String(formData.get('changedWorldState') ?? '')),
    nextHooks: splitList(String(formData.get('nextHooks') ?? '')),
  });

  await createChangeLogEntry({
    worldId,
    objectType: 'session',
    objectId: session.id,
    oldValueSummary: 'Session not yet created.',
    newValueSummary: `${session.title}: ${session.summary}`,
    reason: `Session created for campaign ${campaign.title}.`,
    changedBy: user.id,
    sourceMessageId: null,
  });

  revalidatePath(`/worlds/${worldId}/campaigns/${campaignId}`);
  revalidatePath(`/worlds/${worldId}/campaigns`);
  revalidatePath(`/worlds/${worldId}`);
  return { error: null, success: 'Session created.' };
}
