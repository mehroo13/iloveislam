// app/HomeClient.tsx — Homepage hub client (spec §2).
// The hero lives in app/page.tsx (server). This client owns: how-it-works,
// continue-where-you-left-off, coach entry card, featured surahs, plans
// strip, the demoted Today strip (prayer countdown, Verse of the Day, Dua
// of the Day), the utilities grid and the trust strip.
// All external fetches happen client-side in useEffect — nothing here runs
// at build time, so the page builds with no network.
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TOOLS_DATA } from './lib/toolsData';
import { getDuaOfTheDay, type Dua } from '../lib/duas';
import ToolIcon from './components/ToolIcon';
import {
  PRAYER_METHODS,
  PRAYER_ORDER,
  formatPrayerTime,
  formatCountdown,
  nextPrayer as calcNextPrayer,
  fetchTimingsByCity,
  DEFAULT_CITY,
  DEFAULT_COUNTRY,
  DEFAULT_METHOD,
  CITY_KEY,
  METHOD_KEY,
  type PrayerTimings,
} from './lib/prayer';
import { RECITERS } from './quran/lib';
import { NAMED_LAUNCH_SURAHS, LAUNCH_SURAHS } from './hifz/surahs';
import { getPlan, JUZ_AMMA_90_DAY } from './hifz/plans';
import ProgressWidget, { SurahProgressBar } from './hifz/components/ProgressWidget';
import PlanCard from './hifz/components/PlanCard';

// ==================== CONSTANTS ====================
const VERSE_KEYS = ['94:6', '2:152', '13:28', '39:53', '65:3', '2:186', '16:97', '3:139'];

const FALLBACK_VERSE = {
  arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
  translation: 'Indeed, with hardship comes ease.',
  reference: 'Quran 94:6',
};

// ==================== TYPES ====================
interface ToolItem {
  name: string;
  desc: string;
  icon: string;
  href: string;
  color: string;
}

interface ToolSection {
  category: string;
  emoji: string;
  items: ToolItem[];
}

interface VerseState {
  arabic: string;
  translation: string;
  reference: string;
}

// ==================== HELPERS ====================
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

/** TOOLS_DATA is exported as a zero-arg function in lib/toolsData.ts; resolve
 *  defensively so a plain-array rewrite of that file still works. */
function resolveToolsData(): ToolSection[] {
  const data: unknown = TOOLS_DATA;
  if (typeof data === 'function') {
    try {
      return (data as () => ToolSection[])();
    } catch {
      return [];
    }
  }
  if (Array.isArray(data)) return data as ToolSection[];
  return [];
}

const HOW_IT_WORKS = [
  { icon: 'ear', title: 'Listen', text: 'Hear the ayah from a trusted reciter, as many times as you need.' },
  { icon: 'hide', title: 'Hide', text: 'Hide the Arabic and keep the translation as a prompt.' },
  { icon: 'mic', title: 'Recite', text: 'Recite aloud into your microphone — audio never leaves your device.' },
  { icon: 'check', title: 'Feedback', text: 'See every word marked correct, not heard, or to check — then retry.' },
];

