// app/hifz/components/HubClient.tsx — hub landing chrome that needs the
// interface language (client component; the hub page itself stays a server
// component so it can keep its metadata export).
'use client';

import Link from 'next/link';
import { useT } from '../lib/i18n';

const MORE_LINKS: { href: string; labelKey: string; noteKey: string }[] = [
  { href: '/hifz/test', labelKey: 'hub.testMode', noteKey: 'hub.testModeNote' },
  { href: '/hifz/voice-search', labelKey: 'hub.voiceSearch', noteKey: 'hub.voiceSearchNote' },
  { href: '/hifz/challenges', labelKey: 'hub.challenges', noteKey: 'hub.challengesNote' },
  { href: '/hifz/bookmarks', labelKey: 'hub.bookmarks', noteKey: 'hub.bookmarksNote' },
  { href: '/hifz/plans', labelKey: 'hub.plans', noteKey: 'hub.plansNote' },
  { href: '/hifz/juz-amma', labelKey: 'hub.juzAmma', noteKey: 'hub.juzAmmaNote' },
  { href: '/hifz/my-progress', labelKey: 'hub.myProgress', noteKey: 'hub.myProgressNote' },
];

const SUGGESTIONS: { href: string; labelKey: string; noteKey: string }[] = [
  { href: '/hifz/plans', labelKey: 'hub.completeQuran', noteKey: 'hub.completeQuranNote' },
  { href: '/hifz/goals?preset=kahf', labelKey: 'hub.kahf', noteKey: 'hub.kahfNote' },
  { href: '/hifz/juz-amma', labelKey: 'hub.juzAmma', noteKey: 'hub.juzAmmaNote' },
  { href: '/hifz/memorize', labelKey: 'hub.pageADay', noteKey: 'hub.pageADayNote' },
];

export default function HubClient() {
  const t = useT();
  return (
    <>
      <header className="mt-4 text-center">
        <p dir="rtl" lang="ar" className="font-quran text-3xl text-[#1FA36B] sm:text-4xl">
          خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
          {t('hub.title')}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#6B7280] sm:text-base">
          {t('hub.subtitle')}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/hifz/recite"
            className="rounded-full bg-[#57D798] px-6 py-3 text-sm font-bold text-[#102E26] hover:brightness-105"
          >
            {t('common.startReciting')}
          </Link>
        </div>
      </header>

      {/* New Goal hero — clean white card with green accents (clean
          restyle 2026-11-23; was dark green). Intention first, our own
          words and mark. */}
      <section aria-labelledby="new-goal-heading" className="mt-6 overflow-hidden rounded-2xl border border-[#E8EAED] bg-white shadow-sm">
        <div className="p-5 sm:p-6">
          <h2 id="new-goal-heading" className="text-2xl font-bold text-[#111827]">{t('hub.goalTitle')}</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#6B7280]">
            {t('hub.goalBody')}
          </p>
          <p className="mt-4 border-t border-[#E8EAED] pt-4 text-sm italic text-[#6B7280]">
            “The most beloved deeds to Allah are the most consistent, even if they are small.”
            <span className="mt-1 block text-xs not-italic text-[#6B7280]/70">Sahih al-Bukhari</span>
          </p>
          <Link
            href="/hifz/goals"
            className="mt-5 block rounded-full bg-[#57D798] py-3 text-center text-sm font-bold text-[#102E26] hover:brightness-105"
          >
            {t('hub.goalCta')}
          </Link>
        </div>
      </section>

      {/* Suggestions — horizontal scroll cards */}
      <section aria-labelledby="suggestions-heading" className="mt-6">
        <h2 id="suggestions-heading" className="text-lg font-bold text-[#111827]">{t('hub.suggestions')}</h2>
        <p className="text-sm text-[#6B7280]">{t('hub.suggestionsHint')}</p>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {SUGGESTIONS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="w-52 shrink-0 rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm hover:border-[#57D798]"
            >
              <span className="block font-bold text-[#111827]">{t(c.labelKey)}</span>
              <span className="mt-1 block text-sm text-[#6B7280]">{t(c.noteKey)}</span>
              <span className="mt-3 block text-sm font-bold text-[#1FA36B]">{t('hub.start')}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/** "More" links — rendered by the hub page after the surah list, as before. */
export function HubMoreLinks() {
  const t = useT();
  return (
    <section aria-labelledby="more-heading" className="mt-8">
      <h2 id="more-heading" className="text-xl font-bold text-[#111827]">{t('hub.more')}</h2>
      <ul className="mt-3 divide-y divide-[#E8EAED] rounded-2xl border border-[#E8EAED] bg-white shadow-sm">
        {MORE_LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 hover:bg-[#F4F5F7]">
              <span className="min-w-0">
                <span className="block font-semibold text-[#111827]">{t(l.labelKey)}</span>
                <span className="block truncate text-sm text-[#6B7280]">{t(l.noteKey)}</span>
              </span>
              <span aria-hidden="true" className="shrink-0 font-bold text-[#1FA36B]">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
