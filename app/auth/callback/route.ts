// app/auth/callback/route.ts — Email confirmation / magic-link callback
// (Stage 7). Supabase redirects here with ?code=…; we exchange it for a
// session and send the user on. On ANY failure the user lands on the
// account page with an honest error instead of silently signed-out on
// Settings: no code, a Supabase ?error=… (an expired link arrives as
// error=access_denied&error_code=otp_expired, with no code at all), or
// a failed exchange (expired / already-used / invalid code).

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const DEFAULT_NEXT = '/hifz/settings';
const LINK_FAILED_URL = '/hifz/settings/account?auth=link_expired';

/** Only relative in-app paths may be used as a post-login destination. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return DEFAULT_NEXT;
  return raw;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const next = safeNext(req.nextUrl.searchParams.get('next'));
  const origin = req.nextUrl.origin;

  if (!code || req.nextUrl.searchParams.get('error')) {
    return NextResponse.redirect(new URL(LINK_FAILED_URL, origin));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !anonKey) {
    // Cloud backup is not configured: the account page explains that
    // itself, so send the user there rather than silently to Settings.
    return NextResponse.redirect(new URL('/hifz/settings/account', origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(LINK_FAILED_URL, origin));
  }
  return NextResponse.redirect(new URL(next, origin));
}
