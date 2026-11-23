// app/hifz/components/SurahClient.tsx — the surah study page island (spec §4.1).
// Server page fetches the verses; this client island renders them (SSR'd on
// first paint) and owns all interaction: coach entry, read/pagination,
// listen + repeat controls, word-by-word, view modes incl. tafsir, bookmarks,
// mark-memorised. The RecitationCoach is loaded ONLY via dynamic import
// when the user opens it (?mode=recite or taps "Recite") — never in the
// first-paint bundle (spec §6).
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  API, AUDIO_BASE, TRANSLATIONS, RECITERS, TAFSIRS, TAFSIR_ID, groupByLanguage, stripHtml, cleanIndopak, verseText,
  type Verse,
} from '../../quran/lib';
import { ALL_SURAHS, type HifzSurah } from '../surahs';
import { getTopic } from '../topics';
import { useScriptPref, SCRIPT_LABELS } from '../lib/script';
import { attributionFor } from '../lib/fetch';
import {
  loadProgress, saveProgress, loadSettings, saveSettings, markAttempt,
  type HifzProgress,
} from '../progress';
import {
  MODE_EVENT, loadMode, saveMode, loadListenPosition, saveListenPosition,
  type HifzMode,
} from '../lib/mode';
import ToolIcon from '../../components/ToolIcon';
import TafsirBlock from './TafsirBlock';
import SearchablePicker from './SearchablePicker';
import WordByWord from './WordByWord';
import { TajweedGuide, HiddenWords, tajweedClass } from './SharedSheets';
import type { CoachAyah } from './RecitationCoach';
import { useT, t as tr, getUiLocale } from '../lib/i18n';

const RecitationCoach = dynamic(() => import('./RecitationCoach'), { ssr: false });

type ViewMode = 'arabic' | 'translation' | 'tafsir';
const PAGE_SIZE = 25;
const LISTEN_KEY = 'ili_hifz_listen_v1';
const TAFSIR_KEY = 'ili_hifz_tafsir_v1';

interface ListenSettings {
  repeat: number;
  pauseSec: number;
  speed: number;
  fromAyah: number;
  toAyah: number;
  /** Word-by-word listening: play each word's clip in turn, highlighting it. */
  wordByWord: boolean;
}

function loadListenSettings(ayahCount: number): ListenSettings {
  try {
    const raw = localStorage.getItem(LISTEN_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<ListenSettings>;
      return {
        repeat: Math.min(100, Math.max(1, Number(p.repeat ?? 1) || 1)),
        pauseSec: Math.min(10, Math.max(0, Number(p.pauseSec ?? 0) || 0)),
        speed: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].includes(Number(p.speed))
          ? Number(p.speed)
          : 1,
        fromAyah: Math.min(ayahCount, Math.max(1, Number(p.fromAyah ?? 1) || 1)),
        toAyah: Math.min(ayahCount, Math.max(1, Number(p.toAyah ?? ayahCount) || ayahCount)),
        wordByWord: p.wordByWord === true,
      };
    }
  } catch {
    /* defaults */
  }
  return { repeat: 1, pauseSec: 0, speed: 1, fromAyah: 1, toAyah: ayahCount, wordByWord: false };
}

