-- supabase/migrations/0002_global_leaderboard.sql — Global leaderboard (DRAFT)
--
-- *** DRAFT ONLY — DO NOT APPLY TO THE LIVE DATABASE YET. ***
-- This file is committed for review only. Nothing in it runs until the
-- site owner reviews it and applies it by hand in the Supabase SQL
-- editor (Dashboard → SQL Editor → New query), exactly like 0001.
-- The challenges page already ships a Global section, but until this
-- migration is applied the RPC below does not exist and the UI shows
-- its honest empty state ("No one on the global board yet").
--
-- WHAT IT ENABLES
-- A single read-only aggregate for the Global leaderboard on
-- /hifz/challenges: display name + memorised ayah count + streaks.
-- It is computed live from the existing `sync_docs` progress documents
-- (the same HifzProgress object the app already syncs: `ayahs` records
-- with status 'memorised', `streak.count`, `longestStreak`). There is
-- NO xp column anywhere in the app, so no XP is invented here.
--
-- WHAT IT EXPOSES — AND WHAT IT DOES NOT
-- Exposes, per opted-in member, ONLY:
--   display_name     (user-chosen name from profiles, trimmed, max 40 chars)
--   memorised_ayahs  (count of ayahs with status 'memorised')
--   current_streak   (streak.count, days)
--   longest_streak   (longestStreak, days)
-- It NEVER exposes: email, user id, auth id, timestamps, surah/ayah
-- detail, test scores, mistakes, goals, or any other progress detail.
-- There is no row identifier in the output, so rows cannot be joined
-- back to a user, and the 100-row cap + fixed ordering mean the board
-- cannot be used to enumerate users.
--
-- WHY IT IS SAFE
-- * Opt-in, default OFF: `profiles.show_on_leaderboard` defaults to
--   false. Nobody appears on the board until they choose to — and
--   there is no opt-in UI yet, so even after applying this migration
--   the board stays empty until a follow-up adds the toggle.
-- * Anonymous display names are excluded: rows with a blank or missing
--   display_name never appear (no invented "Anonymous" placeholder).
-- * SECURITY DEFINER with a fixed `search_path = public`: the function
--   reads `profiles` + `sync_docs` as the definer (it must — those
--   tables are own-row-only under RLS and a plain view would return
--   nothing to other users), but it returns ONLY the four aggregate
--   columns above. It cannot leak a row it does not select.
-- * Read-only + STABLE: the function writes nothing and cannot be
--   used to change any data.
-- * Limit is clamped to 1..100 server-side (default 50): a caller
--   cannot ask for the whole table.
-- * Existing RLS is UNTOUCHED: all five tables stay own-row-only.
--   No policy is added, changed, or dropped here.
-- * Grants are execute-only on this one function, to `anon` +
--   `authenticated` (guests may read the public board; the board is
--   public by design). No table grants are added.
--
-- REVIEW CHECKLIST (for the site owner before applying):
--  1. Confirm you are happy with a PUBLIC board: anyone (signed in
--     or guest) can read the top 100 opted-in names + totals.
--  2. Confirm the opt-in default (false) is right — nobody is listed
--     without choosing to be.
--  3. Confirm the four columns are all you want shown (no email,
--     no user id, no dates).
--  4. After applying, the board still shows empty until the opt-in
--     toggle exists in Settings/Account — that is a separate, small
--     follow-up; do not expect names to appear on apply.
--  5. Deletion stays safe: deleting an account cascades its profile
--     + sync_docs rows (0001), so the member vanishes from the board
--     at once. Turning `show_on_leaderboard` off removes them too.
--
-- Idempotent: safe to re-run.

-- Opt-in flag on profiles. Default false: nobody is listed unless
-- they choose to be. No UI sets this yet (follow-up).
alter table public.profiles
  add column if not exists show_on_leaderboard boolean not null default false;

comment on column public.profiles.show_on_leaderboard is
  'Global leaderboard opt-in. False by default: the member is never listed unless they choose to appear.';

-- ------------------------------------------------------------------
-- Global leaderboard aggregate.
--
-- SECURITY DEFINER so it can read across users' own-row-only tables
-- and return ONLY the public aggregate below. Fixed search_path so
-- the function cannot be redirected by a caller-controlled schema.
-- ------------------------------------------------------------------
create or replace function public.global_leaderboard(p_limit int default 50)
returns table (
  display_name text,
  memorised_ayahs int,
  current_streak int,
  longest_streak int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    left(btrim(p.display_name), 40) as display_name,
    coalesce(m.memorised_ayahs, 0) as memorised_ayahs,
    coalesce(s.current_streak, 0) as current_streak,
    coalesce(s.longest_streak, 0) as longest_streak
  from public.profiles p
  left join public.sync_docs d
    on d.user_id = p.id
   and d.doc_type = 'progress'
  -- Memorised ayahs: count of entries in the progress payload's
  -- `ayahs` object whose status is 'memorised'. A missing or
  -- malformed `ayahs` value counts as zero, never an error.
  left join lateral (
    select count(*)::int as memorised_ayahs
    from jsonb_each(
      case when jsonb_typeof(d.payload -> 'ayahs') = 'object'
           then d.payload -> 'ayahs'
           else '{}'::jsonb end
    ) as a (ayah_key, rec)
    where a.rec ->> 'status' = 'memorised'
  ) m on true
  -- Streaks: digits-only values from the progress payload, else zero.
  -- (The app only ever writes numbers here; the guard is belt-and-braces
  -- so a hand-edited document can never break the board.)
  left join lateral (
    select
      case when (d.payload -> 'streak' ->> 'count') ~ '^[0-9]+$'
           then (d.payload -> 'streak' ->> 'count')::int
           else 0 end as current_streak,
      case when (d.payload ->> 'longestStreak') ~ '^[0-9]+$'
           then (d.payload ->> 'longestStreak')::int
           else 0 end as longest_streak
  ) s on true
  where p.show_on_leaderboard is true
    and btrim(coalesce(p.display_name, '')) <> ''
  order by memorised_ayahs desc, longest_streak desc, current_streak desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
$$;

comment on function public.global_leaderboard(int) is
  'Public leaderboard aggregate (DRAFT, migration 0002). Returns ONLY display_name + memorised ayah count + streaks for members who opted in. No email, no user id, no timestamps — rows cannot be joined back to a user. Read-only; limit clamped to 1..100.';

-- Execute-only on this one function. Guests may read the public board;
-- nobody gains any table access from this grant.
revoke all on function public.global_leaderboard(int) from public;
grant execute on function public.global_leaderboard(int) to anon, authenticated;
