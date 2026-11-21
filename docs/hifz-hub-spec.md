# iloveislam.life — AI Hifz / Recitation-Coach Hub: Build Spec

**Status:** Spec — ready to build from. Not yet built. Do not treat anything in this
document as already implemented.
**Date:** 21 November 2026
**Repo:** `~/workspace/iloveislam-deploy` (Next.js 16.2.4, React 19.2.4, App Router,
`main` branch, Tailwind 3.4.19). Working copy only — **do not push to git** as part
of this spec; deployment is a separate step.
**Audience:** The owner (works alone now) and any developer hired later. Every section
states what to build, where it lives in the repo, and how to verify it.
**Builder note:** the repo's `AGENTS.md` warns this Next.js version has breaking
changes vs training data — read the relevant guide in `node_modules/next/dist/docs/`
before writing any code, and follow the patterns already in the repo (server page +
client island, same-origin `/api/quran` proxy) rather than generic Next.js habits.
**Sources:** Market research `~/workspace/research_notes/best-islamic-market-2026-20261121-0639/report.md`
(Tarteel 16–17M installs, Premium $12.99/mo; Quran.com 16.64M visits/mo Oct 2026;
web has no dominant AI recitation coach — that gap is the opening).
**Competition study (this spec, §11):** 21 November 2026 — Tarteel (tarteel.ai,
App Store / Google Play listings, Play-store reviews), Quran.com (site + 2025–26
year in review), Quranly, Pillars, Muslim Pro (store listings + 2026 comparisons).
All competitor claims in §11 name their source; nothing in §11 comes from
hands-on use of a competitor app — it comes from official sites, store listings,
reviews and credible write-ups, and is labelled as such.
**Baseline (Search Console, 12 months):** ~71 clicks, ~9.02K impressions, 0.8% CTR,
avg. position ~42.4. The rebuild is measured against this.

---

## 0. What exists today (grounded in the repo — verified 2026-11-21)

Do not invent files. The real structure is:

- **Stack:** Next.js 16 App Router, no database, no auth, no backend beyond two API
  routes. All user state is `localStorage`. Fonts are self-hosted in `public/fonts/`
  (Scheherazade New 400/700, Amiri, DM Sans). PWA files exist (`public/manifest.json`,
  `public/sw.js`, `app/components/PWAProvider.tsx`).
- **Quran reader (the foundation to reuse, not rebuild):**
  `app/quran/page.tsx` (server component) + `app/quran/QuranClient.tsx` (client reader)
  + `app/quran/lib.ts` (shared constants/helpers) + `app/api/quran/[...path]/route.ts`
  (same-origin proxy to `api.quran.com/api/v4`, whitelisted paths only, 24h cache for
  static content, server-side Juz pagination merge because Quran.com 404s on
  `by_juz` with `per_page=all`).
  - `app/quran/lib.ts` already provides: `TRANSLATIONS` (Saheeh International id 20,
    Yusuf Ali 22, Pickthall 19, Abdel Haleem 85, Taqi Usmani 84), `RECITERS`
    (Alafasy 7, Abdul Basit 2, as-Sudais 3, al-Minshawi 9, Al-Husary 6, al-Shatri 4),
    `TAFSIR_ID = 169` (Ibn Kathir Abridged, English), `JUZ_DATA` (all 30 juz with
    start ayahs), `VOTD_KEYS`, `BISMILLAH`, `AUDIO_BASE = https://verses.quran.com/`.
  - The reader already has: Indo-Pak script (`text_indopak`), 3 view modes
    (Arabic / +translation / +translation +tafsir), per-verse audio, tafsir loaded
    lazily on scroll, bookmarks (`quran_bookmarks_v2` in localStorage), a Juz reading
    plan (`ili_reading_plan`), 25-verse pagination, `.font-quran` (Scheherazade New,
    line-height 2.2 — fixes the earlier verse-overlap bug).
  - The reader does **not** yet have word-by-word. No new proxy work is needed for it:
    the proxy whitelist already allows `verses/by_chapter/\d+` and passes the query
    string through, so `?words=true` works through the existing route. Verify this
    against the live API before building on it.
- **Dua for This Moment:** `app/dua-for-this-moment/page.tsx` + `lib/duaDatabase*.ts`
  (5 files, 56 verified duas, each with Arabic + transliteration + translation +
  reference + category). `app/dua/page.tsx` is the full dua library.
- **Other kept tools** (all under `app/`, each with `page.tsx` + `layout.tsx`):
  `/prayer-times` (+ `PrayerTimesClient.tsx`, `app/lib/prayer.ts` — Aladhan, MWL method),
  `/qibla`, `/zakat`, `/dhikr`, `/names`, `/names-finder`, `/hadith`, `/hajj`,
  `/hijri`, `/ramadan`, `/night`, `/sadaqah`, `/inheritance`, `/mizan`,
  `/halal-finance`, `/kaffarah`, `/travel`, `/eid`, `/eid-adha`, `/compare-religions`,
  `/blog` (+ 55 posts in `app/blog/content/*.ts` with unique titles — the old
  one-title-for-all-posts defect is fixed, do not reintroduce it),
  `/about`, `/contact`, `/faq`, `/install`, `/privacy`, `/terms`.
- **Homepage:** `app/page.tsx` (server, metadata) + `app/HomeClient.tsx` (client
  "living dashboard": next-prayer countdown, Verse of the Day, Dua of the Day,
  prayer marks `ili_prayer_marks_v1`, dhikr `ili_dhikr_today`, tool grid from
  `app/lib/toolsData.ts`). Header nav lives in `app/components/Header.tsx`;
  icons are the SVG `app/components/ToolIcon.tsx` (no emoji — standing rule).
- **SEO infra:** `app/sitemap.xml/route.ts` (hand-built entries + blog entries),
  `public/robots.txt` (allows `/`, disallows `/api/`, points at the sitemap).
  **There is no `llms.txt` yet** — it is new work (§9). **There is no `docs/` dir yet**
  — this file is the first document in it.
- **Design tokens** (`app/globals.css`): `--emerald-deep #0b3d2e`, `--emerald-mid
  #146b4d`, `--emerald-soft #eaf3ee`, `--gold #c9a227`, `--gold-light #e7d9a8`,
  `--paper #f7f5ef`, `--ink #1c2420`, `--ink-muted #5b6b62`. Body font DM Sans.

### 0.1 Decisions already made (do not re-decide)

1. **The homepage becomes the Hifz hub.** Tools stay as utilities; they are not the
   proposition any more.
2. **No account required.** Progress is local-first (§5). Accounts are a v3 question.
3. **Quran text is never paywalled** (§7). Premium pays for coaching, plans and
   history — never for the text, translation, tafsir or basic audio.
4. **Word-level accuracy only — never tajweed-rule accuracy** (§8). The UI must say
   plainly that a teacher is still needed for tajweed.
5. **On-device recitation processing is preferred** for privacy (no audio uploaded).
6. **Launch content is Juz Amma (78–114) + the famous surahs** (§4), not all 114
   surahs at once.

### 0.2 Hard blockers found in the current repo — fix before the coach ships

| # | Blocker | Where | Fix |
|---|---------|-------|-----|
| B1 | `Permissions-Policy: microphone=()` in `next.config.ts` **blocks microphone access site-wide**. The coach cannot work until this changes. | `next.config.ts`, headers() | Change to `microphone=(self)` (keep `camera=(self)`, `geolocation=(self)` as-is). Verify in the browser: mic permission prompt must appear on the coach page. |
| B2 | No word-by-word data path yet. | `app/quran/lib.ts`, proxy | Use `verses/by_chapter/{id}?words=true` through the existing `/api/quran` proxy (whitelist already allows the path). Verify one surah returns word data before building the word-by-word UI. If the proxy rejects it, extend `ALLOWED_PATH` — do not bypass the proxy with a direct browser call to `api.quran.com` (that path failed for users before). |
| B3 | No payment/billing infra exists (no Stripe, no accounts). | Whole repo | Premium in v1 is **a defined free/premium split in the product, not a working paywall**. Do not build billing in v1. §7 defines the split so v2 can add a provider without redesigning the product. |

---

## 1. Information architecture

### 1.1 Route map

**New routes (the Hifz hub):**

| Route | What it is | Rendering |
|---|---|---|
| `/hifz` | Hub landing: continue-where-you-left-off, featured surahs, plans, streak, how the coach works | Static shell + client progress widget (reads localStorage) |
| `/hifz/[slug]` | Per-surah study page (template §4). Slug is the transliterated name, e.g. `al-mulk` | Server component (SEO) + client reader/coach islands |
| `/hifz/[slug]/[ref]` | Per-ayah page. `[ref]` is `SURAH-AYAH`, e.g. `67-1` | Server component (SEO) |
| `/hifz/juz-amma` | Juz 30 overview: all 37 surahs (78–114) with progress, "start here" order | Server + client progress |
| `/hifz/juz/[n]` | Juz overview page, `n` = 1–30 (v1 ships only 30; others 404 or redirect to `/quran` until built — see §1.3) | Server + client progress |
| `/hifz/plans` | All memorisation plans (7-day / 30-day per surah, Juz Amma plan) | Static |
| `/hifz/my-progress` | Dashboard: streak, daily goal, mistake log, memorised ayahs, export/import | Client (localStorage only) |
| `/hifz/recite` | Coach entry: pick a surah/ayah, then redirects to `/hifz/[slug]?mode=recite` | Client |
| `/hifz/ayat-al-kursi` | Special page for Ayat al-Kursi (2:255) — a single-ayah study page, not a surah page | Server; canonical content lives at `/hifz/al-baqarah/2-255`, this page links there |

**Existing routes kept (unchanged, linked from the hub as "Utilities"):**

