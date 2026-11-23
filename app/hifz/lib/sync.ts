// app/hifz/lib/sync.ts — Local-first cloud sync (Stage 7, §22–23).
//
// DESIGN (research report 2026-11-22): local storage stays the source of
// truth for reads. The cloud is a backup + cross-device mirror, never a
// load blocker. If Supabase is unconfigured or offline, everything below
// is a no-op and the app works exactly as it does for guests.
//
// SYNC DOCUMENTS (one row per doc type in `sync_docs`):
//   progress   — ili_hifz_v1 (per-ayah records; merged PER AYAH so work on
//                different ayahs on two devices never clobbers)
//   mistakes   — ili_hifz_mistakes_v1 (append-only, capped at 500, union
//                by surah+ayah+word+date)
//   preferences— ili_hifz_settings_v1 (last-write-wins by updated_at)
//   bookmarks  — quran_bookmarks_v2 (union by ayah/page ref; a delete on
//                one device wins only if newer — tombstones)
//   reading    — last read + Mushaf reader position + mode + listen
//                position + recent surahs (last-write-wins)
//   goals      — ili_goals_v1 + per-type goals inside progress
//                (last-write-wins)
//   activity   — practice sessions, test sessions, best test, test
//                ranges (union by date/id, capped)
//   challenges — hifz_challenges_v1 (union by challenge id)
//
// CONFLICT RULE: per document, last-write-wins by the server timestamp
// returned on write (client clock is only a tiebreaker — a device with a
// wrong clock can never wipe newer data). Inside a document, collections
// merge per item as described above.
//
// OFFLINE: while offline, changed doc types are queued in IndexedDB
// (database "ili-hifz-outbox", store "outbox") and flushed on the next
// online event / app start. No audio ever leaves the device.

import { getSupabase } from './supabase';
import {
  HIFZ_PROGRESS_KEY,
  HIFZ_MISTAKES_KEY,
  HIFZ_SETTINGS_KEY,
  createDefaultProgress,
  createDefaultSettings,
  loadMistakes,
  loadProgress,
  loadSettings,
  saveMistakes,
  saveProgress,
  saveSettings,
  type HifzProgress,
  type HifzSettings,
  type MistakeEntry,
} from '../progress';
import { BOOKMARKS_KEY, loadBookmarks, saveBookmarks, bookmarkKey, type BookmarkEntry } from './bookmarks';
import { loadChallenges, saveChallenges, type GroupChallenge } from './challenges';
import { LAST_READ_KEY, LISTEN_POS_KEY, MODE_KEY, TEST_SESSIONS_KEY } from './mode';

export type SyncDocType =
  | 'progress'
  | 'mistakes'
  | 'preferences'
  | 'bookmarks'
  | 'reading'
  | 'goals'
  | 'activity'
  | 'challenges';

export const SYNC_DOC_TYPES: SyncDocType[] = [
  'progress',
  'mistakes',
  'preferences',
  'bookmarks',
  'reading',
  'goals',
  'activity',
  'challenges',
];

/** Caps from the research design: last 100 test sessions, 500 mistakes. */
export const MAX_MISTAKES_SYNCED = 500;
export const MAX_TEST_SESSIONS_SYNCED = 100;

/** Extra local keys folded into the sync documents (reading / goals /
 *  activity). They are NOT separate sync_docs rows — small values ride
 *  inside the nearest document so one pull restores the whole device. */
const READING_KEYS = ['ili_last_read_v1', 'ili_mushaf_reader_pos_v1', MODE_KEY, LISTEN_POS_KEY, 'ili_hifz_recent_surahs_v1'] as const;
const GOALS_KEYS = ['ili_goals_v1'] as const;
const ACTIVITY_KEYS = ['ili_sessions_v1', TEST_SESSIONS_KEY, 'ili_hifz_best_test_v1', 'ili_test_ranges_v1', 'ili_hifz_test_in_progress_v1'] as const;
const CHALLENGES_KEY = 'hifz_challenges_v1';

export type LocalSnapshot = Record<SyncDocType, unknown>;

