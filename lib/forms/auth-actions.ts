'use server';

import { redirect } from 'next/navigation';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/env';

export async function signInAction(formData: FormData) {
  if (isDemoMode) {
    redirect('/worlds');
  }

  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/worlds');
}

export async function signUpAction(formData: FormData) {
  if (isDemoMode) {
    redirect('/worlds');
  }

  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('displayName') ?? email.split('@')[0]);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/worlds');
}

export async function signOutAction() {
  if (!isDemoMode) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }
  redirect('/');
}
