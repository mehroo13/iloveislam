// app/HomeClient.tsx — homepage client, Tarteel-simple (redesign 2026-11-21).
// One primary action (recite now), then Continue, then the surah list,
// then one slim verse-of-the-day line. Everything else (plans, Test Mode,
// Voice Search, challenges, progress) lives one tap away on the hub and
// in the header — not stacked on this page.
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ToolIcon from './components/ToolIcon';
import { RECITERS } from './quran/lib';
import { ALL_SURAHS, getSurahById } from './hifz/surahs';
import ProgressWidget from './hifz/components/ProgressWidget';
import SurahList from './hifz/components/SurahList';

// Verse of the day — rotates daily; every verse links into the hub.
const VERSE_KEYS = ['67:1', '1:5', '55:13', '78:1', '94:6', '2:255', '112:1', '36:58'];

const FALLBACK_VERSE = {
  arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
  translation: 'Indeed, with hardship comes ease.',
  reference: 'Quran 94:6',
};

interface VerseState {
  arabic: string;
  translation: string;
  reference: string;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

/** Hub link for a verse key like '67:1' — Ayat al-Kursi goes to its own page. */
function verseHref(key: string): string {
  if (key === '2:255') return '/hifz/ayat-al-kursi';
  const [s, a] = key.split(':').map(Number);
  const surah = getSurahById(s);
  return surah ? `/hifz/${surah.slug}/${s}-${a}` : '/hifz';
}

export default function HomeClient() {
  const router = useRouter();
  const [verse, setVerse] = useState<VerseState>(FALLBACK_VERSE);
  const [coachSurah, setCoachSurah] = useState('al-fatihah');
  const [coachReciter, setCoachReciter] = useState(7);

  const verseKey = VERSE_KEYS[dayOfYear(new Date()) % VERSE_KEYS.length];

  useEffect(() => {
    let cancelled = false;
    const key = VERSE_KEYS[dayOfYear(new Date()) % VERSE_KEYS.length];
    fetch(`/api/quran/verses/by_key/${key}?fields=text_indopak&translations=20`)
      .then((r) => {
        if (!r.ok) throw new Error('Verse request failed');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const v = data?.verse;
        const arabic: unknown = v?.text_indopak;
        const translation: unknown = v?.translations?.[0]?.text;
        if (typeof arabic === 'string' && arabic.trim() && typeof translation === 'string' && translation.trim()) {
          setVerse({ arabic: arabic.trim().replace(/[\uE000-\uF8FF]/g, ''), translation: stripHtml(translation), reference: `Quran ${key}` });
        }
      })
      .catch(() => {
        // Keep the hardcoded fallback verse.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-[#F7F5EF] text-[#1C2420]">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-8">
        {/* Coach entry — the one primary action on this page. */}
        <section aria-labelledby="coach-heading" className="rounded-2xl bg-[#0B3D2E] p-5 text-white shadow-sm sm:p-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#C9A227]">
            <ToolIcon name="mic" className="h-4 w-4" /> AI recitation coach
          </p>
          <h2 id="coach-heading" className="mt-2 text-xl font-bold sm:text-2xl">Recite right now</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/80">
            Listen first, hide the verse, then recite it from memory — the coach follows
            you word by word and flags every missed word.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 text-xs font-semibold text-white/70">
              Surah
              <select
                value={coachSurah}
                onChange={(e) => setCoachSurah(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white"
              >
                {ALL_SURAHS.map((s) => (
                  <option key={s.slug} value={s.slug} className="text-[#1C2420]">
                    {s.name} — {s.meaning} ({s.ayahCount} ayahs)
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-white/70">
              Reciter
              <select
                value={coachReciter}
                onChange={(e) => setCoachReciter(Number(e.target.value))}
                className="mt-1 block w-full max-w-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id} className="text-[#1C2420]">{r.name}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => router.push(`/hifz/${coachSurah}?mode=recite`)}
              className="rounded-full bg-[#C9A227] px-6 py-3 text-sm font-bold text-[#0B3D2E] hover:brightness-110"
            >
              Recite now
            </button>
          </div>
          <p className="mt-3 text-xs text-white/60">
            This checks which words you said — it does not check tajweed. A teacher is still needed for tajweed.
          </p>
        </section>

        {/* Continue where you left off */}
        <ProgressWidget />

        {/* Surah list */}
        <SurahList />

        {/* Verse of the day — one slim card */}
        <section aria-labelledby="verse-heading" className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9A227]">Verse of the day</p>
          <h3 id="verse-heading" className="sr-only">Verse of the day</h3>
          <p dir="rtl" lang="ar" className="font-quran mt-4 text-right text-2xl text-[#0B3D2E] sm:text-3xl">
            {verse.arabic}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#1C2420]/80 sm:text-base">
            &ldquo;{verse.translation}&rdquo;
          </p>
          <p className="mt-2 text-xs font-semibold text-[#1C2420]/50">— {verse.reference}</p>
          <Link href={verseHref(verseKey)} className="mt-4 inline-block text-sm font-semibold text-[#146B4D] hover:text-[#0B3D2E] hover:underline">
            Open this ayah in the coach →
          </Link>
        </section>

        <p className="pb-4 text-center text-sm text-[#5b6b62]">
          Free · No sign-up · Your audio never leaves your device
        </p>
      </div>
    </div>
  );
}
