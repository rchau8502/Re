'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import { createChangeLogEntry, createWorld, getWorldById, updateWorld } from '@/lib/data/repository';

export interface WorldFormState {
  error: string | null;
  success?: string | null;
}

export async function createWorldAction(_: WorldFormState, formData: FormData): Promise<WorldFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to create a world.' };
  }

  const title = String(formData.get('title') ?? '');
  const genre = String(formData.get('genre') ?? '');
  const tone = String(formData.get('tone') ?? '');
  const techLevel = String(formData.get('techLevel') ?? '');
  const systemType = String(formData.get('systemType') ?? '');
  const description = String(formData.get('description') ?? '');

  if (!title || !genre || !tone || !techLevel || !systemType || !description) {
    return { error: 'All world fields are required for the MVP.' };
  }

  const world = await createWorld(user.id, {
    title,
    genre,
    tone,
    techLevel,
    systemType,
    description,
  });

  await createChangeLogEntry({
    worldId: world.id,
    objectType: 'world',
    objectId: world.id,
    oldValueSummary: 'World not yet created.',
    newValueSummary: `${world.title}: ${world.description}`,
    reason: 'Initial world creation.',
    changedBy: user.id,
    sourceMessageId: null,
  });

  revalidatePath('/worlds');
  redirect(`/worlds/${world.id}/chat`);
}

export async function updateWorldAction(_: WorldFormState, formData: FormData): Promise<WorldFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to update a world.' };
  }

  const worldId = String(formData.get('worldId') ?? '');
  const title = String(formData.get('title') ?? '');
  const genre = String(formData.get('genre') ?? '');
  const tone = String(formData.get('tone') ?? '');
  const techLevel = String(formData.get('techLevel') ?? '');
  const systemType = String(formData.get('systemType') ?? '');
  const description = String(formData.get('description') ?? '');

  if (!worldId || !title || !genre || !tone || !techLevel || !systemType || !description) {
    return { error: 'All world fields are required.' };
  }

  const existing = await getWorldById(worldId);
  if (!existing) {
    return { error: 'World not found.' };
  }

  const updated = await updateWorld(worldId, {
    title,
    genre,
    tone,
    techLevel,
    systemType,
    description,
  });

  await createChangeLogEntry({
    worldId,
    objectType: 'world',
    objectId: worldId,
    oldValueSummary: `${existing.title}: ${existing.description}`,
    newValueSummary: `${updated.title}: ${updated.description}`,
    reason: 'World metadata updated from overview page.',
    changedBy: user.id,
    sourceMessageId: null,
  });

  revalidatePath(`/worlds/${worldId}`);
  revalidatePath(`/worlds/${worldId}/chat`);
  revalidatePath('/worlds');

  return { error: null, success: 'World metadata updated.' };
}
