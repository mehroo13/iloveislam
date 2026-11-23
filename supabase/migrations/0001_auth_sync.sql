-- supabase/migrations/0001_auth_sync.sql — Optional accounts + cloud sync
-- (Stage 7, Part 8 §20–24). Run once in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query) AFTER creating the project
-- `iloveislam` in region ap-southeast-2. Idempotent: safe to re-run.
--
-- DESIGN (research report 2026-11-22):
-- * Guests are NEVER in the cloud. A row is created only when a user
--   chooses to register / sign in, and only their own email + progress
--   records are stored. No audio, no files, no Quran text per user —
--   surah/ayah numbers only.
-- * `profiles`: email only (display name optional, user-chosen).
-- * `sync_docs`: one row per sync document per user; `updated_at`
--   drives last-write-wins. Doc types: progress | mistakes |
--   preferences | bookmarks | reading | goals | activity | challenges.
-- * `test_attempts` / `mistake_events`: append-only tables reserved for
--   a future per-event sync. v1 syncs capped arrays inside `sync_docs`
--   (last 100 test sessions, last 500 mistakes); these tables are
--   created now so the shape is settled and RLS is in place.
-- * `challenge_members`: local HIFZ-XXXX codes linked to the account.
-- * Every table is RLS-gated to auth.uid(). The service-role key
--   (server only) bypasses RLS for the account-deletion route.
-- * All rows CASCADE on auth user deletion.

-- Profiles: minimal PII, email only.
-- NOTE: citext must exist before the profiles table (fresh projects do
-- not have it by default — the first dashboard run failed with
-- `type "citext" does not exist` until the extension was created).
create extension if not exists citext;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per sync document per user. The workhorse table.
create table if not exists public.sync_docs (
  user_id uuid not null references auth.users (id) on delete cascade,
  doc_type text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, doc_type),
  constraint sync_docs_doc_type_check check (
    doc_type in ('progress', 'mistakes', 'preferences', 'bookmarks',
                 'reading', 'goals', 'activity', 'challenges')
  )
);

-- Append-only test attempts (cap: last 100 per user, enforced in app).
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surah int not null,
  mode text not null,
  score numeric,
  total_words int,
  wrong_words int,
  duration_s int,
  created_at timestamptz not null default now()
);
create index if not exists test_attempts_user_created_idx
  on public.test_attempts (user_id, created_at desc);

-- Append-only mistake events (cap: last 500 per user, enforced in app).
-- Surah/ayah/word + error kind only. NEVER audio.
create table if not exists public.mistake_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surah int not null,
  ayah int not null,
  word_index int,
  kind text,
  created_at timestamptz not null default now()
);
create index if not exists mistake_events_user_created_idx
  on public.mistake_events (user_id, created_at desc);

-- Group challenges: local HIFZ-XXXX codes linked to the account.
create table if not exists public.challenge_members (
  code text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (code, user_id)
);

-- ------------------------------------------------------------------
-- Row Level Security: each user can only read/write their own rows.
-- ------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.sync_docs enable row level security;
alter table public.test_attempts enable row level security;
alter table public.mistake_events enable row level security;
alter table public.challenge_members enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own sync docs" on public.sync_docs;
create policy "own sync docs" on public.sync_docs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own test attempts" on public.test_attempts;
create policy "own test attempts" on public.test_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own mistake events" on public.mistake_events;
create policy "own mistake events" on public.mistake_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own challenge memberships" on public.challenge_members;
create policy "own challenge memberships" on public.challenge_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- Profile row auto-created on sign-up (keeps `profiles` in sync with
-- auth.users without any client write).
-- ------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
