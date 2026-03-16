'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { updateWorldAction, type WorldFormState } from '@/lib/forms/world-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { World } from '@/lib/types';

const initialState: WorldFormState = { error: null, success: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending}>{pending ? 'Saving…' : 'Save world metadata'}</Button>;
}

export function WorldSettingsForm({ world }: { world: World }) {
  const [state, action] = useActionState(updateWorldAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="worldId" value={world.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="title" defaultValue={world.title} required />
        <Input name="genre" defaultValue={world.genre} required />
        <Input name="tone" defaultValue={world.tone} required />
        <Input name="techLevel" defaultValue={world.techLevel} required />
        <Input name="systemType" defaultValue={world.systemType} className="md:col-span-2" required />
      </div>
      <Textarea name="description" defaultValue={world.description} rows={6} required />
      {state.error ? <p className="text-sm text-[var(--danger)]">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[var(--accent-strong)]">{state.success}</p> : null}
      <SubmitButton />
    </form>
  );
}