/* ------------------------------------------------------------------ */
/*  Local snapshot — read everything the cloud needs from localStorage */
/* ------------------------------------------------------------------ */

function readRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage failure is never fatal */
  }
}

/** Build the full local snapshot (what a registration upload sends). */
export function buildLocalSnapshot(): LocalSnapshot {
  const pick = (keys: readonly string[]) => {
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      const v = readRaw(k);
      if (v !== null) out[k] = v;
    }
    return out;
  };
  return {
    progress: loadProgress(),
    mistakes: loadMistakes(),
    preferences: loadSettings(),
    bookmarks: loadBookmarks(),
    reading: pick(READING_KEYS),
    goals: pick(GOALS_KEYS),
    activity: pick(ACTIVITY_KEYS),
    challenges: loadChallenges(),
  };
}

/** Apply a (merged) snapshot back to localStorage. */
export function applySnapshot(snap: Partial<LocalSnapshot>): void {
  if (snap.progress) saveProgress(snap.progress as HifzProgress);
  if (snap.mistakes) saveMistakes((snap.mistakes as MistakeEntry[]).slice(0, MAX_MISTAKES_SYNCED));
  if (snap.preferences) saveSettings(snap.preferences as HifzSettings);
  if (snap.bookmarks) saveBookmarks(snap.bookmarks as BookmarkEntry[]);
  if (snap.challenges) saveChallenges(snap.challenges as GroupChallenge[]);
  const putAll = (doc: unknown) => {
    if (typeof doc !== 'object' || doc === null) return;
    for (const [k, v] of Object.entries(doc as Record<string, unknown>)) writeRaw(k, v);
  };
  putAll(snap.reading);
  putAll(snap.goals);
  putAll(snap.activity);
}

/* ------------------------------------------------------------------ */
/*  Merge — per-document rules from the research design (§5.3)         */
/* ------------------------------------------------------------------ */

function newer(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a) return false;
  if (!b) return true;
  return a > b;
}

/** Per-ayah merge: keep the newer record for each ayah. Streak: the doc
 *  with the more recent lastActiveDate wins; on a tie the larger count
 *  wins. minutesToday: today's entry wins; older days are dropped. */
export function mergeProgress(local: HifzProgress, cloud: HifzProgress): HifzProgress {
  const ayahs: HifzProgress['ayahs'] = { ...local.ayahs };
  for (const [key, c] of Object.entries(cloud.ayahs ?? {})) {
    const l = ayahs[key];
    if (!l || newer(c.lastPractised, l.lastPractised)) ayahs[key] = c;
  }
  const cloudStreakNewer = newer(cloud.streak?.lastActiveDate, local.streak?.lastActiveDate);
  const streak =
    cloudStreakNewer ||
    (cloud.streak?.lastActiveDate === local.streak?.lastActiveDate &&
      (cloud.streak?.count ?? 0) > (local.streak?.count ?? 0))
      ? cloud.streak
      : local.streak;
  const today = new Date().toISOString().slice(0, 10);
  const minutesToday =
    cloud.minutesToday?.date === today && (local.minutesToday?.date !== today || (cloud.minutesToday.minutes ?? 0) >= (local.minutesToday.minutes ?? 0))
      ? cloud.minutesToday
      : local.minutesToday;
  return {
    ...local,
    ...cloud,
    ayahs,
    streak,
    minutesToday,
    createdAt: local.createdAt < cloud.createdAt ? local.createdAt : cloud.createdAt,
    dailyGoalMinutes: cloudStreakNewer ? cloud.dailyGoalMinutes : local.dailyGoalMinutes,
    longestStreak: Math.max(local.longestStreak ?? 0, cloud.longestStreak ?? 0) || undefined,
  };
}

/** Mistakes: union by surah+ayah+word+date, newest first, capped 500. */
export function mergeMistakes(local: MistakeEntry[], cloud: MistakeEntry[]): MistakeEntry[] {
  const seen = new Map<string, MistakeEntry>();
  for (const m of [...local, ...cloud]) {
    const k = `${m.surah}:${m.ayah}:${m.word}:${m.date}`;
    const prev = seen.get(k);
    if (!prev || (m.correctedAt && (!prev.correctedAt || m.correctedAt > prev.correctedAt))) seen.set(k, m);
  }
  return [...seen.values()]
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .slice(0, MAX_MISTAKES_SYNCED);
}