export default function SurahClient({
  surah,
  initialVerses,
  coachOpen: initialCoachOpen = false,
  initialAyah = 1,
}: {
  surah: HifzSurah;
  initialVerses: Verse[];
  coachOpen?: boolean;
  initialAyah?: number;
}) {
  const [verses, setVerses] = useState<Verse[]>(initialVerses);
  const t = useT();
  const [versesError, setVersesError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('translation');
  const [translationId, setTranslationId] = useState(20);
  const [reciterId, setReciterId] = useState(7);
  const [tafsirId, setTafsirId] = useState(TAFSIR_ID);
  const translationGroups = useMemo(() => groupByLanguage(TRANSLATIONS), []);
  const tafsirGroups = useMemo(() => groupByLanguage(TAFSIRS), []);
  const [script, setScript] = useScriptPref();
  const [page, setPage] = useState(1);
  const [coachOpen, setCoachOpen] = useState(initialCoachOpen);
  const [coachAyahIndex, setCoachAyahIndex] = useState(
    Math.max(0, Math.min(initialAyah - 1, Math.max(0, initialVerses.length - 1))),
  );

  /* ?mode=recite / ?mode=listen / ?mode=memorise / ?ayah=N are read
   * client-side (the server page stays fully static — reading searchParams
   * server-side would force dynamic rendering of all 6,236 ayah pages). */
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('mode') === 'recite') setCoachOpen(true);
      if (q.get('mode') === 'listen') setAutoListen(true);
      if (q.get('mode') === 'memorise') {
        setMemoriseMode(true);
        setCoachOpen(true);
        setHideMode('ayah');
        setHiddenAyahs(new Set(initialVerses.map((v) => v.verse_number)));
      }
      const ayah = Number(q.get('ayah') ?? '');
      if (ayah >= 1 && ayah <= surah.ayahCount) setCoachAyahIndex(ayah - 1);
      const pos = loadListenPosition();
      if (pos && pos.surah === surah.id) setSavedListenPos(pos.ayah);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [bookmarks, setBookmarks] = useState<{ surahNumber: number; verseNumber: number }[]>([]);
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [wordsOpen, setWordsOpen] = useState<Record<string, boolean>>({});
  // Screenshot-spec rebuild (§22): Adaptive Mode, Tajweed colours (display
  // only), hide ayah markers, memorisation hide per ayah.
  const [adaptive, setAdaptive] = useState(false);
  const [adaptiveFont, setAdaptiveFont] = useState(28);
  const [tajweedOn, setTajweedOn] = useState(false);
  const [showTajweedGuide, setShowTajweedGuide] = useState(false);
  const [hideMarkers, setHideMarkers] = useState(false);
  // Colour-code ayahs by topic (study aid, §23). Default on.
  const [topicColors, setTopicColors] = useState(true);
  const [hiddenAyahs, setHiddenAyahs] = useState<Set<number>>(new Set());
  const [revealedAyah, setRevealedAyah] = useState<Record<number, number>>({});
  const [memoriseMode, setMemoriseMode] = useState(false);
  // Stage 5 (§8) — proper memorisation mode: a selectable range, two
  // hiding styles, and range-level reveal controls.
  //   'ayah'  — whole ayahs hidden (grey rules per word, existing
  //             HiddenWords path); reveal one word or one ayah at a time.
  //   'words' — ayahs stay visible in structure (numbers shown) but every
  //             word in the range is hidden; one counter walks the range
  //             in reading order, so "Reveal next word" peeks the next
  //             word of the passage, not of one ayah.
  const [hideMode, setHideMode] = useState<'ayah' | 'words'>('ayah');
  const [memFrom, setMemFrom] = useState(1);
  const [memTo, setMemTo] = useState(surah.ayahCount);
  const [rangeRevealed, setRangeRevealed] = useState(0);
  // ?mode=listen handoff: start Listen once the component is mounted.
  const [autoListen, setAutoListen] = useState(false);
  // Peek recording (Stage 4): one peek per ayah per page-view is recorded
  // as help-needed — markAttempt(…, 'peek') resets that ayah's correct
  // streak and puts it in the revision queue. Peeking five words of one
  // ayah is one missed ayah, not five.
  const peekedAyahsRef = useRef<Set<number>>(new Set());
  const recordPeek = useCallback((ayah: number) => {
    if (peekedAyahsRef.current.has(ayah)) return;
    peekedAyahsRef.current.add(ayah);
    try {
      const next = markAttempt(loadProgress(), surah.id, ayah, 'peek');
      saveProgress(next);
      setProgress(next);
    } catch {
      /* storage unavailable — the reveal still works */
    }
  }, [surah.id]);
  // Stage 9 (React #418): initialise Listen to the defaults so the first
  // client render matches the SSR HTML exactly, then apply the saved prefs
  // in an effect after mount (the useScriptPref pattern). Reading
  // localStorage in the lazy initialiser made the first client render say
  // "Play ayahs 1–7" (prefs clamped to the previous, shorter surah) while
  // the server said "1–286", so React discarded the SSR output and logged
  // #418 on every hard load after visiting a short surah. The persisted
  // effect below skips until this load has run, so the defaults never
  // overwrite the saved prefs.
  const [listen, setListen] = useState<ListenSettings>({ repeat: 1, pauseSec: 0, speed: 1, fromAyah: 1, toAyah: surah.ayahCount, wordByWord: false });
  const [listenHydrated, setListenHydrated] = useState(false);
  useEffect(() => {
    setListen(loadListenSettings(surah.ayahCount));
    setListenHydrated(true);
  }, [surah.ayahCount]);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [listenPlaying, setListenPlaying] = useState(false);
  // Listening as a real mode (Stage 4): true while the user is in Listen
  // mode, even between repeats / pauses — the pill stays lit and the
  // listen panel is highlighted. Cleared by Stop or by switching mode.
  const [listenMode, setListenMode] = useState(false);
  // Saved Listen position for this surah (resume where it stopped).
  const [savedListenPos, setSavedListenPos] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenQueueRef = useRef<{ key: string; url: string; repeatsLeft: number }[]>([]);
  const listenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translationName = TRANSLATIONS.find((t) => t.id === translationId)?.name ?? 'Saheeh International';
  const reciterName = RECITERS.find((r) => r.id === reciterId)?.name ?? 'Mishary Alafasy';

  /* ---------- saved state ---------- */
  useEffect(() => {
    try {
      const b = localStorage.getItem('quran_bookmarks_v2');
      if (b) {
        const raw = JSON.parse(b) as { surahNumber?: number; surah?: number; verseNumber?: number; ayah?: number }[];
        setBookmarks(raw.map((x) => ({ surahNumber: Number(x.surahNumber ?? x.surah ?? 1), verseNumber: Number(x.verseNumber ?? x.ayah ?? 1) })));
      }
      setProgress(loadProgress());
      const s = loadSettings();
      setReciterId(s.reciterId);
      setTranslationId(s.translationId);
      const storedTafsir = Number(localStorage.getItem(TAFSIR_KEY) ?? '');
      if (TAFSIRS.some((t) => t.id === storedTafsir)) setTafsirId(storedTafsir);
      setTajweedOn(s.tajweedColors ?? false);
      setHideMarkers(s.hideAyahMarkers ?? false);
      setTopicColors(s.topicColors ?? true);
      // Last-read marker (spec §22.4): Progress shows "Continue where you left off".
      localStorage.setItem(
        'ili_last_read_v1',
        JSON.stringify({ surah: surah.id, name: surah.name, slug: surah.slug, at: Date.now() }),
      );
      // Recently opened surahs (Stage 2): most recent first, max 5, for the
      // homepage surah list. Same write, no extra render.
      const rawRecent = localStorage.getItem('ili_hifz_recent_surahs_v1');
      const prevRecent = rawRecent ? (JSON.parse(rawRecent) as { id?: number; at?: number }[]) : [];
      const nextRecent = [{ id: surah.id, at: Date.now() }, ...prevRecent.filter((x) => x?.id !== surah.id)].slice(0, 5);
      localStorage.setItem('ili_hifz_recent_surahs_v1', JSON.stringify(nextRecent));
    } catch {
      /* storage unavailable — reading still works */
    }
  }, [surah.id, surah.name, surah.slug]);

  useEffect(() => {
    try {
      localStorage.setItem('quran_bookmarks_v2', JSON.stringify(bookmarks.map((b) => ({ ...b, surahName: surah.name, timestamp: Date.now() }))));
    } catch {
      /* ignore */
    }
  }, [bookmarks, surah.name]);

  useEffect(() => {
    // Stage 9 (#418): skip until the saved prefs have been applied — the
    // defaults must never overwrite them on mount.
    if (!listenHydrated) return;
    try {
      localStorage.setItem(LISTEN_KEY, JSON.stringify(listen));
    } catch {
      /* ignore */
    }
  }, [listen, listenHydrated]);

  useEffect(() => {
    try {
      localStorage.setItem(TAFSIR_KEY, String(tafsirId));
    } catch {
      /* ignore */
    }
  }, [tafsirId]);

  /* ---------- refetch when translation / reciter changes ---------- */
  const refetchVerses = useCallback(async (tId: number, rId: number) => {
    try {
      const res = await fetch(
        `${API}/verses/by_chapter/${surah.id}?fields=text_indopak,text_uthmani&translations=${tId}&audio=${rId}&per_page=all`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVerses((data.verses as Verse[]) ?? []);
      setVersesError('');
    } catch {
      setVersesError(tr('surah.reloadError', getUiLocale()));
    }
  }, [surah.id]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void refetchVerses(translationId, reciterId);
    try {
      const s = loadSettings();
      saveSettings({ ...s, translationId, reciterId });
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationId, reciterId]);

  /* ---------- coach ayahs ---------- */
  const coachAyahs: CoachAyah[] = useMemo(
    () =>
      verses.map((v) => ({
        surah: surah.id,
        ayah: v.verse_number,
        text: cleanIndopak(v.text_indopak),
        translation: stripHtml(v.translations?.[0]?.text ?? ''),
        audioUrl: v.audio?.url,
      })),
    [verses, surah.id],
  );

  /* ---------- bookmarks / memorised ---------- */
  const isBookmarked = (ayah: number) =>
    bookmarks.some((b) => b.surahNumber === surah.id && b.verseNumber === ayah);

  const toggleBookmark = (ayah: number) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.surahNumber === surah.id && b.verseNumber === ayah);
      if (exists) return prev.filter((b) => !(b.surahNumber === surah.id && b.verseNumber === ayah));
      return [...prev, { surahNumber: surah.id, verseNumber: ayah }];
    });
  };

  const ayahStatus = (ayah: number) => progress?.ayahs[`${surah.id}:${ayah}`]?.status ?? 'new';

  const toggleMemorised = (ayah: number) => {
    try {
      const p = loadProgress();
      const key = `${surah.id}:${ayah}`;
      const prev = p.ayahs[key];
      const now = new Date().toISOString();
      const next: HifzProgress = {
        ...p,
        ayahs: {
          ...p.ayahs,
          [key]:
            prev?.status === 'memorised'
              ? { status: 'learning', correctStreak: 0, lastPractised: now, attempts: (prev.attempts ?? 0) + 1 }
              : { status: 'memorised', correctStreak: 3, lastPractised: now, attempts: (prev?.attempts ?? 0) + 1 },
        },
      };
      saveProgress(next);
      setProgress(next);
    } catch {
      /* storage unavailable — the toggle just doesn't persist */
    }
  };

  /* ---------- single-ayah audio ---------- */
  const playVerseAudio = useCallback((v: Verse) => {
    const audio = audioRef.current;
    if (!audio || !v.audio?.url) return;
    stopListen();
    audio.src = `${AUDIO_BASE}${v.audio.url}`;
    audio.playbackRate = listen.speed;
    audio.play().catch(() => setPlayingKey(null));
    setPlayingKey(v.verse_key);
  }, [listen.speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setPlayingKey(null);
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, []);

  /* ---------- word-by-word listening: play each word's clip in turn,
       highlighting it in the Arabic line. Uses a second audio element so
       the whole-ayah listen queue is untouched. Word clips come from the
       same words payload as WordByWord (verses.quran.com wbw/*.mp3, one
       clip per word, fetched through the same-origin proxy and cached per
       ayah). If an ayah has no word audio at all, that ayah falls back to
       whole-ayah audio with a note — never a silent failure. Words without
       a clip are skipped, not stalled on. Repeat / pause / speed apply per
       ayah exactly as in whole-ayah listening. The three functions below
       only touch refs and React setters (plus the stable fetchWbwWords),
       so any render's copy is equivalent — they are driven from the
       word-audio 'ended' handler via wbwNextRef.
       RECITER LIMIT (verified live against api.quran.com 2026-11-23):
       the `audio=<reciterId>` parameter does NOT change the word clips —
       with audio=2 and audio=7 the words payload still returns the same
       `wbw/001_001_001.mp3` audio_url. The wbw clips are one fixed voice
       with no per-reciter variant in Quran.com v4, so word-by-word clips
       deliberately ignore the selected reciter. Do NOT "fix" this by
       passing the reciter id — it was probed and the API ignores it.
       Per-reciter word-by-word follow-along DOES exist by another route:
       the ayah audio object carries `segments` (per-word timings inside
       the selected reciter's continuous audio) — see the Mushaf reader's
       Listen engine, which highlights words from those timings. ---------- */
  interface WbwWord {
    arabic: string;
    translation: string;
    transliteration: string;
    audioUrl?: string;
  }

  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const wbwCacheRef = useRef(new Map<string, WbwWord[]>());
  const wbwRunRef = useRef<{
    ayahs: { key: string; url: string; indopak: string }[];
    pos: number;
    repeat: number;
    repeatsLeft: number;
    pauseSec: number;
    speed: number;
    words: WbwWord[];
    wordPos: number;
  } | null>(null);
  const wbwNextRef = useRef<(() => void) | null>(null);
  const wbwTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wbw, setWbw] = useState<{ key: string; index: number } | null>(null);
  const [wbwNote, setWbwNote] = useState('');

  const fetchWbwWords = useCallback(async (key: string, indopakText: string): Promise<WbwWord[]> => {
    const cached = wbwCacheRef.current.get(key);
    if (cached) return cached;
    try {
      const res = await fetch(`${API}/verses/by_key/${key}?fields=text_indopak&words=true`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = (data?.verse?.words ?? []) as Record<string, unknown>[];
      const infos = raw
        .filter((w) => w.char_type_name === 'word')
        .map((w) => ({
          translation: String((w.translation as { text?: string } | undefined)?.text ?? ''),
          transliteration: String(
            (w.transliteration as { text?: string } | undefined)?.text ?? '',
          ),
          audioUrl: typeof w.audio_url === 'string' ? w.audio_url : undefined,
        }));
      const display = cleanIndopak(indopakText).split(/\s+/).filter(Boolean);
      const words = display.map((arabic, i) => ({
        arabic,
        translation: infos[i]?.translation ?? '',
        transliteration: infos[i]?.transliteration ?? '',
        audioUrl: infos[i]?.audioUrl,
      }));
      wbwCacheRef.current.set(key, words);
      return words;
    } catch {
      return [];
    }
  }, []);

  const wbwStop = useCallback(() => {
    wbwRunRef.current = null;
    wbwNextRef.current = null;
    if (wbwTimerRef.current) {
      clearTimeout(wbwTimerRef.current);
      wbwTimerRef.current = null;
    }
    const a = wordAudioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute('src');
    }
    setWbw(null);
    setWbwNote('');
  }, []);

  const wbwFinish = () => {
    wbwRunRef.current = null;
    wbwNextRef.current = null;
    setListenPlaying(false);
    setListenMode(false);
    setPlayingKey(null);
    setWbw(null);
    setWbwNote('');
  };

  const wbwAfterAyah = () => {
    const run = wbwRunRef.current;
    if (!run) return;
    if (run.repeatsLeft > 1) {
      run.repeatsLeft -= 1;
    } else {
      run.pos += 1;
      if (run.pos >= run.ayahs.length) {
        wbwFinish();
        return;
      }
      run.repeatsLeft = run.repeat;
    }
    if (run.pauseSec > 0) {
      wbwTimerRef.current = setTimeout(() => {
        if (wbwRunRef.current) void wbwStartAyah();
      }, run.pauseSec * 1000);
    } else {
      void wbwStartAyah();
    }
  };

  const wbwPlayWord = () => {
    const run = wbwRunRef.current;
    const audio = wordAudioRef.current;
    if (!run || !audio) return;
    while (run.wordPos < run.words.length && !run.words[run.wordPos]?.audioUrl) {
      run.wordPos += 1;
    }
    if (run.wordPos >= run.words.length) {
      wbwAfterAyah();
      return;
    }
    const ayah = run.ayahs[run.pos];
    const word = run.words[run.wordPos];
    audio.src = `${AUDIO_BASE}${word.audioUrl}`;
    audio.playbackRate = run.speed;
    setWbw({ key: ayah.key, index: run.wordPos });
    wbwNextRef.current = () => {
      const r = wbwRunRef.current;
      if (r) r.wordPos += 1;
      wbwPlayWord();
    };
    audio.play().catch(() => {
      const r = wbwRunRef.current;
      if (r) r.wordPos += 1;
      wbwPlayWord();
    });
  };

  const wbwStartAyah = async () => {
    const run = wbwRunRef.current;
    const audio = wordAudioRef.current;
    if (!run || !audio) return;
    const ayah = run.ayahs[run.pos];
    if (!ayah) {
      wbwFinish();
      return;
    }
    const words = await fetchWbwWords(ayah.key, ayah.indopak);
    if (wbwRunRef.current !== run) return; // stopped while fetching
    setPlayingKey(ayah.key);
    if (!words.some((w) => w.audioUrl)) {
      // Fallback: no word audio for this ayah — whole-ayah audio instead.
      setWbw(null);
      setWbwNote(t('surah.wbwFallback'));
      audio.src = `${AUDIO_BASE}${ayah.url}`;
      audio.playbackRate = run.speed;
      wbwNextRef.current = () => wbwAfterAyah();
      audio.play().catch(() => wbwAfterAyah());
      return;
    }
    setWbwNote('');
    run.words = words;
    run.wordPos = 0;
    wbwPlayWord();
  };

  useEffect(() => {
    const audio = wordAudioRef.current;
    if (!audio) return;
    const onEnded = () => {
      wbwNextRef.current?.();
    };
    const onError = () => {
      wbwNextRef.current?.();
    };
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  /* ---------- listen: play-all with repeat / range loop / pause / speed ---------- */
  const stopListen = useCallback(() => {
    wbwStop();
    listenQueueRef.current = [];
    if (listenTimerRef.current) clearTimeout(listenTimerRef.current);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
    }
    setListenPlaying(false);
    setListenMode(false);
    setPlayingKey(null);
  }, [wbwStop]);

  const playNextInQueue = useCallback(() => {
    const audio = audioRef.current;
    const item = listenQueueRef.current[0];
    if (!item || !audio) {
      setListenPlaying(false);
      setPlayingKey(null);
      return;
    }
    audio.src = `${AUDIO_BASE}${item.url}`;
    audio.playbackRate = listen.speed;
    setPlayingKey(item.key);
    audio.play().catch(() => {
      setListenPlaying(false);
      setPlayingKey(null);
    });
  }, [listen.speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const item = listenQueueRef.current[0];
      if (!item) return;
      if (item.repeatsLeft > 1) {
        item.repeatsLeft -= 1;
        if (listen.pauseSec > 0) {
          listenTimerRef.current = setTimeout(() => playNextInQueue(), listen.pauseSec * 1000);
          return;
        }
        playNextInQueue();
        return;
      }
      listenQueueRef.current.shift();
      if (listenQueueRef.current.length > 0) {
        if (listen.pauseSec > 0) {
          listenTimerRef.current = setTimeout(() => playNextInQueue(), listen.pauseSec * 1000);
          return;
        }
        playNextInQueue();
      } else {
        setListenPlaying(false);
        setPlayingKey(null);
      }
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [listen.pauseSec, playNextInQueue]);

  const startListen = () => {
    const from = Math.min(listen.fromAyah, listen.toAyah);
    const to = Math.max(listen.fromAyah, listen.toAyah);
    const inRange = verses.filter(
      (v) => v.verse_number >= from && v.verse_number <= to && v.audio?.url,
    );
    if (inRange.length === 0) return;
    setListenMode(true);
    saveMode('listen');
    if (listen.wordByWord) {
      stopListen();
      setListenMode(true); // stopListen clears the mode flag; re-assert it
      wbwRunRef.current = {
        ayahs: inRange.map((v) => ({ key: v.verse_key, url: v.audio!.url!, indopak: v.text_indopak })),
        pos: 0,
        repeat: listen.repeat,
        repeatsLeft: listen.repeat,
        pauseSec: listen.pauseSec,
        speed: listen.speed,
        words: [],
        wordPos: 0,
      };
      setListenPlaying(true);
      setWbwNote('');
      void wbwStartAyah();
      return;
    }
    const items = inRange.map((v) => ({ key: v.verse_key, url: v.audio!.url!, repeatsLeft: listen.repeat }));
    listenQueueRef.current = items;
    setListenPlaying(true);
    playNextInQueue();
  };

  /* ---------- floating mode switcher: apply mode changes in place ----------
     Switching must stop the previous mode cleanly (Stage 3 contract):
     - leaving Recite unmounts the coach, whose cleanup aborts the live
       Tilawa session and stops its audio — no invisible mic session.
     - leaving Listen calls stopListen(): both <audio> elements pause and
       the queue clears. Test is not handled here: the switcher navigates
       to /hifz/test instead (no preventDefault). */
  const applyModeRef = useRef<(mode: HifzMode) => void>(() => {});
  applyModeRef.current = (mode: HifzMode) => {
    if (mode === 'test') return; // let the switcher navigate
    if (mode === 'reading') {
      stopListen();
      setCoachOpen(false);
      setMemoriseMode(false);
      setHiddenAyahs(new Set());
      saveMode('reading');
    } else if (mode === 'recite') {
      stopListen();
      setMemoriseMode(false);
      setCoachOpen(true);
      saveMode('recite');
    } else if (mode === 'listen') {
      setCoachOpen(false);
      setListenMode(true);
      saveMode('listen');
      startListen();
    } else if (mode === 'memorise') {
      stopListen();
      setMemoriseMode(true);
      setCoachOpen(true);
      setHideMode('ayah');
      setHiddenAyahs(new Set(verses.map((v) => v.verse_number)));
      saveMode('memorise');
    }
  };
  useEffect(() => {
    const onMode = (e: Event) => {
      const m = (e as CustomEvent<{ mode: HifzMode }>).detail?.mode;
      if (!m || m === 'test') return;
      e.preventDefault();
      applyModeRef.current(m);
    };
    window.addEventListener(MODE_EVENT, onMode);
    return () => window.removeEventListener(MODE_EVENT, onMode);
  }, []);
  // ?mode=listen handoff from the switcher / other pages.
  useEffect(() => {
    if (autoListen && verses.length > 0) {
      setAutoListen(false);
      setListenMode(true);
      saveMode('listen');
      startListen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoListen, verses]);

  /* ---------- pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(verses.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageVerses = verses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* ---------- follow-along auto-scroll (spec §22.5) ---------- */
  useEffect(() => {
    if (!listenPlaying || !playingKey) return;
    const n = Number(playingKey.split(':')[1]);
    if (!n) return;
    // Remember where Listen stopped, so a return visit can resume.
    saveListenPosition(surah.id, n);
    setSavedListenPos(n);
    const idx = verses.findIndex((v) => v.verse_number === n);
    if (idx >= 0) {
      const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
      if (targetPage !== safePage) {
        setPage(targetPage);
        return;
      }
    }
    document.querySelector(`#ayah-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [playingKey, listenPlaying, verses, safePage]);


  const toggleWords = (key: string) =>
    setWordsOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleHiddenAyah = (ayah: number) => {
    setHiddenAyahs((prev) => {
      const next = new Set(prev);
      if (next.has(ayah)) {
        // Revealing a hidden ayah is a peek: recorded as help-needed.
        recordPeek(ayah);
        next.delete(ayah);
      } else next.add(ayah);
      return next;
    });
  };

  /* Stage 5 (§8): the memorisation range, in reading order. `offsets`
   * maps each ayah in the range to its word span inside the range, so
   * "Reveal next word" walks the passage word by word and "Reveal next
   * ayah" jumps to the end of the next unrevealed ayah. */
  const memRange = useMemo(() => {
    const from = Math.min(memFrom, memTo);
    const to = Math.max(memFrom, memTo);
    const inRange = verses.filter((v) => v.verse_number >= from && v.verse_number <= to);
    let total = 0;
    const offsets = new Map<number, { start: number; count: number }>();
    for (const v of inRange) {
      const count = verseText(v, script).split(' ').filter(Boolean).length;
      offsets.set(v.verse_number, { start: total, count });
      total += count;
    }
    return { from, to, inRange, offsets, total };
  }, [verses, script, memFrom, memTo]);
  const rangeWordTotal = memRange.total;

  const revealNextWordInRange = () => {
    if (hideMode === 'words') {
      if (rangeRevealed >= rangeWordTotal) return;
      const entry = memRange.inRange.find((v) => {
        const o = memRange.offsets.get(v.verse_number)!;
        return rangeRevealed >= o.start && rangeRevealed < o.start + o.count;
      });
      if (entry) {
        recordPeek(entry.verse_number);
        // A per-ayah hide on this ayah would outrank the range counter —
        // revealing into it lifts that hide (the peek is already recorded).
        if (hiddenAyahs.has(entry.verse_number)) {
          setHiddenAyahs((prev) => {
            const next = new Set(prev);
            next.delete(entry.verse_number);
            return next;
          });
          setRevealedAyah((prev) => {
            const next = { ...prev };
            delete next[entry.verse_number];
            return next;
          });
        }
      }
      setRangeRevealed((r) => Math.min(rangeWordTotal, r + 1));
      return;
    }
    // Ayah mode: reveal the next word of the first still-hidden ayah.
    const target = memRange.inRange.find((v) => hiddenAyahs.has(v.verse_number));
    if (!target) return;
    recordPeek(target.verse_number);
    setRevealedAyah((prev) => ({
      ...prev,
      [target.verse_number]: (prev[target.verse_number] ?? 0) + 1,
    }));
  };

  const revealNextAyahInRange = () => {
    if (hideMode === 'words') {
      const target = memRange.inRange.find((v) => {
        const o = memRange.offsets.get(v.verse_number)!;
        return rangeRevealed < o.start + o.count;
      });
      if (!target) return;
      const o = memRange.offsets.get(target.verse_number)!;
      recordPeek(target.verse_number);
      if (hiddenAyahs.has(target.verse_number)) {
        setHiddenAyahs((prev) => {
          const next = new Set(prev);
          next.delete(target.verse_number);
          return next;
        });
        setRevealedAyah((prev) => {
          const next = { ...prev };
          delete next[target.verse_number];
          return next;
        });
      }
      setRangeRevealed(o.start + o.count);
      return;
    }
    // Ayah mode: reveal the first still-hidden ayah (records a peek).
    const target = memRange.inRange.find((v) => hiddenAyahs.has(v.verse_number));
    if (!target) return;
    toggleHiddenAyah(target.verse_number);
  };

  const renderArabic = (text: string) => {
    if (!tajweedOn) return text;
    return (
      <>
        {text.split(' ').map((w, i) => (
          <span key={i} className={tajweedClass(w)}>
            {w}{' '}
          </span>
        ))}
      </>
    );
  };

  return (
    <div>
      <audio ref={audioRef} preload="none" className="hidden" />
      <audio ref={wordAudioRef} preload="none" className="hidden" />

      {/* ---------- READER HEADER (variant A: hamburger · search · centred
           Chapter / Verse title + chevrons · bookmark · gear) ---------- */}
      <header className="mt-4 flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-2 py-2 shadow-sm sm:px-3" aria-label={t('surah.readerHeader')}>
        <Link href="/hifz" aria-label={t('surah.menuLabel')} className="rounded-full p-2 text-lg font-bold hover:bg-[#FFFBF2]">☰</Link>
        <Link href="/hifz/search" aria-label={t('surah.searchLabel')} className="rounded-full p-2 text-lg font-bold hover:bg-[#FFFBF2]">⌕</Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[13px] font-bold text-[#102E26] sm:text-sm"><span className="hidden sm:inline">{t('surah.chapter')} </span>{surah.name}</p>
          <p className="truncate text-xs text-[#5b6b62]">
            {t('surah.chapterVerse').replace('{id}', String(surah.id)).replace('{n}', String(coachAyahIndex + 1))}
          </p>
        </div>
        <span className="flex shrink-0 flex-col leading-none" aria-hidden="true">
          <Link href={surah.id > 1 ? `/hifz/${ALL_SURAHS[surah.id - 2]?.slug ?? 'al-fatihah'}` : '#'} aria-label={t('surah.prevSurah')} className="px-2 py-1.5 text-xs text-[#5b6b62]">⌃</Link>
          <Link href={surah.id < 114 ? `/hifz/${ALL_SURAHS[surah.id]?.slug ?? 'an-nas'}` : '#'} aria-label={t('surah.nextSurah')} className="px-2 py-1.5 text-xs text-[#5b6b62]">⌄</Link>
        </span>
        <button
          type="button"
          onClick={() => toggleBookmark(coachAyahIndex + 1)}
          aria-label={t('surah.bookmarkAyah')}
          aria-pressed={isBookmarked(coachAyahIndex + 1)}
          className="rounded-full p-2 text-lg hover:bg-[#FFFBF2]"
        >
          {isBookmarked(coachAyahIndex + 1) ? '🔖' : '📑'}
        </button>
        <Link href="/hifz/settings" aria-label={t('surah.settings')}  className="rounded-full p-2 text-lg hover:bg-[#FFFBF2]">⚙</Link>
      </header>

      {/* ---------- MODE SWITCHER: Reading / Recitation / Listening /
           Memorisation / Test (long-press the green button in the app;
           here as a row — same five modes) ---------- */}
      <nav aria-label={t('surah.readingMode')} className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ['reading', t('surah.modeReading')],
            ['recitation', t('surah.modeRecitation')],
            ['listening', t('surah.modeListening')],
            ['memorisation', t('surah.modeMemorisation')],
            ['test', t('surah.modeTest')],
          ] as const
        ).map(([m, label]) => {
          const active =
            (m === 'reading' && !coachOpen && !memoriseMode && !listenMode) ||
            (m === 'recitation' && coachOpen && !memoriseMode) ||
            (m === 'listening' && listenMode) ||
            (m === 'memorisation' && memoriseMode);
          if (m === 'test') {
            return (
              <Link key={m} href="/hifz/test" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]">
                {label}
              </Link>
            );
          }
          if (m === 'listening') {
            return (
              <button
                key={m}
                type="button"
                aria-pressed={listenMode}
                onClick={() => {
                  if (listenMode) {
                    stopListen();
                    saveMode('reading');
                  } else {
                    // Listening is a real mode now, not a scroll: close the
                    // coach (unmount aborts any live mic session) and
                    // start play-all from the saved range.
                    setCoachOpen(false);
                    setMemoriseMode(false);
                    startListen();
                  }
                }}
                className={`rounded-full min-h-11 px-4 py-2 text-sm font-semibold ${active ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] bg-white hover:border-[#1FA36B]'}`}
              >
                {label}
              </button>
            );
          }
          return (
            <button
              key={m}
              type="button"
              aria-pressed={active}
              onClick={() => {
                if (m === 'recitation') {
                  stopListen();
                  setMemoriseMode(false);
                  setCoachOpen(true);
                  saveMode('recite');
                  document.querySelector(`[aria-label="${t('surah.coachAria')}"]`)?.scrollIntoView({ behavior: 'smooth' });
                } else if (m === 'memorisation') {
                  stopListen();
                  setMemoriseMode(true);
                  setCoachOpen(true);
                  saveMode('memorise');
                  setHideMode('ayah');
                  setHiddenAyahs(new Set(verses.map((v) => v.verse_number)));
                  document.querySelector(`[aria-label="${t('surah.coachAria')}"]`)?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  stopListen();
                  setCoachOpen(false);
                  setMemoriseMode(false);
                  setHiddenAyahs(new Set());
                  saveMode('reading');
                }
              }}
              className={`rounded-full min-h-11 px-4 py-2 text-sm font-semibold ${active ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] bg-white hover:border-[#1FA36B]'}`}
            >
              {label}
            </button>
          );
        })}
      </nav>
      {memoriseMode && (
        <p className="mt-3 rounded-xl border border-[#FFB800]/60 bg-[#FFFBF2] px-4 py-2.5 text-sm text-[#5b6b62]">
          Ayahs are hidden — recite from memory. Revealing a word or an ayah is recorded as
          help needed: it resets that ayah&apos;s correct streak and adds it to your revision
          queue. The coach checks your recitation word by word.
        </p>
      )}
      {memoriseMode && (
        <section aria-label={t('mem.controlsAria')} className="mt-3 rounded-2xl border border-[#FFB800]/60 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#102E26]">{t('mem.heading')}</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#5b6b62]">
            {t('mem.intro')}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-[#5b6b62]">
              {t('mem.fromAyah')}
              <input
                type="number"
                min={1}
                max={surah.ayahCount}
                value={memFrom}
                onChange={(e) => setMemFrom(Math.min(surah.ayahCount, Math.max(1, Number(e.target.value) || 1)))}
                className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs font-semibold text-[#5b6b62]">
              {t('mem.toAyah')}
              <input
                type="number"
                min={1}
                max={surah.ayahCount}
                value={memTo}
                onChange={(e) => setMemTo(Math.min(surah.ayahCount, Math.max(1, Number(e.target.value) || surah.ayahCount)))}
                className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
              />
            </label>
            <div className="flex rounded-full border border-[#E5E7EB] bg-[#FFFBF2] p-0.5" role="group" aria-label={t('mem.whatToHide')}>
              {(
                [
                  ['ayah', t('mem.hideAyahs')],
                  ['words', t('mem.hideWordsOnly')],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={hideMode === m}
                  onClick={() => {
                    setHideMode(m);
                    if (m === 'words') {
                      // Words mode hides by the range counter, not by the
                      // per-ayah set — entering memorise mode hid every
                      // ayah in that set, and leaving it in place would
                      // keep every ayah hidden whatever the counter says.
                      setHiddenAyahs(new Set());
                      setRevealedAyah({});
                    }
                  }}
                  className={`min-h-10 rounded-full px-3 py-1.5 text-sm font-semibold ${hideMode === m ? 'bg-[#102E26] text-white' : 'text-[#102E26] hover:bg-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setHideMarkers((h) => !h)}
              aria-pressed={hideMarkers}
              title={t('mem.hideNumbersTitle')}
              className={`min-h-11 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${hideMarkers ? 'border-[#FFB800] bg-[#FFFBF2] text-[#102E26]' : 'border-[#E5E7EB] hover:border-[#1FA36B]'}`}
            >
              {hideMarkers ? t('mem.numbersHidden') : t('mem.hideNumbers')}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const from = Math.min(memFrom, memTo);
                const to = Math.max(memFrom, memTo);
                if (hideMode === 'ayah') {
                  setHiddenAyahs(new Set(verses.filter((v) => v.verse_number >= from && v.verse_number <= to).map((v) => v.verse_number)));
                  setRevealedAyah({});
                  setRangeRevealed(0);
                } else {
                  // Words mode owns the hiding: clear any per-ayah hides
                  // (e.g. from entering memorise mode) so the counter rules.
                  setHiddenAyahs(new Set());
                  setRevealedAyah({});
                  setRangeRevealed(0);
                }
              }}
              className="min-h-11 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
            >
              {hideMode === 'ayah' ? t('mem.hideAyahsRange') : t('mem.hideWordsRange')}
            </button>
            <button
              type="button"
              onClick={revealNextWordInRange}
              className="min-h-11 rounded-full border border-[#FFB800] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2]"
            >
              {t('mem.revealNextWord')}
            </button>
            <button
              type="button"
              onClick={revealNextAyahInRange}
              className="min-h-11 rounded-full border border-[#FFB800] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2]"
            >
              {t('mem.revealNextAyah')}
            </button>
            <button
              type="button"
              onClick={() => {
                setHiddenAyahs(new Set());
                setRevealedAyah({});
                setRangeRevealed(rangeWordTotal);
              }}
              className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
            >
              {t('mem.revealAll')}
            </button>
            <button
              type="button"
              onClick={() => {
                // Reset = start the test over: everything in the range
                // hidden again, nothing revealed. (Showing everything is
                // the "Reveal all" button next to it.)
                const from = Math.min(memFrom, memTo);
                const to = Math.max(memFrom, memTo);
                if (hideMode === 'ayah') {
                  setHiddenAyahs(new Set(verses.filter((v) => v.verse_number >= from && v.verse_number <= to).map((v) => v.verse_number)));
                  setRevealedAyah({});
                } else {
                  setHiddenAyahs(new Set());
                  setRevealedAyah({});
                }
                setRangeRevealed(0);
              }}
              className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
            >
              {t('mem.startOver')}
            </button>
          </div>
          <p role="status" className="mt-2 text-xs text-[#5b6b62]">
            {hideMode === 'words'
              ? t('mem.statusWords').replace('{n}', String(rangeRevealed)).replace('{total}', String(rangeWordTotal)).replace('{from}', String(Math.min(memFrom, memTo))).replace('{to}', String(Math.max(memFrom, memTo)))
              : hiddenAyahs.size === 1
                ? t('mem.statusAyahsOne').replace('{n}', String(hiddenAyahs.size))
                : t('mem.statusAyahsMany').replace('{n}', String(hiddenAyahs.size))}
          </p>
        </section>
      )}

      {/* ---------- COACH ENTRY (first interactive element, spec §4.1.2) ---------- */}
      <section aria-label={t('surah.coachAria')} className="mt-6 rounded-2xl bg-[#102E26] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#FFB800]">
              <ToolIcon name="mic" className="h-4 w-4" /> {t('surah.coach')}
            </p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">{t('surah.reciteSurah').replace('{name}', surah.name)}</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/80">
              {t('surah.reciteIntro')}
            </p>
          </div>
          {!coachOpen && (
            <button
              type="button"
              onClick={() => {
                stopListen();
                setCoachOpen(true);
                saveMode('recite');
              }}
              className="shrink-0 rounded-full bg-[#FFB800] min-h-11 px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {t('surah.reciteThis')}
            </button>
          )}
        </div>
        {coachOpen && coachAyahs.length > 0 && (
          <div className="mt-5 text-[#1C2420]">
            <RecitationCoach
              surah={surah.id}
              surahName={surah.name}
              ayahs={coachAyahs}
              initialAyahIndex={coachAyahIndex}
              initialReciterId={reciterId}
              onAyahChange={(ayah) => setCoachAyahIndex(Math.max(0, ayah - 1))}
            />
          </div>
        )}
        {coachOpen && coachAyahs.length === 0 && (
          <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-sm">
            {t('surah.versesFailed')}
          </p>
        )}
      </section>

      {/* ---------- READER CONTROLS ---------- */}
      <section aria-label={t('surah.readingControls')} className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('surah.viewMode')}>
          <span className="text-sm font-medium">{t('surah.view')}</span>
          {(
            [
              ['arabic', t('surah.viewArabic')],
              ['translation', t('surah.viewTranslation')],
              ['tafsir', t('surah.viewTafsir')],
            ] as [ViewMode, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={viewMode === id}
              onClick={() => setViewMode(id)}
              className={`rounded-full min-h-11 px-3.5 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${
                viewMode === id ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Advanced reader settings live in an expandable, not all on screen
            at once: the view-mode pills above stay visible; the display
            options and the four pickers open on demand. The summary shows
            the current choices so the reader still knows what is active. */}
        <details className="mt-3">
          <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#FFFBF2] px-4 py-2 text-sm font-semibold text-[#102E26] hover:border-[#1FA36B]">
            <span aria-hidden="true">⚙</span> {t('surah.settings')}
            <span className="font-normal text-[#5b6b62]">
              {translationName} · {reciterName} · {SCRIPT_LABELS[script]}
            </span>
          </summary>
          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={t('surah.displayOptions')}>
          <button
            type="button"
            onClick={() => setAdaptive((a) => !a)}
            aria-pressed={adaptive}
            title={t('surah.adaptiveTitle')}
            className={`rounded-full min-h-11 px-3.5 py-1.5 text-sm font-semibold ${adaptive ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
          >
            {adaptive ? t('surah.adaptiveOn') : t('surah.adaptive')}
          </button>
          <button
            type="button"
            onClick={() => setTajweedOn((t) => !t)}
            aria-pressed={tajweedOn}
            title={t('surah.tajweedTitle')}
            className={`rounded-full min-h-11 px-3.5 py-1.5 text-sm font-semibold ${tajweedOn ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
          >
            {tajweedOn ? t('surah.tajweedOn') : t('surah.tajweed')}
          </button>
          <button
            type="button"
            onClick={() => setShowTajweedGuide(true)}
            className="rounded-full border border-[#E5E7EB] min-h-11 min-w-11 px-3 py-1.5 text-sm font-semibold hover:border-[#1FA36B]"
            aria-label={t('surah.aboutTajweed')}
          >
            ⓘ
          </button>
          <button
            type="button"
            onClick={() => setHideMarkers((h) => !h)}
            aria-pressed={hideMarkers}
            title={t('surah.hideMarkersTitle')}
            className={`rounded-full min-h-11 px-3.5 py-1.5 text-sm font-semibold ${hideMarkers ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
          >
            {hideMarkers ? t('surah.markersHidden') : t('surah.hideMarkers')}
          </button>
          {adaptive && (
            <label className="flex min-w-0 items-center gap-2 text-sm font-medium">
              {t('surah.textSize')}
              <input
                type="range"
                min={20}
                max={40}
                value={adaptiveFont}
                onChange={(e) => setAdaptiveFont(Number(e.target.value))}
                aria-label={t('surah.adaptiveSize')}
                className="w-28"
              />
              <span className="text-xs text-[#5b6b62]">{adaptiveFont}px</span>
            </label>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <span className="shrink-0">{t('surah.translation')}</span>
            <SearchablePicker
              label={t('surah.translation')}
              value={translationId}
              groups={translationGroups}
              onChange={setTranslationId}
              searchPlaceholder={t('picker.searchTranslations')}
              noResults={t('picker.noResults')}
            />
          </div>
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <span className="shrink-0">{t('surah.tafsir')}</span>
            <SearchablePicker
              label={t('surah.tafsir')}
              value={tafsirId}
              groups={tafsirGroups}
              onChange={setTafsirId}
              searchPlaceholder={t('picker.searchTafsirs')}
              noResults={t('picker.noResults')}
            />
          </div>
          <label className="flex min-w-0 items-center gap-2 text-sm font-medium">
            {t('surah.reciter')}
            <select
              value={reciterId}
              onChange={(e) => setReciterId(Number(e.target.value))}
              className="min-w-0 min-h-11 flex-1 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 items-center gap-2 text-sm font-medium">
            {t('surah.script')}
            <select
              value={script}
              onChange={(e) => setScript(e.target.value as 'indopak' | 'uthmani')}
              className="min-w-0 min-h-11 flex-1 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {(Object.keys(SCRIPT_LABELS) as ('indopak' | 'uthmani')[]).map((s) => (
                <option key={s} value={s}>{SCRIPT_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <Link
            href={`/hifz/${surah.slug}/${surah.id}-1`}
            className="ml-auto inline-block py-1 text-sm font-semibold text-[#1FA36B] underline"
          >
            {t('surah.openFirstAyah')}
          </Link>
        </div>
        </details>
        <p className="mt-3 text-xs leading-relaxed text-[#5b6b62]">
          {TRANSLATIONS.length} {t('ayah.translationsCount')} · {TAFSIRS.length} {t('ayah.tafsirsCount')} · {RECITERS.length} {t('ayah.recitationsCount')} — {t('ayah.allFree')}. {attributionFor(translationId, tafsirId)}
        </p>
        {script === 'uthmani' && (
          <p className="mt-3 text-xs leading-relaxed text-[#5b6b62]">
            {t('surah.uthmaniNote')}
          </p>
        )}
      </section>

      {/* ---------- LISTEN ---------- */}
      <section aria-labelledby="listen-heading" className={`mt-6 rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${listenMode ? 'border-[#FFB800] ring-1 ring-[#FFB800]' : 'border-[#E5E7EB]'}`}>
        <h2 id="listen-heading" className="flex items-center gap-2 text-lg font-bold text-[#102E26]">
          <ToolIcon name="ear" className="h-5 w-5 text-[#1FA36B]" /> {t('surah.listen')}
          {listenMode && (
            <span className="rounded-full bg-[#E4FFF2] px-2.5 py-0.5 text-xs font-bold text-[#1FA36B]">{t('surah.listeningMode')}</span>
          )}
        </h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          {t('surah.listenIntro').replace('{name}', reciterName)}
        </p>
        {savedListenPos !== null && savedListenPos !== listen.fromAyah && !listenPlaying && (
          <button
            type="button"
            onClick={() => {
              setListen((p) => ({ ...p, fromAyah: savedListenPos }));
              setListenMode(true);
              saveMode('listen');
              // Start from the saved ayah on the next tick, after state lands.
              setAutoListen(true);
            }}
            className="mt-3 rounded-full border border-[#FFB800] bg-[#FFFBF2] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFF6D6]"
          >
            {t('surah.resumeListen').replace('{n}', String(savedListenPos))}
          </button>
        )}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-[#5b6b62]">
            {t('surah.fromAyah')}
            <input
              type="number"
              min={1}
              max={surah.ayahCount}
              value={listen.fromAyah}
              onChange={(e) => setListen((p) => ({ ...p, fromAyah: Number(e.target.value) || 1 }))}
              className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            {t('surah.toAyah')}
            <input
              type="number"
              min={1}
              max={surah.ayahCount}
              value={listen.toAyah}
              onChange={(e) => setListen((p) => ({ ...p, toAyah: Number(e.target.value) || surah.ayahCount }))}
              className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            {t('surah.repeatEach')}
            <input
              type="number"
              min={1}
              max={100}
              value={listen.repeat}
              onChange={(e) => setListen((p) => ({ ...p, repeat: Math.min(100, Math.max(1, Number(e.target.value) || 1)) }))}
              className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            {t('surah.pauseBetween')}
            <input
              type="number"
              min={0}
              max={10}
              value={listen.pauseSec}
              onChange={(e) => setListen((p) => ({ ...p, pauseSec: Math.min(10, Math.max(0, Number(e.target.value) || 0)) }))}
              className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            {t('surah.speed')}
            <select
              value={listen.speed}
              onChange={(e) => setListen((p) => ({ ...p, speed: Number(e.target.value) }))}
              className="mt-1 block min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            >
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                <option key={s} value={s}>{s}×</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-pressed={listen.wordByWord}
            title={t('surah.wbwTitle')}
            onClick={() => {
              if (listenPlaying) stopListen();
              setListen((p) => ({ ...p, wordByWord: !p.wordByWord }));
            }}
            className={`rounded-full border min-h-11 px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${listen.wordByWord ? 'border-[#FFB800] bg-[#FFB800]/15 text-[#7A5C00]' : 'border-[#E5E7EB] bg-white hover:border-[#1FA36B]'}`}
          >
            {listen.wordByWord ? t('surah.wordByWordOn') : t('surah.wordByWord')}
          </button>
          <button
            type="button"
            onClick={listenPlaying ? stopListen : startListen}
            disabled={verses.length === 0}
            className="rounded-full bg-[#1FA36B] min-h-11 px-5 py-2 text-sm font-semibold text-white hover:bg-[#102E26] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
          >
            {listenPlaying ? t('surah.stopListening') : t('surah.playAyahs').replace('{from}', String(Math.min(listen.fromAyah, listen.toAyah))).replace('{to}', String(Math.max(listen.fromAyah, listen.toAyah)))}
          </button>
        </div>
        {listen.wordByWord && (
          <p className="mt-2 text-xs leading-relaxed text-[#5b6b62]">
            {t('surah.wbwIntro')}
          </p>
        )}
        {listenPlaying && playingKey && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#1FA36B]">
            {t('surah.playing').replace('{key}', playingKey).replace('{n}', String(listen.repeat)).replace('{s}', String(listen.speed))}
            {listen.wordByWord ? t('surah.playingWbw') : ''}
          </p>
        )}
        {listen.wordByWord && wbwNote && (
          <p role="status" className="mt-2 text-sm text-[#7A5C00]">
            {wbwNote}
          </p>
        )}
      </section>

      {/* ---------- READ ---------- */}
      <section aria-labelledby="read-heading" className="mt-6">
        <h2 id="read-heading" className="text-lg font-bold text-[#102E26]">
          {t('surah.readHeading').replace('{name}', surah.name).replace('{n}', String(verses.length))}
        </h2>
        {versesError && (
          <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">
            {versesError}
          </p>
        )}
        {verses.length === 0 && !versesError && (
          <p className="mt-3 text-sm text-[#5b6b62]">{t('surah.loadingVerses')}</p>
        )}
        {pageVerses.map((v) => {
          const translation = stripHtml(v.translations?.[0]?.text ?? '');
          const status = ayahStatus(v.verse_number);
          const bookmarked = isBookmarked(v.verse_number);
          const isPlaying = playingKey === v.verse_key;
          const isWbwAyah = wbw?.key === v.verse_key;
          const topic = topicColors ? getTopic(surah.id, v.verse_number) : null;
          // Stage 5 (§8) — words mode: every word in the range is hidden
          // (grey rules) while the ayah structure stays visible; the
          // range counter decides how many words of this ayah are shown.
          // Ayah mode keeps the per-ayah hiding above. Either way the
          // hidden text is genuinely hidden — a grey rule, not text
          // rendered transparent underneath.
          const wordOffset = memRange.offsets.get(v.verse_number);
          const inWordsMode =
            memoriseMode &&
            hideMode === 'words' &&
            wordOffset !== undefined;
          const wordsRevealed = inWordsMode
            ? Math.max(0, Math.min(wordOffset!.count, rangeRevealed - wordOffset!.start))
            : 0;
          const wordsHidden = inWordsMode && wordsRevealed < wordOffset!.count;
          const ayahHidden = hiddenAyahs.has(v.verse_number);
          return (
            <article
              key={v.verse_key}
              id={`ayah-${v.verse_number}`}
              className={adaptive
                ? `mt-2 scroll-mt-24 border-b border-[#E5E7EB] bg-white px-1 py-4 ${isPlaying ? 'bg-[#FFFBF2]' : ''}`
                : `mt-4 scroll-mt-24 rounded-2xl border bg-white p-5 shadow-sm ${isPlaying ? 'border-[#FFB800] ring-1 ring-[#FFB800]' : 'border-[#E5E7EB]'}`}
            >
              <div className="flex items-center justify-between gap-3">
                {!hideMarkers && (
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#102E26] text-xs font-bold text-white">
                    {v.verse_key}
                  </span>
                )}
                {topic && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold"
                    style={{ borderColor: topic.color, color: topic.color, background: topic.wash }}
                    title={topic.description}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: topic.color }} aria-hidden="true" />
                    {topic.name}
                  </span>
                )}
                {hiddenAyahs.has(v.verse_number) && (
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        recordPeek(v.verse_number);
                        setRevealedAyah((prev) => ({
                          ...prev,
                          [v.verse_number]: (prev[v.verse_number] ?? 0) + 1,
                        }));
                      }}
                      className="min-h-11 rounded-full border border-[#FFB800] px-3 py-1 text-xs font-bold text-[#102E26] hover:bg-[#FFFBF2]"
                    >
                      {t('surah.nextWord')}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleHiddenAyah(v.verse_number)}
                      className="min-h-11 rounded-full border border-[#E5E7EB] px-3 py-1 text-xs font-bold hover:border-[#1FA36B]"
                    >
                      {t('surah.showAyah')}
                    </button>
                  </span>
                )}
                {status === 'memorised' && (
                  <span className="rounded-full bg-[#E4FFF2] px-2.5 py-1 text-xs font-bold text-[#1FA36B]">{t('common.memorised')}</span>
                )}
                {status === 'learning' && (
                  <span className="rounded-full bg-[#FFFBF2] px-2.5 py-1 text-xs font-bold text-[#5b6b62]">{t('common.learning')}</span>
                )}
              </div>
              {ayahHidden || wordsHidden ? (
                <p dir="rtl" lang="ar" translate="no" className={`font-quran ${script === 'uthmani' ? 'font-quran-madani' : ''} mt-4 text-right ${adaptive ? '' : 'text-[28px] sm:text-4xl'}`} style={adaptive ? { fontSize: `${adaptiveFont}px`, lineHeight: 2 } : undefined}>
                  <HiddenWords
                    words={verseText(v, script).split(' ')}
                    revealed={ayahHidden ? (revealedAyah[v.verse_number] ?? 0) : wordsRevealed}
                    rosette={hideMarkers ? undefined : ` ﴿${v.verse_number}﴾`}
                  />
                </p>
              ) : (
                <p dir="rtl" lang="ar" translate="no" className={`font-quran ${script === 'uthmani' ? 'font-quran-madani' : ''} mt-4 text-right ${adaptive ? '' : 'text-[28px] sm:text-4xl'}`} style={adaptive ? { fontSize: `${adaptiveFont}px`, lineHeight: 2 } : undefined}>
                  {isWbwAyah && wbw ? (
                    /* Word-by-word listening: the sounding word is highlighted. */
                    verseText(v, script).split(' ').map((w, i) => (
                      <span
                        key={i}
                        className={`${tajweedOn ? tajweedClass(w) : ''} ${i === wbw.index ? 'rounded bg-[#FFB800]/60 px-0.5' : ''}`}
                      >
                        {w}{' '}
                      </span>
                    ))
                  ) : (
                    renderArabic(verseText(v, script))
                  )}
                </p>
              )}
              {viewMode !== 'arabic' && translation && (
                <p className="mt-4 text-[15px] leading-relaxed text-[#1C2420]/85">{translation}</p>
              )}
              {viewMode !== 'arabic' && (
                <p className="mt-2 text-xs text-[#1C2420]/50">{t('surah.translationLabel').replace('{name}', translationName)}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#E5E7EB] pt-3">
                <button
                  type="button"
                  onClick={() => playVerseAudio(v)}
                  disabled={!v.audio?.url}
                  aria-label={t('surah.playVerse').replace('{key}', v.verse_key)}
                  className="rounded-full bg-[#1FA36B] min-h-11 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[#102E26] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                >
                  {isPlaying ? t('surah.playingNow') : t('surah.listen')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleWords(v.verse_key)}
                  aria-expanded={!!wordsOpen[v.verse_key]}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] px-3.5 py-1.5 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                >
                  {wordsOpen[v.verse_key] ? t('surah.hideWords') : t('surah.wordByWordBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleBookmark(v.verse_number)}
                  aria-pressed={bookmarked}
                  className={`rounded-full border min-h-11 px-3.5 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${bookmarked ? 'border-[#FFB800] bg-[#FFB800]/15 text-[#7A5C00]' : 'border-[#E5E7EB] hover:border-[#1FA36B]'}`}
                >
                  {bookmarked ? t('surah.bookmarked') : t('surah.bookmark')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleHiddenAyah(v.verse_number)}
                  aria-pressed={hiddenAyahs.has(v.verse_number)}
                  className={`rounded-full border min-h-11 px-3.5 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${hiddenAyahs.has(v.verse_number) ? 'border-[#FFB800] bg-[#FFFBF2] text-[#102E26]' : 'border-[#E5E7EB] hover:border-[#1FA36B]'}`}
                >
                  {hiddenAyahs.has(v.verse_number) ? t('surah.hiddenTap') : t('surah.hideAyah')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleMemorised(v.verse_number)}
                  aria-pressed={status === 'memorised'}
                  className={`rounded-full border min-h-11 px-3.5 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${status === 'memorised' ? 'border-[#1FA36B] bg-[#E4FFF2] text-[#1FA36B]' : 'border-[#E5E7EB] hover:border-[#1FA36B]'}`}
                >
                  {status === 'memorised' ? t('surah.memorisedTap') : t('surah.markMemorised')}
                </button>
                <Link
                  href={`/hifz/${surah.slug}/${surah.id}-${v.verse_number}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] px-3.5 py-1.5 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                >
                  {t('surah.ayahPage')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setCoachAyahIndex(v.verse_number - 1);
                    setCoachOpen(true);
                    document.querySelector(`[aria-label="${t('surah.coachAria')}"]`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-full border border-[#E5E7EB] min-h-11 px-3.5 py-1.5 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                >
                  {t('surah.reciteAyah')}
                </button>
              </div>
              {wordsOpen[v.verse_key] && (
                <WordByWord surahId={surah.id} ayah={v.verse_number} indopakText={v.text_indopak} />
              )}
              {/* Tafsir renders ONLY in Tafsir mode (commit 12a3449 — do not regress). */}
              {viewMode === 'tafsir' && <TafsirBlock key={`${v.verse_key}:${tafsirId}`} verseKey={v.verse_key} tafsirId={tafsirId} />}
            </article>
          );
        })}

        {totalPages > 1 && (
          <nav aria-label={t('surah.ayahPages')} className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="rounded-full border border-[#E5E7EB] bg-white min-h-11 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {t('surah.previous')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                aria-current={p === safePage ? 'page' : undefined}
                onClick={() => setPage(p)}
                className={`h-11 w-11 rounded-full text-sm font-bold ${p === safePage ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] bg-white'}`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="rounded-full border border-[#E5E7EB] bg-white min-h-11 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {t('common.next')}
            </button>
            <span className="w-full text-center text-xs text-[#5b6b62]">
              {t('surah.pageOf').replace('{p}', String(safePage)).replace('{t}', String(totalPages)).replace('{n}', String(verses.length))}
            </span>
          </nav>
        )}
      </section>

      {showTajweedGuide && <TajweedGuide onClose={() => setShowTajweedGuide(false)} />}
    </div>
  );
}
