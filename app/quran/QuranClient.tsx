'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  API, AUDIO_BASE, TRANSLATIONS, RECITERS, TAFSIR_ID, TAFSIR_NAME, BISMILLAH,
  VOTD_KEYS, JUZ_DATA, stripHtml, cleanIndopak, dayOfYear, networkErrorMessage,
  type Chapter, type Verse, type Bookmark, type SearchHit, type Tab,
} from './lib';
import { ALL_SURAHS_BY_SLUG } from '../hifz/surahs';

/* Quran Reader client — Indo-Pak script (Quran.com API v4, text_indopak).
   The surah list and Verse of the Day arrive server-rendered as props;
   verses come through the same-origin proxy /api/quran (see lib.ts).
   A surah renders in full, in one continuous flow — no paging.
   View modes: Arabic only / Arabic + Translation / Arabic + Translation
   + Tafsir (tafsir loads under each verse as it scrolls into view). */

type ViewMode = 'arabic' | 'translation' | 'tafsir';
const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'arabic', label: 'Arabic only' },
  { id: 'translation', label: 'Arabic + Translation' },
  { id: 'tafsir', label: 'Arabic + Translation + Tafsir' },
];

/* In Tafsir view mode, each verse loads its own tafsir when it scrolls
   near the viewport, so opening a long surah does not fire 286 requests. */
