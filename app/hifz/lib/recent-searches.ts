// app/hifz/lib/recent-searches.ts — the ONE recent-searches store
// (2026-11-26, the "five" build: Recent Search History).
//
// Every search surface in the Hifz app reads and writes THIS store, so
// there is exactly one recent-searches list wherever the user searches:
//   - the reader's Search overlay (ReaderSearch) — records when the user
//     taps a result (the honest trigger: they found what they wanted
//     and jumped to it), never per keystroke or per debounced fetch;
//   - the Search hub page (SearchClient) — records a submitted query;
//   - Voice Search (VoiceSearchClient) — records a submitted query
//     (typed or recited).
// A row tap re-runs that query. Device-local only, like everything else
// in the Hifz app — no account, no sync, nothing uploaded.
//
// History: the hub and voice search used to keep their own copy under
// `ili_hifz_recent_searches_v1` (cap 15). That key is now the legacy
// key: on first load, if the new key is empty, any entries under the
// legacy key are imported (capped at 25) so existing history survives
// the move instead of vanishing.

export const RECENT_SEARCHES_KEY = 'ili_recent_searches_v1';
/** Legacy key (SearchClient / VoiceSearchClient, cap 15) — import-only. */
export const LEGACY_RECENT_SEARCHES_KEY = 'ili_hifz_recent_searches_v1';
export const MAX_RECENT_SEARCHES = 25;

/** Event fired on window whenever the list changes, so a mounted
 *  search surface picks up a change made elsewhere without a reload
 *  (same pattern as the test-settings store). */
export const RECENT_SEARCHES_EVENT = 'ili:recent-searches-changed';

/** Normalise one stored entry: trimmed, non-empty strings only. */
function clean(entries: unknown): string[] {
  if (!Array.isArray(entries)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of entries) {
    if (typeof x !== 'string') continue;
    const trimmed = x.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(trimmed);
  }
  return out.slice(0, MAX_RECENT_SEARCHES);
}

function readKey(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return clean(JSON.parse(raw));
  } catch {
    /* bad stored data (or storage unavailable) — empty, never throws */
    return [];
  }
}

export function loadRecentSearches(): string[] {
  const current = readKey(RECENT_SEARCHES_KEY);
  if (current.length > 0) return current;
  // One-time import from the legacy key, so the hub / voice-search
  // history built before this store existed is not lost.
  const legacy = readKey(LEGACY_RECENT_SEARCHES_KEY);
  if (legacy.length === 0) return [];
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(legacy));
  } catch {
    /* storage unavailable — the in-memory list still applies */
  }
  return legacy;
}

function write(entries: string[]): string[] {
  const next = clean(entries);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — search still works */
  }
  try {
    window.dispatchEvent(new CustomEvent(RECENT_SEARCHES_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  return next;
}

/** Record a search: most-recent-first, deduped (a repeat moves to the
 *  top, never duplicates), capped at 25. Empty queries are ignored.
 *  Returns the new list. */
export function recordRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return loadRecentSearches();
  const lower = trimmed.toLowerCase();
  const next = [
    trimmed,
    ...loadRecentSearches().filter((x) => x.toLowerCase() !== lower),
  ].slice(0, MAX_RECENT_SEARCHES);
  return write(next);
}

/** Empty the list entirely. Returns []. */
export function clearRecentSearches(): string[] {
  return write([]);
}
