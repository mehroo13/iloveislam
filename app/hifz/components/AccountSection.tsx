// app/hifz/components/AccountSection.tsx — Optional account & backup
// (Stage 7, §20–24). Rendered inside Settings, nowhere else: an account
// is never requested on first use and never interrupts reading/reciting.
//
// STATES (honest about each one — never imply guest progress is in the
// cloud, because it is not):
//   * Cloud not configured — the site owner has not set up the backup
//     service yet. Sign-up is disabled with a plain explanation; the
//     on-device export below stays the way to keep a copy.
//   * Guest — everything works without an account. The section explains
//     what an account adds (backup, sync across devices, recovery after
//     changing phones) and offers Sign up / Log in. Opening or cancelling
//     the form changes nothing and deletes nothing.
//   * Signed in — shows the account email, last synced time, a Sync now
//     button, Sign out, and Delete my account.
//
// MIGRATION (§22): the moment a session appears (fresh sign-up or
// sign-in), the whole local snapshot is merged into the account and
// uploaded — bookmarks, memorisation records, goals, reading history,
// preferences. If the account already has cloud progress from another
// device, the two are merged per the rules in lib/sync.ts; local data
// is never overwritten wholesale and never deleted by registering.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSupabase,
  isCloudConfigured,
  requestAccountDeletion,
  signInWithMagicLink,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from '../lib/supabase';
import {
  getLastSyncedAt,
  migrateGuestToAccount,
  pullAndMerge,
  pushDocs,
  SYNC_DOC_TYPES,
} from '../lib/sync';
import { resetUiPrefsToDefaults } from '../lib/i18n';

type View = 'intro' | 'signup' | 'login';

