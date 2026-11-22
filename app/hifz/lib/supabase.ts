// app/hifz/lib/supabase.ts — Optional accounts + cloud sync (Stage 7, §20–24).
//
// Supabase Auth + Postgres is the backend for OPTIONAL accounts only.
// Guests never touch Supabase: no account is created, no data is sent,
// and the app works exactly as before with progress stored only on the
// device. The cloud is switched on only when a user chooses to create an
// account or sign in (Settings → Account & backup).
//
// CONFIGURATION — the project is NOT configured until the site owner adds:
//   NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  — Supabase anon / publishable key
//   SUPABASE_SERVICE_ROLE_KEY      — server-only; used ONLY by the
//                                    account-deletion API route. Never
//                                    exposed to the browser.
// Until those exist, `isCloudConfigured()` is false and every auth/sync
// helper below is a safe no-op: the UI says plainly that cloud backup is
// not set up yet and points at the on-device export instead. Nothing
// here invents credentials or pretends the cloud is available.
//
// The anon key is safe to ship in the browser build by design (Supabase
// Row Level Security limits every row to its own user), but it must still
// only ever arrive via environment variables / the secure form — never
// pasted into chat or committed to the repo.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True only when the Supabase project URL + anon key are configured. */
export function isCloudConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

let browserClient: SupabaseClient | null = null;

/** Browser client, or null when cloud backup is not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!isCloudConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ili-supabase-auth',
      },
    });
  }
  return browserClient;
}

/** Server client for API routes. Service-role key bypasses RLS — it is
 *  used ONLY by the account-deletion route and must never reach the
 *  browser. Returns null when not configured. */
export function getServiceClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!SUPABASE_URL || !serviceKey) return null;
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AuthResult =
  | { ok: true; needsEmailConfirmation?: boolean }
  | { ok: false; error: string };

function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Email or password did not match. Try again, or use “Email me a sign-in link” below.';
  if (/user already registered|already registered/i.test(message)) return 'An account with this email already exists. Sign in instead — your progress on this device will be merged in, never deleted.';
  if (/password.*at least|password should/i.test(message)) return 'Use a password of at least 6 characters.';
  if (/invalid email/i.test(message)) return 'That email address does not look right.';
  if (/email.*rate|rate limit/i.test(message)) return 'Too many emails sent just now. Wait a little while and try again.';
  if (/network|fetch failed/i.test(message)) return 'Could not reach the server. Check your connection and try again.';
  return message || 'Something went wrong. Try again.';
}

/** Create an account with email + password. On success the caller must
 *  run the one-shot guest → account migration (sync.ts) — the local
 *  snapshot is uploaded only AFTER the account exists, never before. */
export async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Cloud backup is not set up yet.' };
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) return { ok: false, error: friendlyError(error.message) };
  // Supabase returns no session until the email is confirmed.
  return { ok: true, needsEmailConfirmation: !data.session };
}

/** Sign in with email + password. */
export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Cloud backup is not set up yet.' };
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true };
}

/** Passwordless sign-in / sign-up by magic link. Works for both new and
 *  existing accounts; the callback route completes the session. */
export async function signInWithMagicLink(email: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Cloud backup is not set up yet.' };
  const { error } = await sb.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true };
}

/** Sign out. Local progress stays on this device; cloud data is untouched. */
export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

/** Ask the server to delete the account (auth user + all cloud rows via
 *  ON DELETE CASCADE). The caller wipes the local copy separately. */
export async function requestAccountDeletion(): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Cloud backup is not set up yet.' };
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return { ok: false, error: 'You are not signed in.' };
  const res = await fetch('/api/account/delete', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    let detail = 'Account deletion failed.';
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      /* keep generic message */
    }
    return { ok: false, error: detail };
  }
  await sb.auth.signOut();
  return { ok: true };
}
