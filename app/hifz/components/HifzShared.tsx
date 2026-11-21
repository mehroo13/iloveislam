// app/hifz/components/HifzShared.tsx — shared SERVER components for the hub:
// breadcrumb, attribution footer, premium section, surah hero.
import Link from 'next/link';
import type { HifzSurah } from '../surahs';
import { ATTRIBUTION } from '../lib/fetch';
import { BISMILLAH } from '../../quran/lib';

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-[#5b6b62]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">›</span>}
            {item.href ? (
              <Link href={item.href} className="font-semibold text-[#146B4D] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-[#1C2420]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Attribution({ reciterName }: { reciterName?: string }) {
  return (
    <p className="mt-8 text-center text-xs leading-relaxed text-[#5b6b62]">
      {ATTRIBUTION}
      {reciterName ? ` Audio: ${reciterName}.` : ''}
    </p>
  );
}

/** Premium — plain "coming soon" section (spec §3.3/§7). No billing, no
 *  price hard-coded, no paywall on text / translation / tafsir / audio /
 *  word-by-word. */
export function PremiumSection() {
  return (
    <section id="premium" aria-labelledby="premium-heading" className="mt-10 scroll-mt-24 rounded-2xl border border-[#C9A227]/40 bg-white p-5 shadow-sm sm:p-6">
      <h2 id="premium-heading" className="text-xl font-bold text-[#0B3D2E]">Premium — coming soon</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#1C2420]/80">
        The recitation coach, 7-day plans, streaks and your progress dashboard are free —
        free during testing, and free every day after that for one surah a day. Premium will
        add unlimited recitation time, all 30-day plans, the Juz Amma 90-day plan and full
        mistake history. Quran text, translations, tafsir, audio and word-by-word are free
        forever and will never be paywalled.
      </p>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <li className="rounded-lg bg-[#F7F5EF] px-3 py-2"><strong>Free:</strong> coach 1 surah/day, 10 minutes/day · 7-day plans · streaks · 7-day mistake log</li>
        <li className="rounded-lg bg-[#F7F5EF] px-3 py-2"><strong>Premium:</strong> unlimited coach · all 30-day plans · Juz Amma 90-day plan · full mistake history</li>
      </ul>
    </section>
  );
}

export function SurahHero({
  surah,
  planDays,
}: {
  surah: HifzSurah;
  planDays?: number;
}) {
  return (
    <header className="rounded-2xl bg-[#0B3D2E] px-5 py-8 text-center text-white shadow-sm sm:px-8 sm:py-10">
      <p dir="rtl" lang="ar" className="font-quran text-5xl text-[#C9A227] sm:text-6xl">
        {surah.arabic}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Surah {surah.name}</h1>
      <p className="mt-1 text-base text-white/80">
        {surah.meaning} · Surah {surah.id} of 114
      </p>
      <p className="mt-2 text-sm text-white/70">
        {surah.ayahCount} ayahs · {surah.revelation} · Juz {surah.juz}
        {surah.juzEnd && surah.juzEnd !== surah.juz ? `–${surah.juzEnd}` : ''}
        {planDays ? ` · ${planDays}-day plan available` : ''}
      </p>
      {surah.id !== 1 && surah.id !== 9 && (
        <p dir="rtl" lang="ar" className="font-quran mt-5 text-2xl text-white/90 sm:text-3xl">
          {BISMILLAH}
        </p>
      )}
    </header>
  );
}