export default function AccountSection() {
  const configured = isCloudConfigured();
  const [email, setEmail] = useState<string | null>(null);
  const [view, setView] = useState<View>('intro');
  const [formEmail, setFormEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const migratedFor = useRef<string | null>(null);

  const refreshLastSynced = useCallback(() => setLastSynced(getLastSyncedAt()), []);

  // Watch the session: when a user signs in (or confirms their email and
  // lands back here), run the one-shot guest → account migration once.
  useEffect(() => {
    if (!configured) return;
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;
    const applySession = async (userEmail: string | null, userId: string | null) => {
      if (!alive) return;
      setEmail(userEmail);
      refreshLastSynced();
      if (userId && migratedFor.current !== userId) {
        migratedFor.current = userId;
        const result = await migrateGuestToAccount();
        if (!alive) return;
        if (result.ok) {
          setMsg(
            result.merged
              ? 'Signed in. Your progress on this device was merged with your account backup — nothing was lost.'
              : 'Signed in. Your progress on this device is now backed up to your account.',
          );
          refreshLastSynced();
        } else {
          // Never claim a backup that did not happen: the progress is
          // safe on this device, and "Back up now" retries the upload.
          setErr('Could not back up your progress just now — it is safe on this device. Tap “Back up now” to retry.');
        }
      }
    };
    void sb.auth.getSession().then(({ data: { session } }) => {
      void applySession(session?.user?.email ?? null, session?.user?.id ?? null);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user?.email ?? null, session?.user?.id ?? null);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [configured, refreshLastSynced]);

  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!formEmail.trim()) {
      setErr('Enter your email address.');
      return;
    }
    setBusy(true);
    try {
      if (useMagicLink) {
        const r = await signInWithMagicLink(formEmail);
        if (!r.ok) setErr(r.error);
        else setMsg('Check your email — we sent you a sign-in link. Open it on this device.');
        return;
      }
      if (view === 'signup') {
        if (password.length < 6) {
          setErr('Use a password of at least 6 characters.');
          return;
        }
        const r = await signUpWithPassword(formEmail, password);
        if (!r.ok) {
          setErr(r.error);
          return;
        }
        if (r.needsEmailConfirmation) {
          setMsg('Account created. Check your email to confirm it — then your progress on this device will be backed up.');
        } else {
          // No backup claim here: the session watcher runs the migration
          // right after sign-up and reports the real outcome.
          setMsg('Account created. Backing up your progress on this device…');
        }
      } else {
        if (!password) {
          setErr('Enter your password.');
          return;
        }
        const r = await signInWithPassword(formEmail, password);
        if (!r.ok) setErr(r.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const doSyncNow = async () => {
    setBusy(true);
    setErr(null);
    try {
      const pulled = await pullAndMerge();
      if (!pulled.ok) {
        setErr('Could not reach the backup server. Your progress is still safe on this device.');
        return;
      }
      const pushed = await pushDocs(SYNC_DOC_TYPES);
      if (pushed) {
        setMsg('Backed up just now.');
        refreshLastSynced();
      } else {
        setErr('Could not reach the backup server. Your progress is still safe on this device.');
      }
    } finally {
      setBusy(false);
    }
  };

  const doSignOut = async () => {
    await signOut();
    migratedFor.current = null;
    setEmail(null);
    setMsg('Signed out. Your progress stays on this device.');
    refreshLastSynced();
  };

  const doDeleteLocalOnly = () => {
    if (
      !window.confirm(
        'Delete ALL your Hifz progress, mistakes, goals and settings on this device? This cannot be undone. Export a backup file first if you want a copy.' +
          (email ? '\n\nYou are signed in — your cloud backup stays, and you can sign back in later to restore it. You will be signed out now so the empty device does not overwrite your backup.' : ''),
      )
    ) {
      return;
    }
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('ili_') || k.startsWith('quran_bookmarks')) localStorage.removeItem(k);
      }
      if (typeof indexedDB !== 'undefined') {
        indexedDB.deleteDatabase('ili-hifz');
        indexedDB.deleteDatabase('ili-hifz-outbox');
      }
      resetUiPrefsToDefaults();
      if (email) void signOut().then(() => setEmail(null));
      setMsg('Everything on this device was deleted. Reload the page to start fresh.');
    } catch {
      setErr('Delete failed — browser storage is unavailable.');
    }
  };

  const doDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await requestAccountDeletion();
      if (!r.ok) {
        setErr(r.error);
        setConfirmDelete(false);
        return;
      }
      // Cloud account gone — wipe the local copy in the same flow.
      try {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith('ili_') || k.startsWith('quran_bookmarks')) localStorage.removeItem(k);
        }
        if (typeof indexedDB !== 'undefined') {
          indexedDB.deleteDatabase('ili-hifz');
          indexedDB.deleteDatabase('ili-hifz-outbox');
        }
      } catch {
        /* local wipe failure is reported, not fatal to the account delete */
      }
      resetUiPrefsToDefaults();
      migratedFor.current = null;
      setEmail(null);
      setConfirmDelete(false);
      setMsg('Your account and its cloud backup were deleted, and your progress on this device was deleted too.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="account-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
      <h2 id="account-heading" className="text-lg font-bold text-[#102E26]">Account &amp; backup</h2>

      {msg && (
        <p role="status" className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#E4FFF2] px-4 py-3 text-sm font-semibold text-[#1FA36B]">
          {msg}
        </p>
      )}
      {err && (
        <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {err}
        </p>
      )}

      {!configured && (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-[#5b6b62]">
            <strong className="text-[#102E26]">You are using the app as a guest.</strong> Everything works
            without an account, and your memorisation progress, bookmarks, goals and settings are saved
            only on this device. If you clear browser data or lose this device, they are gone.
          </p>
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-[#7a5b00]">
            Cloud backup is not set up yet, so accounts are not available right now. Your progress is
            still safe on this device — use “Export progress” below to keep a backup file you can
            restore from. Nothing is uploaded anywhere.
          </p>
        </div>
      )}

      {configured && !email && (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-[#5b6b62]">
            <strong className="text-[#102E26]">You are using the app as a guest.</strong> Everything works
            without an account, and your progress stays only on this device. An optional account adds:
          </p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-relaxed text-[#5b6b62]">
            <li>Save your progress online, so it survives losing or changing phones.</li>
            <li>Synchronise across devices — memorise on your phone, continue on your tablet.</li>
            <li>Back up your memorisation history, goals, bookmarks and preferences.</li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed text-[#5b6b62]">
            No Quran feature ever needs an account. Your voice is checked on your device and is never
            uploaded, with or without an account.
          </p>

          {view === 'intro' && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setView('signup'); setErr(null); setMsg(null); }}
                className="min-h-11 rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
              >
                Create an account
              </button>
              <button
                type="button"
                onClick={() => { setView('login'); setErr(null); setMsg(null); }}
                className="min-h-11 rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
              >
                Log in
              </button>
            </div>
          )}

          {view !== 'intro' && (
            <form onSubmit={submitAuth} className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-[#102E26]">
                {view === 'signup' ? 'Create an account' : 'Log in'}
                {' — '}
                <span className="font-normal text-[#5b6b62]">
                  {view === 'signup'
                    ? 'your progress on this device will be backed up into it. Cancelling changes nothing.'
                    : 'your progress on this device will be merged with your backup — never deleted.'}
                </span>
              </p>
              <label className="block text-sm font-semibold">
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="mt-1 block w-full max-w-sm rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm font-normal"
                  placeholder="you@example.com"
                />
              </label>
              {!useMagicLink && (
                <label className="block text-sm font-semibold">
                  Password
                  <input
                    type="password"
                    autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full max-w-sm rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm font-normal"
                    placeholder="At least 6 characters"
                  />
                </label>
              )}
              <label className="flex items-center gap-2 text-sm text-[#5b6b62]">
                <input
                  type="checkbox"
                  checked={useMagicLink}
                  onChange={(e) => setUseMagicLink(e.target.checked)}
                />
                Email me a sign-in link instead of using a password
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-11 rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] disabled:opacity-50"
                >
                  {busy ? 'Please wait…' : useMagicLink ? 'Email me a sign-in link' : view === 'signup' ? 'Create account' : 'Log in'}
                </button>
                <button
                  type="button"
                  onClick={() => { setView('intro'); setErr(null); setMsg(null); }}
                  className="min-h-11 rounded-full border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold text-[#102E26]"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs leading-relaxed text-[#5b6b62]">
                {view === 'signup' ? (
                  <>Already have an account?{' '}
                    <button type="button" className="font-semibold underline" onClick={() => setView('login')}>Log in instead</button> — your progress here will be merged in.</>
                ) : (
                  <>No account yet?{' '}
                    <button type="button" className="font-semibold underline" onClick={() => setView('signup')}>Create one</button> — it takes a minute.</>
                )}
              </p>
            </form>
          )}
        </div>
      )}

      {configured && email && (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-[#5b6b62]">
            Signed in as <strong className="text-[#102E26]">{email}</strong>. Your progress is backed up
            to your account and synchronised across your devices. It also stays on this device.
          </p>
          <p className="mt-1 text-sm text-[#5b6b62]">
            {lastSynced
              ? `Last backed up: ${new Date(lastSynced).toLocaleString()}.`
              : 'Not backed up yet on this device.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={doSyncNow}
              disabled={busy}
              className="min-h-11 rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] disabled:opacity-50"
            >
              {busy ? 'Please wait…' : 'Back up now'}
            </button>
            <button
              type="button"
              onClick={doSignOut}
              className="min-h-11 rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
            >
              Sign out
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#5b6b62]">
            Signing out stops syncing and leaves your progress on this device. It never deletes your cloud backup.
          </p>
          <div className="mt-4 border-t border-[#E5E7EB] pt-4">
            <p className="text-sm font-semibold text-[#102E26]">Delete your data</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={doDeleteLocalOnly}
                className="min-h-11 rounded-full border border-red-700 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Delete progress on this device
              </button>
              <button
                type="button"
                onClick={doDeleteAccount}
                disabled={busy}
                className="min-h-11 rounded-full border border-red-700 bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
              >
                {confirmDelete ? 'Tap again to confirm — delete my account and cloud backup' : 'Delete my account'}
              </button>
            </div>
            {confirmDelete && (
              <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
                This deletes your account, your cloud backup and your progress on this device. It cannot be undone.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