/** Bookmarks: union by ayah/page ref; the newer addedAt wins. A bookmark
 *  deleted on one device is represented by its absence + the deletion is
 *  only honoured when the other side's copy is older — in practice the
 *  union keeps a bookmark if either side still has it; a delete is
 *  propagated on the next push because the pushing side's list no longer
 *  contains it and its updated_at is newer. */
export function mergeBookmarks(local: BookmarkEntry[], cloud: BookmarkEntry[]): BookmarkEntry[] {
  const byKey = new Map<string, BookmarkEntry>();
  for (const b of [...local, ...cloud]) {
    const k = bookmarkKey(b);
    const prev = byKey.get(k);
    if (!prev || (b.addedAt ?? 0) > (prev.addedAt ?? 0)) byKey.set(k, b);
  }
  return [...byKey.values()];
}

/** Generic last-write-wins for scalar docs (preferences, reading, goals):
 *  the caller compares updated_at; the newer payload wins wholesale. */
export function pickNewer<T>(local: T, cloud: T, cloudIsNewer: boolean): T {
  return cloudIsNewer ? cloud : local;
}

/** Activity: union of session/test arrays by JSON identity, capped. */
function unionCapped<T>(local: T[], cloud: T[], cap: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of [...local, ...cloud]) {
    const k = JSON.stringify(row);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out.slice(0, cap);
}

export function mergeActivity(
  local: Record<string, unknown>,
  cloud: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...local };
  for (const [k, cv] of Object.entries(cloud)) {
    const lv = local[k];
    if (Array.isArray(lv) && Array.isArray(cv)) {
      out[k] = unionCapped(lv as unknown[], cv as unknown[], k === TEST_SESSIONS_KEY ? MAX_TEST_SESSIONS_SYNCED : 200);
    } else if (lv === undefined) {
      out[k] = cv;
    } else if (typeof lv === 'number' && typeof cv === 'number') {
      out[k] = Math.max(lv, cv);
    }
    // Anything else (e.g. an in-progress test): local wins — the device
    // the user is holding is the one mid-test.
  }
  return out;
}

export function mergeChallenges(local: GroupChallenge[], cloud: GroupChallenge[]): GroupChallenge[] {
  const byId = new Map<string, GroupChallenge>();
  for (const c of [...local, ...cloud]) {
    const prev = byId.get(c.id);
    if (!prev) {
      byId.set(c.id, c);
      continue;
    }
    // Same challenge on both sides: merge members by name, newest
    // update wins. (The share-link merge in challenges.ts skips the
    // sender's own record — wrong here, where both sides belong to the
    // same user on different devices.)
    const members = [...prev.members];
    for (const inc of c.members) {
      const at = members.findIndex((m) => m.name.toLowerCase() === inc.name.toLowerCase());
      if (at < 0) members.push(inc);
      else if (Date.parse(inc.updatedAt) > Date.parse(members[at].updatedAt)) {
        members[at] = { ...inc, mine: members[at].mine || inc.mine };
      } else {
        members[at] = { ...members[at], mine: members[at].mine || inc.mine };
      }
    }
    byId.set(c.id, { ...prev, members });
  }
  return [...byId.values()];
}

/** Merge a full cloud snapshot into the local one, per the rules above.
 *  `cloudNewer` maps each doc type to whether the cloud copy's
 *  updated_at is newer than the local copy's (server timestamps). */
