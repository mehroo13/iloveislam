// app/hifz/components/ReciteClient.tsx — the Recite with Coach screen
// (rebuilt 2026-11-27). ONE simple white screen, ONE job: recite.
// The surah + ayah are picked in the header sheet; the coach below
// does Listen → Hide → mic → result. No picker page, no redirect to
// the surah page. Reciter and translation come from Settings.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { API, KHATTAB_TRANSLATION_ID, cleanIndopak } from '../../quran/lib';
import { ALL_SURAHS, getSurahById, type HifzSurah } from '../surahs';
import { loadSettings } from '../progress';
import { lastReadSlug } from '../lib/mode';
import { audioSpokenKeys } from '../lib/reader-words';
import { ATTRIBUTION } from '../lib/fetch';
import type { AudioSegment, CoachAyah } from './RecitationCoach';

const RecitationCoach = dynamic(() => import('./RecitationCoach'), { ssr: false });

interface VersePayload {
  verse_key: string;
  verse_number: number;
  text_indopak?: string;
  text_uthmani?: string;
  translations?: { text?: string }[];
  audio?: { url?: string; segments?: AudioSegment[] };
  words?: { text_uthmani?: string; char_type_name?: string }[];
}

function resolveSurah(param: string | undefined): HifzSurah {
  if (param) {
    const bySlug = ALL_SURAHS.find((s) => s.slug === param);
    if (bySlug) return bySlug;
    const id = Number(param);
    if (Number.isFinite(id)) {
      const byId = getSurahById(id);
      if (byId) return byId;
    }
  }
  const last = ALL_SURAHS.find((s) => s.slug === lastReadSlug());
  return last ?? ALL_SURAHS[0];
}

