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
        setNotice(
          'No ayah matched that exactly. Try reciting a longer phrase, or check the words and try again.',
        );
      }
    } catch {
      setNotice('Search could not run — check your connection and try again.');
    } finally {
      setSearching(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setNotice('Voice search needs a browser with speech recognition (Chrome or Edge). Type the words instead — the search works the same way.');
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
        setNotice('Microphone access was blocked. Allow the microphone and try again — or type the words instead.');
      } else if (event.error === 'no-speech') {
        setNotice('Nothing was heard. Recite a few words clearly and try again.');
      } else {
        setNotice('Voice recognition hit a problem — type the words instead, the search works the same way.');
      }
    };
    recog.onend = () => setListening(false);
    setNotice(null);
    setListening(true);
    try {
      recog.start();
    } catch {
      setListening(false);
      setNotice('Voice recognition could not start in this browser — type the words instead.');
    }
  }, [runSearch]);

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
            Recite a phrase, or type it
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="voice-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. تبارك الذي بيده الملك — or type the words in Arabic"
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
                {listening ? 'Listening…' : '🎙 Recite it'}
              </button>
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] disabled:opacity-50"
              >
                {searching ? 'Searching…' : 'Find the ayah'}
              </button>
            </div>
          </div>
        </form>
        {!speechSupported && (
          <p className="mt-3 text-sm text-[#5b6b62]">
            This browser has no speech recognition (it works in Chrome and Edge). Type the
            Arabic words instead — the search is the same.
          </p>
        )}
        {listening && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#1FA36B]">
            Listening — recite a few words of the ayah now.
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 text-sm text-[#5b6b62]">{notice}</p>
        )}
      </section>

      {results !== null && results.length > 0 && (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-xl font-bold text-[#102E26]">
            Matches for “{searchedQuery}”
          </h2>
          <ul className="mt-4 space-y-3">
            {results.map((r) => {
              const surah = getSurahById(r.surah);
              return (
                <li key={r.verseKey} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#102E26]">
                    {surah ? `Surah ${surah.name}` : `Surah ${r.surah}`} · {r.verseKey}
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
                      className="rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                    >
                      Open in the coach →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#102E26]">How it works</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#5b6b62]">
          <li>Tap “Recite it” and say a few words of any ayah — the browser turns your voice into text on your device.</li>
          <li>Only the recognised text is searched, through the same Quran.com search the hub already uses. Your voice is never recorded or uploaded by us.</li>
          <li>Matches open straight into the recitation coach for that ayah.</li>
        </ul>
      </section>
    </div>
  );
}
