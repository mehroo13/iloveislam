// app/hifz/components/SyncWatcher.tsx — Background sync for signed-in
// users (Stage 7, §23). Mounted once in the Hifz shell; renders nothing.
//
// Behaviour:
// * Guests: does nothing at all — no network calls, no Supabase contact.
// * Cloud unconfigured: does nothing.
// * Signed in: pulls + merges on start, flushes the offline outbox,
//   then every 30 s pushes when the local snapshot changed, and again on
//   coming back online / returning to the tab. Local storage stays the
//   source of truth; a failed push is queued, never fatal.

'use client';

import { useEffect, useRef } from 'react';
import { getSupabase, isCloudConfigured } from '../lib/supabase';
import {
  pullAndMerge,
  pushDocs,
  snapshotFingerprint,
  takePendingDocs,
  SYNC_DOC_TYPES,
} from '../lib/sync';

export default function SyncWatcher() {
  const lastPushed = useRef<string>('');
  const running = useRef(false);

  useEffect(() => {
    if (!isCloudConfigured()) return;
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;

    const syncIfSignedIn = async () => {
      if (!alive || running.current) return;
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!alive || !session) return;
      running.current = true;
      try {
        // Flush anything queued while offline first.
        const pending = await takePendingDocs();
        if (pending.length > 0) await pushDocs(pending);
        const fp = snapshotFingerprint();
        if (fp && fp !== lastPushed.current) {
          const ok = await pushDocs(SYNC_DOC_TYPES);
          if (ok) lastPushed.current = snapshotFingerprint();
        }
      } finally {
        running.current = false;
      }
    };

    const start = async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!alive || !session) return;
      running.current = true;
      try {
        await pullAndMerge();
        const pending = await takePendingDocs();
        if (pending.length > 0) await pushDocs(pending);
        lastPushed.current = snapshotFingerprint();
      } finally {
        running.current = false;
      }
    };

    void start();
    const interval = window.setInterval(() => void syncIfSignedIn(), 30_000);
    const onOnline = () => void syncIfSignedIn();
    const onVisible = () => {
      if (!document.hidden) void syncIfSignedIn();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      window.clearInterval(interval);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
