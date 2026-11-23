// app/HomeClient.tsx — homepage client, clean redesign 2026-11-21.
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
import { useT } from './hifz/lib/i18n';

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
  const t = useT();
  const router = useRouter();
  const [verse, setVerse] = useState<VerseState>(FALLBACK_VERSE);
  const [coachSurah, setCoachSurah] = useState('al-fatihah');
  const [coachReciter, setCoachReciter] = useState(7);
  // Quick Listen goes to the last surah opened, or Al-Fatihah for a new user.
  const [listenSlug, setListenSlug] = useState('al-fatihah');
  useEffect(() => {
    try {
      const lr = localStorage.getItem('ili_last_read_v1');
      if (lr) {
        const parsed = JSON.parse(lr) as { slug?: string };
        if (parsed?.slug) setListenSlug(parsed.slug);
      }
    } catch {
      /* keep the default */
    }
  }, []);

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
    <div className="bg-[#F4F5F7] text-[#111827]">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-8">
        {/* Coach entry — the one primary action on this page. Clean white
            card with green accents (clean restyle 2026-11-23). */}
        <section aria-labelledby="coach-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#1FA36B]">
            <ToolIcon name="mic" className="h-4 w-4" />{t('rb.home.coachEyebrow')}</p>
          <h2 id="coach-heading" className="mt-2 text-xl font-bold text-[#111827] sm:text-2xl">{t('rb.home.reciteNow')}</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6B7280]">{t('rb.home.coachDesc')}</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 text-xs font-semibold text-[#6B7280]">
              {t('common.surah')}
              <select
                value={coachSurah}
                onChange={(e) => setCoachSurah(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#E8EAED] bg-white px-3 py-2.5 text-sm text-[#111827]"
              >
                {ALL_SURAHS.map((s) => (
                  <option key={s.slug} value={s.slug} className="text-[#111827]">
                    {s.name} — {s.meaning} ({s.ayahCount} ayahs)
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#6B7280]">
              {t('surah.reciter')}
              <select
                value={coachReciter}
                onChange={(e) => setCoachReciter(Number(e.target.value))}
                className="mt-1 block w-full max-w-xs rounded-lg border border-[#E8EAED] bg-white px-3 py-2.5 text-sm text-[#111827]"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id} className="text-[#111827]">{r.name}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => router.push(`/hifz/${coachSurah}?mode=recite`)}
              className="rounded-full bg-[#57D798] px-6 py-3 text-sm font-bold text-[#102E26] hover:brightness-105"
            >{t('coach.reciteNow')}</button>
          </div>
          <p className="mt-3 text-xs text-[#6B7280]">{t('rb.home.checksNote')}</p>
        </section>

        {/* Quick actions — Recite / Listen / Test, one tap each. */}
        <nav aria-label={t('rb.home.quickActions')} className="grid grid-cols-3 gap-2 sm:gap-3">
          <Link
            href="/hifz/recite"
            className="rounded-2xl border border-[#E8EAED] bg-white p-3 text-center shadow-sm hover:border-[#57D798] sm:p-4"
          >
            <span className="block text-lg font-bold text-[#111827]">{t('common.recite')}</span>
            <span className="mt-0.5 block text-xs leading-snug text-[#6B7280]">{t('rb.home.withCoach')}</span>
          </Link>
          <Link
            href={`/hifz/${listenSlug}`}
            className="rounded-2xl border border-[#E8EAED] bg-white p-3 text-center shadow-sm hover:border-[#57D798] sm:p-4"
          >
            <span className="block text-lg font-bold text-[#111827]">{t('mode.listen')}</span>
            <span className="mt-0.5 block text-xs leading-snug text-[#6B7280]">{t('rb.home.hearReciter')}</span>
          </Link>
          <Link
            href="/hifz/test"
            className="rounded-2xl border border-[#E8EAED] bg-white p-3 text-center shadow-sm hover:border-[#57D798] sm:p-4"
          >
            <span className="block text-lg font-bold text-[#111827]">{t('mode.test')}</span>
            <span className="mt-0.5 block text-xs leading-snug text-[#6B7280]">{t('rb.home.proveIt')}</span>
          </Link>
        </nav>

        {/* Continue where you left off */}
        <ProgressWidget />

        {/* What the app does — one idea per card, one sentence each. */}
        <section aria-labelledby="features-heading" className="grid gap-3 sm:grid-cols-3">
          <h2 id="features-heading" className="sr-only">{t('rb.home.featuresHeading')}</h2>
          <Link href="/hifz/recite" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm hover:border-[#57D798]">
            <span className="block text-base font-bold text-[#111827]">{t('rb.home.reciteChecked')}</span>
            <span className="mt-1 block text-sm leading-relaxed text-[#6B7280]">{t('rb.home.reciteCheckedDesc')}</span>
            <span className="mt-3 block text-sm font-semibold text-[#1FA36B]">{t('common.startReciting')} →</span>
          </Link>
          <Link href="/hifz/test" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm hover:border-[#57D798]">
            <span className="block text-base font-bold text-[#111827]">{t('rb.home.testYourself')}</span>
            <span className="mt-1 block text-sm leading-relaxed text-[#6B7280]">{t('rb.home.hideWords')}</span>
            <span className="mt-3 block text-sm font-semibold text-[#1FA36B]">{t('rb.home.takeTest')} →</span>
          </Link>
          <Link href="/hifz/plans" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm hover:border-[#57D798]">
            <span className="block text-base font-bold text-[#111827]">{t('rb.home.planFits')}</span>
            <span className="mt-1 block text-sm leading-relaxed text-[#6B7280]">{t('rb.home.planDesc')}</span>
            <span className="mt-3 block text-sm font-semibold text-[#1FA36B]">{t('rb.home.seePlans')} →</span>
          </Link>
        </section>

        {/* Surah list */}
        <SurahList />

        {/* Verse of the day — one slim card */}
        <section aria-labelledby="verse-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#1FA36B]">{t('rb.home.verseOfDay')}</p>
          <h3 id="verse-heading" className="sr-only">{t('rb.home.verseOfDay')}</h3>
          <p dir="rtl" lang="ar" className="font-quran mt-4 text-right text-2xl text-[#111827] sm:text-3xl">
            {verse.arabic}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#111827]/80 sm:text-base">
            &ldquo;{verse.translation}&rdquo;
          </p>
          <p className="mt-2 text-xs font-semibold text-[#111827]/50">— {verse.reference}</p>
          <Link href={verseHref(verseKey)} className="mt-4 inline-block text-sm font-semibold text-[#1FA36B] hover:text-[#111827] hover:underline">{t('rb.home.openAyah')} →</Link>
        </section>

        <p className="pb-4 text-center text-sm text-[#6B7280]">{t('rb.home.freeNote')}</p>
      </div>
    </div>
  );
}