function TafsirAuto({ verseKey, tafsir, ensureTafsir }: {
  verseKey: string;
  tafsir?: { open: boolean; loading: boolean; text: string; error: string };
  ensureTafsir: (verseKey: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || tafsir?.text || tafsir?.loading) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          ensureTafsir(verseKey);
          obs.disconnect();
        }
      },
      { rootMargin: '800px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [verseKey, tafsir?.text, tafsir?.loading, ensureTafsir]);
  return (
    <div ref={ref} className="mt-4 rounded-xl bg-[#F7F5EF] border border-[#e5e0d3] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#146B4D]">{TAFSIR_NAME}</p>
      {(!tafsir || tafsir.loading) && <p className="mt-2 text-sm text-[#1C2420]/60">Loading tafsir…</p>}
      {tafsir?.error && <p className="mt-2 text-sm text-red-700" role="alert">{tafsir.error}</p>}
      {tafsir?.text && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#1C2420]/85">{tafsir.text}</p>}
    </div>
  );
}

export default function QuranClient({
  initialChapters,
  initialVotd,
  initialVotdKey,
}: {
  initialChapters: Chapter[];
  initialVotd: Verse | null;
  initialVotdKey: string;
}) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [chaptersLoading, setChaptersLoading] = useState(initialChapters.length === 0);
  const [chaptersError, setChaptersError] = useState('');
  const [tab, setTab] = useState<Tab>('surahs');
  const [surahFilter, setSurahFilter] = useState('');

  const [currentSurah, setCurrentSurah] = useState<Chapter | null>(null);
  const [currentJuz, setCurrentJuz] = useState<number | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [versesError, setVersesError] = useState('');
  const [targetVerse, setTargetVerse] = useState(1);

  const [viewMode, setViewMode] = useState<ViewMode>('translation');

  const [translationId, setTranslationId] = useState(20);
  const [reciterId, setReciterId] = useState(7);
  const [fontScale, setFontScale] = useState(1);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lastRead, setLastRead] = useState<Bookmark | null>(null);

  const [votd, setVotd] = useState<Verse | null>(initialVotd);
  const [votdKey, setVotdKey] = useState(initialVotdKey);

  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const queueIndexRef = useRef(0);

  const [tafsirs, setTafsirs] = useState<Record<string, { open: boolean; loading: boolean; text: string; error: string }>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchDone, setSearchDone] = useState(false);

  const [juzDone, setJuzDone] = useState<number[]>([]);

  const chapterById = useMemo(() => {
    const map = new Map<number, Chapter>();
    chapters.forEach((c) => map.set(c.id, c));
    return map;
  }, [chapters]);

  const filteredChapters = useMemo(() => {
    const q = surahFilter.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter((c) =>
      c.name_simple.toLowerCase().includes(q) ||
      c.translated_name.name.toLowerCase().includes(q) ||
      c.name_arabic.includes(surahFilter.trim()) ||
      String(c.id) === q,
    );
  }, [chapters, surahFilter]);

  /* ---------- load surah list + saved state ---------- */
  useEffect(() => {
    let cancelled = false;
    if (initialChapters.length > 0) {
      setChaptersLoading(false);
    } else {
      void loadChapters();
    }
    async function loadChapters() {
      try {
        const res = await fetch(`${API}/chapters?language=en`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setChapters(data.chapters as Chapter[]);
      } catch (err) {
        if (!cancelled) setChaptersError(networkErrorMessage(err));
      } finally {
        if (!cancelled) setChaptersLoading(false);
      }
    }
    try {
      const b = localStorage.getItem('quran_bookmarks_v2');
      if (b) {
        const raw = JSON.parse(b) as Record<string, unknown>[];
        setBookmarks(raw.map((item) => ({
          surahNumber: Number(item.surahNumber ?? item.surah ?? 1),
          surahName: String(item.surahName ?? ''),
          verseNumber: Number(item.verseNumber ?? item.ayah ?? 1),
          timestamp: Number(item.timestamp ?? Date.now()),
        })));
      }
      const lr = localStorage.getItem('quran_last_read');
      if (lr) setLastRead(JSON.parse(lr) as Bookmark);
      const plan = localStorage.getItem('ili_reading_plan');
      if (plan) {
        const parsed = JSON.parse(plan) as { juzDone?: number[] };
        if (Array.isArray(parsed.juzDone)) setJuzDone(parsed.juzDone);
      }
    } catch {
      /* corrupted local data — start fresh */
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem('quran_bookmarks_v2', JSON.stringify(bookmarks)); } catch { /* storage full/blocked */ }
  }, [bookmarks]);

  useEffect(() => {
    if (lastRead) {
      try { localStorage.setItem('quran_last_read', JSON.stringify(lastRead)); } catch { /* ignore */ }
    }
  }, [lastRead]);

  useEffect(() => {
    try { localStorage.setItem('ili_reading_plan', JSON.stringify({ juzDone })); } catch { /* ignore */ }
  }, [juzDone]);

  /* ---------- Verse of the Day ---------- */
  useEffect(() => {
    if (initialVotd) return; // server-rendered — nothing to fetch
    const key = VOTD_KEYS[dayOfYear(new Date()) % VOTD_KEYS.length];
    setVotdKey(key);
    let cancelled = false;
    fetch(`${API}/verses/by_key/${key}?fields=text_indopak&translations=20`)
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((data) => { if (!cancelled) setVotd(data.verse as Verse); })
      .catch(() => { /* VOTD is decorative — fail silently */ });
    return () => { cancelled = true; };
  }, []);

  /* ---------- audio queue ---------- */
  const versesRef = useRef<Verse[]>([]);
  versesRef.current = verses;

  const playAudioUrl = useCallback((url: string, key: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = `${AUDIO_BASE}${url}`;
    audio.play().catch(() => { setPlayingKey(null); });
    setPlayingKey(key);
    setIsPaused(false);
  }, []);

  const handleAudioEnded = useCallback(() => {
    const next = queueIndexRef.current + 1;
    if (next < queueRef.current.length) {
      queueIndexRef.current = next;
      const key = queueRef.current[next];
      const verse = versesRef.current.find((v) => v.verse_key === key);
      if (verse?.audio?.url) { playAudioUrl(verse.audio.url, key); return; }
    }
    queueRef.current = [];
    setPlayingKey(null);
    setIsPaused(false);
  }, [playAudioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener('ended', handleAudioEnded);
    return () => audio.removeEventListener('ended', handleAudioEnded);
  }, [handleAudioEnded]);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.removeAttribute('src'); }
    queueRef.current = [];
    setPlayingKey(null);
    setIsPaused(false);
  }, []);

  const toggleVerseAudio = useCallback((verse: Verse) => {
    const audio = audioRef.current;
    if (!audio || !verse.audio?.url) return;
    if (playingKey === verse.verse_key) {
      if (isPaused) { audio.play().catch(() => {}); setIsPaused(false); }
      else { audio.pause(); setIsPaused(true); }
      return;
    }
    queueRef.current = [];
    playAudioUrl(verse.audio.url, verse.verse_key);
  }, [playingKey, isPaused, playAudioUrl]);

  const playWholeSurah = useCallback(() => {
    const playable = verses.filter((v) => v.audio?.url);
    if (playable.length === 0) return;
    queueRef.current = playable.map((v) => v.verse_key);
    queueIndexRef.current = 0;
    playAudioUrl(playable[0].audio!.url!, playable[0].verse_key);
  }, [verses, playAudioUrl]);

  /* View mode persists on this device. */
  const viewModeLoaded = useRef(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ili_quran_view_mode');
      if (saved === 'arabic' || saved === 'translation' || saved === 'tafsir') setViewMode(saved);
    } catch { /* storage unavailable */ }
    viewModeLoaded.current = true;
  }, []);
  useEffect(() => {
    if (!viewModeLoaded.current) return;
    try { localStorage.setItem('ili_quran_view_mode', viewMode); } catch { /* storage unavailable */ }
  }, [viewMode]);

  /* ---------- loading verses ---------- */
  const loadSurah = useCallback(async (surah: Chapter, verse = 1) => {
    stopAudio();
    setCurrentSurah(surah);
    setCurrentJuz(null);
    setVerses([]);
    setVersesLoading(true);
    setVersesError('');
    setTargetVerse(verse);
    setTafsirs({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const res = await fetch(`${API}/verses/by_chapter/${surah.id}?fields=text_indopak&translations=${translationId}&audio=${reciterId}&per_page=all`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVerses(data.verses as Verse[]);
      setLastRead({ surahNumber: surah.id, surahName: surah.name_simple, verseNumber: verse, timestamp: Date.now() });
    } catch (err) {
      setVersesError(networkErrorMessage(err));
    } finally {
      setVersesLoading(false);
    }
  }, [translationId, reciterId, stopAudio]);

  const loadJuz = useCallback(async (juz: number) => {
    stopAudio();
    setCurrentSurah(null);
    setCurrentJuz(juz);
    setVerses([]);
    setVersesLoading(true);
    setVersesError('');
    setTargetVerse(1);
    setTafsirs({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const res = await fetch(`${API}/verses/by_juz/${juz}?fields=text_indopak&translations=${translationId}&audio=${reciterId}&per_page=all`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVerses(data.verses as Verse[]);
      const first = (data.verses as Verse[])[0];
      if (first) {
        const s = Number(first.verse_key.split(':')[0]);
        const ch = chapterById.get(s);
        setLastRead({ surahNumber: s, surahName: ch?.name_simple ?? '', verseNumber: first.verse_number, timestamp: Date.now() });
      }
    } catch (err) {
      setVersesError(networkErrorMessage(err));
    } finally {
      setVersesLoading(false);
    }
  }, [translationId, reciterId, stopAudio, chapterById]);

  /* Refetch verses when translation or reciter changes while reading. */
  const readingRef = useRef({ surah: null as Chapter | null, juz: null as number | null });
  readingRef.current = { surah: currentSurah, juz: currentJuz };
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const { surah, juz } = readingRef.current;
    if (surah) void loadSurah(surah, targetVerse);
    else if (juz) void loadJuz(juz);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationId, reciterId]);

  /* Scroll to a target verse once verses load (bookmark / VOTD / search). */
  useEffect(() => {
    if (verses.length === 0 || targetVerse <= 1) return;
    const el = document.getElementById(`verse-${targetVerse}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [verses, targetVerse]);

  /* ---------- bookmarks ---------- */
  const isBookmarked = useCallback((surahNumber: number, verseNumber: number) =>
    bookmarks.some((b) => b.surahNumber === surahNumber && b.verseNumber === verseNumber),
  [bookmarks]);

  const toggleBookmark = useCallback((surahNumber: number, surahName: string, verseNumber: number) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.surahNumber === surahNumber && b.verseNumber === verseNumber);
      if (exists) return prev.filter((b) => !(b.surahNumber === surahNumber && b.verseNumber === verseNumber));
      return [...prev, { surahNumber, surahName, verseNumber, timestamp: Date.now() }];
    });
  }, []);

  const openBookmark = useCallback((b: Bookmark) => {
    const ch = chapterById.get(b.surahNumber);
    if (ch) void loadSurah(ch, b.verseNumber);
  }, [chapterById, loadSurah]);

  /* ---------- tafsir ---------- */
  const fetchTafsir = useCallback(async (verseKey: string) => {
    setTafsirs((prev) => ({ ...prev, [verseKey]: { open: true, loading: true, text: '', error: '' } }));
    try {
      const res = await fetch(`${API}/tafsirs/${TAFSIR_ID}/by_ayah/${verseKey}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text = stripHtml(String(data.tafsir?.text ?? ''));
      setTafsirs((prev) => ({ ...prev, [verseKey]: { open: true, loading: false, text: text || 'No tafsir text was returned for this verse.', error: '' } }));
    } catch {
      setTafsirs((prev) => ({ ...prev, [verseKey]: { open: true, loading: false, text: '', error: 'Could not load the tafsir. Check your connection and try again.' } }));
    }
  }, []);

  /* Used by Tafsir view mode: load a verse's tafsir once, when it scrolls near. */
  const ensureTafsir = useCallback((verseKey: string) => {
    const existing = tafsirs[verseKey];
    if (existing?.text || existing?.loading) return;
    void fetchTafsir(verseKey);
  }, [tafsirs, fetchTafsir]);

  /* ---------- share ---------- */
  const shareVerse = useCallback(async (verse: Verse, surahName: string) => {
    const translation = stripHtml(verse.translations?.[0]?.text ?? '');
    const text = `${verse.text_indopak}\n\n"${translation}"\n\n— ${surahName} (${verse.verse_key})\n\niloveislam.life/quran`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      throw new Error('no share API');
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(verse.verse_key);
        window.setTimeout(() => setCopiedKey((k) => (k === verse.verse_key ? null : k)), 2000);
      } catch { /* clipboard unavailable */ }
    }
  }, []);

  /* ---------- in-Quran search ---------- */
  const runSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (q.length < 2) return;
    setSearchLoading(true);
    setSearchError('');
    setSearchDone(false);
    setSearchResults([]);
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&size=20&language=en`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = (data.search?.results ?? []) as { verse_key: string }[];
      /* Enrich each hit with Indo-Pak text + translation so search results never show Uthmani text. */
      const enriched = await Promise.all(raw.map(async (r) => {
        const [s, a] = r.verse_key.split(':').map(Number);
        try {
          const vr = await fetch(`${API}/verses/by_key/${r.verse_key}?fields=text_indopak&translations=${translationId}`);
          if (!vr.ok) throw new Error('verse fetch failed');
          const vd = await vr.json();
          const v = vd.verse as Verse;
          return {
            verse_key: r.verse_key, surahNumber: s, verseNumber: a,
            arabic: cleanIndopak(v.text_indopak), translation: stripHtml(v.translations?.[0]?.text ?? ''),
          } as SearchHit;
        } catch {
          return { verse_key: r.verse_key, surahNumber: s, verseNumber: a, arabic: '', translation: '' } as SearchHit;
        }
      }));
      setSearchResults(enriched);
      setSearchDone(true);
    } catch (err) {
      setSearchError(networkErrorMessage(err));
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, translationId]);

  const openSearchHit = useCallback((hit: SearchHit) => {
    const ch = chapterById.get(hit.surahNumber);
    if (ch) void loadSurah(ch, hit.verseNumber);
  }, [chapterById, loadSurah]);

  /* ---------- reading plan ---------- */
  const toggleJuzDone = useCallback((juz: number) => {
    setJuzDone((prev) => (prev.includes(juz) ? prev.filter((j) => j !== juz) : [...prev, juz]));
  }, []);

  const readerTitle = currentSurah
    ? `${currentSurah.name_simple} — ${currentSurah.translated_name.name}`
    : currentJuz
      ? `Juz ${currentJuz} — ${JUZ_DATA[currentJuz - 1].name}`
      : '';
  const reading = currentSurah !== null || currentJuz !== null;
  const translationName = TRANSLATIONS.find((t) => t.id === translationId)?.name ?? 'Saheeh International';
  const arabicSize = fontScale <= 0.85 ? 'text-2xl sm:text-3xl' : fontScale >= 1.15 ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl';
  const surahNameForVerse = (v: Verse): string => {
    if (currentSurah) return currentSurah.name_simple;
    const s = Number(v.verse_key.split(':')[0]);
    return chapterById.get(s)?.name_simple ?? '';
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'surahs', label: 'Surahs' },
    { id: 'juz', label: 'Juz' },
    { id: 'search', label: 'Search' },
    { id: 'bookmarks', label: `Bookmarks${bookmarks.length ? ` (${bookmarks.length})` : ''}` },
    { id: 'plan', label: 'Reading Plan' },
  ];

  return (
    <main className="min-h-screen bg-[#F7F5EF] text-[#1C2420]">
      <audio ref={audioRef} preload="none" className="hidden" />

      {/* Header */}
      <header className="bg-[#0B3D2E] text-white">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-8 sm:pt-14 sm:pb-10 text-center">
          <p className="font-quran text-3xl sm:text-4xl text-[#C9A227]">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Quran Reader</h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 max-w-xl mx-auto">
            Read the Holy Quran in the Indo-Pak script — the 15-line Mushaf style read across
            Pakistan, India and Bangladesh — with English translation, audio recitation and tafsir.
          </p>
          {lastRead && !reading && (
            <button
              type="button"
              onClick={() => openBookmark(lastRead)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-[#0B3D2E] shadow hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              ▶ Continue reading — {lastRead.surahName || `Surah ${lastRead.surahNumber}`} {lastRead.surahNumber}:{lastRead.verseNumber}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        {/* Tabs */}
        {!reading && (
          <nav aria-label="Quran sections" className="mt-6 flex gap-2 scroll-mt-20 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] ${
                  tab === t.id ? 'bg-[#0B3D2E] text-white' : 'bg-white text-[#1C2420] border border-[#e5e0d3] hover:border-[#146B4D]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}

        {/* ============ READER VIEW ============ */}
        {reading && (
          <section aria-label="Quran reader" className="mt-6 scroll-mt-20">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { stopAudio(); setCurrentSurah(null); setCurrentJuz(null); setVerses([]); setVersesError(''); }}
                className="rounded-full bg-white border border-[#e5e0d3] px-4 py-2 text-sm font-semibold hover:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
              >
                ← All Surahs
              </button>
              <span className="text-sm text-[#1C2420]/60">{verses.length > 0 ? `${verses.length} verses` : ''}</span>
            </div>

            <div className="mt-4 rounded-2xl bg-[#0B3D2E] px-5 py-6 text-center text-white shadow-sm">
              <p className="font-quran text-2xl sm:text-3xl text-[#C9A227]">{currentSurah?.name_arabic ?? (currentJuz ? JUZ_DATA[currentJuz - 1].ar : '')}</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-bold">{readerTitle}</h2>
              {currentSurah && (
                <p className="mt-1 text-sm text-emerald-100/80">
                  {currentSurah.verses_count} verses · {currentSurah.revelation_place === 'makkah' ? 'Makki' : 'Madani'} · Surah {currentSurah.id} of 114
                </p>
              )}
              {currentSurah && (() => {
                const launch = Object.values(ALL_SURAHS_BY_SLUG).find((s) => s.id === currentSurah.id);
                return launch ? (
                  <a
                    href={`/hifz/${launch.slug}`}
                    className="mt-4 inline-block rounded-full bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B3D2E] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Memorise this surah →
                  </a>
                ) : null;
              })()}
              {currentSurah && currentSurah.id !== 1 && currentSurah.id !== 9 && (
                <p className="font-quran mt-4 text-xl sm:text-2xl">{BISMILLAH}</p>
              )}
            </div>

            {/* Reader controls */}
            <div className="mt-4 rounded-2xl bg-white border border-[#e5e0d3] p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="View mode">
                <span className="text-sm font-medium">View</span>
                {VIEW_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={viewMode === m.id}
                    onClick={() => setViewMode(m.id)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] ${
                      viewMode === m.id ? 'bg-[#0B3D2E] text-white' : 'border border-[#e5e0d3] hover:border-[#146B4D]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={playingKey ? stopAudio : playWholeSurah}
                  disabled={verses.length === 0}
                  className="rounded-full bg-[#146B4D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B3D2E] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                >
                  {playingKey ? '■ Stop audio' : '▶ Play whole surah'}
                </button>
                <label className="flex items-center gap-2 text-sm font-medium">
                  Translation
                  <select
                    value={translationId}
                    onChange={(e) => setTranslationId(Number(e.target.value))}
                    className="rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-2 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                  >
                    {TRANSLATIONS.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  Reciter
                  <select
                    value={reciterId}
                    onChange={(e) => setReciterId(Number(e.target.value))}
                    className="rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-2 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                  >
                    {RECITERS.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </label>
                <span className="ml-auto flex items-center gap-1 text-sm font-medium" aria-label="Arabic font size">
                  <button type="button" aria-label="Smaller Arabic text" onClick={() => setFontScale((s) => Math.max(0.8, +(s - 0.15).toFixed(2)))} className="rounded-lg border border-[#e5e0d3] px-2.5 py-1 hover:border-[#146B4D]">A−</button>
                  <button type="button" aria-label="Larger Arabic text" onClick={() => setFontScale((s) => Math.min(1.3, +(s + 0.15).toFixed(2)))} className="rounded-lg border border-[#e5e0d3] px-2.5 py-1 hover:border-[#146B4D]">A+</button>
                </span>
              </div>
            </div>

            {versesLoading && (
              <div className="mt-6 space-y-3" aria-live="polite">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl bg-white border border-[#e5e0d3] p-5">
                    <div className="h-8 w-3/4 ml-auto rounded bg-[#e5e0d3]" />
                    <div className="mt-4 h-4 w-full rounded bg-[#e5e0d3]" />
                    <div className="mt-2 h-4 w-2/3 rounded bg-[#e5e0d3]" />
                  </div>
                ))}
                <p className="text-center text-sm text-[#1C2420]/60">Loading verses…</p>
              </div>
            )}

            {versesError && (
              <div className="mt-6 rounded-2xl bg-white border border-red-200 p-5 text-center shadow-sm" role="alert">
                <p className="text-sm text-red-700">{versesError}</p>
                <button
                  type="button"
                  onClick={() => { if (currentSurah) void loadSurah(currentSurah, targetVerse); else if (currentJuz) void loadJuz(currentJuz); }}
                  className="mt-3 rounded-full bg-[#0B3D2E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]"
                >
                  Try again
                </button>
              </div>
            )}

            {!versesLoading && !versesError && verses.map((v) => {
              const sNum = Number(v.verse_key.split(':')[0]);
              const bookmarked = isBookmarked(sNum, v.verse_number);
              const tafsir = tafsirs[v.verse_key];
              const translation = stripHtml(v.translations?.[0]?.text ?? '');
              const isPlaying = playingKey === v.verse_key;
              return (
                <article
                  key={v.verse_key}
                  id={`verse-${v.verse_number}`}
                  className={`mt-4 rounded-2xl bg-white border p-5 shadow-sm scroll-mt-24 ${isPlaying ? 'border-[#C9A227] ring-1 ring-[#C9A227]' : 'border-[#e5e0d3]'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] text-xs font-bold text-white">
                      {v.verse_key}
                    </span>
                    {currentJuz && (
                      <span className="text-xs font-semibold text-[#146B4D]">{surahNameForVerse(v)}</span>
                    )}
                  </div>

                  <p dir="rtl" lang="ar" className={`font-quran mt-4 text-right ${arabicSize}`}>
                    {cleanIndopak(v.text_indopak)}
                  </p>
                  {viewMode !== 'arabic' && translation && (
                    <p className="mt-4 text-[15px] leading-relaxed text-[#1C2420]/85">{translation}</p>
                  )}
                  {viewMode !== 'arabic' && <p className="mt-2 text-xs text-[#1C2420]/50">Translation: {translationName}</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#f0ede4] pt-3">
                    <button
                      type="button"
                      onClick={() => toggleVerseAudio(v)}
                      disabled={!v.audio?.url}
                      aria-label={isPlaying && !isPaused ? `Pause verse ${v.verse_key}` : `Play verse ${v.verse_key}`}
                      className="rounded-full bg-[#146B4D] px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[#0B3D2E] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                    >
                      {isPlaying ? (isPaused ? '▶ Resume' : '⏸ Pause') : '▶ Listen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(sNum, surahNameForVerse(v), v.verse_number)}
                      aria-pressed={bookmarked}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] ${bookmarked ? 'border-[#C9A227] bg-[#C9A227]/15 text-[#7a6414]' : 'border-[#e5e0d3] hover:border-[#146B4D]'}`}
                    >
                      {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void shareVerse(v, surahNameForVerse(v))}
                      className="rounded-full border border-[#e5e0d3] px-3.5 py-1.5 text-sm font-semibold hover:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                    >
                      {copiedKey === v.verse_key ? '✓ Copied!' : '↗ Share'}
                    </button>
                  </div>

                  {viewMode === 'tafsir' && (
                    <TafsirAuto verseKey={v.verse_key} tafsir={tafsir} ensureTafsir={ensureTafsir} />
                  )}
                </article>
              );
            })}
            {!versesLoading && !versesError && verses.length > 0 && (
              <p className="mt-6 text-center text-xs text-[#1C2420]/50">End of {currentSurah ? `Surah ${currentSurah.name_simple}` : `Juz ${currentJuz}`} · {verses.length} verses</p>
            )}
          </section>
        )}

        {/* ============ SURAH LIST ============ */}
        {!reading && tab === 'surahs' && (
          <section aria-label="Surah list" className="mt-6">
            {/* Verse of the Day */}
            {votd && (
              <article className="rounded-2xl bg-[#0B3D2E] p-5 text-white shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Verse of the Day · {votdKey}</p>
                <p dir="rtl" lang="ar" className="font-quran mt-3 text-right text-2xl sm:text-3xl">{cleanIndopak(votd.text_indopak)}</p>
                {votd.translations?.[0] && (
                  <p className="mt-3 text-sm leading-relaxed text-emerald-100/90">“{stripHtml(votd.translations[0].text)}”</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const ch = chapterById.get(Number(votdKey.split(':')[0]));
                    if (ch) void loadSurah(ch, Number(votdKey.split(':')[1]));
                  }}
                  className="mt-3 rounded-full bg-[#C9A227] px-4 py-1.5 text-sm font-semibold text-[#0B3D2E] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Read in context →
                </button>
              </article>
            )}

            <label className="mt-5 block">
              <span className="sr-only">Search surahs by name or number</span>
              <input
                type="search"
                value={surahFilter}
                onChange={(e) => setSurahFilter(e.target.value)}
                placeholder="Search surahs by name or number…"
                className="w-full rounded-xl border border-[#e5e0d3] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
              />
            </label>

            {chaptersLoading && (
              <div className="mt-4 space-y-2" aria-live="polite">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-white border border-[#e5e0d3] p-4">
                    <div className="h-4 w-1/2 rounded bg-[#e5e0d3]" />
                  </div>
                ))}
                <p className="text-center text-sm text-[#1C2420]/60">Loading surahs…</p>
              </div>
            )}

            {chaptersError && (
              <div className="mt-4 rounded-2xl bg-white border border-red-200 p-5 text-center shadow-sm" role="alert">
                <p className="text-sm text-red-700">{chaptersError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 rounded-full bg-[#0B3D2E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]"
                >
                  Try again
                </button>
              </div>
            )}

            {!chaptersLoading && !chaptersError && filteredChapters.length === 0 && (
              <p className="mt-6 text-center text-sm text-[#1C2420]/60">No surah matches “{surahFilter}”.</p>
            )}

            <ul className="mt-4 space-y-2">
              {filteredChapters.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => void loadSurah(c)}
                    className="flex w-full items-center gap-3 rounded-xl border border-[#e5e0d3] bg-white p-4 text-left shadow-sm transition hover:border-[#146B4D] hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] text-sm font-bold text-white">{c.id}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c.name_simple} <span className="font-normal text-[#1C2420]/50">· {c.translated_name.name}</span></span>
                      <span className="block text-xs text-[#1C2420]/55">{c.revelation_place === 'makkah' ? 'Makki' : 'Madani'} · {c.verses_count} verses</span>
                    </span>
                    <span dir="rtl" lang="ar" className="font-quran shrink-0 text-xl text-[#146B4D]">{c.name_arabic}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ============ JUZ LIST ============ */}
        {!reading && tab === 'juz' && (
          <section aria-label="Juz list" className="mt-6">
            <p className="text-sm text-[#1C2420]/65">
              The Quran is divided into 30 Juz (Para). Tap one to read it in the Indo-Pak script.
            </p>
            <ul className="mt-4 space-y-2">
              {JUZ_DATA.map((j) => (
                <li key={j.juz}>
                  <button
                    type="button"
                    onClick={() => void loadJuz(j.juz)}
                    className="flex w-full items-center gap-3 rounded-xl border border-[#e5e0d3] bg-white p-4 text-left shadow-sm transition hover:border-[#146B4D] hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] text-sm font-bold text-white">{j.juz}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">Juz {j.juz} · {j.name}</span>
                      <span className="block text-xs text-[#1C2420]/55">Starts at {j.start} · Surahs {j.surahs.join(', ')}</span>
                    </span>
                    <span dir="rtl" lang="ar" className="font-quran shrink-0 text-xl text-[#146B4D]">{j.ar}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ============ SEARCH ============ */}
        {!reading && tab === 'search' && (
          <section aria-label="Search the Quran" className="mt-6">
            <form onSubmit={(e) => void runSearch(e)} className="flex gap-2">
              <label className="flex-1">
                <span className="sr-only">Search the Quran in English</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a word or phrase, e.g. mercy, patience…"
                  className="w-full rounded-xl border border-[#e5e0d3] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                />
              </label>
              <button
                type="submit"
                disabled={searchLoading || searchQuery.trim().length < 2}
                className="shrink-0 rounded-xl bg-[#0B3D2E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#146B4D] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
              >
                {searchLoading ? 'Searching…' : 'Search'}
              </button>
            </form>
            <p className="mt-2 text-xs text-[#1C2420]/55">Searches the English translation across all 114 surahs. Results open in the Indo-Pak script reader.</p>

            {searchError && (
              <div className="mt-4 rounded-2xl bg-white border border-red-200 p-5 text-center shadow-sm" role="alert">
                <p className="text-sm text-red-700">{searchError}</p>
                <button type="button" onClick={() => void runSearch()} className="mt-3 rounded-full bg-[#0B3D2E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]">Try again</button>
              </div>
            )}

            {searchDone && searchResults.length === 0 && (
              <p className="mt-6 text-center text-sm text-[#1C2420]/60">No verses found for “{searchQuery}”. Try a different word.</p>
            )}

            <ul className="mt-4 space-y-3">
              {searchResults.map((hit) => (
                <li key={hit.verse_key}>
                  <button
                    type="button"
                    onClick={() => openSearchHit(hit)}
                    className="block w-full rounded-2xl border border-[#e5e0d3] bg-white p-5 text-left shadow-sm transition hover:border-[#146B4D] hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-[#146B4D]">
                      {chapterById.get(hit.surahNumber)?.name_simple ?? `Surah ${hit.surahNumber}`} · {hit.verse_key}
                    </span>
                    {hit.arabic && (
                      <span dir="rtl" lang="ar" className="font-quran mt-2 block text-right text-2xl">{hit.arabic}</span>
                    )}
                    {hit.translation && (
                      <span className="mt-2 block text-sm leading-relaxed text-[#1C2420]/85">“{hit.translation}”</span>
                    )}
                    <span className="mt-2 block text-xs font-semibold text-[#C9A227]">Tap to read in context →</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ============ BOOKMARKS ============ */}
        {!reading && tab === 'bookmarks' && (
          <section aria-label="Bookmarks" className="mt-6">
            {bookmarks.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#e5e0d3] p-6 text-center shadow-sm">
                <p className="text-3xl">☆</p>
                <p className="mt-2 font-semibold">No bookmarks yet</p>
                <p className="mt-1 text-sm text-[#1C2420]/60">Tap “Bookmark” on any verse to save it here. Bookmarks are stored on this device.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {[...bookmarks].sort((a, b) => b.timestamp - a.timestamp).map((b) => (
                  <li key={`${b.surahNumber}:${b.verseNumber}`} className="flex items-center gap-3 rounded-xl border border-[#e5e0d3] bg-white p-4 shadow-sm">
                    <button
                      type="button"
                      onClick={() => openBookmark(b)}
                      className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] rounded"
                    >
                      <span className="block truncate font-semibold">{b.surahName || `Surah ${b.surahNumber}`} · {b.surahNumber}:{b.verseNumber}</span>
                      <span className="block text-xs text-[#1C2420]/55">{new Date(b.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(b.surahNumber, b.surahName, b.verseNumber)}
                      aria-label={`Remove bookmark ${b.surahNumber}:${b.verseNumber}`}
                      className="shrink-0 rounded-full border border-[#e5e0d3] px-3 py-1.5 text-sm font-semibold text-red-700 hover:border-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ============ READING PLAN ============ */}
        {!reading && tab === 'plan' && (
          <section aria-label="30 Juz reading plan" className="mt-6">
            <div className="rounded-2xl bg-white border border-[#e5e0d3] p-5 shadow-sm">
              <h2 className="text-lg font-bold">Read the Quran in 30 Days</h2>
              <p className="mt-1 text-sm text-[#1C2420]/65">One Juz a day. Tick each Juz off as you finish it — your progress is saved on this device.</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#e5e0d3]" role="progressbar" aria-valuenow={juzDone.length} aria-valuemin={0} aria-valuemax={30} aria-label="Reading plan progress">
                  <div className="h-full rounded-full bg-[#146B4D] transition-all" style={{ width: `${(juzDone.length / 30) * 100}%` }} />
                </div>
                <span className="shrink-0 text-sm font-bold text-[#146B4D]">{juzDone.length}/30 juz done</span>
              </div>
              {juzDone.length === 30 && (
                <p className="mt-3 rounded-xl bg-[#C9A227]/15 px-4 py-2 text-sm font-semibold text-[#7a6414]">MashaAllah — you have completed all 30 Juz!</p>
              )}
            </div>
            <ul className="mt-4 space-y-2">
              {JUZ_DATA.map((j) => {
                const done = juzDone.includes(j.juz);
                return (
                  <li key={j.juz} className="flex items-center gap-3 rounded-xl border border-[#e5e0d3] bg-white p-4 shadow-sm">
                    <input
                      type="checkbox"
                      id={`juz-plan-${j.juz}`}
                      checked={done}
                      onChange={() => toggleJuzDone(j.juz)}
                      className="h-5 w-5 shrink-0 accent-[#146B4D]"
                    />
                    <label htmlFor={`juz-plan-${j.juz}`} className={`min-w-0 flex-1 cursor-pointer ${done ? 'line-through text-[#1C2420]/45' : ''}`}>
                      <span className="block truncate font-semibold">Juz {j.juz} · {j.name}</span>
                      <span className="block text-xs text-[#1C2420]/55">Starts at {j.start}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => void loadJuz(j.juz)}
                      className="shrink-0 rounded-full border border-[#e5e0d3] px-3 py-1.5 text-sm font-semibold hover:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                    >
                      Read →
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Footer note */}
        {!reading && (
          <p className="mt-8 text-center text-xs leading-relaxed text-[#1C2420]/50">
            Arabic text in the Indo-Pak Mushaf script, with English translation, audio and tafsir
            from Quran.com. Translations: Saheeh International, Yusuf Ali, Pickthall, Abdel Haleem, Taqi Usmani.
            Tafsir: Ibn Kathir (Abridged).
          </p>
        )}
      </div>
    </main>
  );
}
