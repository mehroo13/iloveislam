// app/HomeClient.tsx — Homepage client for the single-purpose Hifz app
// (spec §2, refocus §14). The hero lives in app/page.tsx (server). This
// client owns: the coach entry card (FIRST — the coach is the product),
// continue-where-you-left-off, how-it-works, featured surahs, plans strip,
// Test Mode + Voice Search entries, the verse of the day, and the trust strip.
// No prayer times, no dua of the day, no utilities grid, no tool links:
// the old tools were retired 2026-11-21 and redirect to /hifz.
// All external fetches happen client-side in useEffect — nothing here runs
// at build time, so the page builds with no network.
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ToolIcon from './components/ToolIcon';
import { RECITERS } from './quran/lib';
import { NAMED_LAUNCH_SURAHS, LAUNCH_SURAHS, getSurahById } from './hifz/surahs';
import { getPlan, JUZ_AMMA_90_DAY } from './hifz/plans';
import ProgressWidget, { SurahProgressBar } from './hifz/components/ProgressWidget';
import PlanCard from './hifz/components/PlanCard';

// ==================== CONSTANTS ====================
// Verse of the day — launch-set verses only, so every one links into the hub.
// '2:255' is Ayat al-Kursi, whose friendly page is /hifz/ayat-al-kursi.
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

// ==================== HELPERS ====================
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

const HOW_IT_WORKS = [
  { icon: 'ear', title: 'Listen', text: 'Hear the ayah from a trusted reciter, as many times as you need.' },
  { icon: 'hide', title: 'Hide', text: 'Hide the Arabic and keep the translation as a prompt.' },
  { icon: 'mic', title: 'Recite', text: 'Recite aloud into your microphone — audio never leaves your device.' },
  { icon: 'check', title: 'Feedback', text: 'See every word marked correct, not heard, or to check — then retry.' },
];

// ==================== MAIN HOME CLIENT ====================
export default function HomeClient() {
  const router = useRouter();

  // --- Verse of the day ---
  const [verse, setVerse] = useState<VerseState>(FALLBACK_VERSE);

  // --- Coach entry card ---
  const [coachSurah, setCoachSurah] = useState('al-mulk');
  const [coachReciter, setCoachReciter] = useState(7);

  const verseKey = VERSE_KEYS[dayOfYear(new Date()) % VERSE_KEYS.length];

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

  return (
    <div className="bg-[#F7F5EF] text-[#1C2420]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-8">
        {/* ==================== COACH ENTRY CARD — FIRST ==================== */}
        <section aria-labelledby="coach-heading" className="rounded-2xl bg-[#0B3D2E] p-5 text-white shadow-sm sm:p-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#C9A227]">
            <ToolIcon name="mic" className="h-4 w-4" /> AI recitation coach
          </p>
          <h2 id="coach-heading" className="mt-2 text-xl font-bold sm:text-2xl">Recite right now</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/80">
            Pick a surah and a reciter. Listen first, hide the verse, then recite it from
            memory — the coach follows you word by word and flags every missed word live.
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

        {/* ==================== CONTINUE ==================== */}
        <ProgressWidget />

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

        {/* ==================== GO FURTHER: TEST + VOICE SEARCH ==================== */}
        <section aria-labelledby="further-heading">
          <h2 id="further-heading" className="text-xl font-bold text-[#0B3D2E] sm:text-2xl">Go further</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#0B3D2E]">Test Mode</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#1C2420]/60">
                Exam-style recall: random ayahs from what you have memorised, Arabic hidden,
                no cue. A reveal counts as a miss — exactly like a peek in the coach.
              </p>
              <Link href="/hifz/test" className="mt-4 inline-block rounded-full bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]">
                Take a test →
              </Link>
            </article>
            <article className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#0B3D2E]">Voice Search</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#1C2420]/60">
                Heard an ayah and don&apos;t know where it is? Recite a few words and find it
                instantly — then open it straight in the coach.
              </p>
              <Link href="/hifz/voice-search" className="mt-4 inline-block rounded-full bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]">
                Find an ayah by voice →
              </Link>
            </article>
          </div>
        </section>

        {/* ==================== VERSE OF THE DAY ==================== */}
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
                Use the coach instantly — no account, no email, no personal information required.
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
                Quran text, translations, and tafsir drawn from verified sources and established Islamic references.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
