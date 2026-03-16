'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { createSessionAction, type CampaignActionState } from '@/lib/forms/campaign-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const initialState: CampaignActionState = { error: null, success: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending}>{pending ? 'Creating…' : 'Create session'}</Button>;
}

export function SessionForm({ worldId, campaignId }: { worldId: string; campaignId: string }) {
  const [state, action] = useActionState(createSessionAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="worldId" value={worldId} />
      <input type="hidden" name="campaignId" value={campaignId} />
      <Input name="title" placeholder="Session title" required />
      <Input name="summary" placeholder="Short summary" required />
      <Textarea name="recap" placeholder="Recap" rows={5} required />
      <div className="grid gap-4 md:grid-cols-2">
        <Textarea name="decisions" rows={4} placeholder="Decisions, one per line" />
        <Textarea name="revealedLore" rows={4} placeholder="Revealed lore, one per line" />
        <Textarea name="changedWorldState" rows={4} placeholder="Changed world state, one per line" />
        <Textarea name="nextHooks" rows={4} placeholder="Next hooks, one per line" />
      </div>
      {state.error ? <p className="text-sm text-[var(--danger)]">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[var(--accent-strong)]">{state.success}</p> : null}
      <SubmitButton />
    </form>
  );
}