export default function ReciteClient({
  initialSurah,
  initialAyah,
}: {
  /** ?surah= slug or id, from the page's search params. */
  initialSurah?: string;
  /** ?ayah= number, from the page's search params. */
  initialAyah?: number;
}) {
  const router = useRouter();
  const [surah, setSurah] = useState<HifzSurah>(() => resolveSurah(initialSurah));
  const [ayah, setAyah] = useState<number>(() => {
    const s = resolveSurah(initialSurah);
    const a = initialAyah ?? 1;
    return Math.max(1, Math.min(a, s.ayahCount));
  });
  const [coachAyah, setCoachAyah] = useState<CoachAyah | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSurah, setSheetSurah] = useState<HifzSurah>(surah);
  const [sheetAyah, setSheetAyah] = useState(ayah);
  const runRef = useRef(0);

  // Follow the URL when it changes under us (browser back/forward,
  // or a link from the surah page) — the state is otherwise the source
  // of truth and the URL is kept in step by navigation below.
  useEffect(() => {
    const next = resolveSurah(initialSurah);
    const nextAyah = Math.max(1, Math.min(initialAyah ?? 1, next.ayahCount));
    setSurah((prev) => (prev.id === next.id ? prev : next));
    setAyah((prev) => (prev === nextAyah ? prev : nextAyah));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSurah, initialAyah]);

  const fetchAyah = useCallback(async (s: HifzSurah, a: number) => {
    const run = runRef.current + 1;
    runRef.current = run;
    setLoading(true);
    setLoadFailed(false);
    let reciterId = 7;
    let translationId = 20;
    try {
      const st = loadSettings();
      reciterId = st.reciterId;
      translationId = st.translationId;
    } catch {
      /* defaults */
    }
    try {
      const res = await fetch(
        `${API}/verses/by_key/${s.id}:${a}?fields=text_indopak,text_uthmani&words=true&translations=${translationId === KHATTAB_TRANSLATION_ID ? 20 : translationId}&audio=${reciterId}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { verse?: VersePayload };
      const verse = data.verse;
      if (!verse?.text_indopak && !verse?.text_uthmani) throw new Error('No verse');
      let translation = verse.translations?.[0]?.text ?? '';
      if (translationId === KHATTAB_TRANSLATION_ID) {
        // Khattab (131) is not a v4 resource: substitute its text from
        // the same route the ayah page uses.
        try {
          const kRes = await fetch(`/api/quran/khattab/${s.id}`);
          if (kRes.ok) {
            const kData = (await kRes.json()) as { translations?: Record<number, string> };
            const text = kData.translations?.[a];
            if (typeof text === 'string' && text.length > 0) translation = text;
          }
        } catch {
          /* keep the default translation as the fallback */
        }
      }
      if (runRef.current !== run) return;
      setCoachAyah({
        surah: s.id,
        ayah: a,
        text: cleanIndopak(verse.text_indopak ?? verse.text_uthmani ?? ''),
        translation: translation.replace(/<[^>]*>/g, '').trim() || undefined,
        audioUrl: verse.audio?.url,
        segments: verse.audio?.segments,
        // Spoken numbering (audioSpokenKeys), not the reader's
        // token-numbered audioDisplayKeys: the coach's word list is
        // the spoken list, so a segment's key must be the engine's
        // word number — after a pause-mark word the two numberings
        // diverge (18:56) and a token-numbered key would name the
        // wrong segment.
        segKeys: audioSpokenKeys(verse),
      });
    } catch {
      if (runRef.current !== run) return;
      setLoadFailed(true);
      setCoachAyah(null);
    } finally {
      if (runRef.current === run) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAyah(surah, ayah);
  }, [surah, ayah, fetchAyah]);

  const goTo = useCallback(
    (s: HifzSurah, a: number) => {
      const clamped = Math.max(1, Math.min(a, s.ayahCount));
      setSurah(s);
      setAyah(clamped);
      try {
        localStorage.setItem(
          'ili_last_read_v1',
          JSON.stringify({ surah: s.id, name: s.name, slug: s.slug, at: Date.now() }),
        );
      } catch {
        /* storage unavailable */
      }
      router.push(`/hifz/recite?surah=${s.slug}&ayah=${clamped}`);
    },
    [router],
  );

  const nextSurah = ALL_SURAHS.find((s) => s.id === surah.id + 1) ?? null;
  const hasNext = ayah < surah.ayahCount || nextSurah !== null;
  const goNext = useCallback(() => {
    if (ayah < surah.ayahCount) goTo(surah, ayah + 1);
    else if (nextSurah) goTo(nextSurah, 1);
  }, [ayah, surah, nextSurah, goTo]);

  const openSheet = () => {
    setSheetSurah(surah);
    setSheetAyah(ayah);
    setSheetOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-4">
      {/* Header: back to the Features menu, and the surah/ayah picker. */}
      <div className="flex items-center gap-2">
        <Link
          href="/?dashboard=1"
          aria-label="Back to Features"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-xl text-[#1C2420] hover:border-[#1C2420] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
        >
          ←
        </Link>
        <button
          type="button"
          onClick={openSheet}
          aria-haspopup="dialog"
          className="min-h-11 flex-1 rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-left text-[15px] font-semibold text-[#1C2420] hover:border-[#1C2420] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
        >
          {surah.name} · Ayah {ayah}
          <span aria-hidden="true" className="float-right text-[#5b6b62]">⌄</span>
        </button>
      </div>

      {/* The coach. */}
      <div className="mt-4">
        {loading && !coachAyah && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p role="status" className="text-sm text-[#5b6b62]">Loading the ayah…</p>
          </div>
        )}
        {loadFailed && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p role="alert" className="text-sm text-[#1C2420]">
              Couldn&apos;t load this ayah — check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => void fetchAyah(surah, ayah)}
              className="mt-3 min-h-11 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#1C2420] hover:border-[#1C2420] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
            >
              Try again
            </button>
          </div>
        )}
        {coachAyah && (
          <RecitationCoach
            key={`${surah.id}:${ayah}`}
            surah={surah.id}
            surahName={surah.name}
            ayahs={[coachAyah]}
            initialAyahIndex={0}
            onNextAyah={goNext}
            hasNextAyah={hasNext}
          />
        )}
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-[#5b6b62]">{ATTRIBUTION}</p>

      {/* Surah + ayah sheet. */}
      {sheetOpen && (
        <div
          role="dialog"
          aria-label="Choose a surah and ayah"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-t-2xl border border-[#E5E7EB] bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
              <p className="text-base font-bold text-[#1C2420]">Choose a surah and ayah</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] text-[#1C2420] hover:border-[#1C2420] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#1C2420]">
                Ayah
                <select
                  value={sheetAyah}
                  onChange={(e) => setSheetAyah(Number(e.target.value))}
                  className="min-h-11 rounded-lg border border-[#E5E7EB] bg-white px-2 py-2 text-sm"
                >
                  {Array.from({ length: sheetSurah.ayahCount }, (_, i) => i + 1).map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  goTo(sheetSurah, sheetAyah);
                }}
                className="min-h-11 rounded-full border border-[#1C2420] bg-white px-5 py-2.5 text-sm font-semibold text-[#1C2420] hover:bg-[#F4F5F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
              >
                Go
              </button>
            </div>
            <ul className="max-h-[55vh] overflow-y-auto px-2 pb-4">
              {ALL_SURAHS.map((s) => (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetSurah(s);
                      setSheetAyah(1);
                    }}
                    aria-pressed={sheetSurah.id === s.id}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-[#F4F5F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420] ${
                      sheetSurah.id === s.id ? 'font-bold text-[#1C2420]' : 'text-[#1C2420]'
                    }`}
                  >
                    <span>
                      {s.id}. {s.name}
                      <span className="ml-2 font-normal text-[#5b6b62]">{s.meaning}</span>
                    </span>
                    <span className="shrink-0 text-xs text-[#5b6b62]">{s.ayahCount} ayahs</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
