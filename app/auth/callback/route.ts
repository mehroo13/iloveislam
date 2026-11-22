// app/auth/callback/route.ts — Email confirmation / magic-link callback
// (Stage 7). Supabase redirects here with ?code=…; we exchange it for a
// session and send the user to Settings, where the one-shot guest →
// account migration runs (local progress is uploaded only after the
// account exists).

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const next = req.nextUrl.searchParams.get('next') ?? '/hifz/settings';
  const origin = req.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL('/hifz/settings', origin));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !anonKey) {
    return NextResponse.redirect(new URL('/hifz/settings', origin));
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
  await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(next, origin));
}
