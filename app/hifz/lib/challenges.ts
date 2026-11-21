// app/hifz/lib/challenges.ts — group challenges WITHOUT accounts
// (spec §13 #20, §15.9).
//
// How it works, honestly: there is no server and no account, so a group
// challenge is a local record plus a shareable link. The link carries the
// whole challenge (code, surah, target, members and their progress) as a
// URL-safe base64 payload (`?join=CODE&c=...`). Anyone who opens the link
// gets the challenge on their device; when they share THEIR link back, the
// payload carries their updated progress, and opening it merges it into
// your local copy (per member, the newest update wins). Progress syncs
// through shared links — nothing is uploaded anywhere, and the UI says so.
//
// A code alone (`?join=CODE` with no payload) cannot carry the surah or
// target, so joining with a bare code asks the joiner to pick the same
// surah/target the group agreed — the code is the group's shared key,
// the payload is the data.
import type { HifzSurah } from '../surahs';

const CHALLENGES_KEY = 'hifz_challenges_v1';

export interface ChallengeMember {
  name: string;
  /** Ayahs completed toward the challenge target. */
  ayahs: number;
  /** ISO date-time of the member's last update. Newest wins on merge. */
  updatedAt: string;
  /** True for the member record that belongs to this device. */
  mine: boolean;
}

export interface GroupChallenge {
  id: string;
  /** Shareable code, e.g. HIFZ-7K2Q. */
  code: string;
  name: string;
  surahId: number;
  surahName: string;
  /** Ayahs each member aims to complete. */
  targetAyahs: number;
  /** Challenge length in days. */
  days: number;
  createdAt: string;
  endsAt: string;
  members: ChallengeMember[];
}

export const CHALLENGE_TARGET_OPTIONS = [5, 10, 20, 30] as const;
export const CHALLENGE_DAY_OPTIONS = [7, 14, 30] as const;

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `HIFZ-${out}`;
}

export function createChallenge(opts: {
  name: string;
  surah: HifzSurah;
  targetAyahs: number;
  days: number;
  myName: string;
}): GroupChallenge {
  const now = new Date();
  const ends = new Date(now.getTime() + opts.days * 24 * 60 * 60 * 1000);
  return {
    id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    code: randomCode(),
    name: opts.name.trim() || `${opts.surah.name} challenge`,
    surahId: opts.surah.id,
    surahName: opts.surah.name,
    targetAyahs: opts.targetAyahs,
    days: opts.days,
    createdAt: now.toISOString(),
    endsAt: ends.toISOString(),
    members: [
      { name: opts.myName.trim() || 'Me', ayahs: 0, updatedAt: now.toISOString(), mine: true },
    ],
  };
}

/** Whole days left (0 when ended). */
export function daysLeft(c: GroupChallenge, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((Date.parse(c.endsAt) - now.getTime()) / 86400000));
}

export function isEnded(c: GroupChallenge, now: Date = new Date()): boolean {
  return daysLeft(c, now) <= 0;
}

/** Group progress: ayahs done by all members vs target × members. */
export function groupProgress(c: GroupChallenge): { done: number; goal: number; pct: number } {
  const done = c.members.reduce((sum, m) => sum + m.ayahs, 0);
  const goal = c.targetAyahs * Math.max(1, c.members.length);
  return { done, goal, pct: goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0 };
}

export function myMember(c: GroupChallenge): ChallengeMember | undefined {
  return c.members.find((m) => m.mine);
}

/** Log ayahs for my member record. Returns a NEW challenge. */
export function logMyAyahs(c: GroupChallenge, count: number, now: Date = new Date()): GroupChallenge {
  const mine = myMember(c);
  const updatedAt = now.toISOString();
  if (!mine) {
    return {
      ...c,
      members: [...c.members, { name: 'Me', ayahs: count, updatedAt, mine: true }],
    };
  }
  return {
    ...c,
    members: c.members.map((m) =>
      m.mine ? { ...m, ayahs: Math.min(c.targetAyahs, m.ayahs + count), updatedAt } : m,
    ),
  };
}

/* ---------------- share-link encoding ---------------- */

function toBase64Url(json: string): string {
  if (typeof window === 'undefined') return '';
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(s: string): string | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return null;
  }
}

/** Full share link for a challenge (carries the challenge + member progress). */
export function shareLink(c: GroupChallenge, origin: string): string {
  const payload = toBase64Url(JSON.stringify(c));
  return `${origin}/hifz/challenges?join=${encodeURIComponent(c.code)}&c=${payload}`;
}

export function isValidChallenge(value: unknown): value is GroupChallenge {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.code === 'string' &&
    typeof v.name === 'string' &&
    typeof v.surahId === 'number' &&
    typeof v.surahName === 'string' &&
    typeof v.targetAyahs === 'number' &&
    typeof v.days === 'number' &&
    typeof v.endsAt === 'string' &&
    Array.isArray(v.members)
  );
}

/** Decode a `c` payload from a share link; null when it is not a challenge. */
export function decodeChallengeParam(param: string): GroupChallenge | null {
  const json = fromBase64Url(param);
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return isValidChallenge(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Merge an incoming challenge (from a share link) into the local list.
 * Same code = same group: members merge by name, newest update wins;
 * my own record is never overwritten by an older copy. Returns the new
 * list and whether anything changed.
 */
export function mergeChallenge(
  local: GroupChallenge[],
  incoming: GroupChallenge,
): { list: GroupChallenge[]; changed: boolean } {
  const idx = local.findIndex((c) => c.code === incoming.code);
  if (idx < 0) {
    // A link opened on a device that never joined: my record is the
    // incoming one marked mine only if it was created here — it wasn't,
    // so add a fresh "Me" member at 0.
    const copy: GroupChallenge = {
      ...incoming,
      members: [
        ...incoming.members.map((m) => ({ ...m, mine: false })),
        { name: 'Me', ayahs: 0, updatedAt: new Date().toISOString(), mine: true },
      ],
    };
    return { list: [...local, copy], changed: true };
  }
  const existing = local[idx];
  const mergedMembers = [...existing.members];
  let changed = false;
  for (const inc of incoming.members) {
    if (inc.mine) continue; // the sender's own record is theirs, not ours
    const at = mergedMembers.findIndex(
      (m) => m.name.toLowerCase() === inc.name.toLowerCase() && !m.mine,
    );
    if (at < 0) {
      mergedMembers.push({ ...inc, mine: false });
      changed = true;
    } else if (Date.parse(inc.updatedAt) > Date.parse(mergedMembers[at].updatedAt)) {
      mergedMembers[at] = { ...inc, mine: false };
      changed = true;
    }
  }
  // The group's own fields (name/target/days) come from the creator; keep
  // the local copy's, except endsAt which never changes after creation.
  if (!changed) return { list: local, changed: false };
  const next = [...local];
  next[idx] = { ...existing, members: mergedMembers };
  return { list: next, changed: true };
}

/* ---------------- localStorage ---------------- */

export function loadChallenges(): GroupChallenge[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(CHALLENGES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidChallenge);
  } catch {
    return [];
  }
}

export function saveChallenges(list: GroupChallenge[]): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(CHALLENGES_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
