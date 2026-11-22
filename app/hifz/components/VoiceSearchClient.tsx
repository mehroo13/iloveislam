// app/hifz/components/VoiceSearchClient.tsx — Voice Search (spec §15.2).
// "Shazam for Quran": recite a few words and find the ayah. The browser's
// speech recognition (Web Speech API) transcribes the spoken Arabic, and the
// text is matched against the Quran through the same-origin /api/quran proxy
// (Quran.com search endpoint). Nothing is recorded or uploaded by us: the
// transcription happens in the browser, and only the recognised text is sent
// to the search API. A typed search box is the fallback when the browser has
// no speech recognition. Results link into the Hifz hub — every surah in
// the whole Quran has a coach page, so every match opens in the coach.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getSurahById } from '../surahs';
import { useT } from '../lib/i18n';

interface SearchResult {
  verseKey: string;
  surah: number;
  ayah: number;
  text: string;
  translation: string;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionCtor | undefined;
  return typeof Ctor === 'function' ? Ctor : null;
}

export default function VoiceSearchClient() {
  const t = useT();
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const recogRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null);
    return () => {
      try {
        recogRef.current?.stop();
      } catch {
        // Already stopped.
      }
    };
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearching(true);
    setNotice(null);
    setResults(null);
    setSearchedQuery(trimmed);
    try {
      const res = await fetch(
        `/api/quran/search?q=${encodeURIComponent(trimmed)}&size=5&language=en`,
      );
      if (!res.ok) throw new Error('Search request failed');
      const data = await res.json();
      const raw: unknown[] = Array.isArray(data?.search?.results)
        ? data.search.results
        : Array.isArray(data?.results)
          ? data.results
          : [];
      const parsed: SearchResult[] = [];
      for (const r of raw) {
        const item = r as Record<string, unknown>;
        const verseKey = typeof item.verse_key === 'string' ? item.verse_key : '';
        const m = /^(\d+):(\d+)$/.exec(verseKey);
        if (!m) continue;
        const textRaw = typeof item.text === 'string' ? item.text : '';
        const translations = Array.isArray(item.translations) ? item.translations : [];
        const translation =
          translations.length > 0 && typeof (translations[0] as Record<string, unknown>).text === 'string'
            ? stripHtml((translations[0] as Record<string, unknown>).text as string)
            : '';
        parsed.push({
          verseKey,
          surah: Number(m[1]),
          ayah: Number(m[2]),
          text: stripHtml(textRaw),
          translation,
        });
      }
      setResults(parsed);
      if (parsed.length === 0) {
        setNotice(t('voice.noMatch'));
      }
    } catch {
      setNotice(t('voice.searchFailed'));
    } finally {
      setSearching(false);
    }
  }, [t]);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setNotice(t('voice.needBrowser'));
      return;
    }
    try {
      recogRef.current?.stop();
    } catch {
      // Nothing running.
    }
    const recog = new Ctor();
    recogRef.current = recog;
    recog.lang = 'ar-SA';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      if (transcript.trim()) {
        setQuery(transcript.trim());
        void runSearch(transcript.trim());
      }
    };
    recog.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setNotice(t('voice.micBlocked'));
      } else if (event.error === 'no-speech') {
        setNotice(t('voice.noSpeechHeard'));
      } else {
        setNotice(t('voice.recogProblem'));
      }
    };
    recog.onend = () => setListening(false);
    setNotice(null);
    setListening(true);
    try {
      recog.start();
    } catch {
      setListening(false);
      setNotice(t('voice.couldNotStart'));
    }
  }, [runSearch, t]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(query);
          }}
        >
          <label className="block text-sm font-semibold" htmlFor="voice-search-input">
            {t('voice.label')}
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="voice-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('voice.placeholder')}
              dir="auto"
              className="min-w-0 flex-1 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm outline-none focus:border-[#1FA36B]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startListening}
                disabled={listening || !speechSupported}
                className="rounded-full bg-[#FFB800] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:brightness-110 disabled:opacity-50"
              >
                {listening ? t('voice.listening') : t('voice.reciteIt')}
              </button>
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="min-h-11 rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] disabled:opacity-50"
              >
                {searching ? t('voice.searching') : t('voice.findAyah')}
              </button>
            </div>
          </div>
        </form>
        {!speechSupported && (
          <p className="mt-3 text-sm text-[#5b6b62]">
            {t('voice.noSpeech')}
          </p>
        )}
        {listening && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#1FA36B]">
            {t('voice.listeningNow')}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 text-sm text-[#5b6b62]">{notice}</p>
        )}
      </section>

      {results !== null && results.length > 0 && (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-xl font-bold text-[#102E26]">
            {t('voice.matchesFor')} “{searchedQuery}”
          </h2>
          <ul className="mt-4 space-y-3">
            {results.map((r) => {
              const surah = getSurahById(r.surah);
              return (
                <li key={r.verseKey} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#102E26]">
                    {surah ? `${t('common.surah')} ${surah.name}` : `${t('common.surah')} ${r.surah}`} · {r.verseKey}
                  </p>
                  {r.text && (
                    <p dir="rtl" lang="ar" className="font-quran mt-3 text-right text-2xl leading-loose text-[#102E26]">
                      {r.text}
                    </p>
                  )}
                  {r.translation && (
                    <p className="mt-2 text-sm leading-relaxed text-[#1C2420]/80">“{r.translation}”</p>
                  )}
                  <div className="mt-4">
                    <Link
                      href={`/hifz/${surah?.slug ?? ''}/${r.surah}-${r.ayah}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                    >
                      {t('voice.openCoach')}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#102E26]">{t('voice.howItWorks')}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#5b6b62]">
          <li>{t('voice.how1')}</li>
          <li>{t('voice.how2')}</li>
          <li>{t('voice.how3')}</li>
        </ul>
      </section>
    </div>
  );
}
