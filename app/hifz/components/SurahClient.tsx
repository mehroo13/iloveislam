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
  API, AUDIO_BASE, TRANSLATIONS, RECITERS, stripHtml, cleanIndopak, verseText,
  type Verse,
} from '../../quran/lib';
import type { LaunchSurah } from '../surahs';
import { useScriptPref, SCRIPT_LABELS } from '../lib/script';
import {
  loadProgress, saveProgress, loadSettings, saveSettings,
  type HifzProgress,
} from '../progress';
import ToolIcon from '../../components/ToolIcon';
import TafsirBlock from './TafsirBlock';
import WordByWord from './WordByWord';
import type { CoachAyah } from './RecitationCoach';

const RecitationCoach = dynamic(() => import('./RecitationCoach'), { ssr: false });

type ViewMode = 'arabic' | 'translation' | 'tafsir';
const PAGE_SIZE = 25;
const LISTEN_KEY = 'ili_hifz_listen_v1';

interface ListenSettings {
  repeat: number;
  pauseSec: number;
  speed: number;
  fromAyah: number;
  toAyah: number;
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
      };
    }
  } catch {
    /* defaults */
  }
  return { repeat: 1, pauseSec: 0, speed: 1, fromAyah: 1, toAyah: ayahCount };
}

export default function SurahClient({
  surah,
  initialVerses,
  coachOpen: initialCoachOpen = false,
  initialAyah = 1,
}: {
  surah: LaunchSurah;
  initialVerses: Verse[];
  coachOpen?: boolean;
  initialAyah?: number;
}) {
  const [verses, setVerses] = useState<Verse[]>(initialVerses);
  const [versesError, setVersesError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('translation');
  const [translationId, setTranslationId] = useState(20);
  const [reciterId, setReciterId] = useState(7);
  const [script, setScript] = useScriptPref();
  const [page, setPage] = useState(1);
  const [coachOpen, setCoachOpen] = useState(initialCoachOpen);
  const [coachAyahIndex, setCoachAyahIndex] = useState(
    Math.max(0, Math.min(initialAyah - 1, Math.max(0, initialVerses.length - 1))),
  );

  /* ?mode=recite / ?ayah=N are read client-side (the server page stays
   * fully static — reading searchParams server-side would force dynamic
   * rendering of all 969 ayah pages). */
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('mode') === 'recite') setCoachOpen(true);
      const ayah = Number(q.get('ayah') ?? '');
      if (ayah >= 1 && ayah <= surah.ayahCount) setCoachAyahIndex(ayah - 1);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [bookmarks, setBookmarks] = useState<{ surahNumber: number; verseNumber: number }[]>([]);
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [wordsOpen, setWordsOpen] = useState<Record<string, boolean>>({});
  const [listen, setListen] = useState<ListenSettings>(() =>
    typeof window === 'undefined'
      ? { repeat: 1, pauseSec: 0, speed: 1, fromAyah: 1, toAyah: surah.ayahCount }
      : loadListenSettings(surah.ayahCount),
  );
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [listenPlaying, setListenPlaying] = useState(false);
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
    } catch {
      /* storage unavailable — reading still works */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('quran_bookmarks_v2', JSON.stringify(bookmarks.map((b) => ({ ...b, surahName: surah.name, timestamp: Date.now() }))));
    } catch {
      /* ignore */
    }
  }, [bookmarks, surah.name]);

  useEffect(() => {
    try {
      localStorage.setItem(LISTEN_KEY, JSON.stringify(listen));
    } catch {
      /* ignore */
    }
  }, [listen]);

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
      setVersesError('Could not reload the verses. Check your connection and try again.');
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

  /* ---------- listen: play-all with repeat / range loop / pause / speed ---------- */
  const stopListen = useCallback(() => {
    listenQueueRef.current = [];
    if (listenTimerRef.current) clearTimeout(listenTimerRef.current);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
    }
    setListenPlaying(false);
    setPlayingKey(null);
  }, []);

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
    const items = verses
      .filter((v) => v.verse_number >= from && v.verse_number <= to && v.audio?.url)
      .map((v) => ({ key: v.verse_key, url: v.audio!.url!, repeatsLeft: listen.repeat }));
    if (items.length === 0) return;
    listenQueueRef.current = items;
    setListenPlaying(true);
    playNextInQueue();
  };

  /* ---------- pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(verses.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageVerses = verses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleWords = (key: string) =>
    setWordsOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      <audio ref={audioRef} preload="none" className="hidden" />

      {/* ---------- COACH ENTRY (first interactive element, spec §4.1.2) ---------- */}
      <section aria-label="Recitation coach" className="mt-6 rounded-2xl bg-[#0B3D2E] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#C9A227]">
              <ToolIcon name="mic" className="h-4 w-4" /> Recitation coach
            </p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">Recite Surah {surah.name} aloud</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/80">
              Listen, hide the verse, then recite it from memory. The checker follows your
              recitation word by word, on this device — your audio never leaves your device.
            </p>
          </div>
          {!coachOpen && (
            <button
              type="button"
              onClick={() => setCoachOpen(true)}
              className="shrink-0 rounded-full bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-[#0B3D2E] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Recite this surah
            </button>
          )}
        </div>
        {coachOpen && coachAyahs.length > 0 && (
          <div className="mt-5 text-[#1C2420]">
            <RecitationCoach
              surah={surah.id}
              surahSlug={surah.slug}
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
            The verses could not be loaded, so the coach cannot start. Check your connection and reload the page.
          </p>
        )}
      </section>

      {/* ---------- READER CONTROLS ---------- */}
      <section aria-label="Reading controls" className="mt-6 rounded-2xl border border-[#e5e0d3] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="View mode">
          <span className="text-sm font-medium">View</span>
          {(
            [
              ['arabic', 'Arabic only'],
              ['translation', 'Arabic + Translation'],
              ['tafsir', 'Arabic + Translation + Tafsir'],
            ] as [ViewMode, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={viewMode === id}
              onClick={() => setViewMode(id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] ${
                viewMode === id ? 'bg-[#0B3D2E] text-white' : 'border border-[#e5e0d3] hover:border-[#146B4D]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
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
          <label className="flex items-center gap-2 text-sm font-medium">
            Script
            <select
              value={script}
              onChange={(e) => setScript(e.target.value as 'indopak' | 'uthmani')}
              className="rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-2 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
            >
              {(Object.keys(SCRIPT_LABELS) as ('indopak' | 'uthmani')[]).map((s) => (
                <option key={s} value={s}>{SCRIPT_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <Link
            href={`/hifz/${surah.slug}/${surah.id}-1`}
            className="ml-auto text-sm font-semibold text-[#146B4D] underline"
          >
            Open the first ayah
          </Link>
        </div>
        {script === 'uthmani' && (
          <p className="mt-3 text-xs leading-relaxed text-[#5b6b62]">
            Reading in Madani (Uthmani) script. The recitation coach still checks
            against the Indo-Pak text — its word alignment is built on it.
          </p>
        )}
      </section>

      {/* ---------- LISTEN ---------- */}
      <section aria-labelledby="listen-heading" className="mt-6 rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="listen-heading" className="flex items-center gap-2 text-lg font-bold text-[#0B3D2E]">
          <ToolIcon name="ear" className="h-5 w-5 text-[#146B4D]" /> Listen
        </h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Reciter: {reciterName}. Repeat any ayah or range, with a pause between repeats and
          your choice of speed. Settings are remembered on this device.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-[#5b6b62]">
            From ayah
            <input
              type="number"
              min={1}
              max={surah.ayahCount}
              value={listen.fromAyah}
              onChange={(e) => setListen((p) => ({ ...p, fromAyah: Number(e.target.value) || 1 }))}
              className="mt-1 block w-20 rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            To ayah
            <input
              type="number"
              min={1}
              max={surah.ayahCount}
              value={listen.toAyah}
              onChange={(e) => setListen((p) => ({ ...p, toAyah: Number(e.target.value) || surah.ayahCount }))}
              className="mt-1 block w-20 rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            Repeat each ayah
            <input
              type="number"
              min={1}
              max={100}
              value={listen.repeat}
              onChange={(e) => setListen((p) => ({ ...p, repeat: Math.min(100, Math.max(1, Number(e.target.value) || 1)) }))}
              className="mt-1 block w-20 rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            Pause between repeats (seconds)
            <input
              type="number"
              min={0}
              max={10}
              value={listen.pauseSec}
              onChange={(e) => setListen((p) => ({ ...p, pauseSec: Math.min(10, Math.max(0, Number(e.target.value) || 0)) }))}
              className="mt-1 block w-20 rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            Speed
            <select
              value={listen.speed}
              onChange={(e) => setListen((p) => ({ ...p, speed: Number(e.target.value) }))}
              className="mt-1 block rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-2 py-1.5 text-sm"
            >
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                <option key={s} value={s}>{s}×</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={listenPlaying ? stopListen : startListen}
            disabled={verses.length === 0}
            className="rounded-full bg-[#146B4D] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0B3D2E] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
          >
            {listenPlaying ? 'Stop listening' : `Play ayahs ${Math.min(listen.fromAyah, listen.toAyah)}–${Math.max(listen.fromAyah, listen.toAyah)}`}
          </button>
        </div>
        {listenPlaying && playingKey && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#146B4D]">
            Playing {playingKey} · {listen.repeat}× per ayah · {listen.speed}× speed
          </p>
        )}
      </section>

      {/* ---------- READ ---------- */}
      <section aria-labelledby="read-heading" className="mt-6">
        <h2 id="read-heading" className="text-lg font-bold text-[#0B3D2E]">
          Read — Surah {surah.name} ({verses.length} ayahs)
        </h2>
        {versesError && (
          <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">
            {versesError}
          </p>
        )}
        {verses.length === 0 && !versesError && (
          <p className="mt-3 text-sm text-[#5b6b62]">Loading verses…</p>
        )}
        {pageVerses.map((v) => {
          const translation = stripHtml(v.translations?.[0]?.text ?? '');
          const status = ayahStatus(v.verse_number);
          const bookmarked = isBookmarked(v.verse_number);
          const isPlaying = playingKey === v.verse_key;
          return (
            <article
              key={v.verse_key}
              id={`ayah-${v.verse_number}`}
              className={`mt-4 scroll-mt-24 rounded-2xl border bg-white p-5 shadow-sm ${isPlaying ? 'border-[#C9A227] ring-1 ring-[#C9A227]' : 'border-[#e5e0d3]'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] text-xs font-bold text-white">
                  {v.verse_key}
                </span>
                {status === 'memorised' && (
                  <span className="rounded-full bg-[#eaf3ee] px-2.5 py-1 text-xs font-bold text-[#146B4D]">Memorised</span>
                )}
                {status === 'learning' && (
                  <span className="rounded-full bg-[#F7F5EF] px-2.5 py-1 text-xs font-bold text-[#5b6b62]">Learning</span>
                )}
              </div>
              <p dir="rtl" lang="ar" className={`font-quran ${script === 'uthmani' ? 'font-quran-madani' : ''} mt-4 text-right text-[28px] sm:text-4xl`}>
                {verseText(v, script)}
              </p>
              {viewMode !== 'arabic' && translation && (
                <p className="mt-4 text-[15px] leading-relaxed text-[#1C2420]/85">{translation}</p>
              )}
              {viewMode !== 'arabic' && (
                <p className="mt-2 text-xs text-[#1C2420]/50">Translation: {translationName}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#f0ede4] pt-3">
                <button
                  type="button"
                  onClick={() => playVerseAudio(v)}
                  disabled={!v.audio?.url}
                  aria-label={`Play verse ${v.verse_key}`}
                  className="rounded-full bg-[#146B4D] px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[#0B3D2E] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                >
                  {isPlaying ? 'Playing…' : 'Listen'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleWords(v.verse_key)}
                  aria-expanded={!!wordsOpen[v.verse_key]}
                  className="rounded-full border border-[#e5e0d3] px-3.5 py-1.5 text-sm font-semibold hover:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                >
                  {wordsOpen[v.verse_key] ? 'Hide words' : 'Word-by-word'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleBookmark(v.verse_number)}
                  aria-pressed={bookmarked}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] ${bookmarked ? 'border-[#C9A227] bg-[#C9A227]/15 text-[#7a6414]' : 'border-[#e5e0d3] hover:border-[#146B4D]'}`}
                >
                  {bookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleMemorised(v.verse_number)}
                  aria-pressed={status === 'memorised'}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] ${status === 'memorised' ? 'border-[#146B4D] bg-[#eaf3ee] text-[#146B4D]' : 'border-[#e5e0d3] hover:border-[#146B4D]'}`}
                >
                  {status === 'memorised' ? 'Memorised — tap to unmark' : 'Mark memorised'}
                </button>
                <Link
                  href={`/hifz/${surah.slug}/${surah.id}-${v.verse_number}`}
                  className="rounded-full border border-[#e5e0d3] px-3.5 py-1.5 text-sm font-semibold hover:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                >
                  Ayah page
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setCoachAyahIndex(v.verse_number - 1);
                    setCoachOpen(true);
                    document.querySelector('[aria-label="Recitation coach"]')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-full border border-[#e5e0d3] px-3.5 py-1.5 text-sm font-semibold hover:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                >
                  Recite this ayah
                </button>
              </div>
              {wordsOpen[v.verse_key] && (
                <WordByWord surahId={surah.id} ayah={v.verse_number} indopakText={v.text_indopak} />
              )}
              {/* Tafsir renders ONLY in Tafsir mode (commit 12a3449 — do not regress). */}
              {viewMode === 'tafsir' && <TafsirBlock verseKey={v.verse_key} />}
            </article>
          );
        })}

        {totalPages > 1 && (
          <nav aria-label="Ayah pages" className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="rounded-full border border-[#e5e0d3] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                aria-current={p === safePage ? 'page' : undefined}
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-full text-sm font-bold ${p === safePage ? 'bg-[#0B3D2E] text-white' : 'border border-[#e5e0d3] bg-white'}`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="rounded-full border border-[#e5e0d3] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Next
            </button>
            <span className="w-full text-center text-xs text-[#5b6b62]">
              Page {safePage} of {totalPages} · {verses.length} ayahs · 25 per page
            </span>
          </nav>
        )}
      </section>
    </div>
  );
}
