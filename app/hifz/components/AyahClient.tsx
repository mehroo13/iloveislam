// app/hifz/components/AyahClient.tsx — the per-ayah study page island (spec §4.3).
// Server page fetches the verse + word-by-word; this island owns translation
// picking, audio, tafsir (only in Tafsir mode), word display and the coach
// scoped to this one ayah (dynamic import, only when opened).
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  API, AUDIO_BASE, TRANSLATIONS, RECITERS, TAFSIRS, TAFSIR_ID, groupByLanguage, stripHtml, cleanIndopak, verseText,
  type Verse,
} from '../../quran/lib';
import type { HifzSurah } from '../surahs';
import { loadProgress, saveProgress, type HifzProgress } from '../progress';
import { useScriptPref, SCRIPT_LABELS } from '../lib/script';
import { attributionFor } from '../lib/fetch';
import ToolIcon from '../../components/ToolIcon';
import TafsirBlock from './TafsirBlock';
import type { CoachAyah } from './RecitationCoach';
import type { WordInfo } from '../lib/fetch';
import { pairWords } from '../lib/fetch';

const RecitationCoach = dynamic(() => import('./RecitationCoach'), { ssr: false });

const TAFSIR_KEY = 'ili_hifz_tafsir_v1';

type ViewMode = 'arabic' | 'translation' | 'tafsir';

