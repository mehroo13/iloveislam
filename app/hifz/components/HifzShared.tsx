// app/hifz/components/HifzShared.tsx — shared SERVER components for the hub:
// breadcrumb, attribution footer, surah hero.
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
              <Link href={item.href} className="font-semibold text-[#1FA36B] hover:underline">
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

export function SurahHero({
  surah,
  planDays,
}: {
  surah: HifzSurah;
  planDays?: number;
}) {
  return (
    <header className="rounded-2xl bg-[#102E26] px-5 py-8 text-center text-white shadow-sm sm:px-8 sm:py-10">
      <p dir="rtl" lang="ar" className="font-quran text-5xl text-[#FFB800] sm:text-6xl">
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