// ==================== MAIN HOME CLIENT ====================
export default function HomeClient({
  initialPrayer,
}: {
  /** Server-rendered Sydney / Muslim World League timings — the card renders
   *  instantly instead of waiting on a client fetch. */
  initialPrayer?: { timings: PrayerTimings; hijri: string } | null;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());

  // --- Prayer times state ---
  const [city, setCity] = useState(DEFAULT_CITY);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [cityInput, setCityInput] = useState(DEFAULT_CITY);
  const [countryInput, setCountryInput] = useState(DEFAULT_COUNTRY);
  const [method, setMethod] = useState(DEFAULT_METHOD);
  const [timings, setTimings] = useState<PrayerTimings | null>(initialPrayer?.timings ?? null);
  const [hijri, setHijri] = useState(initialPrayer?.hijri ?? '');
  const [prayerError, setPrayerError] = useState(false);

  // --- Verse of the day ---
  const [verse, setVerse] = useState<VerseState>(FALLBACK_VERSE);

  // --- Coach entry card ---
  const [coachSurah, setCoachSurah] = useState('al-mulk');
  const [coachReciter, setCoachReciter] = useState(7);

  // Dua of the day (deterministic per day, from lib/duas)
  const dua = useMemo<Dua | null>(() => {
    try {
      return getDuaOfTheDay();
    } catch {
      return null;
    }
  }, []);

  const sections = useMemo<ToolSection[]>(() => resolveToolsData(), []);

  // Tick every second for the live countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Load saved location + calculation method.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CITY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { city?: string; country?: string };
        if (typeof parsed.city === 'string' && parsed.city.trim()) {
          setCity(parsed.city.trim());
          setCityInput(parsed.city.trim());
        }
        if (typeof parsed.country === 'string' && parsed.country.trim()) {
          setCountry(parsed.country.trim());
          setCountryInput(parsed.country.trim());
        }
      }
      const savedMethod = localStorage.getItem(METHOD_KEY);
      if (savedMethod) {
        const n = Number(savedMethod);
        if (PRAYER_METHODS.some((pm) => pm.id === n)) setMethod(n);
      }
    } catch {
      // Defaults stand.
    }
  }, []);

  // Fetch prayer times from Aladhan whenever location/method changes.
  useEffect(() => {
    let cancelled = false;
    setPrayerError(false);
    fetchTimingsByCity(city, country, method)
      .then((day) => {
        if (cancelled) return;
        if (day) {
          setTimings(day.timings);
          if (day.hijri) setHijri(day.hijri);
        } else {
          setPrayerError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setPrayerError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [city, country, method]);

  // Fetch verse of the day from Quran.com (rotates by day of year).
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

  const nextPrayer = useMemo(() => (timings ? calcNextPrayer(timings, now) : null), [timings, now]);

  function applyLocation(e: React.FormEvent) {
    e.preventDefault();
    const c = cityInput.trim() || DEFAULT_CITY;
    const co = countryInput.trim() || DEFAULT_COUNTRY;
    setCity(c);
    setCountry(co);
    setCityInput(c);
    setCountryInput(co);
    try {
      localStorage.setItem(CITY_KEY, JSON.stringify({ city: c, country: co }));
    } catch {
      // Storage unavailable — location still applies for this session.
    }
  }

  function changeMethod(id: number) {
    setMethod(id);
    try {
      localStorage.setItem(METHOD_KEY, String(id));
    } catch {
      // Storage unavailable — method still applies for this session.
    }
  }

  return (
    <div className="bg-[#F7F5EF] text-[#1C2420]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-8">
        {/* ==================== HOW IT WORKS ==================== */}
        <section aria-labelledby="how-heading">
          <h2 id="how-heading" className="sr-only">How the recitation coach works</h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-4 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3ee] text-[#146B4D]">
                  <ToolIcon name={step.icon} className="h-5 w-5" />
                </span>
                <p className="mt-3 font-bold text-[#0B3D2E]">
                  {i + 1}. {step.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#1C2420]/60">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ==================== CONTINUE ==================== */}
        <ProgressWidget />

        {/* ==================== COACH ENTRY CARD ==================== */}
        <section aria-labelledby="coach-heading" className="rounded-2xl bg-[#0B3D2E] p-5 text-white shadow-sm sm:p-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#C9A227]">
            <ToolIcon name="mic" className="h-4 w-4" /> Recitation coach
          </p>
          <h2 id="coach-heading" className="mt-2 text-xl font-bold sm:text-2xl">Recite right now</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/80">
            Pick a surah and a reciter. Listen first, or go straight to reciting.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-white/70">
              Surah
              <select
                value={coachSurah}
                onChange={(e) => setCoachSurah(e.target.value)}
                className="mt-1 block w-full max-w-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white"
              >
                {LAUNCH_SURAHS.map((s) => (
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push(`/hifz/${coachSurah}`)}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0B3D2E] hover:bg-[#eaf3ee]"
              >
                Listen first
              </button>
              <button
                type="button"
                onClick={() => router.push(`/hifz/${coachSurah}?mode=recite`)}
                className="rounded-full bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-[#0B3D2E] hover:brightness-110"
              >
                Recite now
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/60">
            This checks which words you said — it does not check tajweed. A teacher is still needed for tajweed.
          </p>
        </section>

        {/* ==================== FEATURED SURAHS ==================== */}
        <section aria-labelledby="featured-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="featured-heading" className="text-xl font-bold text-[#0B3D2E] sm:text-2xl">Featured surahs</h2>
            <Link href="/hifz" className="text-sm font-semibold text-[#146B4D] hover:text-[#0B3D2E] hover:underline">
              Open the Hifz hub →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NAMED_LAUNCH_SURAHS.map((s) => {
              const plan = getPlan(s.slug, 7);
              return (
                <article key={s.slug} className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#0B3D2E]">
                        <Link href={`/hifz/${s.slug}`} className="hover:underline">Surah {s.name}</Link>
                      </h3>
                      <p className="text-sm text-[#1C2420]/60">
                        {s.meaning} · {s.ayahCount} ayahs · {s.revelation} · Juz {s.juz}
                      </p>
                    </div>
                    <p dir="rtl" lang="ar" className="font-quran shrink-0 text-3xl text-[#146B4D]">{s.arabic}</p>
                  </div>
                  <div className="mt-4">
                    <SurahProgressBar surahId={s.id} ayahCount={s.ayahCount} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/hifz/${s.slug}?mode=recite`} className="rounded-full bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]">
                      Recite
                    </Link>
                    <Link href={`/hifz/${s.slug}`} className="rounded-full border border-[#e5e0d3] px-4 py-2 text-sm font-semibold hover:border-[#146B4D]">
                      Study
                    </Link>
                    {plan && (
                      <span className="rounded-full bg-[#F7F5EF] px-3 py-2 text-xs font-bold text-[#1C2420]/60">7-day plan</span>
                    )}
                  </div>
                </article>
              );
            })}
            <article className="rounded-2xl border border-[#C9A227]/40 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#0B3D2E]">
                    <Link href="/hifz/ayat-al-kursi" className="hover:underline">Ayat al-Kursi</Link>
                  </h3>
                  <p className="text-sm text-[#1C2420]/60">The greatest verse in the Book of Allah · 2:255 · 1 ayah</p>
                </div>
                <p dir="rtl" lang="ar" className="font-quran shrink-0 text-3xl text-[#146B4D]">آية الكرسي</p>
              </div>
              <div className="mt-4">
                <SurahProgressBar surahId={2} ayahCount={1} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/hifz/ayat-al-kursi" className="rounded-full bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]">
                  Study Ayat al-Kursi
                </Link>
                <span className="rounded-full bg-[#F7F5EF] px-3 py-2 text-xs font-bold text-[#1C2420]/60">7-day plan</span>
              </div>
            </article>
            <article className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#0B3D2E]">
                    <Link href="/hifz/juz-amma" className="hover:underline">Juz Amma</Link>
                  </h3>
                  <p className="text-sm text-[#1C2420]/60">Juz 30 · 37 short surahs · 564 ayahs · the beginner path</p>
                </div>
                <p dir="rtl" lang="ar" className="font-quran shrink-0 text-3xl text-[#146B4D]">جزء عمّ</p>
              </div>
              <p className="mt-4 text-sm text-[#1C2420]/60">
                Shortest first, one surah every 2–3 days — early wins that build a habit.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/hifz/juz-amma" className="rounded-full bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]">
                  Browse Juz Amma
                </Link>
                <span className="rounded-full bg-[#F7F5EF] px-3 py-2 text-xs font-bold text-[#1C2420]/60">90-day plan</span>
              </div>
            </article>
          </div>
        </section>

        {/* ==================== PLANS STRIP ==================== */}
        <section aria-labelledby="plans-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="plans-heading" className="text-xl font-bold text-[#0B3D2E] sm:text-2xl">Memorisation plans</h2>
            <Link href="/hifz/plans" className="text-sm font-semibold text-[#146B4D] hover:text-[#0B3D2E] hover:underline">
              See all plans →
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <PlanCard plan={getPlan('al-mulk', 7)!} surahSlug="al-mulk" surahName="Al-Mulk" />
            <PlanCard plan={JUZ_AMMA_90_DAY} surahName="Juz Amma" premium />
          </div>
        </section>

        {/* ==================== TODAY STRIP (demoted) ==================== */}
        <section aria-labelledby="today-heading">
          <h2 id="today-heading" className="text-xl font-bold text-[#0B3D2E] sm:text-2xl">Today</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <section aria-labelledby="prayer-heading" className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 id="prayer-heading" className="text-lg font-bold text-[#0B3D2E]">
                  Prayer times · {city}
                </h3>
                <Link href="/prayer-times" className="text-sm font-semibold text-[#146B4D] hover:text-[#0B3D2E] hover:underline">
                  Full prayer times →
                </Link>
              </div>
              {prayerError && !timings && (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  We couldn&apos;t load prayer times for {city}, {country}. Check the spelling below and try again.
                </p>
              )}
              {timings && nextPrayer && (
                <div className="mt-4 rounded-xl bg-[#0B3D2E] px-4 py-4 text-white sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#C9A227]">
                    Next prayer · {nextPrayer.name}
                    {nextPrayer.tomorrow ? ' (tomorrow)' : ''}
                  </p>
                  <p className="mt-1 font-mono text-3xl font-bold tabular-nums sm:text-4xl">
                    {formatCountdown(nextPrayer.time.getTime() - now.getTime())}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    {nextPrayer.name} at {formatPrayerTime(timings[nextPrayer.name])}
                  </p>
                </div>
              )}
              {timings && (
                <ul className="mt-4 divide-y divide-[#1C2420]/5">
                  {PRAYER_ORDER.map((name) => {
                    const isNext = nextPrayer?.name === name && !nextPrayer.tomorrow;
                    return (
                      <li key={name} className={`flex items-center justify-between py-2 text-sm ${isNext ? 'font-bold text-[#0B3D2E]' : ''}`}>
                        <span className="flex items-center gap-2">
                          {name}
                          {isNext && (
                            <span className="rounded-full bg-[#C9A227] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0B3D2E]">
                              Next
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums">{formatPrayerTime(timings[name])}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {hijri && <p className="mt-3 text-xs font-semibold text-[#1C2420]/50">{hijri}</p>}
              <form onSubmit={applyLocation} className="mt-4 flex flex-col gap-2 border-t border-[#1C2420]/5 pt-4 sm:flex-row sm:items-end">
                <label className="flex-1 text-xs font-semibold text-[#1C2420]/70">
                  City
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="Sydney"
                    className="mt-1 w-full rounded-lg border border-[#1C2420]/15 px-3 py-2 text-sm font-normal text-[#1C2420] outline-none focus:border-[#146B4D]"
                  />
                </label>
                <label className="flex-1 text-xs font-semibold text-[#1C2420]/70">
                  Country
                  <input
                    type="text"
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value)}
                    placeholder="Australia"
                    className="mt-1 w-full rounded-lg border border-[#1C2420]/15 px-3 py-2 text-sm font-normal text-[#1C2420] outline-none focus:border-[#146B4D]"
                  />
                </label>
                <label className="flex-1 text-xs font-semibold text-[#1C2420]/70">
                  Calculation method
                  <select
                    value={method}
                    onChange={(e) => changeMethod(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#1C2420]/15 bg-white px-3 py-2 text-sm font-normal text-[#1C2420] outline-none focus:border-[#146B4D]"
                  >
                    {PRAYER_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#146B4D]"
                >
                  Update
                </button>
              </form>
            </section>

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
              <Link href="/quran" className="mt-4 inline-block text-sm font-semibold text-[#146B4D] hover:text-[#0B3D2E] hover:underline">
                Read more in the Quran reader →
              </Link>
            </section>

            {dua && (
              <section aria-labelledby="dua-heading" className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9A227]">Dua of the day</p>
                <h3 id="dua-heading" className="mt-2 text-lg font-bold text-[#0B3D2E] sm:text-xl">
                  {dua.title}
                </h3>
                {dua.situations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {dua.situations.map((s) => (
                      <span key={s} className="rounded-full bg-[#F7F5EF] px-2.5 py-1 text-[11px] font-semibold text-[#146B4D]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <p dir="rtl" lang="ar" className="font-quran mt-4 text-right text-2xl text-[#0B3D2E] sm:text-3xl">
                  {dua.arabic}
                </p>
                {dua.transliteration && (
                  <p className="mt-3 text-sm italic leading-relaxed text-[#1C2420]/70">{dua.transliteration}</p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-[#1C2420]/80 sm:text-base">{dua.translation}</p>
                <p className="mt-2 text-xs font-semibold text-[#1C2420]/50">{dua.source}</p>
                <Link href="/dua-for-this-moment" className="mt-4 inline-block text-sm font-semibold text-[#146B4D] hover:text-[#0B3D2E] hover:underline">
                  Find the dua for this moment →
                </Link>
              </section>
            )}
          </div>
        </section>

        {/* ==================== UTILITIES GRID ==================== */}
        <section aria-labelledby="tools-heading" id="tools" className="scroll-mt-20">
          <h2 id="tools-heading" className="text-xl font-bold text-[#0B3D2E] sm:text-2xl">More tools</h2>
          <p className="mt-1 text-sm text-[#1C2420]/60">
            Everything else you need for your daily deen, in one place.
          </p>
          {sections.map((section) => (
            <div key={section.category} className="mt-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#1C2420]/60">
                <span className="text-[#146B4D]"><ToolIcon name={section.emoji} className="h-4 w-4" /></span> {section.category}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {section.items.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group flex flex-col items-start rounded-xl border border-[#0B3D2E]/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#C9A227] hover:shadow-md"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool.color}`}>
                      <ToolIcon name={tool.icon} className="h-5 w-5" />
                    </span>
                    <span className="mt-3 text-sm font-bold leading-tight text-[#1C2420] group-hover:text-[#0B3D2E]">
                      {tool.name}
                    </span>
                    <span className="mt-0.5 text-xs leading-snug text-[#1C2420]/55">{tool.desc}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ==================== TRUST STRIP ==================== */}
        <section aria-labelledby="why-heading" className="rounded-2xl bg-[#0B3D2E] p-5 text-white shadow-sm sm:p-6">
          <h2 id="why-heading" className="text-xl font-bold sm:text-2xl">
            Why I Love Islam
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
            Quran text, translation and tafsir from Quran.com. Your recitation audio never leaves
            your device. A teacher is still needed for tajweed — this tool checks words, not tajweed.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="flex items-center gap-1.5 font-bold text-[#C9A227]"><ToolIcon name="check" className="h-4 w-4" /> Free forever</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">
                No subscriptions, no premium tiers, no hidden costs. The coach and the plans are free.
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-bold text-[#C9A227]"><ToolIcon name="check" className="h-4 w-4" /> No sign-up</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">
                Use any tool instantly — no account, no email, no personal information required.
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-bold text-[#C9A227]"><ToolIcon name="check" className="h-4 w-4" /> Privacy first</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">
                Your recitation audio never leaves your device. Your progress stays on your own device.
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-bold text-[#C9A227]"><ToolIcon name="check" className="h-4 w-4" /> Authentic sources</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">
                Quran text, translations, and duas drawn from verified sources and established Islamic references.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
