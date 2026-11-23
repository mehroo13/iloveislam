// app/hifz/components/MushafPageView.tsx — one Madani mushaf page in the
// single-page view (route /hifz/mushaf/[page]).
//
// The page itself renders in MushafPageFrame (shared with the continuous
// reader); this component owns the single-page chrome around it: the
// memorise / script / topic / zoom controls and the scaled-page viewport
// (fixed 970px design width, CSS `zoom` to fit — see the scaled-page note
// below). For the full continuous reader, use /hifz/mushaf.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSurahById, type HifzSurah } from '../surahs';
import { JUZ_FIRST_PAGE, MUSHAF_TOTAL_PAGES } from '../mushaf';
import { type MushafVerse } from '../lib/fetch';
import { SCRIPT_LABELS, useScriptPref } from '../lib/script';
import { TOPICS } from '../topics';
import { loadMistakes, loadProgress, saveProgress, markAttempt, loadSettings, saveSettings } from '../progress';
import { loadBookmarks, saveBookmarks } from '../lib/bookmarks';
import { normalizeArabic } from '../lib/alignment';
import { MODE_EVENT, ayahKeyForRevealedWord, lastReadSlug, requestMode, saveMode, type HifzMode } from '../lib/mode';
import MushafPageFrame, { MUSHAF_PAGE_WIDTH } from './MushafPageFrame';
import { MushafTopBar, MushafBottomBar, ReaderSheet, PracticeModeList } from './MushafReader';
import SurahList from './SurahList';
import { useT } from '../lib/i18n';