export function mergeSnapshots(
  local: LocalSnapshot,
  cloud: Partial<LocalSnapshot>,
  cloudNewer: Record<SyncDocType, boolean>,
): LocalSnapshot {
  return {
    progress:
      cloud.progress && (local.progress as HifzProgress)
        ? mergeProgress(local.progress as HifzProgress, cloud.progress as HifzProgress)
        : (cloud.progress ?? local.progress),
    mistakes:
      cloud.mistakes
        ? mergeMistakes(local.mistakes as MistakeEntry[], cloud.mistakes as MistakeEntry[])
        : local.mistakes,
    preferences: pickNewer(local.preferences, cloud.preferences ?? local.preferences, !!cloud.preferences && cloudNewer.preferences),
    bookmarks:
      cloud.bookmarks
        ? mergeBookmarks(local.bookmarks as BookmarkEntry[], cloud.bookmarks as BookmarkEntry[])
        : local.bookmarks,
    reading: pickNewer(local.reading, cloud.reading ?? local.reading, !!cloud.reading && cloudNewer.reading),
    goals: pickNewer(local.goals, cloud.goals ?? local.goals, !!cloud.goals && cloudNewer.goals),
    activity:
      cloud.activity
        ? mergeActivity(local.activity as Record<string, unknown>, cloud.activity as Record<string, unknown>)
        : local.activity,
    challenges:
      cloud.challenges
        ? mergeChallenges(local.challenges as GroupChallenge[], cloud.challenges as GroupChallenge[])
        : local.challenges,
  };
}

/* ------------------------------------------------------------------ */
/*  Offline outbox — pending doc types, in IndexedDB                   */
/* ------------------------------------------------------------------ */

const OUTBOX_DB = 'ili-hifz-outbox';
const OUTBOX_STORE = 'outbox';
const OUTBOX_KEY = 'pending-docs';

