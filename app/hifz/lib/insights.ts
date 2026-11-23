// app/hifz/lib/insights.ts — per-user test insights.
//
// Every line here is generated ONLY from the user's own stored records:
// their test sessions (mode.ts) and their word-level mistake log
// (progress.ts). Nothing is invented, nothing is guessed, and no outside
// data is used. A metric with no data returns honest empty-state text
// instead of a made-up suggestion. All functions are pure so they can be
// unit-checked against a hand-built record set.

import type { MistakeEntry } from '../progress';
import type { TestSessionRecord } from './mode';

export interface TestInsight {
  /** Short heading, e.g. the weakest surah or the trend. */
  title: string;
  /** One or two sentences, naming real counts from the user's records. */
  body: string;
  /** The surah this insight points at, when it points at one. */
  surah?: number;
  /** The ayah this insight points at, when it points at one. */
  ayah?: number;
}

export interface TestInsightsInput {
  /** The user's word-level mistake log (corrected rows included — the
   *  builder filters them out; a fixed mistake is history, not a weak
   *  spot). */
  mistakes: MistakeEntry[];
  /** Completed test sessions, newest first (as loadTestSessions returns
   *  them). The caller may prepend the session that just finished so the
   *  done screen reflects it immediately. */
  sessions: TestSessionRecord[];
  /** Surah catalogue for names ({ id, name }). */
  surahs: { id: number; name: string }[];
  /** The locale-bound translate function (useT) — every user-facing
   *  string the builder emits goes through it. */
  t: (key: string) => string;
}

function surahName(surahs: { id: number; name: string }[], id: number): string {
  return surahs.find((s) => s.id === id)?.name ?? `Surah ${id}`;
}

function sessionPct(s: TestSessionRecord): number | null {
  if (s.total <= 0) return null;
  return (s.score / s.total) * 100;
}

/** Build the insight list for the test done screen and the setup screen.
 *  Returns at most four insights, most actionable first. With no sessions
 *  and no uncorrected mistakes, returns a single honest empty-state
 *  insight — never an invented suggestion. */
export function buildTestInsights({ mistakes, sessions, surahs, t }: TestInsightsInput): TestInsight[] {
  const open = mistakes.filter((m) => !m.corrected);
  if (sessions.length === 0 && open.length === 0) {
    return [
      {
        title: t('ins.noHistoryTitle'),
        body: t('ins.noHistoryBody'),
      },
    ];
  }

  const out: TestInsight[] = [];

  // Weakest surah: uncorrected mistakes grouped by surah, by attempts.
  const bySurah = new Map<number, { attempts: number; ayahs: Set<string> }>();
  for (const m of open) {
    const prev = bySurah.get(m.surah) ?? { attempts: 0, ayahs: new Set<string>() };
    prev.attempts += m.attempts;
    prev.ayahs.add(`${m.surah}:${m.ayah}`);
    bySurah.set(m.surah, prev);
  }
  const weakestSurah = [...bySurah.entries()].sort((a, b) => b[1].attempts - a[1].attempts)[0];
  if (weakestSurah) {
    const [id, agg] = weakestSurah;
    const name = surahName(surahs, id);
    out.push({
      title: t('ins.hardestSurahTitle').replace('{name}', name),
      body: t('ins.hardestSurahBody')
        .replace('{a}', String(agg.attempts))
        .replace('{words}', agg.attempts === 1 ? t('ins.wordOne') : t('ins.wordMany'))
        .replace('{b}', String(agg.ayahs.size))
        .replace('{ayahs}', agg.ayahs.size === 1 ? t('ins.ayahOne') : t('ins.ayahMany'))
        .replace('{name}', name),
      surah: id,
    });
  }

  // Most-missed ayah: uncorrected mistakes grouped by ayah, by attempts.
  const byAyah = new Map<string, { surah: number; ayah: number; attempts: number; words: Set<string> }>();
  for (const m of open) {
    const k = `${m.surah}:${m.ayah}`;
    const prev = byAyah.get(k) ?? { surah: m.surah, ayah: m.ayah, attempts: 0, words: new Set<string>() };
    prev.attempts += m.attempts;
    prev.words.add(m.word);
    byAyah.set(k, prev);
  }
  const worstAyah = [...byAyah.values()].sort((a, b) => b.attempts - a.attempts)[0];
  if (worstAyah) {
    out.push({
      title: t('ins.mostMissedTitle').replace('{ref}', `${worstAyah.surah}:${worstAyah.ayah}`),
      body: t('ins.mostMissedBody')
        .replace('{a}', String(worstAyah.attempts))
        .replace('{times}', worstAyah.attempts === 1 ? t('ins.timeOne') : t('ins.timeMany'))
        .replace('{b}', String(worstAyah.words.size))
        .replace('{words}', worstAyah.words.size === 1 ? t('ins.wordOne') : t('ins.wordMany')),
      surah: worstAyah.surah,
      ayah: worstAyah.ayah,
    });
  }

  // Trend: average score of the last 3 sessions vs the sessions before
  // them. Only stated when both sides have at least one scored session.
  const scored = sessions.map(sessionPct).filter((p): p is number => p !== null);
  if (scored.length >= 2) {
    // sessions arrive newest first, so the recent group is the head.
    const recent = scored.slice(0, 3);
    const earlier = scored.slice(3);
    if (earlier.length > 0) {
      const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      const recentAvg = Math.round(avg(recent));
      const earlierAvg = Math.round(avg(earlier));
      const diff = recentAvg - earlierAvg;
      const trendBody = (key: string) =>
        t(key)
          .replace('{n}', String(recent.length))
          .replace('{tests}', recent.length === 1 ? t('ins.testOne') : t('ins.testMany'))
          .replace('{a}', String(recentAvg))
          .replace('{b}', String(earlierAvg));
      if (diff >= 5) {
        out.push({
          title: t('ins.improvingTitle'),
          body: trendBody('ins.improvingBody'),
        });
      } else if (diff <= -5) {
        out.push({
          title: t('ins.slippedTitle'),
          body: trendBody('ins.slippedBody'),
        });
      } else {
        out.push({
          title: t('ins.steadyTitle'),
          body: trendBody('ins.steadyBody'),
        });
      }
    }
  }

  // Revise next: the three most-missed uncorrected ayahs, in order.
  const reviseNext = [...byAyah.values()].sort((a, b) => b.attempts - a.attempts).slice(0, 3);
  if (reviseNext.length > 0) {
    const list = reviseNext
      .map((a) => `${surahName(surahs, a.surah)} ${a.surah}:${a.ayah} (${a.attempts} ${a.attempts === 1 ? t('ins.missOne') : t('ins.missMany')})`)
      .join(', ');
    out.push({
      title: t('ins.reviseNextTitle'),
      body: t('ins.reviseNextBody').replace('{list}', list),
      surah: reviseNext[0].surah,
      ayah: reviseNext[0].ayah,
    });
  }

  if (out.length === 0) {
    // Sessions exist, but every mistake so far has been corrected.
    out.push({
      title: t('ins.nothingMissedTitle'),
      body: t('ins.nothingMissedBody')
        .replace('{n}', String(sessions.length))
        .replace('{tests}', sessions.length === 1 ? t('ins.testOne') : t('ins.testMany')),
    });
  }

  return out.slice(0, 4);
}
