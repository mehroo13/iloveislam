// app/hifz/components/ChallengesClient.tsx — group challenges UI (spec §15.9).
// No accounts: challenges live in localStorage; a share link carries the
// challenge + member progress, and opening a teammate's link merges their
// latest progress into this device's copy. Nothing is uploaded anywhere.
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ALL_SURAHS } from '../surahs';
import { useT } from '../lib/i18n';
import {
  loadChallenges, saveChallenges, createChallenge, mergeChallenge,
  decodeChallengeParam, shareLink, groupProgress, daysLeft, isEnded,
  logMyAyahs, myMember,
  CHALLENGE_TARGET_OPTIONS, CHALLENGE_DAY_OPTIONS,
  type GroupChallenge,
} from '../lib/challenges';
import { getSupabase } from '../lib/supabase';

/** One row of the public global leaderboard aggregate (migration 0002
 *  RPC `global_leaderboard`). Display name + totals only — no user id,
 *  no email, nothing identifying. */
type GlobalRow = {
  displayName: string;
  memorisedAyahs: number;
  currentStreak: number;
  longestStreak: number;
};

export default function ChallengesClient() {
  const t = useT();
  // C4: days until Ramadan 1447, which begins 18 Feb 2027 — computed
  // from the real date, never a hardcoded number.
  const daysUntilRamadan = Math.max(
    0,
    Math.ceil((new Date('2027-02-18T00:00:00').getTime() - Date.now()) / 86400000),
  );
  const [list, setList] = useState<GroupChallenge[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState('');
  const [myName, setMyName] = useState('');
  const [surahSlug, setSurahSlug] = useState('al-fatihah');
  const [target, setTarget] = useState<number>(10);
  const [days, setDays] = useState<number>(7);

  // Join form (bare code — no payload)
  const [joinCode, setJoinCode] = useState('');

  // Global leaderboard: reads the public aggregate via the
  // `global_leaderboard` RPC (migration 0002, applied live
  // 2026-11-25). Until a member opts in the board stays empty — no
  // error is ever shown, and no names are invented or seeded.
  const [globalRows, setGlobalRows] = useState<GlobalRow[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = getSupabase();
        if (!sb) return;
        const { data, error } = await sb.rpc('global_leaderboard', { p_limit: 50 });
        if (!alive || error || !Array.isArray(data)) return;
        const rows: GlobalRow[] = [];
        for (const r of data as unknown[]) {
          if (typeof r !== 'object' || r === null) continue;
          const rec = r as Record<string, unknown>;
          if (typeof rec.display_name !== 'string' || !rec.display_name.trim()) continue;
          rows.push({
            displayName: rec.display_name.trim().slice(0, 40),
            memorisedAyahs: typeof rec.memorised_ayahs === 'number' ? rec.memorised_ayahs : 0,
            currentStreak: typeof rec.current_streak === 'number' ? rec.current_streak : 0,
            longestStreak: typeof rec.longest_streak === 'number' ? rec.longest_streak : 0,
          });
        }
        setGlobalRows(rows);
      } catch {
        /* RPC missing / offline / unconfigured: board stays empty. */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: GroupChallenge[]) => {
    saveChallenges(next);
    setList(next);
  }, []);

  // On load: import a challenge from ?join=CODE&c=... (share link).
  useEffect(() => {
    const current = loadChallenges();
    setList(current);
    try {
      const q = new URLSearchParams(window.location.search);
      const code = q.get('join');
      const payload = q.get('c');
      if (code && payload) {
        const incoming = decodeChallengeParam(payload);
        if (incoming && incoming.code === code) {
          const { list: merged, changed } = mergeChallenge(current, incoming);
          if (changed) persist(merged);
          setMsg(
            changed
              ? `${t('chal.joined')} “${incoming.name}” (${incoming.code}) — ${t('chal.groupUpdated')}`
              : `“${incoming.name}” (${incoming.code}) ${t('chal.alreadyUpToDate')}`,
          );
        } else {
          setMsg(t('chal.linkUnreadable'));
        }
        window.history.replaceState({}, '', '/hifz/challenges');
      } else if (code) {
        // C1: a bare code with no share-link payload can never be
        // verified — there is no registry of codes. Say so, and join
        // nothing. (A code already on this device is the exception.)
        const upper = code.toUpperCase();
        setJoinCode(upper);
        setMsg(
          current.some((c) => c.code === upper)
            ? `${upper} ${t('chal.alreadyOnDevice')}`
            : `${t('chal.noChallengeFound')} ${upper} — ${t('chal.noChallengeFoundB')}`,
        );
      }
    } catch {
      /* ignore malformed URLs */
    }
  }, [persist, t]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setMsg(t('chal.copyFailed'));
    }
  };

  const doCreate = () => {
    const surah = ALL_SURAHS.find((s) => s.slug === surahSlug) ?? ALL_SURAHS[0];
    const c = createChallenge({
      name: name.trim() || `${surah.name} challenge`,
      surah,
      targetAyahs: target,
      days,
      myName: myName.trim() || 'Me',
    });
    persist([c, ...list]);
    setMsg(`${t('chal.createdA')}${c.code}${t('chal.createdB')}`);
    setName('');
  };

  // C1 (2026-11-26): joining with a bare code used to silently
  // "succeed" and invent a phantom challenge (any code, e.g.
  // HIFZ-ZZZZ, created a shareable card for a group that does not
  // exist). A code on its own cannot be verified — challenges live
  // on members' devices and only a full share link carries one — so
  // an unknown code FAILS with a clear message and creates nothing.
  // The only joins that succeed are a share link (?join=CODE&c=…)
  // or a code already on this device.
  const doJoinBareCode = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    if (list.some((c) => c.code === code)) {
      setMsg(`${code} ${t('chal.alreadyOnDevice')}`);
      return;
    }
    setMsg(`${t('chal.noChallengeFound')} ${code} — ${t('chal.noChallengeFoundB')}`);
  };

  const doLog = (c: GroupChallenge, count: number) => {
    const next = list.map((x) => (x.id === c.id ? logMyAyahs(x, count) : x));
    persist(next);
  };

  const doLeave = (c: GroupChallenge) => {
    persist(list.filter((x) => x.id !== c.id));
    setMsg(`${t('chal.leftA')}${c.name}${t('chal.leftB')}`);
  };

  return (
    <div className="space-y-6">
      {msg && (
        <p role="status" className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1FA36B]">
          {msg}
        </p>
      )}

      {/* How it works — one short line, not a dashboard of cards */}
      <p className="rounded-xl bg-[#E4FFF2] px-4 py-3 text-sm leading-relaxed text-[#102E26]">
        {t('chal.howItWorks')}
      </p>

      {/* Motivational verse — the same verse as the Community tab of My
          Progress (Al-Mutaffifin 83:26): "And in that let the competitors
          compete." */}
      <blockquote className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-4 text-center shadow-sm">
        <p dir="rtl" lang="ar" className="font-quran text-xl leading-relaxed text-[#111827]">
          وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ
        </p>
        <p className="mt-1 text-sm text-[#111827]">
          &ldquo;And in that let the competitors compete.&rdquo; — Quran 83:26
        </p>
      </blockquote>

      {/* Accept a Challenge — suggested challenges (dark card, screenshot style) */}
      <section aria-labelledby="accept-heading" className="rounded-2xl bg-[#102E26] p-5 text-white shadow-sm sm:p-6">
        <h2 id="accept-heading" className="text-xl font-bold">{t('chal.accept')}</h2>
        <p className="mt-1 text-sm text-white/70">{t('chal.acceptNote')}</p>
        <ul className="mt-4 space-y-2">
          {[
            { label: t('chal.khatm'), note: t('chal.khatmNote'), href: '/hifz/plans#khatm' },
            { label: t('chal.dailyTime'), note: t('chal.dailyTimeNote'), href: '/hifz/goals?preset=daily-time' },
            { label: t('chal.dailyPages'), note: t('chal.dailyPagesNote'), href: '/hifz/goals?preset=daily-pages' },
            { label: t('hub.kahf'), note: t('hub.kahfNote'), href: '/hifz/goals?preset=kahf' },
            { label: t('chal.custom'), note: t('chal.customNote'), href: '/hifz/goals' },
            { label: t('chal.habit'), note: t('chal.habitNote'), href: '/hifz/my-progress' },
            { label: t('chal.streak7'), note: t('chal.streak7Note'), href: '/hifz/my-progress' },
            { label: t('chal.streak30'), note: t('chal.streak30Note'), href: '/hifz/my-progress' },
          ].map((c) => (
            <li key={c.label}>
              <Link href={c.href} className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 hover:bg-white/15">
                <span>
                  <span className="block font-bold">{c.label}</span>
                  <span className="block text-sm text-white/70">{c.note}</span>
                </span>
                <span aria-hidden="true" className="shrink-0 font-bold text-[#57D798]">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Read a Quran, Give a Quran — annual Ramadan 90% challenge.
          C4: the countdown used to say a flat "30 days remaining"
          with no end date — wrong as a Ramadan countdown (Ramadan
          1447 starts 18 Feb 2027). It is now computed from that date. */}
      <section aria-labelledby="rqgq-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="rqgq-heading" className="text-xl font-bold text-[#102E26]">{t('chal.rqgq')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          {t('chal.ramadanIntro')}
        </p>
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-bold text-[#102E26]">0% {t('chal.progressWord')}</span>
            <span className="text-[#5b6b62]">{daysUntilRamadan} {t('chal.daysUntilRamadan')} · 604 {t('chal.pagesTotal')}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100} aria-label={t('chal.ramadanProgressLabel')}>
            <div className="h-full rounded-full bg-[#57D798]" style={{ width: '0%' }} />
          </div>
          <p className="mt-2 text-sm text-[#5b6b62]">
            {t('chal.ramadanProgressNote')}
          </p>
          <Link href="/hifz/my-progress" className="inline-flex min-h-11 items-center justify-center mt-3 inline-block rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]">
            {t('chal.logSessions')}
          </Link>
        </div>
      </section>

      {/* Quran League — time-boxed, goal-led, points, teams */}
      <section id="community-league" aria-labelledby="league-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="league-heading" className="text-xl font-bold text-[#102E26]">{t('chal.league')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          {t('chal.leagueIntro')}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { nameKey: 'chal.tplRamadanName', goalKey: 'chal.tplRamadanGoal', noteKey: 'chal.tplRamadanNote', preset: 'league-ramadan' },
            { nameKey: 'chal.tplBaqarahName', goalKey: 'chal.tplBaqarahGoal', noteKey: 'chal.tplBaqarahNote', preset: 'league-baqarah' },
            { nameKey: 'chal.tplImranName', goalKey: 'chal.tplImranGoal', noteKey: 'chal.tplImranNote', preset: 'league-imran' },
          ].map((l) => (
            <article key={l.nameKey} className="rounded-xl border border-[#E5E7EB] p-4">
              <h3 className="font-bold text-[#102E26]">{t(l.nameKey)}</h3>
              <p className="mt-1 text-sm text-[#5b6b62]">{t(l.goalKey)}</p>
              <p className="text-xs text-[#5b6b62]">{t(l.noteKey)}</p>
              {/* C3: the Join button prefills the league goal on the
                  Goals page (preset, like ?preset=kahf) instead of
                  landing on plain Goals with nothing created. */}
              <Link href={`/hifz/goals?preset=${l.preset}`} className="mt-3 inline-block rounded-full bg-[#57D798] px-4 py-2 text-sm font-bold text-[#102E26] hover:brightness-105">
                {t('chal.joinGoal')}
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#5b6b62]">
          {t('chal.leagueFootnote')}
        </p>
      </section>

      {/* My challenges */}
      {list.length > 0 && (
        <section aria-labelledby="mine-heading" className="space-y-4">
          <h2 id="mine-heading" className="text-xl font-bold text-[#102E26]">{t('chal.myChallenges')}</h2>
          {list.map((c) => {
            const prog = groupProgress(c);
            const mine = myMember(c);
            const ended = isEnded(c);
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            return (
              <article key={c.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#102E26]">{c.name}</h3>
                  <span className="rounded-full bg-[#FFFBF2] px-3 py-1 text-xs font-bold text-[#5b6b62]">
                    {c.code} · {ended ? t('chal.ended') : `${daysLeft(c)} ${t('chal.daysLeft')}`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5b6b62]">
                  {t('common.surah')} {c.surahName} · {c.targetAyahs} {t('chal.ayahsEach')} · {c.members.length}{' '}
                  {c.members.length === 1 ? t('chal.member') : t('chal.members')}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Group progress for ${c.name}`}>
                  <div className="h-full rounded-full bg-[#1FA36B]" style={{ width: `${prog.pct}%` }} />
                </div>
                <p className="mt-2 text-sm text-[#5b6b62]">
                  {t('chal.group')} {prog.done} / {prog.goal} {t('common.ayahs')} ({prog.pct}%)
                </p>
                <ul className="mt-3 space-y-1.5">
                  {c.members.map((m) => (
                    <li key={m.name} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-[#102E26]">
                        {m.name}{m.mine ? ` ${t('chal.you')}` : ''}
                      </span>
                      <span className="text-[#5b6b62]">
                        {m.ayahs} / {c.targetAyahs} {t('common.ayahs')}
                      </span>
                    </li>
                  ))}
                </ul>
                {!ended && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => doLog(c, 1)}
                      className="min-h-11 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                    >
                      {t('chal.did1')}
                    </button>
                    <button
                      type="button"
                      onClick={() => doLog(c, 5)}
                      className="min-h-11 rounded-full border border-[#102E26] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
                    >
                      {t('chal.did5')}
                    </button>
                    <Link
                      href={`/hifz/${ALL_SURAHS.find((s) => s.id === c.surahId)?.slug ?? 'al-fatihah'}?mode=recite`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
                    >
                      {t('chal.reciteCoach')}
                    </Link>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-3">
                  <button
                    type="button"
                    onClick={() => copyText(shareLink(c, origin), `link-${c.id}`)}
                    className="min-h-11 rounded-full bg-[#FFB800] px-4 py-2 text-sm font-semibold text-[#102E26] hover:brightness-110"
                  >
                    {copied === `link-${c.id}` ? t('chal.linkCopied') : t('chal.copyLink')}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(c.code, `code-${c.id}`)}
                    className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
                  >
                    {copied === `code-${c.id}` ? t('chal.codeCopied') : t('chal.copyCode')}
                  </button>
                  <button
                    type="button"
                    onClick={() => doLeave(c)}
                    className="ml-auto text-sm font-semibold text-red-700 underline"
                  >
                    {t('chal.leave')}
                  </button>
                </div>
                {mine && mine.ayahs >= c.targetAyahs && (
                  <p className="mt-3 text-sm font-semibold text-[#1FA36B]">
                    {t('chal.finishedA')}{c.targetAyahs}{t('chal.finishedB')}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* Create */}
      <section id="community-create" aria-labelledby="create-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="create-heading" className="text-xl font-bold text-[#102E26]">{t('chal.startChallenge')}</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold">
            {t('chal.challengeName')}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('chal.namePlaceholder')}
              className="mt-1 block w-full rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm font-semibold">
            {t('chal.yourName')}
            <input
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder={t('chal.nameAhmed')}
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="block text-sm font-semibold">
              {t('common.surah')}
              <select
                value={surahSlug}
                onChange={(e) => setSurahSlug(e.target.value)}
                className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                {ALL_SURAHS.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name} ({s.ayahCount} {t('common.ayahs')})</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              {t('chal.ayahsEachLabel')}
              <select
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                {CHALLENGE_TARGET_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} {t('chal.ayahsOpt')}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              {t('chal.length')}
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                {CHALLENGE_DAY_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} {t('chal.daysOpt')}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={doCreate}
            className="rounded-full bg-[#102E26] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            {t('chal.createChallenge')}
          </button>
        </div>
      </section>

      {/* Join with a bare code — C1: a code on its own can never be
          verified, so this only ever joins a code already on this
          device. Any other code fails with "no challenge found" and
          creates nothing. To join a real group, open the share link
          a member sends — it joins automatically. */}
      <section id="community-join" aria-labelledby="join-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="join-heading" className="text-xl font-bold text-[#102E26]">{t('chal.joinCode')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Got a code but no link? A code on its own can&apos;t be checked — challenges live on
          members&apos; devices, not on a server. Ask a member to share the challenge link
          instead: opening it joins automatically. (A full share link joins without this form.)
        </p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold">
            {t('chal.codeLabel')}
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="HIFZ-XXXX"
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm uppercase"
            />
          </label>
          <button
            type="button"
            onClick={doJoinBareCode}
            disabled={!joinCode.trim()}
            className="rounded-full bg-[#102E26] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1FA36B] disabled:opacity-50"
          >
            {t('chal.joinWithCode')}
          </button>
        </div>
      </section>

      {/* Global leaderboard — live since migration 0002 was applied
          (2026-11-25). No names are invented or seeded; rows appear
          only for members who opted in via Settings → Privacy. */}
      <section aria-labelledby="global-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="global-heading" className="text-xl font-bold text-[#102E26]">{t('chal.globalLeaderboard')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">{t('chal.globalNote')}</p>
        {globalRows.length === 0 ? (
          <p className="mt-4 rounded-xl bg-[#E4FFF2] px-4 py-3 text-sm leading-relaxed text-[#102E26]">
            {t('chal.globalEmpty')}
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {globalRows.map((r, i) => (
              <li key={`${r.displayName}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm">
                <span className="font-bold text-[#102E26]">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E4FFF2] text-xs font-bold">{i + 1}</span>
                  {r.displayName}
                </span>
                <span className="text-[#5b6b62]">
                  {r.memorisedAyahs} {t('chal.ayahsOpt')} · {t('chal.globalStreak')} {r.currentStreak}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