export default function AyahClient({
  surah,
  ayah,
  initialVerse,
  initialWords,
  initialTafsir,
  coachOpen: initialCoachOpen = false,
  prevKey,
  nextKey,
}: {
  surah: HifzSurah;
  ayah: number;
  initialVerse: Verse;
  initialWords: WordInfo[];
  initialTafsir: string;
  coachOpen?: boolean;
  prevKey: string | null;
  nextKey: string | null;
}) {
  const [verse, setVerse] = useState<Verse>(initialVerse);
  const [translationId, setTranslationId] = useState(20);
  const [reciterId, setReciterId] = useState(7);
  const [tafsirId, setTafsirId] = useState(TAFSIR_ID);
  const translationGroups = useMemo(() => groupByLanguage(TRANSLATIONS), []);
  const tafsirGroups = useMemo(() => groupByLanguage(TAFSIRS), []);
  const [viewMode, setViewMode] = useState<ViewMode>('translation');
  const [coachOpen, setCoachOpen] = useState(initialCoachOpen);
  const [script, setScript] = useScriptPref();

  /* ?mode=recite is read client-side so the server page stays static. */
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('mode') === 'recite') {
        setCoachOpen(true);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [playing, setPlaying] = useState(false);
  const [playingWord, setPlayingWord] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [memorised, setMemorised] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* Sequential word-by-word playback: play each word's clip in turn,
     highlighting the word card as it sounds. Words come from the
     server-fetched initialWords (same payload as the list below), so no
     extra fetch. Words without audio are skipped; if none has audio, a
     note is shown instead of silence. */
  const wbwAudioRef = useRef<HTMLAudioElement | null>(null);
  const wbwQueueRef = useRef<number[]>([]);
  const [wbwSeqPlaying, setWbwSeqPlaying] = useState(false);
  const [wbwSeqNote, setWbwSeqNote] = useState('');

  useEffect(() => {
    const a = new Audio();
    wbwAudioRef.current = a;
    const onEnded = () => {
      const next = wbwQueueRef.current.shift();
      if (next === undefined) {
        setWbwSeqPlaying(false);
        setPlayingWord(null);
        return;
      }
      playWbwIndex(next);
    };
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('ended', onEnded);
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playWbwIndex = (i: number) => {
    const w = wordsRef.current[i];
    const a = wbwAudioRef.current;
    if (!w?.audioUrl || !a) return;
    a.src = `${AUDIO_BASE}${w.audioUrl}`;
    setPlayingWord(i);
    a.play().catch(() => {
      const next = wbwQueueRef.current.shift();
      if (next !== undefined) playWbwIndex(next);
      else {
        setWbwSeqPlaying(false);
        setPlayingWord(null);
      }
    });
  };

  const stopWbwSeq = () => {
    wbwQueueRef.current = [];
    wbwAudioRef.current?.pause();
    setWbwSeqPlaying(false);
    setPlayingWord(null);
  };

  const playAllWords = () => {
    const idx = wordsRef.current.map((w, i) => (w.audioUrl ? i : -1)).filter((i) => i >= 0);
    if (idx.length === 0) {
      setWbwSeqNote('Word audio is unavailable for this ayah.');
      return;
    }
    setWbwSeqNote('');
    wbwQueueRef.current = idx.slice(1);
    setWbwSeqPlaying(true);
    playWbwIndex(idx[0]);
  };

  const key = `${surah.id}:${ayah}`;
  const translation = stripHtml(verse.translations?.[0]?.text ?? '');
  const translationName = TRANSLATIONS.find((t) => t.id === translationId)?.name ?? 'Saheeh International';
  const reciterName = RECITERS.find((r) => r.id === reciterId)?.name ?? 'Mishary Alafasy';
  const words = pairWords(verse.text_indopak, initialWords);
  /* Ref so the sequential-playback callbacks above always see the current
     word list even though they were created on an earlier render. */
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useEffect(() => {
    try {
      const b = localStorage.getItem('quran_bookmarks_v2');
      if (b) {
        const raw = JSON.parse(b) as { surahNumber?: number; surah?: number; verseNumber?: number; ayah?: number }[];
        setBookmarked(raw.some((x) => Number(x.surahNumber ?? x.surah) === surah.id && Number(x.verseNumber ?? x.ayah) === ayah));
      }
      const p = loadProgress();
      setMemorised(p.ayahs[key]?.status === 'memorised');
      const storedTafsir = Number(localStorage.getItem(TAFSIR_KEY) ?? '');
      if (TAFSIRS.some((t) => t.id === storedTafsir)) setTafsirId(storedTafsir);
    } catch {
      /* storage unavailable */
    }
  }, [surah.id, ayah, key]);

  useEffect(() => {
    try {
      localStorage.setItem(TAFSIR_KEY, String(tafsirId));
    } catch {
      /* ignore */
    }
  }, [tafsirId]);

  const refetch = useCallback(
    async (tId: number, rId: number) => {
      try {
        const res = await fetch(
          `${API}/verses/by_key/${key}?fields=text_indopak,text_uthmani&translations=${tId}&audio=${rId}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.verse) setVerse(data.verse as Verse);
      } catch {
        /* keep the server-rendered verse */
      }
    },
    [key],
  );

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void refetch(translationId, reciterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationId, reciterId]);

  const playAudio = () => {
    const audio = audioRef.current;
    if (!audio || !verse.audio?.url) return;
    stopWbwSeq();
    audio.src = `${AUDIO_BASE}${verse.audio.url}`;
    setPlaying(true);
    audio.play().catch(() => setPlaying(false));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setPlaying(false);
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, []);

  const toggleBookmark = () => {
    try {
      const raw = localStorage.getItem('quran_bookmarks_v2');
      const list = raw ? (JSON.parse(raw) as { surahNumber: number; verseNumber: number; surahName: string; timestamp: number }[]) : [];
      const next = bookmarked
        ? list.filter((b) => !(b.surahNumber === surah.id && b.verseNumber === ayah))
        : [...list, { surahNumber: surah.id, verseNumber: ayah, surahName: surah.name, timestamp: Date.now() }];
      localStorage.setItem('quran_bookmarks_v2', JSON.stringify(next));
      setBookmarked(!bookmarked);
    } catch {
      /* ignore */
    }
  };

  const toggleMemorised = () => {
    try {
      const p = loadProgress();
      const prev = p.ayahs[key];
      const now = new Date().toISOString();
      const next: HifzProgress = {
        ...p,
        ayahs: {
          ...p.ayahs,
          [key]: memorised
            ? { status: 'learning', correctStreak: 0, lastPractised: now, attempts: (prev?.attempts ?? 0) + 1 }
            : { status: 'memorised', correctStreak: 3, lastPractised: now, attempts: (prev?.attempts ?? 0) + 1 },
        },
      };
      saveProgress(next);
      setMemorised(!memorised);
    } catch {
      /* ignore */
    }
  };

  const coachAyahs: CoachAyah[] = [
    {
      surah: surah.id,
      ayah,
      text: cleanIndopak(verse.text_indopak),
      translation,
      audioUrl: verse.audio?.url,
    },
  ];

  return (
    <div>
      <audio ref={audioRef} preload="none" className="hidden" />

      {/* Arabic + translation */}
      <article className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <p dir="rtl" lang="ar" className={`font-quran ${script === 'uthmani' ? 'font-quran-madani' : ''} text-right text-4xl sm:text-5xl`}>
          {verseText(verse, script)}
        </p>
        {viewMode !== 'arabic' && translation && (
          <p className="mt-5 text-base leading-relaxed text-[#1C2420]/85 sm:text-lg">{translation}</p>
        )}
        {viewMode !== 'arabic' && (
          <p className="mt-2 text-xs text-[#1C2420]/50">Translation: {translationName}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#E5E7EB] pt-4">
          <button
            type="button"
            onClick={playAudio}
            disabled={!verse.audio?.url}
            className="rounded-full bg-[#1FA36B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#102E26] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
          >
            {playing ? 'Playing…' : `Listen — ${reciterName}`}
          </button>
          <button
            type="button"
            onClick={toggleBookmark}
            aria-pressed={bookmarked}
            className="rounded-full border border-[#E5E7EB] px-3.5 py-2 text-sm font-semibold hover:border-[#1FA36B]"
          >
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button
            type="button"
            onClick={toggleMemorised}
            aria-pressed={memorised}
            className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${memorised ? 'border-[#1FA36B] bg-[#E4FFF2] text-[#1FA36B]' : 'border-[#E5E7EB] hover:border-[#1FA36B]'}`}
          >
            {memorised ? 'Memorised — tap to unmark' : 'Mark memorised'}
          </button>
          <button
            type="button"
            onClick={() => setCoachOpen(true)}
            className="rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
          >
            Recite this ayah
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
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
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${viewMode === id ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            Translation
            <select
              value={translationId}
              onChange={(e) => setTranslationId(Number(e.target.value))}
              className="rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            >
              {translationGroups.map((g) => (
                <optgroup key={g.lang} label={g.lang}>
                  {g.items.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            Tafsir
            <select
              value={tafsirId}
              onChange={(e) => setTafsirId(Number(e.target.value))}
              className="rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            >
              {tafsirGroups.map((g) => (
                <optgroup key={g.lang} label={g.lang}>
                  {g.items.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            Reciter
            <select
              value={reciterId}
              onChange={(e) => setReciterId(Number(e.target.value))}
              className="rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
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
              className="rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            >
              {(Object.keys(SCRIPT_LABELS) as ('indopak' | 'uthmani')[]).map((s) => (
                <option key={s} value={s}>{SCRIPT_LABELS[s]}</option>
              ))}
            </select>
          </label>
        </div>
        {script === 'uthmani' && (
          <p className="mt-3 text-xs leading-relaxed text-[#5b6b62]">
            Reading in Madani (Uthmani) script. The recitation coach still checks
            against the Indo-Pak text — its word alignment is built on it.
          </p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-[#5b6b62]">
          {TRANSLATIONS.length} translations · {TAFSIRS.length} tafsirs · {RECITERS.length} recitations — all free. {attributionFor(translationId, tafsirId)}
        </p>

        {/* Tafsir renders ONLY in Tafsir mode (commit 12a3449 — do not regress). */}
        {viewMode === 'tafsir' && (
          <div className="mt-4">
            {tafsirId === TAFSIR_ID && initialTafsir ? (
              <div className="rounded-xl bg-[#FFFBF2] border border-[#E5E7EB] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#1FA36B]">Tafsir Ibn Kathir (Abridged)</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#1C2420]/85">{initialTafsir}</p>
              </div>
            ) : (
              <TafsirBlock key={`${key}:${tafsirId}`} verseKey={key} tafsirId={tafsirId} />
            )}
          </div>
        )}
      </article>

      {/* Word-by-word */}
      <section aria-labelledby="wbw-heading" className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="wbw-heading" className="text-lg font-bold text-[#102E26]">Word-by-word</h2>
          {words.length > 0 && (
            <button
              type="button"
              onClick={wbwSeqPlaying ? stopWbwSeq : playAllWords}
              className="rounded-full bg-[#1FA36B] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#102E26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {wbwSeqPlaying ? 'Stop' : 'Play all words'}
            </button>
          )}
        </div>
        {wbwSeqNote && (
          <p role="status" className="mt-2 text-sm text-[#7A5C00]">{wbwSeqNote}</p>
        )}
        {words.length === 0 ? (
          <p className="mt-2 text-sm text-[#5b6b62]">Word-by-word is unavailable right now.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {words.map((w, i) => (
              <li key={i} className={`rounded-lg border px-2.5 py-1.5 text-center ${playingWord === i ? 'border-[#FFB800] bg-[#FFB800]/15 ring-1 ring-[#FFB800]' : 'border-[#E5E7EB] bg-[#FFFBF2]'}`}>
                <span dir="rtl" lang="ar" className="font-quran block text-xl leading-snug text-[#102E26]">{w.arabic}</span>
                {w.transliteration && <span className="block text-[11px] italic text-[#5b6b62]">{w.transliteration}</span>}
                {w.translation && <span className="block text-[11px] text-[#1C2420]/75">{w.translation}</span>}
                {w.audioUrl && (
                  <button
                    type="button"
                    aria-label={`Hear the word ${w.transliteration || w.arabic}`}
                    onClick={() => {
                      stopWbwSeq();
                      const audio = new Audio(`${AUDIO_BASE}${w.audioUrl}`);
                      setPlayingWord(i);
                      audio.play().catch(() => setPlayingWord(null));
                      audio.addEventListener('ended', () => setPlayingWord(null), { once: true });
                    }}
                    className="mt-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#1FA36B] hover:underline"
                  >
                    {playingWord === i ? 'Playing…' : 'Hear it'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-[#5b6b62]">Word translations via Quran.com.</p>
      </section>

      {/* Coach, scoped to this ayah */}
      {coachOpen && (
        <div className="mt-6 text-[#1C2420]">
          <RecitationCoach
            surah={surah.id}
            surahName={surah.name}
            ayahs={coachAyahs}
            initialAyahIndex={0}
            initialReciterId={reciterId}
          />
        </div>
      )}
      {!coachOpen && (
        <button
          type="button"
          onClick={() => setCoachOpen(true)}
          className="mt-6 flex items-center gap-2 rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
        >
          <ToolIcon name="mic" className="h-4 w-4" /> Recite this ayah with the coach
        </button>
      )}

      {/* Prev / next ayah */}
      <nav aria-label="Previous and next ayah" className="mt-8 flex flex-wrap justify-between gap-2">
        {prevKey ? (
          <Link href={`/hifz/${surah.slug}/${prevKey.replace(':', '-')}`} className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]">
            ← Previous ayah ({prevKey})
          </Link>
        ) : (
          <span />
        )}
        {nextKey ? (
          <Link href={`/hifz/${surah.slug}/${nextKey.replace(':', '-')}`} className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]">
            Next ayah ({nextKey}) →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
