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
const KEYS = [
  'ili_hifz_v1',
  'ili_hifz_mistakes_v1',
  'ili_hifz_settings_v1',
  // Stage 5 (§6): bookmarks + challenges ride in export/import, so the
  // mirror covers them too.
  'quran_bookmarks_v2',
  'hifz_challenges_v1',
] as const;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE);
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
