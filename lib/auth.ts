import { cache } from 'react';

import { isDemoMode } from '@/lib/env';
import { demoUser } from '@/lib/data/demo';
import type { AppUser } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  if (isDemoMode) {
    return demoUser;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata.display_name ?? user.email.split('@')[0],
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  } satisfies AppUser;
});