/** Missed this many times in total before a word counts as a weak word. */
const FREQUENT_MISTAKE_MIN_ATTEMPTS = 2;
/** Zoom limits for the scaled page (multiplier on top of the fit scale). */
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export default function MushafPageView({
  page,
  verses,
  hideInitial = false,
}: {
  page: number;
  verses: MushafVerse[];
  /** Start with the words hidden (from ?memorize=1). */
  hideInitial?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [script, setScript] = useScriptPref();
  // Tarteel-clean chrome: chapter sheet + reader settings sheet.
  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Tajweed colours (display only): the existing "Show Tajweed colours"
  // setting, previously applied only on the surah reader — now also here.
  const [tajweedOn, setTajweedOn] = useState(false);
  const toggleTajweed = useCallback(() => {
    setTajweedOn((prev) => {
      const next = !prev;
      try {
        saveSettings({ ...loadSettings(), tajweedColors: next });
      } catch {
        /* storage unavailable — the toggle still applies this session */
      }
      return next;
    });
  }, []);
  // Bookmark this page (shared list with the continuous reader and the
  // bookmarks page).
  const [pageBookmarked, setPageBookmarked] = useState(false);
  useEffect(() => {
    try {
      setPageBookmarked(loadBookmarks().some((b) => b.kind === 'page' && b.page === page));
    } catch {
      setPageBookmarked(false);
    }
  }, [page]);
  const togglePageBookmark = useCallback(() => {
    try {
      const list = loadBookmarks();
      const exists = list.some((b) => b.kind === 'page' && b.page === page);
      const next = exists
        ? list.filter((b) => !(b.kind === 'page' && b.page === page))
        : [...list, { kind: 'page' as const, page, addedAt: Date.now() }];
      saveBookmarks(next);
      setPageBookmarked(!exists);
    } catch {
      /* storage unavailable — the button just doesn't persist */
    }
  }, [page]);
  // Practice-mode selection from the chapter sheet / mic button — the
  // single-page replacement for the hidden global ModeSwitcher pill.
  // Memorise / Reading are applied in place (listener below); anything
  // else navigates exactly as the switcher did.
  const selectPracticeMode = useCallback(
    (m: HifzMode) => {
      setNavOpen(false);
      if (requestMode(m)) return;
      if (m === 'test') {
        router.push('/hifz/test');
        return;
      }
      if (m === 'reading') return; // already reading, handled in place
      router.push(`/hifz/${lastReadSlug()}?mode=${m}`);
    },
    [router],
  );
  // Memorisation mode (§22, screenshot 4): words hidden as thin grey rules,
  // revealed word-by-word by peeking. ?memorize=1 opens the page hidden.
  const [hideVerses, setHideVerses] = useState(hideInitial);
  const [revealedCount, setRevealedCount] = useState(0);
  const [peekCount, setPeekCount] = useState(0);
  // Colour-code the mushaf by ayah topic (study aid, §23). Default on.
  const [topicColors, setTopicColors] = useState(true);
  // Mistake-history marking (Tarteel row 17, §5.1): words the user has
  // missed repeatedly show in a stronger colour — red + dotted underline,
  // the same marking the coach uses for a wrong word — and stay visible
  // as red rules while verses are hidden. "Frequent" = missed 2+ times
  // in total (addMistake merges same-day repeats into `attempts`, so the
  // count is the sum of attempts across log entries for that word). One
  // lone miss is not marked: a single flag can be a false positive, and
  // Tarteel's own docs admit false positives happen. The marking is
  // keyed "surah:ayah:normalised-word" — normalisation (diacritics,
  // alef variants, Indo-Pak letters stripped the same way on both sides)
  // is what lets a coach-logged word match the mushaf word, which may
  // carry merged pause marks or be in the other script. Gated by the
  // existing "Highlight mistake history" setting (default on); when it
  // is off there is no marking and no legend.
  const [frequentMistakes, setFrequentMistakes] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [mistakeMarkingOn, setMistakeMarkingOn] = useState(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ili_hifz_settings_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as { highlightMistakes?: boolean };
        if (parsed.highlightMistakes === false) {
          setMistakeMarkingOn(false);
          return;
        }
      }
      const counts = new Map<string, number>();
      for (const m of loadMistakes()) {
        const word = normalizeArabic(m.expected || m.word || '');
        if (!word || typeof m.surah !== 'number' || typeof m.ayah !== 'number') continue;
        const key = `${m.surah}:${m.ayah}:${word}`;
        counts.set(key, (counts.get(key) ?? 0) + Math.max(1, m.attempts || 1));
      }
      const frequent = new Set<string>();
      for (const [key, total] of counts) {
        if (total >= FREQUENT_MISTAKE_MIN_ATTEMPTS) frequent.add(key);
      }
      setFrequentMistakes(frequent);
    } catch {
      // Storage unreadable: no marking, the page still renders.
    }
  }, []);

  const [weakOnPage, setWeakOnPage] = useState(0);
  const [compactText, setCompactText] = useState(false);

  // --- Scaled-page rendering (mobile mushaf fix, 2026-11-22) ---
  // WHY: every mushaf line is one <p> at a fixed ~33px font. On a phone
  // the frame is ~300px wide, so a ~650px-wide line wraps onto two visual
  // lines and the kashida filler centres the fragments — the "two centred
  // parts" Mehran saw. Shrinking the font or re-flowing the text cannot
  // fix that without breaking the Madani line breaks, so the page is
  // rendered once at MUSHAF_PAGE_WIDTH (the width it already has on
  // desktop, where the layout is verified) and scaled as a whole to fit
  // the screen. Scaling never re-flows text: line breaks, word order and
  // glyph shaping are identical at every width, and zooming only changes
  // the scale, never the layout.
  // WHY CSS `zoom`, NOT `transform: scale()`: both paint the same, but
  // transform leaves the layout box unscaled, which breaks two things
  // that were caught in headless verification (2026-11-22): (1) with
  // transform-origin centre the scaled page sits centred in its 970px
  // layout box, so at fit zoom the whole frame renders off-screen right
  // of the 308px window — the frame looked completely empty; (2) the
  // scroll container's scrollWidth/scrollHeight stay unscaled (970/1159),
  // so native panning scrolls into empty space. `zoom` scales layout
  // too: scrollWidth/scrollHeight are the true visual sizes, panning
  // works natively, and the kashida filler still measures the design
  // width (verified: line clientWidth stays ~920 under zoom, tatweel
  // intact, no wraps). `zoom` is supported in Chrome, Safari and
  // Firefox 126+; the one risk is a very old browser ignoring it and
  // showing the page at full width.
  // The line divisions themselves are authentic: Quran.com verses/by_page
  // gives every word its Madani line_number, and the renderer groups
  // words by that number — no line break is invented and no ayah text is
  // re-divided. Fonts are unchanged (Amiri for Uthmani, Scheherazade New
  // for Indo-Pak, both self-hosted with full Arabic ranges).
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const zoomWrapRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [pageHeight, setPageHeight] = useState(0);
  const [zoom, setZoom] = useState(1);
  const fitScaleRef = useRef(1);
  const zoomRef = useRef(1);
  const scale = fitScale * zoom;

  // Measure the available width (fit scale) and the unscaled page height.
  // The viewport's height is the scaled page height, so the page never
  // overflows the screen at fit zoom; zoomed in, the viewport scrolls.
  // NOTE: under CSS `zoom`, offsetHeight is the UNSCALED layout height
  // (verified in headless Chrome 2026-11-22) — the viewport height must
  // multiply it by the scale, as below.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const w = vp.clientWidth;
      if (w > 0) {
        const next = Math.min(1, w / MUSHAF_PAGE_WIDTH);
        fitScaleRef.current = next;
        setFitScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(vp);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const wrap = zoomWrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const h = wrap.offsetHeight;
      if (h > 0) setPageHeight((prev) => (prev === h ? prev : h));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  // Zoom, keeping the focal point (pinch midpoint / viewport centre)
  // stable by re-anchoring the scroll position after the scale changes.
  const applyZoom = (next: number, focalX?: number, focalY?: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    const vp = viewportRef.current;
    const prevScale = fitScaleRef.current * zoomRef.current;
    const nextScale = fitScaleRef.current * clamped;
    let fx = 0;
    let fy = 0;
    let sx = 0;
    let sy = 0;
    if (vp) {
      const rect = vp.getBoundingClientRect();
      fx = focalX !== undefined ? focalX - rect.left : vp.clientWidth / 2;
      fy = focalY !== undefined ? focalY - rect.top : vp.clientHeight / 2;
      sx = vp.scrollLeft;
      sy = vp.scrollTop;
    }
    zoomRef.current = clamped;
    setZoom(clamped);
    if (vp && prevScale > 0) {
      requestAnimationFrame(() => {
        vp.scrollLeft = ((sx + fx) / prevScale) * nextScale - fx;
        vp.scrollTop = ((sy + fy) / prevScale) * nextScale - fy;
      });
    }
  };
  const applyZoomRef = useRef(applyZoom);
  useEffect(() => {
    applyZoomRef.current = applyZoom;
  });

  // Pinch-to-zoom (two fingers) and Ctrl+wheel / trackpad pinch.
  // Native listeners, not React handlers: the move handler must be
  // non-passive so preventDefault() stops the browser's own pinch/scroll
  // while a pinch is in progress. The viewport's touch-action (pan-x
  // pan-y) keeps one-finger panning working and leaves pinch gestures to
  // this handler; the +/- buttons are the fallback if a browser does not
  // deliver the gesture. Native browser pinch-zoom of the whole page
  // still works outside the page frame (the root viewport sets no
  // maximum-scale / user-scalable restriction).
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const pinch = { active: false, d0: 0, z0: 1, cx: 0, cy: 0 };
    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch.active = true;
        pinch.d0 = dist(e.touches);
        pinch.z0 = zoomRef.current;
        pinch.cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        pinch.cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinch.active || e.touches.length !== 2 || pinch.d0 <= 0) return;
      e.preventDefault();
      applyZoomRef.current(pinch.z0 * (dist(e.touches) / pinch.d0), pinch.cx, pinch.cy);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch.active = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      applyZoomRef.current(zoomRef.current * Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY);
    };
    vp.addEventListener('touchstart', onTouchStart, { passive: true });
    vp.addEventListener('touchmove', onTouchMove, { passive: false });
    vp.addEventListener('touchend', onTouchEnd);
    vp.addEventListener('touchcancel', onTouchEnd);
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchmove', onTouchMove);
      vp.removeEventListener('touchend', onTouchEnd);
      vp.removeEventListener('touchcancel', onTouchEnd);
      vp.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('memorize') === '1') setHideVerses(true);
      const raw = localStorage.getItem('ili_hifz_settings_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as { mushafLines?: number; topicColors?: boolean; tajweedColors?: boolean };
        if (parsed.mushafLines === 16) setCompactText(true);
        if (parsed.topicColors === false) setTopicColors(false);
        if (parsed.tajweedColors === true) setTajweedOn(true);
      }
    } catch {
      /* defaults */
    }
  }, []);

  const surahIds = [...new Set(verses.map((v) => Number(v.verse_key.split(':')[0])))];
  const surahs = surahIds.map(getSurahById).filter((s): s is HifzSurah => Boolean(s));
  // Juz for the location pill (largest juz whose first page is <= this one).
  const juzHere = (() => {
    let j = 1;
    for (let n = 1; n <= 30; n++) {
      if (JUZ_FIRST_PAGE[n] <= page) j = n;
    }
    return j;
  })();

  const peekedAyahsRef = useRef<Set<string>>(new Set());
  // Peek recording (Stage 4): a peek is help-needed for that ayah —
  // markAttempt(…, 'peek') resets its correct streak and puts it in the
  // revision queue. One peek per ayah per page-view is recorded, however
  // many words of that ayah are peeked.
  const recordPeek = (surah: number, ayah: number) => {
    const key = `${surah}:${ayah}`;
    if (peekedAyahsRef.current.has(key)) return;
    peekedAyahsRef.current.add(key);
    try {
      saveProgress(markAttempt(loadProgress(), surah, ayah, 'peek'));
    } catch {
      /* storage unavailable — the reveal still works */
    }
  };

  const peekNext = () => {
    // The word about to be revealed is at index `revealedCount` in the
    // frame's reading order — map it back to its ayah first.
    const hit = ayahKeyForRevealedWord(verses, script, revealedCount);
    if (hit) recordPeek(hit.surah, hit.ayah);
    setRevealedCount((c) => c + 1);
    setPeekCount((c) => c + 1);
  };
  const peekRest = () => {
    for (const v of verses) {
      const [s, a] = v.verse_key.split(':').map(Number);
      if (Number.isInteger(s) && Number.isInteger(a)) recordPeek(s, a);
    }
    setRevealedCount(100000);
    setPeekCount((c) => c + 1);
  };

  /* Floating mode switcher (Stage 4): Memorise hides the words here,
     Reading shows them again. Recite / Listen / Test are not handled
     here — the switcher navigates to the surah reader or /hifz/test. */
  useEffect(() => {
    const onMode = (e: Event) => {
      const m = (e as CustomEvent<{ mode: HifzMode }>).detail?.mode;
      if (m === 'memorise') {
        e.preventDefault();
        setHideVerses(true);
        setRevealedCount(0);
        setPeekCount(0);
        saveMode('memorise');
      } else if (m === 'reading') {
        e.preventDefault();
        setHideVerses(false);
        setRevealedCount(0);
        setPeekCount(0);
        saveMode('reading');
      }
    };
    window.addEventListener(MODE_EVENT, onMode);
    return () => window.removeEventListener(MODE_EVENT, onMode);
  }, []);

  return (
    <div>
      {/* Tarteel-clean top bar (sticky): hamburger | centre location
          pill | bookmark / search / settings. No gift icon (Premium
          affordance). Hide, zoom, script, topic and tajweed controls
          moved into the settings sheet; the chapter list into the
          hamburger sheet. */}
      <div className="sticky top-0 z-40 -mx-4 border-b border-[#E8EAED] bg-white/95 px-2 backdrop-blur sm:px-3">
        <div className="mx-auto max-w-5xl">
          <MushafTopBar
            title={surahs[0]?.name ?? 'Mushaf'}
            subtitle={`Page ${page} | ${t('reader.juzLabel').replace('{n}', String(juzHere))}`}
            bookmarked={pageBookmarked}
            bookmarkAria={
              pageBookmarked
                ? t('reader.removeBookmarkAria').replace('{n}', String(page))
                : t('reader.bookmarkAria').replace('{n}', String(page))
            }
            onToggleBookmark={togglePageBookmark}
            onOpenNav={() => setNavOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>
      </div>

      {/* Chapter / Juz sheet (hamburger + centre pill). */}
      <ReaderSheet open={navOpen} onClose={() => setNavOpen(false)} side="left" title={t('rb.list.chaptersJuz')}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('mode.practiceMode')}</p>
        <div className="mt-2">
          <PracticeModeList onSelect={selectPracticeMode} />
        </div>
        {/* Prev / Next page — the single-page replacement for the removed
            MushafNav chrome: page navigation lives in this sheet now
            (alongside the chapter / juz / bookmark jumps below). */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#E8EAED] pt-4">
          {page > 1 ? (
            <Link
              href={`/hifz/mushaf/${page - 1}`}
              className="inline-flex min-h-11 items-center rounded-full border border-[#E8EAED] bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F3F4F6]"
            >
              {t('mushaf.prevPage')}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm font-semibold text-[#111827]">
            {t('mushaf.pageOf').replace('{page}', String(page)).replace('{total}', String(MUSHAF_TOTAL_PAGES))}
          </span>
          {page < MUSHAF_TOTAL_PAGES ? (
            <Link
              href={`/hifz/mushaf/${page + 1}`}
              className="inline-flex min-h-11 items-center rounded-full border border-[#E8EAED] bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F3F4F6]"
            >
              {t('mushaf.nextPage')}
            </Link>
          ) : (
            <span />
          )}
        </div>
        <Link
          href={`/hifz/mushaf?page=${page}`}
          className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[#E8EAED] bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F3F4F6]"
        >
          {t('mpv.continuousReader')}
        </Link>
        <div className="mt-5 border-t border-[#E8EAED] pt-4">
          <SurahList />
        </div>
      </ReaderSheet>

      {/* Reader settings sheet (gear): zoom, script, text size, topic +
          tajweed colours, hide words. */}
      <ReaderSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} side="right" title={t('reader.readerSettings')}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('reader.readerZoom')}</p>
        <div className="mt-2 flex items-center gap-1 rounded-full border border-[#E8EAED] bg-white p-0.5" role="group" aria-label={t('mpv.zoomGroup')}>
          <button
            type="button"
            onClick={() => applyZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            aria-label={t('mpv.zoomOut')}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-lg font-bold text-[#111827] hover:bg-[#F3F4F6] disabled:opacity-40"
          >
            −
          </button>
          <span className="w-12 text-center text-sm font-semibold text-[#111827]" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => applyZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            aria-label={t('mpv.zoomIn')}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-lg font-bold text-[#111827] hover:bg-[#F3F4F6] disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyZoom(MIN_ZOOM)}
            disabled={zoom === MIN_ZOOM}
            className="min-h-10 flex-1 rounded-full px-3 text-sm font-semibold text-[#111827] hover:bg-[#F3F4F6] disabled:opacity-40"
          >
            {t('mpv.fitPage')}
          </button>
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">{t('mpv.zoomNote')}</p>
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('mpv.script')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={t('mpv.script')}>
          {(['indopak', 'uthmani'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScript(s)}
              aria-pressed={script === s}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${
                script === s ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              {SCRIPT_LABELS[s]}
            </button>
          ))}
        </div>
        {script === 'indopak' && <p className="mt-2 text-xs text-[#6B7280]">{t('mpv.indopakNote')}</p>}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => setCompactText((v) => !v)}
            aria-pressed={compactText}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              compactText ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {compactText ? t('mpv.compactText') : t('mpv.largeText')}
          </button>
          <button
            type="button"
            onClick={() => setTopicColors((v) => !v)}
            aria-pressed={topicColors}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              topicColors ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {topicColors ? t('reader.topicOn') : t('reader.topicOff')}
          </button>
          <button
            type="button"
            onClick={toggleTajweed}
            aria-pressed={tajweedOn}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              tajweedOn ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {t('set.tajweedColors')}
          </button>
          <button
            type="button"
            onClick={() => {
              setHideVerses((h) => !h);
              setRevealedCount(0);
              setPeekCount(0);
            }}
            aria-pressed={hideVerses}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              hideVerses ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {hideVerses ? t('mpv.showVerses') : t('mpv.hideVersesMemorise')}
          </button>
        </div>
        {topicColors && (
          <div className="mt-4 rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('mpv.topicsTitle')}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {TOPICS.map((tp) => (
                <li
                  key={tp.id}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold"
                  style={{ borderColor: tp.color, color: tp.color, background: tp.wash }}
                  title={tp.description}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: tp.color }} aria-hidden="true" />
                  {tp.name}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[#6B7280]">{t('mpv.topicsNote')}</p>
          </div>
        )}
        {tajweedOn && (
          <p className="mt-3 text-xs text-[#6B7280]">{t('rb.reader.tajweedNote')}</p>
        )}
        {mistakeMarkingOn && weakOnPage > 0 && (
          <p className="mt-3 text-xs text-[#6B7280]">
            <span className="live-word-wrong font-semibold">{t('mpv.weakLabel')}</span>{' '}
            {weakOnPage === 1
              ? t('mpv.weakOne').replace('{n}', String(weakOnPage))
              : t('mpv.weakMany').replace('{n}', String(weakOnPage))}
          </p>
        )}
        <Link
          href="/hifz/settings"
          className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[#E8EAED] bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F3F4F6]"
        >{t('rb.reader.allSettings')} →</Link>
      </ReaderSheet>

      {hideVerses && (
        <p className="mt-3 text-center text-sm text-[#6B7280]">
          {t('mpv.hideNote')}
          {mistakeMarkingOn && weakOnPage > 0 ? ` ${t('mpv.hideNoteRed')}` : ''}
        </p>
      )}

      <div className="mt-4 rounded-2xl bg-[#F2F2F2] p-2 sm:p-4">
        {/* Scaled-page viewport: the frame inside is always
            MUSHAF_PAGE_WIDTH wide and is scaled with CSS `zoom` to fit
            (see the scaled-page note above). The viewport's height is the
            scaled page height, so the page never overflows the screen at
            fit zoom; zoomed in, it scrolls/pans natively. touch-action
            pan-x pan-y keeps one-finger panning working and leaves pinch
            gestures to the handler above. */}
        <div
          ref={viewportRef}
          style={{
            height: pageHeight > 0 ? Math.ceil(pageHeight * scale) : undefined,
            overflow: zoom > MIN_ZOOM ? 'auto' : 'hidden',
            touchAction: 'pan-x pan-y',
          }}
        >
          <div
            ref={zoomWrapRef}
            style={{
              width: MUSHAF_PAGE_WIDTH,
              margin: '0 auto',
              // String, not number: React would append 'px' to a numeric
              // zoom if it did not treat it as unitless.
              zoom: String(scale),
            }}
          >
            <MushafPageFrame
              page={page}
              verses={verses}
              script={script}
              compactText={compactText}
              topicColors={topicColors}
              hidden={hideVerses}
              revealed={revealedCount}
              frequentMistakes={frequentMistakes}
              mistakeMarkingOn={mistakeMarkingOn}
              tajweedOn={tajweedOn}
              onWeakCount={setWeakOnPage}
            />
          </div>
        </div>
      </div>

      {/* Surahs on this page — jump back into the study view / coach */}
      {surahs.length > 0 && (
        <nav aria-label={t('mpv.surahsOnPage')} className="mt-6 rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#111827]">{t('mpv.onThisPage')}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {surahs.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link href={`/hifz/${s.slug}`} className="font-semibold text-[#1FA36B] hover:underline">
                  Surah {s.name} ({s.meaning})
                </Link>
                <Link href={`/hifz/${s.slug}?mode=recite`} className="text-[#6B7280] hover:underline">
                  {t('mpv.reciteCoach')}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[#6B7280]">
            {t('mpv.preferList')}{' '}
            <Link href="/hifz" className="font-semibold text-[#1FA36B] underline">
              {t('mpv.browseSurahs')}
            </Link>
          </p>
        </nav>
      )}

      {/* Peek controls while words are hidden — floating above the
          bottom bar so they are always in reach. */}
      {hideVerses && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[152px] z-40">
          <div className="mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] flex-wrap items-center justify-center gap-2 px-3">
            <button
              type="button"
              onClick={peekNext}
              aria-label={t('mpv.revealNextWord')}
              className="pointer-events-auto min-h-11 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-md ring-1 ring-[#FFB800] hover:bg-[#F3F4F6]"
            >
              {t('mpv.nextWord')}
            </button>
            <button
              type="button"
              onClick={peekRest}
              aria-label={t('mpv.revealRestPage')}
              className="pointer-events-auto min-h-11 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-md ring-1 ring-[#FFB800] hover:bg-[#F3F4F6]"
            >
              {t('mpv.revealRest')}
            </button>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6B7280] shadow-md ring-1 ring-[#E8EAED]">
              {peekCount === 1
                ? t('mpv.peekOne').replace('{n}', String(peekCount)).replace('{r}', String(revealedCount))
                : t('mpv.peekMany').replace('{n}', String(peekCount)).replace('{r}', String(revealedCount))}
            </span>
          </div>
        </div>
      )}

      {/* Bottom bar: Mistakes / bookmarks / hide + the big mic orb. */}
      <MushafBottomBar
        hideActive={hideVerses}
        onToggleHide={() => {
          setHideVerses((h) => !h);
          setRevealedCount(0);
          setPeekCount(0);
        }}
        onMic={() => selectPracticeMode('recite')}
      />
      {/* Bottom clearance: the fixed bottom bar's top edge sits 140px
          above the viewport bottom (76px tab bar + 64px mic orb), so the
          scroll content needs at least that much space after its last
          line — otherwise the "Surahs on this page" links end up
          half-covered by the bar. h-44 (176px) clears it on its own, so
          the last line stays clear even if the attribution below is
          ever removed. */}
      <div className="h-44" aria-hidden="true" />
    </div>
  );
}
