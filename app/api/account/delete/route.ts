// app/api/account/delete/route.ts — Delete account (Stage 7, §24).
//
// POST with the user's Supabase access token in the Authorization header.
// Verifies the token with the anon client, then deletes the auth user
// with the SERVICE-ROLE key (server-only env var SUPABASE_SERVICE_ROLE_KEY,
// never shipped to the browser). All profile / sync rows are removed by
// ON DELETE CASCADE. The client wipes the local copy separately.
//
// Returns 503 when the cloud is not configured — the route is inert until
// the Supabase project exists.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json(
      { error: 'Cloud backup is not set up yet, so there is no account to delete.' },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  // Verify the caller's token and resolve their user id.
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await anon.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'That sign-in has expired. Sign in again and retry.' }, { status: 401 });
  }

  // Service-role client: bypasses RLS, deletes the auth user; every
  // profile/sync row follows via ON DELETE CASCADE.
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: 'Account deletion failed. Try again, or contact us.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, deletedUserId: user.id });
}