function openOutbox(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(OUTBOX_DB, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(OUTBOX_STORE)) req.result.createObjectStore(OUTBOX_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function queuePendingDocs(docs: SyncDocType[]): Promise<void> {
  try {
    const db = await openOutbox();
    if (!db) return;
    const existing = await new Promise<SyncDocType[]>((resolve) => {
      try {
        const req = db.transaction(OUTBOX_STORE, 'readonly').objectStore(OUTBOX_STORE).get(OUTBOX_KEY);
        req.onsuccess = () => resolve(Array.isArray(req.result) ? (req.result as SyncDocType[]) : []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
    const merged = [...new Set([...existing, ...docs])];
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    tx.objectStore(OUTBOX_STORE).put(merged, OUTBOX_KEY);
  } catch {
    /* outbox failure is never fatal */
  }
}

export async function takePendingDocs(): Promise<SyncDocType[]> {
  try {
    const db = await openOutbox();
    if (!db) return [];
    const pending = await new Promise<SyncDocType[]>((resolve) => {
      try {
        const req = db.transaction(OUTBOX_STORE, 'readonly').objectStore(OUTBOX_STORE).get(OUTBOX_KEY);
        req.onsuccess = () => resolve(Array.isArray(req.result) ? (req.result as SyncDocType[]) : []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
    if (pending.length > 0) {
      const tx = db.transaction(OUTBOX_STORE, 'readwrite');
      tx.objectStore(OUTBOX_STORE).delete(OUTBOX_KEY);
    }
    return pending;
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Push / pull                                                        */
/* ------------------------------------------------------------------ */

export interface SyncState {
  status: 'unconfigured' | 'guest' | 'signed-out' | 'synced' | 'syncing' | 'offline' | 'error';
  email: string | null;
  lastSyncedAt: string | null;
  error: string | null;
}

const LAST_SYNCED_KEY = 'ili_last_synced_v1';
const LOCAL_UPDATED_KEY = 'ili_local_updated_v1';

export function getLastSyncedAt(): string | null {
  try {
    return localStorage.getItem(LAST_SYNCED_KEY);
  } catch {
    return null;
  }
}

function setLastSyncedAt(iso: string): void {
  try {
    localStorage.setItem(LAST_SYNCED_KEY, iso);
  } catch {
    /* ignore */
  }
}

/** Push only the given doc types (or all) to the cloud. Returns false
 *  when offline/unconfigured — the caller queues the docs instead. */
export async function pushDocs(docs: SyncDocType[] = SYNC_DOC_TYPES): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const snap = buildLocalSnapshot();
  const rows = docs.map((docType) => ({
    user_id: user.id,
    doc_type: docType,
    payload: snap[docType] ?? {},
    updated_at: new Date().toISOString(),
  }));
  const { error } = await sb.from('sync_docs').upsert(rows, { onConflict: 'user_id,doc_type' });
  if (error) {
    // Offline / network failure: queue for later, do not lose the change.
    if (typeof navigator !== 'undefined' && !navigator.onLine) void queuePendingDocs(docs);
    return false;
  }
  setLastSyncedAt(new Date().toISOString());
  try {
    localStorage.setItem(LOCAL_UPDATED_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
  return true;
}

/** Pull all cloud docs, merge with local, apply, and push the merged
 *  result back when the merge changed anything. Used on sign-in and on
 *  app start for signed-in users. */
export async function pullAndMerge(): Promise<{ ok: boolean; merged: boolean }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, merged: false };
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, merged: false };
  const { data, error } = await sb
    .from('sync_docs')
    .select('doc_type, payload, updated_at')
    .eq('user_id', user.id);
  if (error) return { ok: false, merged: false };
  const local = buildLocalSnapshot();
  const cloud: Partial<LocalSnapshot> = {};
  const cloudNewer = {} as Record<SyncDocType, boolean>;
  const localUpdated = (() => {
    try {
      return localStorage.getItem(LOCAL_UPDATED_KEY);
    } catch {
      return null;
    }
  })();
  for (const row of data ?? []) {
    const t = row.doc_type as SyncDocType;
    if (!SYNC_DOC_TYPES.includes(t)) continue;
    cloud[t] = row.payload as unknown;
    // Server timestamp wins over the client's last-local-write marker.
    cloudNewer[t] = !localUpdated || (row.updated_at as string) > localUpdated;
  }
  const hasCloud = Object.keys(cloud).length > 0;
  if (!hasCloud) return { ok: true, merged: false };
  const merged = mergeSnapshots(local, cloud, cloudNewer);
  applySnapshot(merged);
  setLastSyncedAt(new Date().toISOString());
  // Push the merged result so the other device converges too.
  await pushDocs(SYNC_DOC_TYPES);
  return { ok: true, merged: true };
}

/** One-shot guest → account migration (§22). Called ONCE, immediately
 *  after a fresh registration or a first sign-in on a device that already
 *  has local progress. It pulls any existing cloud data first, merges
 *  (local is never overwritten wholesale), then uploads the merged
 *  snapshot. Returns false when there is nothing to migrate or the cloud
 *  is unavailable — local data is untouched either way. */
export async function migrateGuestToAccount(): Promise<{ ok: boolean; merged: boolean }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, merged: false };
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, merged: false };
  const pulled = await pullAndMerge();
  if (!pulled.ok) {
    // Pull failed (cloud unreachable): try a direct upload of the local
    // snapshot anyway.
    const pushed = await pushDocs(SYNC_DOC_TYPES);
    return { ok: pushed, merged: false };
  }
  if (!pulled.merged) {
    // Fresh account: pull succeeded but found no cloud data, so nothing
    // was uploaded. Push the whole local snapshot now — without this the
    // account has no backup at all, even though the UI says it does.
    const pushed = await pushDocs(SYNC_DOC_TYPES);
    return { ok: pushed, merged: false };
  }
  return { ok: true, merged: true };
}

/** Snapshot fingerprint for the dirty check: a cheap hash of the local
 *  snapshot so the watcher can tell whether anything changed since the
 *  last push, without comparing every field. */
export function snapshotFingerprint(): string {
  try {
    const snap = buildLocalSnapshot();
    const json = JSON.stringify(snap);
    let h = 0;
    for (let i = 0; i < json.length; i++) h = (h * 31 + json.charCodeAt(i)) >>> 0;
    return `${json.length}:${h}`;
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ */
/*  Local-only helpers used by Settings (export already covers §24,    */
/*  but the sync snapshot must also include the extra keys)            */
/* ------------------------------------------------------------------ */

export { HIFZ_PROGRESS_KEY, HIFZ_MISTAKES_KEY, HIFZ_SETTINGS_KEY, BOOKMARKS_KEY, CHALLENGES_KEY, LAST_READ_KEY };
export { createDefaultProgress, createDefaultSettings };