`/quran` (full reader — the hub's surah pages link back to it for whole-Quran reading),
`/dua-for-this-moment`, `/dua`, `/prayer-times`, `/qibla`, `/dhikr`, `/names`,
`/names-finder`, `/hadith`, `/hajj`, `/hijri`, `/ramadan`, `/night`, `/sadaqah`,
`/inheritance`, `/mizan`, `/halal-finance`, `/kaffarah`, `/travel`, `/eid`,
`/eid-adha`, `/compare-religions`, `/blog`, `/blog/[slug]`, `/about`, `/contact`,
`/faq`, `/install`, `/privacy`, `/terms`.

**Removed in the earlier rebuild — do NOT re-add:** HalalScan, Islamic Will,
Mosque Finder, kids games. (`app/lib/toolsData.ts` carries this rule in a comment.)

### 1.2 URL scheme (normative)

- Surah slug: lowercase transliteration with hyphens, no diacritics, no "surah"
  prefix: `/hifz/al-mulk`, `/hifz/ya-sin`, `/hifz/al-kahf`, `/hifz/ar-rahman`,
  `/hifz/al-waqiah`, `/hifz/al-fatihah`, `/hifz/al-baqarah`.
  Slug table lives in one source of truth: `app/hifz/surahs.ts` (id, slug, names,
  ayah count, revelation, juz). Slugs must match the names already used in
  `app/quran/lib.ts` `JUZ_DATA` where they overlap.
- Ayah ref: `SURAHNUMBER-AYAHNUMBER`, e.g. `/hifz/al-mulk/67-1`,
  `/hifz/al-baqarah/2-255`. Hyphen, not colon — a colon in a path segment is
  legal but ugly in sharing and breaks some link parsers. The page must also show
  the canonical key `67:1` in its content and metadata so search engines and AI
  assistants can match it.
- Ayah pages are **canonical for that ayah**. The surah page links to each ayah
  page; the ayah page links back to its surah and to prev/next ayah.
- Coach mode is a query param on the surah/ayah page, not a separate URL:
  `/hifz/al-mulk?mode=recite`, `/hifz/al-mulk/67-1?mode=recite`. This keeps one
  canonical URL per surah/ayah for SEO.
- Trailing slashes: none (existing `next.config.ts` rule — keep it).

### 1.3 What lives where

- `/hifz/*` — everything memorisation: study pages, coach, plans, progress.
- `/quran` — the full-Quran reader (all 114 surahs, all 30 juz). It stays the
  "read the whole Quran" tool; it does not gain coach UI in v1. It links to
  `/hifz/[slug]` with a "Memorise this surah" button per surah.
- `/dua-for-this-moment` — stays the dua flagship's sibling, not part of the hub.
  The hub links to it from surah pages only where a surah has a related dua
  (e.g. Al-Mulk → dua before sleeping). No new dua pages in v1.
- `/blog` — supports the hub with plan/reflection articles (e.g. "30 days with
  Surah Al-Mulk") but is not the hub. New hifz articles follow the existing
  unique-title rule (§9).
- Static data (surah metadata, plan definitions, launch-set content) lives in
  `app/hifz/*.ts` modules, following the `lib/duaDatabase*.ts` pattern (typed
  arrays, one file per batch if a file gets large). Quran text, translations,
  audio and tafsir always come from the Quran.com API via the existing proxy —
  **never copy Quran text into the repo**.

---

## 2. Homepage proposition

**The homepage is FOR, in one sentence:** helping a visitor memorise Quran —
starting today, with one surah, by reciting it aloud and getting instant feedback.

### 2.1 Homepage sections (top to bottom)

1. **Hero (server-rendered, no client JS required to read it).**
   Headline: "Memorise the Quran, one verse at a time." Subhead: "Recite aloud.
   Get instant feedback on every word. No account, no app to install."
   One primary CTA: **"Start reciting — Surah Al-Mulk"** → `/hifz/al-mulk?mode=recite`.
   One secondary CTA: "Browse Juz Amma" → `/hifz/juz-amma`.
   Hero art: real geometric/mosque SVG art in emerald + gold (reuse
   `public/hero-pattern.svg` / `public/mosque-silhouette.svg` style — do not use
   stock photos of people, do not use emoji). A small "How it works" strip under
   the hero (Listen → Hide → Recite → Feedback, 4 steps, SVG icons).
2. **Continue where you left off (client island, localStorage only).**
   If `ili_hifz_v1` has progress: show current surah, next ayah, streak, today's
   goal progress, and a "Continue" button. If no progress: show the "Start with
   Juz Amma" card instead. This section must render a sensible empty state when
   localStorage is empty or blocked — never a blank gap.
3. **Recitation-coach entry point (the flagship, above the fold on desktop).**
   A compact card: surah picker (launch set only in v1), reciter picker (reuse
   `RECITERS` from `app/quran/lib.ts`), "Listen first" / "Recite now" buttons.
   The coach itself lives on the surah page; this card is the front door.
4. **Featured surahs (launch set, §4).** Cards with Arabic name, English name,
   ayah count, "X-day plan", and per-card progress bar (client island). Order:
   Al-Fatihah, Al-Mulk, Ya-Sin, Ar-Rahman, Al-Waqi'ah, Al-Kahf, Ayat al-Kursi,
   then Juz Amma.
5. **Plans strip.** "Memorise Al-Mulk in 30 days" / "Juz Amma in 90 days" /
   "Ayat al-Kursi in 7 days" → `/hifz/plans`.
6. **Today strip (keep from the current homepage, demoted below the hub).**
   Next-prayer countdown, Verse of the Day, Dua of the Day — reuse `HomeClient.tsx`
   logic, but these are supporting widgets now, not the lead.
7. **Utilities grid (demoted).** The existing tools grid from `app/lib/toolsData.ts`
   under a "More tools" heading. Prayer times, Qibla, zakat, dhikr, 99 Names,
   Hadith, Hajj — present, findable, not the proposition.
8. **Trust strip (one line, no claims we cannot prove).**
   "Quran text, translation and tafsir from Quran.com. Your recitation audio
   never leaves your device. A teacher is still needed for tajweed — this tool
   checks words, not tajweed." (§8 wording, repeated on the coach page.)

### 2.2 Homepage metadata (replace the current title/description)

- Title: `Memorise the Quran — AI Recitation Coach & Hifz Plans | I Love Islam`
- Description: `Recite Quran aloud and get instant word-by-word feedback. Memorise Surah Al-Mulk, Ya-Sin, Al-Kahf and Juz Amma with 7-day and 30-day hifz plans. Free, no sign-up, your audio never leaves your device.`
- Keep `metadataBase https://www.iloveislam.life`, canonical `/`, `robots index, follow`.
- The old "daily companion for prayer, Quran & duas" positioning is retired from
  the homepage. The tools keep their own pages and metadata.

---

## 3. Flagship recitation-coach flow

The coach is a client component mounted on surah/ayah pages
(`app/hifz/components/RecitationCoach.tsx`, new file). It loads **only** when the
user opens it (`?mode=recite` or taps "Recite") — dynamic import, never in the
first-paint bundle (§6). The feedback engine behind it is **to be confirmed by the
feedback-tech research** (§8) — this section specifies the product behaviour the
engine must support, not the engine.

### 3.1 Step-by-step flow

1. **Pick.** User arrives at a surah page (or `/hifz/recite` picker). Default scope:
   one ayah at a time; user can extend to an ayah range (e.g. 67:1–5) or the whole
   surah in "review" mode. Free tier: one surah per day (§3.3). The page shows the
   target text before recording starts.
2. **Listen (optional, recommended first time).** Play the ayah audio from the
   existing reciter audio (`AUDIO_BASE`, reciter picker reuses `RECITERS`). The
   words highlight in sync where the audio API provides timestamps; if timestamps
   are unavailable, highlight per-ayah only — never fake word-level sync.
3. **Hide the verse.** "Hide & recite" hides the Arabic (translation may stay
   visible as a prompt, user-togglable). This is the hifz test — Tarteel's proven
   hidden-verse mode. A "Peek" button reveals the verse and marks the attempt as
   "peeked" (counts as a mistake for streak/accuracy purposes, shown honestly).
4. **Recite into the mic.** Big mic button, visible recording state, live waveform
   or level meter (visual only — no transcript shown live). Mic permission is
   requested **only** at this step, with a plain explanation ("We need the
   microphone to hear your recitation. Audio is processed on your device and never
   uploaded."). If permission is denied: show the denial state (§3.2) with a
   "Listen & repeat instead" fallback (no-mic practice mode: listen, then
   self-mark each word correct/incorrect — still logs to the mistake log, flagged
   as self-marked).
5. **Feedback.** Within ~2 seconds of stopping, show the verse with each word
   marked: **correct** (emerald), **missed/skipped** (gold/amber), **wrong word**
   (red, with the expected word shown). Show a per-attempt score: words correct /
   total, and a one-line summary ("8 of 10 words correct — 2 missed"). Show the
   specific missed words as a retry list. **Never** show a tajweed grade, a
   "tajweed score", or rule names (qalqalah, ghunnah, madd) — see §8.
6. **Mistake log.** Every missed/wrong word is appended to the mistake log
   (localStorage, §5) with surah, ayah, word, date, and attempt count. The log is
   visible on the page ("Words to retry") and on `/hifz/my-progress`.
7. **Retry.** "Retry these words" replays just the missed ayahs. "Retry full ayah"
   restarts from step 3. Three consecutive correct recitations of an ayah marks it
   "memorised" (see §5 for the exact rule). "Next ayah" advances the plan.
8. **Done state.** After the daily goal is met: a completion card ("You recited
   10 ayahs today — streak: 6 days") with "Review mistakes" and "Tomorrow's ayahs"
   actions. No confetti, no gamified noise — one calm confirmation.

### 3.2 States (all must be designed, not just the happy path)

| State | UI requirement |
|---|---|
| Mic not yet requested | Mic button + plain explanation; nothing recorded. |
| Mic denied | "Microphone is blocked. Check your browser site settings to enable it." + "Practice without mic" fallback. Never loop the permission prompt. |
| Mic unavailable (no mic / HTTP) | Same as denied, plus note that the coach needs a secure (HTTPS) page. |
| Model loading (first open) | Progress indicator with honest text ("Loading the recitation checker… ~X MB, once"). Must be cancellable; must not block the rest of the page. |
| Model failed to load | "The checker could not load. You can still listen, read and self-mark." + Retry button. The page must stay fully usable. |
| No speech detected | "We didn't hear anything. Check your mic and try again." |
| Too short / unclear | "That was too short to check. Try reciting the full ayah." |
| Offline | Coach needs the model (downloaded once) — if the model is cached, it works offline; otherwise the offline state explains this. Quran text/audio need network (existing proxy behaviour). |
| Low accuracy result | Show the words honestly; never soften a miss into a pass. Offer retry, not praise for a failed attempt. |

### 3.3 Everything is free — no Premium tier (superseded 2026-11-21, §19)

There is no Free vs Premium split. Everything is free, for everyone, always:
unlimited coach use (any surah, any time, whole-surah review included), all
7/30/90-day plans, the full mistake log (kept in full on the device, never
trimmed), streaks, goals, progress dashboard, word-by-word, translation,
tafsir, audio, offline model. No daily caps, no surah cap, no paywall, no
billing, no "coming soon" pricing section. The old free/premium table below
is retired and must not be reintroduced.

| Feature | Free |
|---|---|
| Coach: surahs per day | Unlimited surahs, unlimited time |
| Coach: ayah scope | One ayah / one range / whole surah |
| Mistake log | Full history, on this device |
| Memorisation plans | All 7-day, 30-day and Juz Amma 90-day plans |
| Word-by-word, translation, tafsir, audio | Free, always (never paywalled) |
| Streaks, daily goal, progress dashboard | Free |
| Offline model | Free (download once) |
| Ads | None on hifz pages |

---

## 4. Per-surah study pages (the template)

Every surah page (`/hifz/[slug]`) is built from the **same template** so a new
surah is a data entry, not a new build. Template components go in
`app/hifz/components/` (new): `SurahHero.tsx`, `AyahList.tsx`, `WordByWord.tsx`,
`RecitationCoach.tsx`, `PlanCard.tsx`, `VirtuesBlock.tsx`.

### 4.1 Template sections (in order)

1. **Header:** Arabic name (Scheherazade New), transliterated name, English meaning,
   surah number, ayah count, revelation (Makki/Madani), juz, "X-day plan" badge.
   Breadcrumb: Home › Hifz › [Surah name].
2. **Coach entry:** the "Recite this surah" card (§3) — the first interactive
   element on the page.
3. **Read:** full surah text, Indo-Pak script (`.font-quran`, line-height 2.2),
   paginated like the existing reader (25 verses per page — do not render all 286
   verses of Al-Baqarah at once; the reader already paginates, reuse the pattern).
   Per-ayah: Arabic, translation (Saheeh International default, picker with the
   5 translations from `app/quran/lib.ts`), transliteration, audio play button,
   link to its ayah page, bookmark, "mark memorised" toggle.
4. **Listen:** reciter picker (reuse `RECITERS`), play-all with per-ayah highlight.
   **Completeness requirement (§12):** repeat controls must match Quran.com's
   free reader — repeat count 1–100 per ayah/range, range looping, adjustable
   pause between repeats, playback speed 0.25×–2×. Play-all alone is not
   enough; a study page that listens worse than Quran.com's free reader fails
   the world-class bar. Repeat settings are remembered between sessions.
5. **Word-by-word:** toggleable per ayah — each word with its translation
   (Quran.com `words=true` data, §0.2 B2). Must degrade gracefully: if word data
   fails, the ayah still shows Arabic + translation; the word-by-word block shows
   "Word-by-word is unavailable right now" instead of breaking the page.
6. **Translation & tafsir:** translation under each ayah (view-mode toggle reusing
   the reader's `arabic | translation | tafsir` pattern); tafsir is Ibn Kathir
   Abridged (`TAFSIR_ID = 169`) loaded lazily per ayah, labelled with its source.
7. **Virtues:** a short, sourced virtues block per surah (e.g. Al-Mulk: "the surah
   that intercedes" — with the hadith reference **and its grading**; if a virtue
   narration is weak, say so or omit it — never present a weak narration as
   established). Virtues content is hand-written per surah in `app/hifz/virtues.ts`
   (new), not AI-generated at runtime, and each entry carries its source.
8. **Memorisation plan:** 7-day and 30-day plan cards (§5) with per-day ayah ranges
   and a "Start this plan" button that sets it as the active plan in localStorage.
9. **Related:** prev/next surah, link to the Juz overview, link to the full reader
   (`/quran`), related blog article if one exists. No unrelated tool links here.

### 4.2 Launch set (v1 — build these and only these)

| Surah | # | Ayahs | Slug | Notes |
|---|---|---|---|---|
| Al-Fatihah | 1 | 7 | `al-fatihah` | Every user knows it; the onboarding surah |
| Al-Mulk | 67 | 30 | `al-mulk` | Template prototype — build this one first, fully, then clone |
| Ya-Sin | 36 | 83 | `ya-sin` | "Heart of the Quran" |
| Al-Kahf | 18 | 110 | `al-kahf` | Longest in the set; paginate carefully |
| Ar-Rahman | 55 | 78 | `ar-rahman` | |
| Al-Waqi'ah | 56 | 96 | `al-waqiah` | |
| Juz Amma | 78–114 | 37 surahs | `juz-amma` (+ `/hifz/juz/30`) | Short surahs; the beginner path |
| Ayat al-Kursi | 2:255 | 1 ayah | `ayat-al-kursi` (special page; canonical ayah at `/hifz/al-baqarah/2-255`) | Single-ayah study page |

**Build order:** Al-Mulk first (template proof), then Al-Fatihah + Ayat al-Kursi
(smallest), then Juz Amma surahs (short, high volume), then Ya-Sin, Ar-Rahman,
Al-Waqi'ah, Al-Kahf. Do not start a second surah until Al-Mulk passes the §10
acceptance checks. Al-Baqarah as a whole is **not** in v1 — only its ayah 2:255.

### 4.3 Per-ayah pages (`/hifz/[slug]/[ref]`)

One ayah, fully: Arabic (large), translation (all 5 translators available via
picker), transliteration, word-by-word, audio, tafsir, "Recite this ayah" coach
(scoped to that ayah), prev/next ayah nav, link to the surah page. These pages
are the SEO long tail (§9): 30 (Al-Mulk) + 7 + 83 + 110 + 78 + 96 + ~100 (Juz Amma)
+ 1 ≈ 500 indexable pages from the launch set alone.

---

## 5. Memorisation plans, streaks and progress

### 5.1 Storage: localStorage first, no account required

- **No backend, no account in v1/v2.** All progress lives in the browser, following
  the existing conventions (`quran_bookmarks_v2`, `ili_reading_plan`,
  `ili_prayer_marks_v1`, `ili_dhikr_today`).
- **New keys (all under one versioned namespace so a future migration is one
  function):**

  | Key | Contents |
  |---|---|
  | `ili_hifz_v1` | The whole progress document (see schema below). Single key = single export/import. |
  | `ili_hifz_mistakes_v1` | Mistake log (separate key so it can be capped/trimmed independently). |
  | `ili_hifz_settings_v1` | Reciter, translation, daily goal minutes, hide-translation preference, free-tier usage counters. |

- **Schema (`ili_hifz_v1`, versioned):**

```ts
interface HifzProgress {
  version: 1;
  createdAt: string;            // ISO date
  dailyGoalMinutes: number;     // default 10
  streak: { count: number; lastActiveDate: string /* YYYY-MM-DD local */ };
  activePlan: { surahSlug: string; planDays: 7 | 30 | 90; startedAt: string; currentDay: number } | null;
  ayahs: Record<string, {      // key: "67:1"
    status: 'new' | 'learning' | 'memorised';
    correctStreak: number;      // consecutive correct recitations
    lastPractised: string | null;
    attempts: number;
  }>;
  minutesToday: { date: string; minutes: number };
}
```

- **Rules (normative, implement exactly):**
  - An ayah becomes `memorised` after **3 consecutive correct recitations**
    (correct = all words correct, no peeks). One miss resets `correctStreak` to 0.
    A peek counts as a miss.
  - A **streak day** counts when the user completes at least the daily goal
    (default 10 minutes of coach/listening/reading time, or 5 ayahs practised —
    whichever the user hits first; show both in the UI). Streak uses the **local**
    calendar date; a missed day resets the count to 0 (show "Start a new streak",
    never fake continuity).
  - **Daily goal** is user-settable (5 / 10 / 15 / 30 minutes). Default 10.
  - **Mistake log** entry: `{ surah, ayah, word, expected, heard?, date, attempts }`.
    The full log is kept on this device; nothing is trimmed. "Heard"
    is only stored if the engine returns it — never invent a heard word.
  - **Export/import:** `/hifz/my-progress` has "Download my progress (.json)" and
    "Import" (file picker, validates `version`, rejects anything else with a plain
    error). This is the v1 substitute for accounts and the migration path to v3.
  - **Privacy:** progress never leaves the device in v1. No analytics event may
    contain ayah text, recitation audio, or mistake words. If analytics is added
    later, it records counts only (e.g. "coach session completed").
  - **Storage failure:** if localStorage is unavailable/full/blocked, the site must
    still work for reading/listening/reciting — progress just isn't saved, and a
    one-line notice says so. Never crash the page.

### 5.2 Plans (content, not code)

- **7-day plan** (per surah): the surah split into 7 roughly equal daily chunks
  (by ayah count, split at natural breaks — never mid-ayah). Day 7 is review.
- **30-day plan** (per surah, premium in v1 — §3.3): smaller daily chunks +
  weekly review days (days 7, 14, 21, 30 are review-only).
- **Juz Amma 90-day plan:** one short surah (or part of one) every 2–3 days,
  ordered shortest-first for early wins, with a weekly review day.
- Plan definitions are data in `app/hifz/plans.ts` (surah slug → day → ayah ranges),
  generated by a script at build/authoring time from ayah counts — hand-check each
  plan's day splits once before publishing. The plan UI shows today's chunk, a
  progress bar, and "Mark day complete" (only enabled after the day's ayahs reach
  `learning` or better — no honour-system completion).

---

## 6. Design system — a complete new look, built from scratch

**This is not a reskin.** The homepage (§2), the hub (`/hifz`), the surah/ayah
template (§4), the coach (§3) and the progress dashboard (§5) are designed from
a blank page for the Hifz hub. They must not look like the current tools pages
with a new heading, a new hero banner pasted on, or the old tool-grid layout
relabelled. A first-time visitor must not be able to tell this site used to be a
tools list. The existing tools pages (`/prayer-times`, `/qibla`, `/zakat` etc.)
keep their current design in v1 — they are utilities, reached from the hub, and
redesigning them is out of scope. The new look lives on `/`, `/hifz/*` and the
hub's shared header/footer treatment; when the tools are eventually redesigned,
they adopt this system, not the other way round.

### 6.1 Brand anchor: emerald + gold stays — and why

- **Identity continues:** emerald + gold on warm paper. Exact tokens from
  `app/globals.css` — `--emerald-deep #0b3d2e`, `--emerald-mid #146b4d`,
  `--emerald-soft #eaf3ee`, `--gold #c9a227`, `--gold-light #e7d9a8`,
  `--paper #f7f5ef`, `--ink #1c2420`, `--ink-muted #5b6b62`. **No new palette.**
  The reason is concrete, not sentimental: emerald + gold is already the live
  site's identity (shipped 2026-11-21, verified on the live homepage), it reads
  unmistakably as Islamic without borrowing any competitor's look (Tarteel's
  brand is dark + neon green; Quran.com's is neutral/minimal; Quranly's is
  bright and playful), and changing it now would throw away the one visual
  asset the site already owns. What changes is everything built *with* those
  tokens: layout, type scale, spacing, art, motion and component design are all
  new. If a future brand review proposes a palette change, it must name a
  concrete problem the current palette causes (e.g. a measured contrast failure
  or a confusion with a competitor) — "freshness" alone is not a reason.
- **New tokens may be added, none removed or redefined:** a deeper ink for the
  coach's focus state, a calm red reserved *only* for wrong-word feedback
  (never for decoration or errors elsewhere), and a warm amber reserved *only*
  for missed-word feedback. Feedback colours must mean one thing everywhere:
  emerald = correct, amber/gold = missed, red = wrong. Never reuse those three
  colours for badges, tags or decoration.

### 6.2 First-sight impression goal (the bar for the homepage and hub)

In the first 3 seconds, before scrolling, a visitor must be able to answer —
without reading a paragraph — (1) this is about memorising Quran, (2) I can
recite aloud right now and get feedback, (3) it is free and needs no account.
The test: show the homepage to someone for 3 seconds, hide it, and ask those
three questions. If any answer is wrong, the hero has failed, whatever it looks
like. Concretely: the hero carries the Arabic of one short ayah (large,
beautiful, readable) next to the single primary CTA "Start reciting — Surah
Al-Mulk"; the mic is visible in the hero (not hidden behind a menu); the words
"Free · No sign-up · Your audio never leaves your device" appear as one line
under the CTA, not in a footer. The visual direction is **a quiet room, not a
dashboard and not a game**: generous whitespace, one focal element per screen,
large Arabic as the hero art itself, geometric eight-point-star patterns used
sparingly as texture (never as a busy background behind text). This is a
deliberate contrast with the competition: Tarteel's site leads with a Premium
upsell carousel ("Make your memorization a Premium experience"); Quranly leads
with playful gamification (egg-breaking, levels, hasanat counters); Muslim Pro
leads with feature density. Our first sight is calm, focused and single-purpose
— the visitor's next action is obvious.

### 6.3 Interaction standard — every page, every interaction, every detail

- **One job per screen.** The surah page's first interactive element is the
  coach (§4.1 order is normative). A page never shows two competing primary
  buttons. Secondary actions (bookmark, share, plan) are quiet text buttons.
- **Every interaction answers in under 200 ms** (visual feedback: button press,
  word highlight, tab switch). Anything slower shows an honest progress state —
  never a dead tap. Coach feedback lands within ~2 s of stopping (§8.1.6); while
  it computes, show "Checking your recitation…" with a real progress indicator.
- **No dead ends, no blank states.** Every empty state has a next action
  (§2.1.2: localStorage empty → "Start with Juz Amma" card, never a blank gap).
  Every error state has a fallback that still lets the user practise (§3.2).
- **Motion is functional, never decorative:** a slow fade for word-by-word
  reveal as you recite correctly (the reward is the text appearing, as in
  Tarteel's hidden-verse mode — but ours reveals word-by-word on the web, with
  no install); a gentle pulse on the mic button while recording; nothing that
  bounces, slides in from off-screen, or plays on loop. Respect
  `prefers-reduced-motion`: all non-essential motion off.
- **Calm, not gamified.** No confetti, no badges popping, no "Beast Mode"
  language. Progress is shown as a quiet ring/bar and a streak count (§5). The
  emotional register is a teacher's patience, not a game's excitement — this is
  the deliberate opposite of Quranly's gamification, and it matches the trust
  strip (§2.1.8): this is worship practice, and the design must feel like it.
- **Typography is the design.** DM Sans for UI (already self-hosted);
  Scheherazade New for Quranic Arabic (`.font-quran`, line-height 2.2,
  `dir="rtl"`); Amiri for Arabic labels. Arabic on surah/ayah pages renders at
  a minimum 28px on mobile, 34px+ on desktop. The Arabic line is always the
  largest, most beautiful thing on the page — it is the content, not a label.
- **No emoji icons, anywhere** (standing rule — the 2026-11-21 rebuild stripped
  ~1,350). Icons are SVG, following the existing `app/components/ToolIcon.tsx`
  pattern; add hifz icons (mic, ear/listen, eye-off/hide, check, book, flame for
  streak) to the same component. Streak flame is an SVG, not 🔥.
- **Real art, not stock photos of people:** geometric eight-point-star patterns
  and mosque silhouettes (existing `public/hero-pattern.svg`,
  `public/mosque-silhouette.svg` style), redrawn for the hub at higher craft —
  the hero art is newly commissioned SVG for this launch, not the old homepage
  art reused at a larger size. No images of people on hifz pages.
- **Accessibility is a beat-Tarteel requirement, not a nice-to-have.** Tarteel
  Play-store reviews include a visually-impaired user who cannot use the app
  because large system text breaks buttons and headers overlap (see §11).
  Our bar: the hub must be fully usable at 200% text scaling and with the
  largest iOS/Android system font, with no overlapping text, no clipped buttons
  and no unreachable controls — verified by testing, not by inspection. Mic
  button ≥ 64px with a visible focus ring; all feedback is also conveyed by
  text, never by colour alone (correct/missed/wrong words carry labels, not
  just emerald/amber/red); full keyboard operability of the coach controls.
- **Mobile-first:** the coach is a phone-first feature (mic + recitation). Every
  coach control must be thumb-reachable; the mic button is at least 64px; ayah text
  must not require horizontal scrolling at 360px wide. Test at 360×640.
- **Performance budget (enforced, measured with Lighthouse on the Al-Mulk page):**
  - First paint of a surah page must not include the recitation model, the mic
    code, or any audio library. Coach code loads only on `?mode=recite` or tap
    (dynamic `import()`), and the model downloads only after the user taps "Recite".
  - LCP ≤ 2.5s on a mid-range phone (Moto G-class, 4G throttling); total JS on
    first load ≤ 200 KB gzipped for a surah page; no new render-blocking font
    requests (fonts are already self-hosted — keep it that way).
  - Quran text/audio/translation come from the existing proxy with its 24h cache;
    do not add new third-party requests to the critical path. No new analytics
    provider on hifz pages in v1.
  - The existing sticky-header `scroll-padding-top: 4.75rem` rule stays — anchor
    links to ayahs must clear the 56px header (this was a real bug, fixed
    2026-11-21; do not regress it).
- **Design acceptance (part of §10 v1 checks):** the 3-second test (§6.2)
  passes with 3 of 3 questions answered; 200%-text-scaling test passes with no
  overlap/clipping; no emoji on any new page (grep the diff); the hub's pages
  share one header, one footer treatment, one card style and one button style —
  a visitor can tell in one glance that `/`, `/hifz`, `/hifz/al-mulk` and
  `/hifz/my-progress` are the same product.

---

## 7. Monetisation — everything is free (superseded 2026-11-21, §19)

There is no paid tier and no monetisation on the site. Everything is free:
the coach (unlimited), all plans, the full mistake log, streaks, goals and
the dashboard. No billing, no paywall, no ads on hifz pages, no "Premium —
coming soon" section anywhere.

Benchmark (competitor research only, from the §11 competition study,
21 Nov 2026): Tarteel Premium $12.99/mo or $99/yr (App Store also lists
$19.99/mo and $239.99/yr). That is what the competition charges — it is
not our model. Our beat is that the flagship (live mistake detection) is
free for everyone, where Tarteel locks it behind Premium.

- **No paywall on the Quran text itself** — ever. Not on text, translation,
  tafsir, or basic audio.
- **Ads:** none on hifz pages. AdSense setup is still outstanding for the
  site generally and is not part of this product.
- **Donations** (the Quran.com model) are a possible future option; do not
  build a donation flow unless the owner asks for one.

---

## 8. Recitation feedback — product requirements

> **IMPLEMENTATION: TO BE CONFIRMED BY THE FEEDBACK-TECH RESEARCH.**
> A separate agent is researching the recitation-feedback technology (model/API,
> accuracy, on-device options, cost). **Do not invent a model, library or API
> here.** The build must not start the coach engine until that research lands and
> this section is updated with the chosen implementation. Everything below is a
> product requirement the chosen implementation must satisfy — if no available
> technology satisfies a MUST, the feature ships without that behaviour and the
> spec is updated to say so.

### 8.1 MUST (non-negotiable)

1. **Word-level accuracy only.** The engine reports, per word: said correctly /
   missed / wrong. Nothing more. It must never output a tajweed ruling, a tajweed
   score, or a grade for madd, ghunnah, qalqalah, makharij or pauses.
2. **Honest limitation, in the UI, every time.** The coach page and the homepage
   trust strip must say, in plain words: "This tool checks which words you said.
   It does not check tajweed. A teacher is still needed for tajweed — use this
   for practice between lessons." Same wording on the feedback screen, not buried
   in a footer.
3. **On-device processing preferred.** Audio is processed on the user's device
   and never uploaded. If the chosen implementation cannot run on-device, that is
   a spec change requiring the owner's explicit approval, plus: explicit consent
   before the first recording, a plain statement of where audio goes and how long
   it is kept, and no audio stored after the session.
4. **Known-text recognition.** The engine is given the expected ayah text and
   checks the recitation against it (alignment, not open transcription). It must
   not hallucinate verses and must never present a wrong word as the Quranic text.
5. **Deterministic, explainable output.** For each word: correct / missed / wrong,
   plus a confidence value the UI may use only to decide "unclear — try again"
   (never shown as a score to the user).
6. **Latency:** feedback appears within ~2 seconds of stopping a short ayah
   recording on a mid-range phone. If it takes longer, show progress honestly.
7. **Graceful failure (§3.2 states):** model load failure, no speech, too short,
   mic denied — the page stays usable and reading/listening/self-marking always work.

### 8.2 MUST NOT

- Never claim tajweed accuracy, in UI copy, metadata, marketing, or JSON-LD.
- Never show a "tajweed score", percentage tajweed grade, or rule names as feedback.
- Never upload audio without explicit, per-session consent (and never by default).
- Never store audio on the server. Never store audio in localStorage.
- Never auto-play audio or auto-start the mic. Both are user-initiated only.
- Never invent a "heard" word for the mistake log — if the engine cannot say what
  was heard, the log records "word missed/incorrect" only.

### 8.3 Questions the feedback-tech research must answer (before build)

1. Which model/API, and can it run on-device in the browser (size, format)?
2. Measured word accuracy on Quranic Arabic (not generic Arabic ASR) — and on
   which recitation styles/accents was it tested?
3. Does it support alignment against known text, per-word timestamps, and
   missed-word detection — or only transcription?
4. Cost per minute/session if server-side; licence terms; offline behaviour.
5. Minimum browser/device requirements and the honest fallback when they are not met.
6. Privacy: exactly what, if anything, leaves the device.

---

## 9. SEO

Baseline: ~71 clicks / 12 months, avg. position ~42.4. The hifz hub is the SEO
strategy: programmatic depth (Quran.com's proven model — 6,236 ayah pages) aimed
at the one job competitors do in apps, not on the web.

### 9.1 Programmatic pages

- v1 creates ~500 indexable URLs from the launch set: 8 surah pages + ~490 ayah
  pages + Juz Amma + Juz 30 + plans + hub. Each is a real server-rendered page
  with unique content (Arabic + translation + word-by-word + tafsir excerpt +
  plan), not a thin template with a swapped name.
- **Titles (≤60 chars) and descriptions (≤155 chars), unique per page** — the
  old defect (all 55 blog posts sharing one title) must never recur. Patterns:
  - Surah: `Surah Al-Mulk — Read, Listen & Memorise | I Love Islam`
    / `Memorise Surah Al-Mulk (67) — Arabic, translation, audio and a 30-day hifz plan. Recite aloud and get word-by-word feedback.`
  - Ayah: `Surah Al-Mulk Ayah 1 (67:1) — Arabic, Translation & Tafsir | I Love Islam`
    / `Read Surah Al-Mulk verse 1 with Indo-Pak Arabic, Saheeh International translation, word-by-word, audio and tafsir.`
  - Juz Amma: `Juz Amma (Juz 30) — Memorise the Short Surahs | I Love Islam`
- **Canonicals:** one canonical per surah/ayah (no `?mode=recite` in canonicals).
  `/hifz/ayat-al-kursi` canonicalises to itself (it is a distinct study page);
  it links to `/hifz/al-baqarah/2-255` as the ayah source.
- **JSON-LD on every surah/ayah page:** schema.org — surah pages use
  `Article` (headline, description, inLanguage) + `BreadcrumbList`; ayah pages
  add the ayah as a `Quotation` with `spokenByCharacter` unset (never attribute
  Quranic text to a person) and `isBasedOn` the Quran.com source. Include
  `speakable` where appropriate. Validate every template with Google's Rich
  Results Test before launch; invalid JSON-LD is worse than none.
- **Sitemap:** extend `app/sitemap.xml/route.ts` — add `/hifz`, all launch-set
  surah/ayah URLs, `/hifz/juz-amma`, `/hifz/juz/30`, `/hifz/plans`,
  `/hifz/my-progress` (low priority, 0.3 — it is a tool page, not content),
  with `changefreq: monthly` for surah/ayah pages, `weekly` for `/hifz`.
  Resubmit in Search Console after deploy (property owned by
  mehrankhan212257@gmail.com — the uet3 account has no access; do not resubmit
  from the wrong account).
- **Internal linking:** every surah page links to its ayahs, prev/next surah, its
  juz page, the plans page, and the matching blog article (if any). The homepage
  links to all launch surahs. The reader (`/quran`) links to `/hifz/[slug]` per
  surah. No orphan hifz pages.
- **Do not chase "quran" (135K/mo) or "prayer times" (2.3M/mo worldwide).**
  Quran.com (authority 75, 5.25M backlinks) and IslamicFinder own those. Target
  the winnable long tail: "surah mulk" (49.5K/mo), "surah yasin", "surah kahf",
  "memorise surah mulk", "learn surah [name]", "ayat al kursi" + per-ayah queries
  — where a genuinely better page (coach + plan + word-by-word) can win over
  12–24 months. AI Overviews eat plain answers; the coach is an interactive tool
  an Overview cannot replace — that is the point.

### 9.2 Machine-readable index (AI citation)

- **New file `public/llms.txt`** (does not exist yet) + `public/llms-full.txt`:
  a plain-text index of the site for AI assistants, in the llms.txt convention —
  site description, then a Markdown list of the hub pages with one-line
  descriptions: `/hifz`, each launch surah, Juz Amma, plans, and the dua flagship.
  Keep it under ~100 lines for `llms.txt`; `llms-full.txt` may list every ayah URL.
- **Link it** from `public/robots.txt` (add a comment line pointing to it) and from
  the footer.
- **Rules for the index:** only real, live URLs; every line must name its source
  (Quran.com for text/translation/tafsir); no claims about tajweed accuracy
  anywhere in it; regenerate it when the launch set grows (add a step to the
  release checklist, §10).
- **Attribution on every hifz page (visible, not just metadata):** "Quran text,
  translation (Saheeh International) and tafsir (Ibn Kathir Abridged) via
  Quran.com. Audio: [reciter name]." This is a trust/ranking asset for YMYL
  religious content, not decoration.

---

## 10. Phased build plan

### v1 — Ship the hub with one complete surah + the coach (the only scope that ships)

Goal: a real user can memorise Al-Mulk end-to-end. Everything else is scaffolding
for the launch set.

1. Fix blockers B1 (mic Permissions-Policy) and verify B2 (word-by-word via proxy).
2. Feedback-tech research lands; §8 updated with the chosen implementation.
   **If it has not landed, v1 ships the hub, surah pages and plans with the coach
   in "listen + self-mark" mode only** — the mic flow is not faked.
3. Routes + templates: `/hifz`, `/hifz/[slug]`, `/hifz/[slug]/[ref]`,
   `/hifz/juz-amma`, `/hifz/plans`, `/hifz/my-progress`, `/hifz/recite`;
   `app/hifz/surahs.ts`, `app/hifz/plans.ts`, `app/hifz/virtues.ts`;
   components in `app/hifz/components/`.
4. Al-Mulk complete (template proof): all §4 sections, 7-day plan, coach flow,
   mistake log, streak, daily goal.
5. Homepage rebuilt as the hub (§2). Header nav gains "Hifz" (first item after
   Home). Old homepage dashboard widgets demoted, not deleted.
6. Launch-set surah pages (Al-Fatihah, Ya-Sin, Ar-Rahman, Al-Waqi'ah, Al-Kahf,
   Juz Amma 78–114, Ayat al-Kursi page) cloned from the Al-Mulk template.
7. SEO: metadata patterns, JSON-LD, sitemap extension, `llms.txt`, internal links,
   Search Console resubmission.
8. Free/premium split implemented client-side (§3.3) with "Premium coming soon"
   messaging (no billing).

**v1 acceptance checks (all must pass before the owner is told it is done):**
- Al-Mulk page: Lighthouse LCP ≤ 2.5s, JS ≤ 200 KB gzipped first load, no coach
  code in the first-paint bundle (verify in DevTools coverage/network).
- Coach: full flow (pick → listen → hide → recite → feedback → mistake log →
  retry) works on a real phone (Chrome Android + Safari iOS) with the mic
  permission prompt appearing (B1 fix verified).
- Word-by-word renders for Al-Mulk 67:1; tafsir loads per ayah; pagination works
  on Al-Kahf (110 ayahs).
- Streak + mistake log + export/import work with localStorage on and off.
- Every new page has a unique title/description; sitemap lists every launch URL;
  JSON-LD validates; no emoji anywhere on new pages (grep the diff).
- `next build` green; no new console errors on any hifz page; the existing tools
  still pass their pages (spot-check `/quran`, `/prayer-times`, `/dua-for-this-moment`).

### v2 — Depth (after v1 is live and verified)

1. Premium billing (provider TBD at v2 planning — no provider is chosen in this
   spec): unlimited coach, 30-day plans, full mistake history.
2. Remaining Juz 29 surahs as study pages (67–77) to complete the "Tabarak" set;
   then Juz 29 + 30 plan bundles.
3. Fajr wake-up challenge inside the hub (the research's proven gap: task to
   dismiss, gentle recitation, streak) — as a feature of the hub, not a new site.
4. Cited AI Q&A / dua-by-situation as layer two, grounded in the same corpus
   (retrieve-then-answer, every claim cited, no fatwas) — only if v1 retention
   justifies it.
5. AdSense evaluation on hifz pages (never in the coach flow, never over Arabic).
6. Multilingual entry: Urdu first (the owner's audience), then Bengali/Indonesian/
   Turkish for the hifz UI strings only — Quran text/translation already
   multilingual via the API.

### v3 — Accounts and scale (only when v1/v2 retention proves the product)

1. Optional accounts (email only) to sync progress across devices; localStorage
   remains the offline default and the import path is the migration.
2. All 114 surah pages + all 30 juz pages from the proven template (programmatic
   rollout, batched, with the same acceptance checks per batch).
3. Teacher mode: share a mistake log with a teacher (link-based, no audio shared
   without explicit consent).
4. Donations (Quran.com model) as a secondary revenue line.

## 11. Competition — what they do vs what we do better

**Studied 21 November 2026.** Method and honesty note: this section is built
from official sites, App Store / Google Play listings, Play-store reviews and
credible 2026 comparisons — **not** from hands-on use of the competitor apps,
which the researcher could not operate. Every row names its evidence. Where a
claim rests on a store listing or a review, it says so. Prices and features
change; re-check the listings before v2 pricing decisions. The bar set by the
owner: we are not matching Tarteel, we are **beating it on the web**.

### 11.1 Tarteel — the one to beat

The category leader. 16M installs (AppBrain, Nov 2026), 4.70 from ~116,000–117,000
Google Play ratings, ~410,000–430,000 installs in the last 30 days, TIME100 AI
2026 for co-founder Mohamed Moussa. Its own site (tarteel.ai, fetched 21 Nov
2026) leads with a Premium upsell carousel — "Make your memorization a Premium
experience" — and its FAQ confirms the split below.

| Feature | What Tarteel does well | What we do better (concrete) | Evidence / source |
|---|---|---|---|
| Platform | Best-in-class phone app (iPhone, iPad, Android); 198.5 MB, updated Nov 2026 (v5.83) | **We exist on the web; Tarteel does not.** No install, no 198 MB download, no store account — open a link and recite in the browser. A Google search for "surah mulk" can land directly on our coach; Tarteel cannot be linked to at all. | Quraniya comparison, Nov 2026: "no version that runs in a web browser"; App Store listing (no web version); AppBrain size 198.5 MB |
| Live mistake detection | Real-time word-level detection: missed, added, changed words, incorrect tashkeel; tap a mistake to see what you said vs the correct ayah | **Free every day, not paywalled.** Tarteel's flagship is Premium-only; ours is free daily (1 surah / 10 min, §3.3). Same job, zero price to try it. | tarteel.ai FAQ + App Store listing (Premium unlocks "Live Memorisation Mistake Detection"); §3.3 |
| Hidden-verse mode | Hide verses, recite from memory, words reveal as you say them; "Peek" when stuck; hide ayah markers for a true test | Same mode on the web (§3.1 step 3), plus the peek is **counted honestly as a miss** in streak/accuracy — Tarteel's listing does not say peeking costs anything. | App Store listing; QuranLoop comparison, Oct 2026 |
| Voice search | "Shazam for Quran" — say a few words, find the verse | **Not in v1 — we lose this one honestly** (see §12). Planned for v2 once the coach engine exists; the same alignment engine powers it. | App Store listing; §12 |
| Test Mode | Drops you at random places in your memorised text, breaking cue-dependence (added Aug 2026, v5.81.1) | **Not in v1 — we lose this one honestly** (see §12). Cheap to add in v2 once ayah state exists (§5 schema already records per-ayah status). | App Store release notes, Aug 2026; §12 |
| Goals, streaks, analytics | Smart Goals (memorisation / revision / reading), streaks + heatmaps, per-surah strength view, mistake history with playback of your own recording | **Streaks and goals are free, not Premium** (§3.3, §5); progress is local-first with export/import, so it survives without an account. What we do **not** match in v1: cross-device sync, groups/leaderboards, or recording playback (we never store audio, §8.2). | App Store listing; §3.3, §5, §8.2 |
| Tajweed | None — its own help centre says it is "not trained to recognise tajweed mistakes yet"; Hafs from Asim only | We do not claim tajweed either (§8) — **we beat Tarteel on honesty of presentation**: the limitation is stated on the coach page and homepage trust strip in plain words, not buried in a help centre. We also do not present the gap as a coming feature we cannot deliver. | Quraniya comparison (help-centre facts, Nov 2026); §8.1.2 |
| Accuracy complaints | Genuinely useful detection, praised in reviews ("even when I make a small mistake on Tashkeel, it directly catches it") | **Our acceptance bar is Tarteel's known failure modes:** reviews report correct recitation flagged as wrong when reciting fast, and long madd merging with the previous word (e.g. Al-Mulk 19) being marked wrong; detection lagging and the session switching off for "inactivity". Our §8 research must test fast recitation and long madd explicitly, and our "unclear — try again" state (§3.2) must never present an uncertain result as a fail. | Google Play reviews via AppBrain, Oct–Nov 2026 (Rez, Phar Haan); Chrome-Stats review summary; QuranCast comparison, Nov 2026 |
| Reliability complaints | — | Reviews report the app **freezing on specific ayahs** (reciting correctly but the app does not advance, even on repeat) and post-update lag. Our web build has no app update to break it mid-session; the §10 acceptance checks require the full coach flow on a real phone before launch, and the page must stay usable if the model fails (§3.2). | ComplaintsBoard reviews; Chrome-Stats review summary |
| Accessibility | — | A visually-impaired reviewer reports large system text **breaking buttons and overlapping headers** so the app is unusable. Our bar (§6.3): fully usable at 200% text scaling with no overlap — a named, tested beat. | ComplaintsBoard review ("Please Make This App More Accessible") |
| Pricing | Premium $12.99/mo or $99/yr (entry tiers; listing also shows $19.99/mo, $239.99/yr); free trial; Family Plan (5 accounts, annual); Alim pay-what-you-can programme down to $0 (reviewed within 48h) | **Cheaper and freer at the point of use:** free daily live coach (§3.3); v2 target $9.99/mo or $59/yr (§7) — under Tarteel's entry price. We should also copy the Alim idea in spirit at v2: a "can't afford it" path, as Quranly does (§11.3) — a concrete trust feature, not a slogan. | App Store listing; tarteel.ai FAQ (Alim, Family Plan); QuranLoop comparison, Oct 2026 |
| Privacy / internet | "Privacy First — Tarteel does not sell your data"; reciter audio downloadable for offline listening | **Stronger privacy + offline story:** audio is processed on-device and never uploaded (§8.1.3) — Tarteel's App Store listing says voice features "require microphone access and a stable internet connection". If the §8 research lands an on-device model, our coach works offline after one download; Tarteel's AI does not. If it does not, §8 must say so and this row is struck. | App Store listing ("requires … a stable internet connection"); Quran Habit comparison (help-centre article on offline audio) |
| Onboarding / first run | Account + onboarding flow; app data corruption has returned users to onboarding screens (release notes) | **No account, no onboarding screens, no sign-up wall.** First visit → hero → "Start reciting" (§2.1.1). Progress is local from the first tap. | App Store release notes (data-corruption/onboarding bug); §0.1.2, §2 |

### 11.2 Quran.com — the web incumbent we must out-specialise

16.64M visits in Oct 2026 (Semrush), authority 75, 5.25M backlinks, #1 for
"quran" (135K/mo) and "surah mulk" (49.5K/mo). Free, ad-free, non-profit
(Quran Foundation). Its 2025–26 year in review reports a redesigned reader
(Study Mode, verse comparison, layered translations, hadith, related-ayah
discovery, notes/collections), 19 new translations, word-by-word in 6 languages,
and Learning Plans with "thousands of enrollees and more than 3,000 five-star
ratings".

| Feature | What Quran.com does well | What we do better (concrete) | Evidence / source |
|---|---|---|---|
| Reader depth | The best free reader on the web: Uthmani + Indo-Pak scripts, dozens of reciters with word-by-word audio follow-along, click-any-word root/morphology, many tafsirs, bookmarks in grouped collections, reading goals + streaks | **We do not try to out-read Quran.com.** We reuse its data (same API, §0) and beat it on the one job it does not do: the coach. Our surah pages link to `/quran` for whole-Quran reading rather than duplicating it (§1.3). | Quran.com year in review (quran.foundation); MamunLabs profile, Nov 2026; research report §3 |
| Learning Plans | Structured 30-day Al-Mulk plan (one ayah/day, word-by-word + commentary + reflection, ~15 min/day) and 7-day Al-Fatihah plan; 3,000+ five-star ratings | **Our plans are verified, theirs are read.** Quran.com's plans teach meaning and ask the user to self-check; ours pair each day's ayahs with the coach, so the plan *knows* whether you recited them correctly (§5.2: "Mark day complete" only after the day's ayahs reach `learning`). Same 30-day Al-Mulk shape, but completion is earned, not claimed. | quran.com learning-plan pages (30-day Al-Mulk; 7-day Al-Fatihah), fetched in research; §5.2 |
| Recitation checking | None — no in-reader AI coach, no recitation checking, no revision scheduling (as of 2026) | **The whole hub.** Listen → hide → recite → word-level feedback (§3) is a feature Quran.com does not offer on the web at all. | QuranLoop comparison, Oct 2026 ("its pages do not mention recitation checking"); Tabarak Academy comparison, Nov 2026; research report §2 |
| Verse repetition | Strongest free repeat settings: 1–100 repeats, looping, adjustable pauses, 0.25×–2× speed, remembered between sessions | **Match it, don't beat it, in v1:** our Listen section (§4.1.4) must offer repeat counts and speed control, not just play-all — otherwise our own study pages are worse listeners than Quran.com's. Flagged in §12. | Tabarak Academy comparison, Nov 2026 |
| Guidance | "A library, not a school" — no guided linear curriculum; the user must know where to start | **A school for one job:** the hub tells a beginner exactly where to start (Juz Amma, shortest-first, §5.2) and what today is (§2.1.2 continue card). One path, not a catalogue. | EatHealthy365 comparison, 2026 ("doesn't offer a guided, linear curriculum") |
| Trust / funding | 501(c)(3) non-profit, donation-funded ("Sadaqah Jariyah"), scholarly oversight, named sources | We match the trust mechanics on our scale: named translator/tafsir/reciter on every page, virtues with grading (§4.1.7, App. A), no ads on hifz pages in v1 (§7). We do **not** match its authority (75) or backlink profile — that is a 12–24-month SEO grind (§9), not a v1 claim. | quran.org / Quran Foundation; research report §3.5 |

### 11.3 Quranly — the habit craft to learn from (and where it stops)

3.9M installs (AppBrain), 4.55–4.7 rating, ~$5K/mo estimated revenue
(Peekly, Nov 2026). Calls itself "the world's first habit-building Quran app".

| Feature | What Quranly does well | What we do better / take from it (concrete) | Evidence / source |
|---|---|---|---|
| Habit design | The best habit loop in the category: daily goals from 2 min ("Break the Egg") to 30+ min ("Beast Mode"), a reading screen tracking time + verses + hasanat live, streaks + weekly tracker on the home screen, levels, private friends-and-family leaderboards | **Take the loop, drop the game skin.** Our daily goal (5/10/15/30 min, §5.1) and streak mirror its structure, but in the calm register of §6.3 — no eggs, no "Beast Mode". **Concrete borrow for v2:** Quranly's "pause streak" feature (a grace mechanism for real-life interruptions) — our v1 hard reset (§5.1) is stricter than the best habit app in the market; §12 flags a grace-day as the v2 fix. | BuiltForMuslims listing; Niyat vs Quranly comparison, 2026; ScreensDesign UI breakdown (onboarding, streak protection) |
| Onboarding | 20-step personalised onboarding (goal, font, reciter, translation) before the paywall; an interactive hasanat calculator on the paywall; an "I can't afford it" free-access option | **Take the personalisation, skip the 20 steps.** Our first run asks two things only: pick a surah, pick a reciter (§2.1.3) — the rest is defaults. Copy the "I can't afford it" idea at v2 as the Alim-style path (§11.1). | ScreensDesign UI breakdown (20 onboarding steps, hasanat calculator, "I can't afford it") |
| Pricing | Free to start, no ads; Premium $4.99/mo, $29.99/yr, lifetime $79.99/$199.99 | Our v2 target ($9.99/mo, $59/yr, §7) is above Quranly's — justified only because we sell live AI coaching, which Quranly does not have. If the coach is not live, our price has no justification; §7's target assumes §8 lands. | Niyat khatm-tracker comparison (prices checked on US App Store, Sep 2026) |
| Where it stops | — | **It stops at reading.** No recitation checking, no prayer times, no duas, no khatm tracker advertised, English only. Our hub is the reading habit *plus* the coach *plus* the plan — the habit is the on-ramp, not the product. | Niyat vs Quranly, 2026 ("It stops at reading") |

### 11.4 Pillars — the trust and calm benchmark

770K installs (AppBrain; company claims ~2M users), 4.74–4.83 rating. Prayer
times + Qibla only, built in the UK after Muslim Pro's 2020 location-data story.

| Feature | What Pillars does well | What we do better / take from it (concrete) | Evidence / source |
|---|---|---|---|
| Privacy | The category's trust benchmark: prayer times and Qibla computed on-device, no account, no ads ("Ads don't belong on a prayer app. Period."), no analytics at launch | **Same promise, extended to voice:** no account (§0.1.2), no ads on hifz pages (§7), audio processed on-device and never uploaded (§8.1.3), no analytics event containing ayah text or mistake words (§5.1). Privacy is our headline, as it is theirs — stated in the hero (§2.1.1), not in a privacy page. | Pillars App Store listing; MamunLabs Pillars profile, Nov 2026 |
| Calm design | "Beautiful design — we want to beautify the act of prayer"; focused, uncluttered, nothing nags or upsells mid-prayer | **Our §6.3 calm register is modelled on Pillars, not on Quranly's gamification or Tarteel's neon.** One job per screen, no mid-practice upsell (free-limit message is plain text, §3.3). | Pillars App Store listing; Living Quran vs Pillars comparison, 2026 |
| Streak humanity | Prayer tracker with a menstruation mode that **pauses tracking so a streak is not lost**; Fajr smart alarm; PrayFirst app blocker | **Concrete lesson for §5:** a streak system that punishes real life loses users. V1 keeps the hard reset (simple, honest), but §12 records a grace/pause mechanism as the v2 fix — Pillars proves the category's best apps already do this. | MamunLabs Pillars profile, Nov 2026 |
| Pricing model | Premium $11.99/mo or $49.99/yr unlocks mostly **cosmetics** (themes, watch support, icons) — core features stay free | Our split (§3.3, §7) follows the same principle in the other direction: the Quran text, audio, translation, tafsir and the daily coach stay free; Premium buys depth (unlimited time, all plans, full history). **Warning from Pillars' reviews:** long-time users report previously-free features moving behind the paywall — we must not do that; the §3.3 free set is a promise, and moving it later breaks trust. | Niyat vs Pillars comparison, 2026 (paywall drift noted); App Store listing |
| Where it stops | — | No Quran reader, no hifz, no AI, no dua library. Pillars is the prayer half of the day; our hub is the memorisation half. We do not compete with it — our prayer-times utility (§1.1) should meet its calm standard, and our Fajr wake-up feature (v2, §10) is the Pillars Fajr-alarm idea inside the hub. | Niyat vs Pillars, 2026; MamunLabs profile |

### 11.5 Muslim Pro — the scale warning (what not to copy)

190M+ downloads claimed by the company (100M+ on Google Play), 4.7 App Store /
~4.1 Play. The all-in-one incumbent: prayer times, Quran, Qibla, duas, halal
directory, Qalbox streaming. Included here as a negative benchmark.

| Feature | What Muslim Pro does well | What we do better (concrete) | Evidence / source |
|---|---|---|---|
| Breadth / scale | Largest user base in the category; enormous prayer-time feedback loop; polished design; community/Ramadan content | **We win by refusing breadth.** One job (memorise Quran by reciting aloud) done better than an all-in-one that does it as a side feature. Our tools stay utilities (§1.1), never the proposition. | FivePrayer comparison, May 2026; research report §1 |
| Free-tier ads | — | **No ads on hifz pages in v1 (§7)** — the direct answer to Muslim Pro's most-cited complaint: banners, interstitials between sections, pre-roll on adhan audio, and users reporting ads even after paying. An ad over Arabic text or inside the coach flow would end the product's trust; §7 forbids it. Trustpilot 2.2/5 ("Poor") is the cost of getting this wrong. | Islamtics comparison, May 2026 (Trustpilot 2.2/5, ad complaints); MWM review summary (ads after paying) |
| Price | Premium ~$12.99/mo or $34.99/yr (US, 2026) | Our v2 target ($9.99/mo, $59/yr) undercuts its monthly price; more importantly, our free tier includes the live coach, which Muslim Pro does not offer at any price. | Living Quran comparison, 2026; Islamtics, May 2026 |
| Trust | — | The 2020 location-data story (Vice/Motherboard: location data shared with broker X-Mode) still appears in every 2026 round-up and still drives "Muslim Pro alternative" searches. Our answer is structural, not a statement: no account, on-device processing, no location needed for the hub at all (§0.1.2, §5.1, §8.1.3). | Vice/Motherboard 2020, via Islamtics / Living Quran comparisons, 2026 |

### 11.6 The gap none of them owns (the summary)

No competitor offers **live recitation feedback on the open web, free, with no
account and no install**: Tarteel is app-only and paywalls the feedback;
Quran.com is web but has no coach; Quranly is app-only and has no coach;
Pillars is app-only and has no Quran; Muslim Pro is app-led and ad-supported.
That empty cell is the whole bet. Everything in this spec exists to hold it:
the coach (§3), the free daily tier (§3.3), the programmatic surah/ayah pages
(§9), and the new look (§6).

---

## 12. World-class bar — per major feature

"World-class" means: as good as or better than the best named competitor in §11
on the thing the user actually feels, measured by the acceptance check given.
If a feature cannot reach that bar in v1, the spec says so here instead of
shipping a mediocre version and calling it done. **Nothing in this section
changes the v1 launch set (§4.2) or the URL scheme (§1.2).**

| Feature | World-class bar | v1 verdict | What would make it world-class |
|---|---|---|---|
| Coach feedback accuracy (§3, §8) | Matches Tarteel's detection on correct recitations and beats it on its known failures: fast recitation, long madd, no false "inactivity" cut-off, no freezing on an ayah | **NOT world-class in v1 — flagged.** The engine is TBD (§8); no available technology has been measured yet, and Tarteel spent years on a proprietary model. V1 may ship listen + self-mark only if §8 has not landed (§10 step 2). Shipping a guessing coach would be worse than shipping no coach. | §8 research lands an on-device Quran-specific alignment model with measured word accuracy on Quranic Arabic (fast + slow recitation, long madd, multiple accents); the §10 phone tests include Tarteel's failure cases as explicit test cases; feedback latency ≤ 2 s (§8.1.6). |
| Hidden-verse / peek mode (§3.1.3) | As good as Tarteel's: words reveal as you recite, peek when stuck | **Can be world-class in v1** — it is a UI mode over the coach, not a model. The honest-peek rule (peek = miss) is already stricter than Tarteel's. | Keep the bar: reveal must be word-by-word in sync with correct recitation, never whole-ayah; peek state visible in the attempt record. |
| Voice search ("Shazam for Quran") | Tarteel's: say a few words, find the verse | **Not in v1 — flagged, not faked.** No voice-search UI in v1; do not imply it exists. | v2: reuse the §8 alignment engine in reverse (match a spoken fragment against the corpus); needs the same on-device model plus an index of the launch set. |
| Test Mode (random-location recall) | Tarteel's (Aug 2026): random ayah starts inside memorised text | **Not in v1 — flagged.** | v2: cheap once §5 per-ayah state exists — pick a random `memorised` ayah, hide it, coach it. No new model work. |
| Mistake log + analytics (§3.1.6, §5) | Tarteel Premium: full history, per-surah strength, heatmaps, playback of your recording | **Partial in v1 — flagged.** 7-day log, on-device, no audio playback (we never store audio, §8.2 — a deliberate privacy trade, not a gap to close by storing recordings). No heatmaps, no per-surah strength view. | v2/v3: full history (Premium), heatmap + per-surah strength view on `/hifz/my-progress`, built from the existing log schema — no new data collection, just visualisation. |
| Word-by-word (§4.1.5) | Quran.com's: tap any word for translation, transliteration, root/morphology; word-by-word in 6 languages | **Near world-class in v1.** Translation per word via the existing proxy (§0.2 B2). Root/morphology is not in v1. | v2: root-word + morphology on tap (Quran.com's word data already carries it — check the `words=true` payload for root fields before promising it). |
| Learning plans (§5.2) | Quran.com's plans: 3,000+ five-star ratings, one ayah/day with commentary + reflection | **Can be world-class in v1 on content; not on scheduling.** Our plans pair each day with coach verification (the beat, §11.2) and earned completion. What is missing: spaced-repetition revision scheduling — Quran.com does not schedule revision either, but Tarteel's Smart Goals do. | v2: revision scheduling — the plan auto-schedules review days from the mistake log and per-ayah `correctStreak` (§5 schema already records it); review days stop being calendar-fixed and become performance-driven. |
| Streaks + daily goal (§5) | Quranly's habit loop; Pillars' humane streak (pause, not punishment) | **Good in v1, not best.** Goal + streak + dashboard ship free. Missing: Quranly's streak-pause and Pillars' pause-for-real-life. Our v1 hard reset (§5.1) is honest but stricter than the best habit apps. | v2: one grace mechanism — a "pause streak" (Quranly) or one forgiveness day per month — chosen at v2 planning, never silently. Do not add it in v1 without changing §5.1 explicitly. |
| Listening / audio (§4.1.4) | Quran.com's repeat engine: 1–100 repeats, looping, pauses, 0.25×–2× speed | **At risk in v1 — flagged.** §4.1.4 currently says "play-all with per-ayah highlight" and does not specify repeat counts or speed control. If v1 ships play-all only, our study pages are worse listeners than Quran.com's free reader. | v1 fix (no scope change, just completeness): specify repeat count (1–100), range loop, pause between repeats and 0.25×–2× speed in §4.1.4 before build. See the note added there. |
| Offline use | Tarteel: reciter audio downloadable; AI needs internet. Pillars: on-device prayer times | **Conditional — flagged.** Offline coach is possible *only* if §8 lands an on-device model; otherwise the coach needs network and the offline state (§3.2) must say so. Offline reading/listening is already possible via PWA + cached proxy only if the builder verifies it — not assumed. | §8 on-device model + a verified PWA offline test (coach with model cached, airplane mode) in the §10 checks. |
| Design / first sight (§6) | Pillars' calm; Quran.com's speed and clarity | **Can be world-class in v1.** The new look (§6) is the one feature with no legacy constraint and no model dependency — the bar is set by the 3-second test and the 200%-text test, both verifiable before launch. | Hold the §6 acceptance checks; do not let the coach's engineering dominate the design review. |
| SEO / programmatic depth (§9) | Quran.com: 6,236 ayah pages, authority 75 | **NOT world-class in v1 — flagged.** ~500 pages from the launch set, authority near zero (baseline: 71 clicks / 12 months, position ~42). No v1 page can outrank Quran.com on head terms. | v3 rollout to all 114 surahs + 30 juz (§10 v3.2) plus 12–24 months of the long-tail strategy (§9.1). The v1 win is not ranking — it is having a page worth ranking. |
| Pricing / free tier (§7) | Tarteel Alim ($0 pay-what-you-can); Quranly "I can't afford it" | **Good in v1, incomplete.** Free daily live coach is the beat; but v1 has no billing and no affordability path, so Premium is a "coming soon" promise. | v2: billing at/below Tarteel (§7) **plus** an explicit affordability path (Alim-style) — without it, the price beat is only a number. |
| Accessibility (§6.3) | Tarteel fails here (large-text breakage in reviews) | **Must be world-class in v1.** This is a named, tested beat with no model dependency. | 200%-text-scaling test + largest system font test on real phones in the §10 checks; feedback never by colour alone. |

---

## Appendix A — Content sourcing rules (apply to every hifz page)

- Quran text: Indo-Pak script via Quran.com API only. Never paste Quran text into
  the repo or generate it with AI.
- Translation default: Saheeh International (id 20); picker offers the 5 in
  `app/quran/lib.ts`. Name the translator on the page.
- Tafsir: Ibn Kathir Abridged (id 169) only in v1. Name it on the page.
- Virtues: hand-written, one source + grading per claim; weak narrations are
  labelled weak or omitted. No AI-generated virtues.
- Audio: reciters from `RECITERS` only; name the reciter wherever audio plays.
- No hadith is quoted without its collection + number. No fatwas anywhere on the
  hub. If a question needs a fatwa, link to the existing `/hadith` / `/blog`
  content or say "ask a qualified scholar".

## Appendix B — New files (complete list for v1)

```
docs/hifz-hub-spec.md            # this file
app/hifz/page.tsx                # hub landing
app/hifz/layout.tsx              # hub metadata wrapper
app/hifz/[slug]/page.tsx         # surah study page
app/hifz/[slug]/[ref]/page.tsx   # ayah page
app/hifz/juz-amma/page.tsx       # Juz 30 overview
app/hifz/juz/[n]/page.tsx        # juz overview (v1: 30 only)
app/hifz/plans/page.tsx          # all plans
app/hifz/my-progress/page.tsx    # dashboard + export/import
app/hifz/recite/page.tsx         # coach entry / picker
app/hifz/ayat-al-kursi/page.tsx  # special single-ayah page
app/hifz/surahs.ts               # slug table (source of truth)
app/hifz/plans.ts                # plan definitions
app/hifz/virtues.ts              # sourced virtues content
app/hifz/progress.ts             # localStorage schema + helpers (ili_hifz_v1)
app/hifz/components/SurahHero.tsx
app/hifz/components/AyahList.tsx
app/hifz/components/WordByWord.tsx
app/hifz/components/RecitationCoach.tsx   # dynamic import only; engine TBD (§8)
app/hifz/components/PlanCard.tsx
app/hifz/components/VirtuesBlock.tsx
app/hifz/components/ProgressWidget.tsx    # homepage + hub "continue" card
public/llms.txt
public/llms-full.txt
```

Modified in v1: `app/page.tsx` + `app/HomeClient.tsx` (hub homepage),
`app/components/Header.tsx` (add Hifz nav), `app/lib/toolsData.ts` (hub links),
`app/sitemap.xml/route.ts` (hifz URLs), `public/robots.txt` (llms.txt pointer),
`next.config.ts` (B1: `microphone=(self)`).

## Appendix C — Open questions for the owner (not blockers for v1)

1. Premium price: target at/below Tarteel's $12.99/mo — confirm $9.99/mo or $59/yr
   at v2, or a different price.
2. Is "Premium coming soon" messaging acceptable in v1, or should the free limits
   be unlabeled until billing exists?
3. Urdu UI in v2 — confirm it is the first non-English language.
4. Ramadan 2027 dates were not verified in the research — do not set a
   Ramadan launch date from this spec without checking the Hijri calendar.

---

## 13. Tarteel feature inventory — the full replication target (2026-11-21)

**Studied 21 November 2026** from tarteel.ai (fetched), the Google Play and App
Store listings, and the §11 competition study. The owner asked for an **exact
copy of Tarteel's feature set, including its AI, on the web — plus more**. This
section is the inventory that request is measured against. Features are copied;
Tarteel's name, logo, artwork and exact wording are **not** — our own branding,
name, design and wording throughout.

| # | Tarteel feature | What it is (evidence) | Our status on the web |
|---|---|---|---|
| 1 | Live Memorisation Mistake Detection (AI coach) | Hide verses, recite from memory; AI flags missed, added, changed words and incorrect tashkeel in real time; tap a mistake to see what you said vs the correct ayah (Play listing; tarteel.ai) | **SHIPPED.** Tilawa on-device coach (`RecitationCoach.tsx`): listen → hide → recite → word-by-word feedback, live correction tap, peek counted as a miss. Free daily (1 surah / 10 min, §3.3) — Tarteel paywalls it. Honest limit kept: word accuracy only, never tajweed; teacher disclaimer in the UI. |
| 2 | Memorisation Mode (hide & recite) | Hide the verses on the mushaf, recite from memory, words reveal as you say them (Play listing) | **SHIPPED.** Hide-Arabic toggle + word-by-word reveal in the coach; translation stays as a prompt. |
| 3 | Peeking / Hidden Verses Mode | Peek when stuck (Premium, Play listing) | **SHIPPED, stricter.** Peek button exists and the peek is **counted as a miss** for streak/accuracy — Tarteel's listing does not say peeking costs anything. |
| 4 | Voice Search ("Shazam for Quran") | Recite any phrase, find the specific ayah and surah (Play listing) | **SHIPPED 2026-11-21 (§15.2).** Browser speech recognition → text → Quran.com search via the `/api/quran` proxy; matches in the launch set open in the coach. Was "not in v1" (§12) — now shipped. |
| 5 | Test Mode | Drops you at random places in your memorised text, breaking cue-dependence (added Aug 2026, v5.81.1, release notes) | **SHIPPED 2026-11-21 (§15.1).** `/hifz/test`: random ayahs from memorised/learning pool, Arabic hidden, reveal = miss, self-mark records attempts like coach attempts. Was "not in v1" (§12) — now shipped. |
| 6 | Memorisation Planning | Tailor the journey to your learning style (tarteel.ai) | **SHIPPED.** 7-day plans per surah, 30-day plans, Juz Amma 90-day plan (`app/hifz/plans.ts`); plan completion is earned by coach verification, not claimed (§5.2). |
| 7 | Smart Goals | Custom targets for memorisation, revision, or reading (Play listing) | **SHIPPED 2026-11-21 (§15.8).** Separate daily goals per type — memorisation, revision, reading — each with its own target (1/3/5/10/20 ayahs) and progress ring on My Progress. Coach attempts auto-count toward memorisation, test questions toward revision; reading is logged by hand (no honest auto-detection from a page view). The combined minutes goal (§5.1) stays as well. |
| 8 | Streaks | Daily streak tracking (Play listing) | **SHIPPED.** Local streak, goal-met day advances it, missed day resets it, never faked (§5.1). |
| 9 | Advanced Analytics — heatmaps | Visualise progress with streaks and heatmaps (Play listing) | **SHIPPED 2026-11-21 (§15.3).** 12-week activity heatmap on My Progress, built from existing ayah records. Was "not in v1" (§12) — now shipped. |
| 10 | Advanced Analytics — per-surah strength | See which surahs are strong and which ayahs need more work (Play listing) | **SHIPPED 2026-11-21 (§15.3).** Per-surah strength bars on My Progress (memorised full weight, learning half). Was "not in v1" (§12) — now shipped. |
| 11 | Historical Mistakes / mistake log | Review a log of past recitation errors to identify patterns (Play listing) | **SHIPPED.** Mistake log on My Progress with ayah, word, heard-as, attempts, retry link; the full log is kept on this device (§5.1). Deliberate difference: we never store audio, so there is no playback of your own recording — a privacy trade, not a gap to close by storing recordings (§8.2). |
| 12 | Reciters / Unlimited Listening | Listen to favourite qaris, follow along or in the background, free (Play listing) | **SHIPPED.** Reciter picker on every surah/ayah page; play-all with repeat 1–100, range loop, pause between repeats, 0.25×–2× speed (§4.1.4, Quran.com parity). |
| 13 | Translations | Multiple translations (tarteel.ai / listing) | **SHIPPED.** Translation picker on surah pages; Saheeh International default; view modes Arabic / +translation / +tafsir. |
| 14 | Tafsir | Tafsir on ayah/surah pages (app feature) | **SHIPPED.** Ibn Kathir Abridged via Quran.com proxy; renders **only** in Tafsir view mode (commit 12a3449 — do not regress). |
| 15 | Word-by-word | Word-by-word text and audio (Quran.com parity, §12) | **SHIPPED.** Word-by-word panel per ayah with translation per word and per-word audio (`WordByWord.tsx`). Root/morphology on tap is still a v2 item (§12). |
| 16 | Adaptive Mushaf — Madani / Indo-Pak scripts | Choose Madani or Indo-Pak script; hide ayah markers (Play listing) | **SHIPPED 2026-11-21 (§15.7).** Script picker (Indo-Pak / Madani-Uthmani) on surah and ayah pages, persisted per device; the reader fetches both Quran.com fields (`text_indopak`, `text_uthmani`) so switching needs no refetch, and Madani renders in Amiri. Scoped cleanly: the coach, Test Mode and word-by-word stay Indo-Pak — the word alignment is built on it (Uthmani word breaks differ) — and the reader says so when Madani is selected. |
| 17 | Audio controls | Playback speed, repeat, looping (Quran.com parity, §12) | **SHIPPED.** See #12. |
| 18 | Progress tracking | Streaks, goals, per-surah progress (Play listing) | **SHIPPED.** My Progress dashboard + homepage continue widget + per-surah progress bars; export/import JSON (no account, §5.1). |
| 19 | Premium gating | Mistake detection, peeking, goals, analytics, history behind Premium; free trial; Family Plan; Alim $0 programme (tarteel.ai FAQ) | **DELIVERED DIFFERENTLY, deliberately.** Our free tier includes the live coach daily, goals, streaks and analytics — the things Tarteel paywalls. Premium ("coming soon") buys depth only: unlimited coach time, all 30-day plans, full mistake history (§3.3, §7). No billing exists yet; the free set is a promise and must never move behind a paywall later (§11.4 warning). Alim-style affordability path is a v2 item (§7, §12). |
| 20 | Challenges | In-app challenges / group challenges (app feature; Family Plan in FAQ) | **SHIPPED 2026-11-21 (§15.9).** Group challenges WITHOUT accounts (`/hifz/challenges`): create a challenge (surah, ayahs each, 7/14/30 days), share a code (`HIFZ-XXXX`) or a link that carries the challenge + member progress as a URL payload; opening a teammate's link merges their latest progress (newest update wins). Solo weekly challenge (§15.4) and 7-day plans stay as well. Honest limit: no live leaderboard — progress syncs through shared links, nothing is uploaded. |
| 21 | Revision mode / spaced repetition | Smart Goals cover revision; Test Mode breaks cue-dependence (listing; release notes) | **SHIPPED 2026-11-21 (§15.5).** Performance-driven revision queue on My Progress: learning ayahs due after 2 days, memorised after 7 days, oldest first. Was "not in v1" (§12) — now shipped. |
| 22 | Privacy | "Privacy First — does not sell your data" (Play listing); voice features need internet (listing) | **SHIPPED, stronger.** On-device processing, audio never leaves the device, no account, no ads on Hifz pages, no analytics event containing ayah text or mistake words (§5.1, §8.1.3). |
| 23 | Offline use | Reciter audio downloadable; AI needs internet (listing; help centre) | **SHIPPED 2026-11-21 (§15.10).** Service worker v3: Quran proxy responses cached 7 days, Hifz pages network-first with cache fallback, Tilawa model + ONNX WASM cached (MODEL_CACHE), and a "Save surahs for offline use" button on My Progress that warms the cache for every launch surah. After one online recitation (model download) the coach works in airplane mode. Airplane-mode test on a real device is still owed (browser verification) — the mechanism is shipped, the device test is not yet run. |
| 24 | Accessibility | Large-text breakage reported in reviews (§11.1) | **SHIPPED (static fixes) 2026-11-21 (§15.11).** The viewport no longer blocks scaling (`maximumScale`/`userScalable=false` removed), `text-size-adjust: 100%`, `overflow-x: clip` on html/body, and `max-width: 100%` on media and form controls; audit found no fixed-width overflow at 360px. A real-device 200% / 360px check is still owed (browser verification) — the fixes are in, the device test is not yet run. |

**Honest summary (updated 2026-11-21):** of Tarteel's feature set, everything
a web app can do without accounts is shipped — including Madani script (#16),
per-type goals (#7), social challenges without accounts (#20) and the offline
coach mechanism (#23). What remains is verification, not building: the
airplane-mode test and the 200%-text / 360px device test (#23, #24) still need
a real device/browser check, and group challenges sync through shared links
rather than a live server (#20).

## 14. Single-purpose refocus (2026-11-21) — the tools site is gone

**Owner verdict:** the Hifz hub worked, but every other tool was still there — it
was still a tools site with a Hifz section on top, not the dedicated Hifz app.
**Fix applied 2026-11-21:** the whole site is now the Tarteel-equivalent AI
Hifz app (§13) and nothing else.

### What was removed from the experience
- Homepage: prayer-times card + countdown, Dua of the Day, utilities grid,
  "More tools" / "All tools" section, "daily companion" positioning. The
  homepage is now: hero → coach entry card (first) → continue → how it works
  → featured surahs → plans → Test Mode + Voice Search → verse of the day
  (launch-set verses only, linking into the hub) → trust strip.
- Header nav: all tool links removed. Nav is now Home, Hifz, Recite, Test Mode,
  Voice Search, Plans, Juz Amma, My Progress.
- Footer: all three tool columns removed. Footer is now Hifz links, start-here
  surah links, and legal links (Privacy, Terms) only.
- Metadata/JSON-LD: site title, description, keywords, WebApplication
  featureList rewritten Hifz-only in `app/layout.tsx` and `app/page.tsx`.
- Sitemap: tool, blog, about/contact/faq/install and legal URLs removed —
  homepage + Hifz URLs only.
- PWA manifest: name, description, shortcuts rewritten Hifz-only.
- Service worker + offline page: tool routes and tool links removed; Hifz
  routes only.
- PWA provider + install prompt: per-tool offline status/messages replaced
  with Hifz routes and one Hifz install message.
- llms.txt / llms-full.txt: "Other tools" sections removed; Test Mode and
  Voice Search added to the Hifz index.
- Privacy / Terms: rewritten Hifz-only (coach, local progress, Quran.com API,
  browser speech recognition; tajweed disclaimer in Terms §3).
- Hifz pages: the four "Read in the full Quran reader" links to `/quran`
  retargeted inside the hub (first ayah, Juz Amma, Test Mode).

### Redirects (permanent, 308, `next.config.ts`)
Every retired route redirects to `/hifz` — base and all subpaths:
about, blog, compare-religions, contact, dhikr, dua, dua-for-this-moment, eid,
eid-adha, faq, hadith, hajj, halal-finance, hijri, inheritance, install,
kaffarah, mizan, names, names-finder, night, prayer-times, qibla, quran,
ramadan, sadaqah, travel, zakat.
**Not redirected:** `/` (homepage), `/hifz` and everything under it, `/api/*`
(the `/api/quran` proxy the Hifz pages rely on), `/privacy`, `/terms` (kept
live, linked only from the footer).

### What was deliberately NOT deleted
The old route folders stay in the repo. `app/quran/lib.ts` is shared by the
Hifz pages (reciters, translations, API helpers, Indo-Pak cleaning) — deleting
the folder would break the build. Redirects run before routing, so no old tool
URL can ever be served. `app/lib/toolsData.ts` and `app/lib/prayer.ts` are now
unused by live pages (only the retired folders import them); they are left in
place rather than risking a shared-import break for tidiness.

### Coach front-and-centre (final direction, 2026-11-21)
The Tilawa on-device coach is the centre of the product, not an add-on: it is
the first thing on the homepage (hero CTA + coach entry card first in
`HomeClient`), the first section of every surah page (`SurahClient`), and
scoped into every ayah page (`AyahClient`). Flow end-to-end: pick → listen →
hide → recite → feedback → mistake log → retry. Accuracy limits unchanged:
word accuracy only, never tajweed, teacher disclaimer in the UI (§8).

## 15. Advanced extras — beyond Tarteel (shipped 2026-11-21)

These are the features that make the app clearly better than Tarteel, not just
equal. All are free (Tarteel paywalls the equivalents) and all run on data the
app already stores — no new collection, no account.

### 15.1 Test Mode — exam-style recall test (`/hifz/test`)
Tarteel added Test Mode in Aug 2026; ours matches it and is stricter. Random
ayahs from your memorised pool first (then learning, then new ayahs so a new
user can still test), Arabic hidden, no cue except surah + ayah number.
Reveal counts as a miss, like a peek. Self-marked attempts are recorded
exactly like coach attempts (3 consecutive correct = memorised, §5.1) and each
question counts a minute toward the daily goal. Score screen grades the test
and links every missed ayah back into the coach. Scope (memorised / practised /
any) and length (5 / 10) are the user's choice.

### 15.2 Voice Search — "Shazam for Quran" (`/hifz/voice-search`)
Tarteel's voice search, on the web. The browser's speech recognition (Web
Speech API, `ar-SA`) transcribes the spoken phrase on the device; only the
recognised text is sent to the Quran.com search endpoint through the existing
`/api/quran` proxy. A typed search box is the fallback where the browser has
no speech recognition. Matches in the launch set open straight into the coach
for that ayah; matches outside the launch set show the verse with an honest
note instead of a dead link.

### 15.3 Mistake heatmaps + per-surah strength (My Progress)
Tarteel paywalls analytics; ours are free. A 12-week activity heatmap (one
square per day, darker = more ayahs practised) built only from the ayah
records' `lastPractised` stamps, so it works on progress saved before the
feature existed. Per-surah strength: memorised ayahs count fully, learning
ayahs count half, as a percentage of the surah — with memorised/learning bars
per surah. Pure functions in `app/hifz/progress.ts` (`activityByDate`,
`surahStrength`); no new data collected.

### 15.4 Weekly challenge (My Progress)
The solo answer to Tarteel's challenges, without accounts: "Practise on 5 days
this week", tracked from real practice dates (`weekPracticeDays`,
Monday–Sunday). Social/group challenges still need accounts (v3) and are not
claimed.

### 15.5 Spaced-revision queue (My Progress)
Performance-driven revision scheduling — the thing §12 said v2 would add. A
learning ayah is due after 2 days without practice, a memorised ayah after 7
days; oldest first, linked straight into the coach (`revisionDue` in
`app/hifz/progress.ts`). Review days stop being calendar-fixed and become
performance-driven, which is the beat over Quran.com's plans too (§11.2).

### 15.7 Madani (Uthmani) script (`/hifz/[slug]`, ayah pages)
A script picker in the reading controls: Indo-Pak (default) or Madani
(Uthmani). The reader fetches both Quran.com v4 fields on every request
(`fields=text_indopak,text_uthmani`, via the existing `/api/quran` proxy —
no proxy change was needed, both fields pass through), so switching scripts
is instant with no refetch. Madani text renders in Amiri; Indo-Pak keeps
Scheherazade New. The choice persists per device (`hifz_script_v1`).
Scoped decision, documented in `app/hifz/lib/script.ts`: the coach, Test
Mode and word-by-word stay Indo-Pak, because the word alignment
(`splitWords`) and the Tilawa tracker's word positions are built on the
Indo-Pak text and Uthmani word breaks differ — aligning against Uthmani
would mis-mark words. The reader shows a one-line note when Madani is
selected so the split is visible, never silent.

### 15.8 Per-type daily goals (My Progress)
Separate daily goals for memorisation, revision and reading — each with its
own target (1/3/5/10/20 ayahs) and its own progress ring. Stored in the
progress document (`typeGoals`, optional so older saves still load; counts
reset every local day). Auto-counted: coach attempts → memorisation, test
questions → revision. Reading is logged by hand (+1 / +5 buttons) — there is
no honest way to auto-detect "I read this ayah" from a page view, and the UI
says so. Pure helpers in `app/hifz/progress.ts` (`getTypeGoals`,
`recordTypeActivity`, `setTypeGoalTarget`); the combined minutes goal (§5.1)
is unchanged.

### 15.9 Group challenges without accounts (`/hifz/challenges`)
Create a challenge — name, surah, ayahs each (5/10/20/30), length (7/14/30
days) — and get a code (`HIFZ-XXXX`) plus a share link. The link carries the
whole challenge (surah, target, members and their progress) as a URL-safe
base64 payload (`?join=CODE&c=...`); opening it joins the challenge on that
device, and opening a teammate's link back merges their latest progress
(per member, newest update wins). A bare code can also be joined by hand
with the agreed surah/target/length. All state is localStorage
(`hifz_challenges_v1`); nothing is uploaded anywhere, and the page says so.
Honest limit: this is sync-through-shared-links, not a live leaderboard —
progress only updates when someone shares their link. Linked from the
header, hub, sitemap (0.3) and manifest shortcuts.

### 15.10 Offline coach (service worker v3 + My Progress)
The service worker (`public/sw.js`, v3.0.0) now caches the coach model path:
a MODEL_CACHE for Tilawa model files (tilawa.dev) and ONNX WASM/CDN files
(cache-first), the Quran proxy for 7 days (text never changes), and all Hifz
pages network-first with cache fallback. My Progress has a "Save surahs for
offline use" button that fetches every launch surah's text plus the main
pages, warming the cache, and reports how many saved; it also shows whether
the service worker is actually controlling the page. After one online
recitation (which downloads the ~25–68 MB model) the coach works in
airplane mode. Voice Search still needs the network (browser speech
recognition). The airplane-mode test on a real device is still owed.

### 15.11 200% text-size and 360px layout (static fixes)
The viewport no longer blocks scaling: `maximumScale: 1` and
`userScalable: false` were removed from the root layout (they also broke
accessibility for low-vision users). `text-size-adjust: 100%`,
`overflow-x: clip` on html/body (clip, not hidden, so the sticky header
keeps working), and `max-width: 100%` on media and form controls. A static
audit found no fixed-width overflow at 360px (the only wide element, the
hero image, is hidden below `lg`). A real-device check at 200% text and
360px width is still owed — the fixes are in, the device test is not run.

### 15.12 What is deliberately NOT claimed as "beyond Tarteel"
- No tajweed feedback (nobody in the category does this reliably, §11.1; we
  say so in the UI instead of faking it).
- No recording playback (we never store audio — a privacy trade, §8.2).
- No live cross-device sync or leaderboards (needs accounts, v3) — group
  challenges sync through shared links instead (§15.9), which is the
  account-free substitute, not a live sync.

## 16. Rebrand to Hifz + Tarteel-simple UI (2026-11-21)

### 16.1 Rebrand
The site is now **Hifz**, tagline "Memorise the Quran with AI". "I Love
Islam" was removed from every served surface: page titles, root metadata,
JSON-LD, header, footer, homepage copy, manifest (`name: "Hifz —
Memorise the Quran with AI"`), llms.txt / llms-full.txt, sitemap,
Privacy/Terms, og tags and the offline page. The domain stays
iloveislam.life (URLs, canonicals and the contact email keep the domain);
the old-brand social handles were dropped from JSON-LD. New mark, same
palette (emerald #0B3D2E + gold #C9A227): an emerald rounded square, a gold
eight-point star, a white open book — generated by
`tools/generate-hifz-brand.py` and wired as favicon.ico, favicon.png,
apple-touch-icon, PWA icons 192/512, og-image (1200×630) and the header
logo, including the `/optimized/*.webp` copies. Old localStorage keys
(`ili_hifz_*`) were deliberately NOT renamed — renaming would have wiped
existing users' progress; they are invisible to users. Old progress
exports (`kind: iloveislam-hifz-export`) still import.

### 16.2 UI simplification — Tarteel's structure, our branding
tarteel.ai itself is a client-side app and would not render as text when
fetched, so the simplification follows the Tarteel structure already
documented in §11/§13 (minimal navigation, one primary action per screen,
big Arabic, generous whitespace, everything else one tap away) rather than
a pixel copy — and copies none of Tarteel's logo, name, artwork or wording.
What changed: the homepage is now a slim hero with one primary CTA, the
coach entry card, Continue, one searchable surah list and one slim
verse-of-the-day card (the How-it-works grid, featured-surah cards, plans
strip, Test/Voice Search cards and trust strip are gone from the page —
all reachable from the hub/header). The hub is the same shape: compact
header, Continue, the shared surah list (`SurahList.tsx`, one row per
surah with search + progress + Recite), and a single "More" link list.
The header has five links (Surahs, Recite, Test, Challenges, My Progress).
Max content width on home/hub is now `max-w-3xl`, matching Tarteel's
single-column reading feel.

## 17. Site name reverted to "I Love Islam" (2026-11-21)

Mehran does not want to pay for a new domain, so the site stays at
iloveislam.life and the site name goes back to **I Love Islam**. The
Hifz app inside is unchanged — same Tarteel-simple UI, same AI coach,
same features. This supersedes §16.1's name removal only; the new brand
mark (emerald rounded square + gold eight-point star + white open book)
stays as the favicon, PWA icons, og image and header logo, and the UI
simplification in §16.2 stays.

What changed: site title is now "I Love Islam — Memorise the Quran
with AI" (root metadata, homepage metadata, manifest `name` /
`short_name`, llms.txt / llms-full.txt, sitemap-adjacent surfaces).
The header and footer show "I Love Islam" with the new mark; the footer
reads "© 2026 I Love Islam. Memorise the Quran with AI." Every page
title suffix is now "| I Love Islam"; every `siteName` and every
JSON-LD WebSite/Organization/author/publisher name is "I Love Islam"
(including the surah/ayah JSON-LD in `app/hifz/lib/fetch.ts`). Privacy
and Terms name "I Love Islam" as the site operator. The offline page
title and the push-notification default title are "I Love Islam".

What did NOT change: "Hifz" remains the name of the app/product inside
the site — "Hifz Hub", "My Hifz Progress", "Hifz Plans", "Hifz is a
free AI companion for memorising the Quran", the coach, the /hifz
routes, the breadcrumb label "Hifz" for the hub, and the localStorage
keys (`ili_hifz_*`, deliberately not renamed so existing users keep
their progress). No domain was bought and no DNS or Vercel domain
setting was changed; the domain stays iloveislam.life.

## 18. Phase 2 — full Quran + better AI (2026-11-21)

Mehran: the AI is not good enough, the app is still not exactly like
Tarteel, and it only has some surahs and opens on Al-Mulk while Tarteel
has the whole Quran. Phase 2: (1) deep Tarteel study, (2) full Quran,
(3) better coach accuracy.

### 18.1 Full Quran

The 43-surah launch set is gone. The app now contains the complete
Quran: **all 114 surahs, all 30 juz, all 6,236 ayahs**, browsable by
surah and by juz. The app no longer starts from Surah Al-Mulk: homepage
and hub hero CTAs point at `/hifz/recite` and the whole-Quran browser;
the homepage coach default is Al-Fatihah.

- `app/hifz/surahs.ts`: all 114 surahs from the live Quran.com
  chapters API (6,236 ayahs). Launch-set slugs/names/meanings
  preserved exactly (generator `tools/gen_full_quran.py`).
  Renamed: `LAUNCH_SURAHS` → `ALL_SURAHS`,
  `LAUNCH_SURAHS_BY_SLUG` → `ALL_SURAHS_BY_SLUG`,
  `LaunchSurah` → `HifzSurah`, `NAMED_LAUNCH_SURAHS` →
  `FEATURED_SURAHS`, `LAUNCH_AYAH_COUNT` → `TOTAL_AYAH_COUNT`.
- `app/hifz/juz.ts` (new): all 30 juz with per-surah ayah segments
  (135 segments) from the live Quran.com juz API.
- `app/hifz/juz/[n]/page.tsx`: real juz overview pages 1–29; juz 30
  still redirects to `/hifz/juz-amma`.
- `app/hifz/[slug]/[ref]/page.tsx`: `generateStaticParams` over all
  6,236 ayahs; Al-Baqarah special-casing and the Ayat al-Kursi extra
  param removed — 2:255 is now a normal ayah page with prev/next.
- `app/hifz/plans.ts`: 7-day/30-day per-surah plans are now GENERATED
  at runtime from the ayah count (same algorithm as the old static
  tables — verified byte-identical for all 43 launch surahs × both
  lengths, `tools/verify_plans.mjs`). Juz Amma 90-day plan unchanged.
- Sitemap: 6,387 URLs (114 surah + 6,236 ayah + 30 juz + 7 hub/static
  pages; verified live). Interactive tool pages (/hifz/recite,
  /hifz/test, /hifz/voice-search) are noindex by their own metadata
  and are deliberately not listed.
- Voice Search, Test Mode, challenges, plans, progress and the
  offline save all work over the whole Quran now (launch-set gates
  removed); `llms.txt` / `llms-full.txt` regenerated (6,412 lines,
  6,386 hifz links).
- Build: 6,425/6,425 static pages, green, no 429s. Commit `822bbc1`.

### 18.2 Tarteel deep study (2026-11-21)

Full report: `~/workspace/research_notes/tarteel-deep-study-20261121/report.md`
(48-row gap table). Headline findings:

- Scale: 20M+ downloads claimed, 4.7 stars (App Store ~11K ratings;
  Play ~115–124K reviews), ~12-person team, CTO on the TIME100 AI
  list 2026.
- Pricing — verified, and it differs by channel: web Premium is
  **$7.50/mo billed annually** (~$90/yr), Family $13/mo billed
  annually (5 accounts); App Store in-app prices are $12.99–$19.99/mo
  and $99–$239.99/yr. The $12.99/mo / $99/yr figures used earlier are
  the *store* prices, not the web prices. Free tier: unlimited
  follow-along, Voice Search, Testing Mode with a daily limit, 152
  translations (76 languages), 45 tafsirs (20 languages), 16
  recitations from 13 reciters, 1 goal. Premium adds mistake
  detection, unlimited Testing Mode, peeking, mistake history /
  frequency / playback, advanced analytics, unlimited goals,
  word-by-word listening highlight and mutashabihat colouring.
- Biggest structural fact: Tarteel is phone/tablet only — its Help
  Centre states it has **no desktop or web-browser version for
  recitation**, and a web version is the most-voted feature request
  since 2022. A web app with live mic coaching is already a place we
  beat it.
- AI limits, documented by Tarteel itself: word-level only,
  Hafs-from-Asim only, **no tajweed detection at all** (roadmap only),
  known weak spot on long madd (esp. madd lazim, 6 counts), plus
  false positives/negatives from noise and Bluetooth/car mics.
  Mistakes show red + dotted underline; tap to see what you said vs
  the correct ayah; wrongly detected mistakes can be removed. No
  public accuracy % exists.
- Testing Mode is the most fully documented mode: random-start
  "sheikh test" question cards (green/red on completion, swipe to
  skip, eye icon hides surah/verse, three reveal options,
  duration/question-length settings on Premium).
- New (Nov 2026): Quran League — time-boxed, goal-led, points-based
  competition with prizes and scholar-led teams, running up to
  Ramadan 1448 — distinct from the older Groups/leaderboards (reset
  each Islamic month, ranked by reading hours + khatms).
- Users' top complaints (our openings): false positives/negatives
  ("recited Fatiha correctly, still flagged wrong"), freezing/getting
  stuck on one ayah and switching off for "inactivity", no
  tajweed/teacher, Premium paywall for mistake detection, no web
  version, poor iPad support (no landscape, mic fails), listening-mode
  position resets, faint audio, failed translation downloads, and
  large-text accessibility overlap.
- Gap table (48 rows): Match 4 · Partial 20 · Missing 0 · Beats
  Tarteel 3 · Unknown 21. Zero clean "Missing" is honest, not a
  dodge: the real gap is **depth and coverage** — full Quran (done in
  §18.1), counts behind translations/tafsirs/reciters, Testing Mode
  details, peeking, mistake playback/frequency, and social/challenge
  depth. The 3 "Beats Tarteel" rows to protect: web recitation with
  live mic, genuinely offline coach, spaced-revision queue. The 21
  unknowns need an in-app check (no live browser/account was used
  for the study); see the report's verify-in-app checklist before
  claiming any of them as matched or missing.

### 18.3 Coach accuracy — false-flag rate 6.9%/9.4% → 0.0%

Measured with `tools/test-tilawa.mjs` (clean professional recitation,
Mishary Alafasy audio, same harness before and after):

| Case | Before (lite) | After (lite) | After (full) |
|---|---|---|---|
| Al-Fatihah 1:1–7 (29 words) | 6.9% (2/29) | **0.0% (0/29)** | 0.0% (0/29) |
| Al-Mulk 67:1–5 (64 words) | 9.4% (6/64) | **0.0% (0/64)** | 0.0% (0/64) |
| Warm-up: 1:1 + 1.5 s silence | 25.0% (1/4) | **0.0% (0/4)** | 0.0% (0/4) |
| Single ayah 1:1 alone | 25.0% (1/4) | **0.0% (0/4)** | 0.0% (0/4) |
| Wrong ayah (detection) | intact | intact | intact |
| Silence (detection) | intact | intact | intact |

Root cause (found with `tools/tilawa-diag.mjs`, a position-event
dump): the **checker confirms nothing** on clean recitation — every
false flag was a word the tracker never observed. The full 68 MB
model scores **identically** to the 25 MB lite model on every case
(same words, same event counts) and is slower (0.11–0.14× real-time
vs 0.08–0.10× lite), so the model tier was never the problem and
**lite stays the default** (coach now requests `tier: 'lite'`
explicitly instead of `auto`, which picked full on capable devices).

Three systematic tracker blind spots, fixed in
`app/hifz/lib/tilawa.ts` `buildResult()` as graces — a graced word is
"not reached yet" (neutral, never in the mistake log, never blocks
the 3-in-a-row memorised rule), never "missed"; a checker-CONFIRMED
flag still beats every grace:

- (A) TAKE-START: the tracker spends the first ~1–3 s in `ambiguous`
  state, emitting positions for WRONG passages (7:54:29, 25:1:2)
  before locking. Boundary: first LOCKED observation when the take
  locks; first OBSERVED word when it never locks (single short ayahs
  never reach `locked` — they track in `ambiguous` at conf ~0.5 for
  the whole take).
- (B) AYAH-BOUNDARY JUMP: the tracker sometimes jumps from an ayah's
  penultimate word straight to the next ayah's first word, skipping
  the boundary word (67:2:12 ٱلْغَفُورُ). A last word of an ayah whose
  next ayah's first word WAS observed is graced.
- (C) SANDWICH: a word between two tracked neighbours is routinely
  merged with them (مِن; ٱللَّهِ inside the Basmala, which runs
  together as "bismillah"). Limited to 1–2 letter particles when the
  take locked; any sandwiched word when it never locked.

Failure mode is safe by construction: a grace can only downgrade
"missed" to "not reached yet" — it can never manufacture "correct",
and a genuinely skipped word still shows as not-reached and still
does not count toward memorised. The harness mirrors the shipped
logic exactly (its `scoreTake` implements the same graces), so the
measured rate IS the shipped rate. The `unclear` gate is unchanged.

---

## 19. Everything free — no Premium tier (2026-11-21)

Mehran: why is there Free and Premium? Everything must be free — the
audience must never pay for anything. The Free vs Premium split is gone,
in full. §3.3 and §7 above are rewritten to record this; the old tables
are retired and must not be reintroduced.

What changed in the code:

- Coach caps removed: the 1 surah/day and 10 minutes/day limits are gone
  (`app/hifz/components/RecitationCoach.tsx` — `checkFreeLimit`,
  `recordFreeUsage`, the `limitHit` alerts and the `FREE_*` constants
  deleted; whole-surah review mode is now free like every other scope).
  Unlimited coach use, any surah, any time.
- All plans free: 7-day, 30-day and Juz Amma 90-day plans, with no badge
  or gate (`PlanCard` `premium` prop removed; `app/hifz/plans.ts`).
- Mistake log kept in full: the 7-day retention is gone
  (`app/hifz/progress.ts` — `FREE_MISTAKE_LOG_DAYS`, the `freeUsage`
  settings field and the `trimMistakes` trimming removed; `saveMistakes`
  and `addMistake` no longer trim).
- Every "Premium" mention removed from the site: the "Premium — coming
  soon" section (`PremiumSection` deleted from `HifzShared.tsx` and all
  seven pages that used it), the `#premium` anchor, "See Premium" links,
  "free tier" wording, and the "free during testing" copy. The site shows
  no Free vs Premium split anywhere. (The word "premiums" still appears
  once in the retired halal-finance quiz — insurance premiums, not a tier —
  and that route redirects to `/hifz`.)
- "Free" as a word still appears where it states the truth (the whole app
  is free) — only the tier split is gone.

Also in this change: the recite entry (`/hifz/recite`) and the
group-challenge create/join forms no longer default to Surah Al-Mulk —
they default to Al-Fatihah, so the app never starts from Al-Mulk (the
homepage/hub hero CTAs already pointed at `/hifz/recite`; the remaining
Al-Mulk links are the surah-list row, a nav pill, and the footer
"Start Here" shortcut, as specified).

## 20. SEO + Google AdSense readiness (2026-11-21)

Audit found the site's SEO was already strong (unique titles/descriptions,
canonicals, OG/Twitter, JSON-LD, robots.txt, 6,387-URL sitemap, 0 images
without alt, 123 internal links on the homepage) with four real defects,
all fixed in this change:

1. **Surah names were wrong in titles/H1s.** The launch-set data stored the
   English meaning as `name` and the ayah count as `meaning` for 43 surahs
   (Al-Mulk was "The Sovereignty" / "30"), so those surah pages ranked for
   nothing anyone searches for. Fixed at the source: `tools/gen_full_quran.py`
   now takes name/meaning from Quran.com `name_simple` / `translated_name`
   for all 114 surahs (slugs preserved, URLs unchanged) and was re-run;
   `juz.ts` regenerated byte-identical. Titles are now
   "Surah Al-Mulk (The Sovereignty) — Read, Listen & Memorise", H1s
   "Surah Al-Mulk", subtitles show the real meaning, and the surah list
   shows name + meaning and searches both.
2. **Broken SearchAction JSON-LD.** The site-wide WebSite block pointed at
   `/search`, which 404s, and the homepage carried a second WebSite block
   pointing at `/?q=`. Both removed; one WebSite/Organization/WebApplication
   block remains in `app/layout.tsx`.
3. **Meta descriptions too long.** Homepage description was 205 chars and
   the layout description ~270 chars; both shortened to ~140–155 chars.
4. **Missing trust pages.** `/about` and `/contact` were 308-redirected to
   `/hifz` (retired with the tools). Both are live again, rewritten for the
   Hifz app, linked in the footer, and in the sitemap — AdSense reviewers
   look for About, Contact, Privacy and Terms. Privacy and Terms are also
   in the sitemap now.

AdSense readiness, checked against the program policies:
- `public/ads.txt` already carries the owner's publisher ID
  (`pub-2264561932019289`) and the AdSense script client matches it.
- Privacy Policy already carries the required disclosure (Google AdSense,
  cookies for ads based on prior visits, opt-out via Google Ad Settings).
- Consent: `CMPConsent` used to silently write `granted` and load the
  AdSense script + Google Analytics without asking. It now shows a small
  bottom banner (Accept / Decline); scripts load only after Accept, and
  the app works fully either way. No ad units are placed yet — the user
  adds them after approval; no AdSense script was added by this change
  beyond the existing consent-gated loader.
- No policy violations: all content is original app content plus Quran
  text/translation/tafsir sourced from Quran.com; no copyrighted material,
  no misleading claims (coach: word accuracy only, never tajweed, teacher
  disclaimer in the UI), clear navigation, HTTPS, mobile viewport, no
  interstitials (the PWA install prompt is disabled).
- Honest risks that code cannot remove: (a) 6,236 ayah pages share one
  template — each carries unique Quran text + translation + word-by-word,
  which is real unique content, but Google indexes programmatic pages
  slowly and may treat some as thin; (b) the site is new as a Hifz app
  (refocused 2026-11-21) with near-zero authority — ranking takes months;
  (c) approval itself needs the owner's AdSense account — not applied for
  here. Steps to apply: sign in to adsense.google.com with the account
  that owns pub-2264561932019289, add iloveislam.life if not already
  added, request review, and wait for Google's email. Search Console
  sitemap resubmission (now ~6,995 URLs) is still owed and needs the
  property-owner Google account (mehrankhan212257@gmail.com).

## 21. Mushaf reading mode (2026-11-21)

Whole-read mode like the printed Quran, requested by the owner: when
someone reads a surah or a juz it should look like the hard-copy mushaf,
not the verse-list view. The normal reader is untouched — Mushaf is an
additional mode.

- Route `/hifz/mushaf/[page]`, pages 1–604 (Madani mushaf), all statically
  generated. Data: Quran.com `verses/by_page` through the existing data
  path — server components fetch the upstream API directly (the repo's
  documented pattern; `verses/by_page` is also whitelisted in the
  `/api/quran` proxy for client use). No new data source.
- Rendering (`app/hifz/components/MushafPageView.tsx`): words grouped by
  `line_number`; ornamental surah header (Arabic name, number, meaning,
  ayah count, revelation) + Bismillah dropped into the empty-line gap
  where a surah starts (verified: page 2 lines 1–2 empty for Al-Baqarah;
  page 564 lines 6–7 empty for Al-Qalam); ayah-end markers as the numeral
  in a gold ring; juz markers when a juz starts; full lines justified,
  short lines centred; Uthmani text in Amiri (`.font-quran-madani`).
  Bismillah is skipped for Surah 1 (it is the first ayah) and Surah 9.
- Mapping (`app/hifz/mushaf.ts`, generated by `tools/gen_mushaf.py` from
  the live chapters API `pages` ranges + each juz's first verse page):
  surah → first/last mushaf page, juz → first page (1, 22, 42, 62, 82,
  102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362,
  382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582 — the standard
  Madani juz starts).
- Navigation: previous/next page, "Page X of 604", jump-to-page box
  (`MushafNav` client island). "Read as Mushaf" buttons on every surah
  page (→ the surah's first mushaf page) and every juz page, plus a
  footer link. Each mushaf page links back to the surahs on it
  (study view + coach).
- SEO: unique title/description per mushaf page, canonical, OG,
  BreadcrumbList JSON-LD; all 604 pages in the sitemap (priority 0.5).
  Sitemap total is now ~6,995 URLs.
