'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { createWorldAction, type WorldFormState } from '@/lib/forms/world-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const initialState: WorldFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending}>{pending ? 'Creating…' : 'Create world'}</Button>;
}

export function WorldForm() {
  const [state, action] = useFormState(createWorldAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="title" placeholder="World title" required />
        <Input name="genre" placeholder="Genre" required />
        <Input name="tone" placeholder="Tone" required />
        <Input name="techLevel" placeholder="Tech level" required />
        <Input name="systemType" placeholder="Magic or system type" className="md:col-span-2" required />
      </div>
      <Textarea name="description" placeholder="What makes this setting distinct?" rows={6} required />
      {state.error ? <p className="text-sm text-[var(--danger)]">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
