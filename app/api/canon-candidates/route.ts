import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { applyCandidate } from '@/lib/data/candidate-apply';
import { getCandidateById, updateCandidate } from '@/lib/data/repository';

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      candidateId?: string;
      reviewStatus?: 'approved' | 'rejected' | 'pending' | 'needs_revision';
      candidatePayload?: Record<string, unknown>;
    };
    if (!body.candidateId) {
      return NextResponse.json({ error: 'candidateId is required.' }, { status: 400 });
    }

    const current = await getCandidateById(body.candidateId);
    if (!current) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    const updated = await updateCandidate(body.candidateId, {
      reviewStatus: body.reviewStatus,
      candidatePayload: body.candidatePayload,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    if (body.reviewStatus === 'approved') {
      await applyCandidate(updated);
    }

    revalidatePath(`/worlds/${updated.worldId}`);
    revalidatePath(`/worlds/${updated.worldId}/chat`);
    revalidatePath(`/worlds/${updated.worldId}/changes`);
    revalidatePath(`/worlds/${updated.worldId}/campaigns`);
    revalidatePath(`/worlds/${updated.worldId}/entities`);
    revalidatePath(`/worlds/${updated.worldId}/timeline`);

    return NextResponse.json({ candidate: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update candidate.' }, { status: 500 });
  }
}
