create extension if not exists pgcrypto;

create type public.canon_visibility as enum ('public', 'gm_only', 'private', 'shared');
create type public.entity_type as enum (
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
  'power_system_element'
);
create type public.chat_mode as enum ('creator', 'archivist', 'consistency_checker', 'gm_assistant');
create type public.campaign_status as enum ('planning', 'active', 'paused', 'completed');
create type public.candidate_status as enum ('pending', 'approved', 'rejected', 'needs_revision');
create type public.canon_level as enum ('core', 'provisional', 'rumored');
create type public.document_parse_status as enum ('pending', 'parsed', 'failed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.auth_user_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.uid()::text, '')::uuid
$$;

create or replace function public.owns_world(target_world_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.worlds w
    where w.id = target_world_id
      and w.owner_id = public.auth_user_id()
  )
$$;

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  genre text not null,
  tone text not null,
  tech_level text not null,
  system_type text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  title text not null,
  summary text not null default '',
  status public.campaign_status not null default 'planning',
  timeline_branch text not null default 'Prime Continuity',
  visibility public.canon_visibility not null default 'shared',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  entity_type public.entity_type not null,
  name text not null,
  aliases jsonb not null default '[]'::jsonb,
  short_description text not null default '',
  long_description text not null default '',
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  visibility public.canon_visibility not null default 'public',
  source_confidence numeric(4,3) not null default 0.750,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists entities_world_name_idx on public.entities(world_id, lower(name));

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  from_entity_id uuid not null references public.entities(id) on delete cascade,
  to_entity_id uuid not null references public.entities(id) on delete cascade,
  relation_type text not null,
  notes text not null default '',
  visibility public.canon_visibility not null default 'public',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  title text not null,
  category text not null default 'General',
  statement text not null,
  exceptions jsonb not null default '[]'::jsonb,
  consequences jsonb not null default '[]'::jsonb,
  examples jsonb not null default '[]'::jsonb,
  visibility public.canon_visibility not null default 'public',
  canon_level public.canon_level not null default 'provisional',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists rules_world_title_idx on public.rules(world_id, lower(title));

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  title text not null,
  summary text not null default '',
  date_in_world text not null default '',
  order_index integer not null default 0,
  causes jsonb not null default '[]'::jsonb,
  consequences jsonb not null default '[]'::jsonb,
  participants jsonb not null default '[]'::jsonb,
  visibility public.canon_visibility not null default 'public',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists events_world_order_idx on public.events(world_id, order_index);

create table if not exists public.secrets (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  related_entity_id uuid references public.entities(id) on delete set null,
  related_event_id uuid references public.events(id) on delete set null,
  secret_text text not null,
  visibility public.canon_visibility not null default 'gm_only',
  reveal_conditions text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  summary text not null default '',
  recap text not null default '',
  decisions jsonb not null default '[]'::jsonb,
  revealed_lore jsonb not null default '[]'::jsonb,
  changed_world_state jsonb not null default '[]'::jsonb,
  next_hooks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.changelog (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  object_type text not null,
  object_id uuid not null,
  old_value_summary text not null default '',
  new_value_summary text not null default '',
  reason text not null default '',
  changed_by uuid not null references public.users(id) on delete set null,
  source_message_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  title text not null,
  file_type text not null check (file_type in ('markdown', 'txt', 'pdf')),
  storage_path text not null,
  extracted_text text,
  access_scope public.canon_visibility not null default 'private',
  parse_status public.document_parse_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  title text not null,
  mode public.chat_mode not null default 'creator',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists chat_messages_thread_created_idx on public.chat_messages(thread_id, created_at);

create table if not exists public.canon_candidates (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  source_message_id uuid not null references public.chat_messages(id) on delete cascade,
  candidate_type text not null check (candidate_type in ('world_update', 'entity', 'relationship', 'rule', 'event', 'secret', 'campaign', 'session')),
  candidate_payload jsonb not null default '{}'::jsonb,
  review_status public.candidate_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_users_updated_at before update on public.users for each row execute procedure public.set_updated_at();
create trigger set_worlds_updated_at before update on public.worlds for each row execute procedure public.set_updated_at();
create trigger set_campaigns_updated_at before update on public.campaigns for each row execute procedure public.set_updated_at();
create trigger set_entities_updated_at before update on public.entities for each row execute procedure public.set_updated_at();
create trigger set_rules_updated_at before update on public.rules for each row execute procedure public.set_updated_at();
create trigger set_events_updated_at before update on public.events for each row execute procedure public.set_updated_at();
create trigger set_secrets_updated_at before update on public.secrets for each row execute procedure public.set_updated_at();
create trigger set_sessions_updated_at before update on public.sessions for each row execute procedure public.set_updated_at();
create trigger set_source_documents_updated_at before update on public.source_documents for each row execute procedure public.set_updated_at();
create trigger set_chat_threads_updated_at before update on public.chat_threads for each row execute procedure public.set_updated_at();
create trigger set_canon_candidates_updated_at before update on public.canon_candidates for each row execute procedure public.set_updated_at();

alter table public.users enable row level security;
alter table public.worlds enable row level security;
alter table public.campaigns enable row level security;
alter table public.entities enable row level security;
alter table public.relationships enable row level security;
alter table public.rules enable row level security;
alter table public.events enable row level security;
alter table public.secrets enable row level security;
alter table public.sessions enable row level security;
alter table public.changelog enable row level security;
alter table public.source_documents enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.canon_candidates enable row level security;

create policy "Users can read own profile" on public.users for select using (id = public.auth_user_id());
create policy "Users can upsert own profile" on public.users for insert with check (id = public.auth_user_id());
create policy "Users can update own profile" on public.users for update using (id = public.auth_user_id()) with check (id = public.auth_user_id());

create policy "Owners manage worlds" on public.worlds for all using (owner_id = public.auth_user_id()) with check (owner_id = public.auth_user_id());
create policy "Owners manage campaigns" on public.campaigns for all using (public.owns_world(world_id)) with check (public.owns_world(world_id));
create policy "Owners manage entities" on public.entities for all using (public.owns_world(world_id)) with check (public.owns_world(world_id));
create policy "Owners manage relationships" on public.relationships for all using (public.owns_world(world_id)) with check (public.owns_world(world_id));
create policy "Owners manage rules" on public.rules for all using (public.owns_world(world_id)) with check (public.owns_world(world_id));
create policy "Owners manage events" on public.events for all using (public.owns_world(world_id)) with check (public.owns_world(world_id));
create policy "Owners manage secrets" on public.secrets for all using (public.owns_world(world_id)) with check (public.owns_world(world_id));
create policy "Owners manage changelog" on public.changelog for all using (public.owns_world(world_id)) with check (public.owns_world(world_id));
create policy "Owners manage documents" on public.source_documents for all using (public.owns_world(world_id)) with check (public.owns_world(world_id));
create policy "Owners manage threads" on public.chat_threads for all using (public.owns_world(world_id)) with check (public.owns_world(world_id));
create policy "Owners manage candidates" on public.canon_candidates for all using (public.owns_world(world_id)) with check (public.owns_world(world_id));
create policy "Owners manage sessions" on public.sessions for all using (
  exists (
    select 1 from public.campaigns c
    join public.worlds w on w.id = c.world_id
    where c.id = sessions.campaign_id and w.owner_id = public.auth_user_id()
  )
) with check (
  exists (
    select 1 from public.campaigns c
    join public.worlds w on w.id = c.world_id
    where c.id = sessions.campaign_id and w.owner_id = public.auth_user_id()
  )
);
create policy "Owners manage chat messages" on public.chat_messages for all using (
  exists (
    select 1 from public.chat_threads t
    join public.worlds w on w.id = t.world_id
    where t.id = chat_messages.thread_id and w.owner_id = public.auth_user_id()
  )
) with check (
  exists (
    select 1 from public.chat_threads t
    join public.worlds w on w.id = t.world_id
    where t.id = chat_messages.thread_id and w.owner_id = public.auth_user_id()
  )
);

insert into storage.buckets (id, name, public)
values ('canonkeep-documents', 'canonkeep-documents', false)
on conflict (id) do nothing;

create policy "Owners can manage CanonKeep documents" on storage.objects
for all
using (
  bucket_id = 'canonkeep-documents'
  and exists (
    select 1
    from public.worlds w
    where split_part(name, '/', 1)::uuid = w.id
      and w.owner_id = public.auth_user_id()
  )
)
with check (
  bucket_id = 'canonkeep-documents'
  and exists (
    select 1
    from public.worlds w
    where split_part(name, '/', 1)::uuid = w.id
      and w.owner_id = public.auth_user_id()
  )
);
