// app/hifz/lib/store.ts — IndexedDB mirror of the localStorage progress keys
// (spec §22, screenshot rebuild 2026-11-21).
//
// localStorage stays the source of truth for synchronous reads (progress.ts
// is sync everywhere), but every progress/mistakes/settings write is ALSO
// mirrored into IndexedDB (database "ili-hifz", store "kv"), and on first
// load any existing localStorage data is migrated into IndexedDB so nothing
// is lost. If IndexedDB is unavailable the app keeps working on
// localStorage alone — storage failure never breaks reading or reciting.
//
// Honest scope: this is a durable mirror + migration, not a rewrite of the
// sync progress API. A future step can promote IndexedDB to primary.

const DB_NAME = 'ili-hifz';
const STORE = 'kv';
/** Session recordings live in their own store: blobs cannot go in the
 * JSON `kv` mirror, and a recording must survive independently of the
 * progress keys (BA, 2026-11-23). */
const AUDIO_STORE = 'session-audio';
/** DB v2 adds the `session-audio` store (v1 had only `kv`). */
const DB_VERSION = 2;
const KEYS = [
  'ili_hifz_v1',
  'ili_hifz_mistakes_v1',
  'ili_hifz_settings_v1',
  // Stage 5 (§6): bookmarks + challenges ride in export/import, so the
  // mirror covers them too.
  'quran_bookmarks_v2',
  'hifz_challenges_v1',
  // Stage 7 (§23): the rest of the guest snapshot — reading location,
  // Mushaf position, goals, sessions, test history — so the IndexedDB
  // mirror is a complete on-device backup, not a partial one.
  'ili_last_read_v1',
  'ili_mushaf_reader_pos_v1',
  'ili_hifz_mode_v1',
  'ili_hifz_listen_pos_v1',
  'ili_hifz_recent_surahs_v1',
  'ili_goals_v1',
  'ili_sessions_v1',
  // Phase 4: coach + reader session records — the Activity tab reads
  // these, so the mirror covers them too.
  'ili_coach_sessions_v1',
  'ili_hifz_test_sessions_v1',
  'ili_hifz_test_in_progress_v1',
  'ili_test_ranges_v1',
  'ili_hifz_best_test_v1',
] as const;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE);
        }
        if (!req.result.objectStoreNames.contains(AUDIO_STORE)) {
          req.result.createObjectStore(AUDIO_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** Copy existing localStorage progress into IndexedDB (first run only). */
export async function migrateToIdb(): Promise<boolean> {
  try {
    const db = await openDb();
    if (!db) return false;
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const key of KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) store.put(raw, key);
    }
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    return true;
  } catch {
    return false;
  }
}

/** Mirror one key's current localStorage value into IndexedDB. Fire-and-forget. */
export function mirrorKeyToIdb(key: string): void {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return;
    void openDb().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(raw, key);
      } catch {
        /* mirror failure is never fatal */
      }
    });
  } catch {
    /* ignore */
  }
}

/** Mirror all progress keys (call after a save). */
export function mirrorAllToIdb(): void {
  for (const key of KEYS) mirrorKeyToIdb(key);
}

