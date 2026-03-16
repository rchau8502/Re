'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { CAMPAIGN_STATUSES, VISIBILITY_OPTIONS } from '@/lib/constants';
import { createCampaignAction, type CampaignActionState } from '@/lib/forms/campaign-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const initialState: CampaignActionState = { error: null, success: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending}>{pending ? 'Creating…' : 'Create campaign'}</Button>;
}

export function CampaignForm({ worldId }: { worldId: string }) {
  const [state, action] = useActionState(createCampaignAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="worldId" value={worldId} />
      <Input name="title" placeholder="Campaign title" required />
      <Textarea name="summary" placeholder="Campaign summary" rows={4} required />
      <div className="grid gap-4 md:grid-cols-3">
        <Select name="status" defaultValue="planning">
          {CAMPAIGN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Input name="timelineBranch" defaultValue="Prime Continuity" placeholder="Timeline branch" required />
        <Select name="visibility" defaultValue="shared">
          {VISIBILITY_OPTIONS.map((visibility) => (
            <option key={visibility} value={visibility}>
              {visibility}
            </option>
          ))}
        </Select>
      </div>
      {state.error ? <p className="text-sm text-[var(--danger)]">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[var(--accent-strong)]">{state.success}</p> : null}
      <SubmitButton />
    </form>
  );
}