/** Read one key back from IndexedDB (diagnostics / future primary use). */
export async function readKeyFromIdb(key: string): Promise<string | null> {
  try {
    const db = await openDb();
    if (!db) return null;
    return await new Promise<string | null>((resolve) => {
      try {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Session audio — IndexedDB store `session-audio` (BA, 2026-11-23).  */
/*  Recordings are local-only and saved ONLY when the user has the     */
/*  `saveAudio` setting on (explicit opt-in; the coach calls these     */
/*  functions only in that case). Nothing is ever uploaded. Blobs      */
/*  cannot live in the JSON `kv` mirror, hence the separate store.     */
/*  No cap on the number of recordings: if storage ever fills, the     */
/*  oldest recordings are dropped to make room for the newest one.     */
/* ------------------------------------------------------------------ */

/** Metadata stored alongside each session recording. */
export interface SessionAudioMeta {
  /** ISO timestamp of the session end. */
  date: string;
  /** Human range label, e.g. "67:1–5". */
  rangeLabel: string;
  /** Session length in seconds (excludes any paused time). */
  durationSec: number;
  /** Number of missed/wrong words in the session. */
  mistakes: number;
}

export interface SessionAudioEntry {
  id: string;
  blob: Blob;
  meta: SessionAudioMeta;
}

interface StoredAudio {
  blob: Blob;
  meta: SessionAudioMeta;
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/** Save one session recording, keyed by session id. Returns true when
 * the recording is stored. On QuotaExceededError the oldest recordings
 * are deleted (newest kept) and the save is retried; returns false only
 * when even the newest recording alone cannot fit. */
export async function saveSessionAudio(
  sessionId: string,
  blob: Blob,
  meta: SessionAudioMeta,
): Promise<boolean> {
  try {
    const db = await openDb();
    if (!db) return false;
    const value: StoredAudio = { blob, meta };
    try {
      const tx = db.transaction(AUDIO_STORE, 'readwrite');
      tx.objectStore(AUDIO_STORE).put(value, sessionId);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
      });
      return true;
    } catch (err) {
      if (!isQuotaError(err)) return false;
      // Storage full: drop the oldest recordings, newest first-kept,
      // and retry. Each retry drops one more oldest entry; give up only
      // when no older recording is left to drop.
      const entries = await listSessionAudios();
      const older = entries
        .filter((e) => e.id !== sessionId)
        .sort((a, b) => a.meta.date.localeCompare(b.meta.date));
      for (const entry of older) {
        try {
          await deleteSessionAudio(entry.id);
        } catch {
          /* keep trying the next oldest */
        }
        try {
          const tx = db.transaction(AUDIO_STORE, 'readwrite');
          tx.objectStore(AUDIO_STORE).put(value, sessionId);
          await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
          });
          return true;
        } catch (retryErr) {
          if (!isQuotaError(retryErr)) return false;
          // Still full — drop the next oldest and try again.
        }
      }
      return false;
    }
  } catch {
    return false;
  }
}

/** Load one stored recording (blob + meta), or null when absent. */
export async function loadSessionAudio(sessionId: string): Promise<SessionAudioEntry | null> {
  try {
    const db = await openDb();
    if (!db) return null;
    const tx = db.transaction(AUDIO_STORE, 'readonly');
    const store = tx.objectStore(AUDIO_STORE);
    const value = await idbRequest<StoredAudio | undefined>(store.get(sessionId));
    if (!value || !(value.blob instanceof Blob) || !value.meta) return null;
    return { id: sessionId, blob: value.blob, meta: value.meta };
  } catch {
    return null;
  }
}

/** All stored recordings, newest first. */
export async function listSessionAudios(): Promise<SessionAudioEntry[]> {
  try {
    const db = await openDb();
    if (!db) return [];
    const tx = db.transaction(AUDIO_STORE, 'readonly');
    const store = tx.objectStore(AUDIO_STORE);
    const [keys, values] = await Promise.all([
      idbRequest<IDBValidKey[]>(store.getAllKeys()),
      idbRequest<StoredAudio[]>(store.getAll()),
    ]);
    const entries: SessionAudioEntry[] = [];
    for (let i = 0; i < keys.length; i++) {
      const value = values[i];
      if (typeof keys[i] === 'string' && value?.blob instanceof Blob && value.meta) {
        entries.push({ id: keys[i] as string, blob: value.blob, meta: value.meta });
      }
    }
    entries.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
    return entries;
  } catch {
    return [];
  }
}

/** Delete one stored recording. */
export async function deleteSessionAudio(sessionId: string): Promise<void> {
  try {
    const db = await openDb();
    if (!db) return;
    const tx = db.transaction(AUDIO_STORE, 'readwrite');
    tx.objectStore(AUDIO_STORE).delete(sessionId);
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* delete failure is never fatal */
  }
}

/** Delete every stored recording. */
export async function deleteAllSessionAudio(): Promise<void> {
  try {
    const db = await openDb();
    if (!db) return;
    const tx = db.transaction(AUDIO_STORE, 'readwrite');
    tx.objectStore(AUDIO_STORE).clear();
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* delete failure is never fatal */
  }
}
