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

export default function ChallengesClient() {
  const t = useT();
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
  const [joinSurahSlug, setJoinSurahSlug] = useState('al-fatihah');
  const [joinTarget, setJoinTarget] = useState<number>(10);
  const [joinDays, setJoinDays] = useState<number>(7);
  const [joinName, setJoinName] = useState('');

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
        setJoinCode(code.toUpperCase());
        setMsg(`${t('chal.joining')}${code.toUpperCase()}${t('chal.joiningPick')}`);
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

  const doJoinBareCode = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    if (list.some((c) => c.code === code)) {
      setMsg(`${code} ${t('chal.alreadyOnDevice')}`);
      return;
    }
    const surah = ALL_SURAHS.find((s) => s.slug === joinSurahSlug) ?? ALL_SURAHS[0];
    const now = new Date();
    const c: GroupChallenge = {
      id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      code,
      name: `${surah.name} challenge`,
      surahId: surah.id,
      surahName: surah.name,
      targetAyahs: joinTarget,
      days: joinDays,
      createdAt: now.toISOString(),
      endsAt: new Date(now.getTime() + joinDays * 86400000).toISOString(),
      members: [{ name: joinName.trim() || 'Me', ayahs: 0, updatedAt: now.toISOString(), mine: true }],
    };
    persist([c, ...list]);
    setMsg(`${t('chal.joined')} ${code}. ${t('chal.joinedBareB')}`);
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
        How it works: create a challenge and share its link. When a member opens your link,
        your progress joins their view — and when they share their link back, their progress
        joins yours. No accounts, no server, nothing uploaded.
      </p>

      {/* Accept a Challenge — suggested challenges (dark card, screenshot style) */}
      <section aria-labelledby="accept-heading" className="rounded-2xl bg-[#102E26] p-5 text-white shadow-sm sm:p-6">
        <h2 id="accept-heading" className="text-xl font-bold">{t('chal.accept')}</h2>
        <p className="mt-1 text-sm text-white/70">{t('chal.acceptNote')}</p>
        <ul className="mt-4 space-y-2">
          {[
            { label: t('chal.khatm'), note: t('chal.khatmNote'), href: '/hifz/plans' },
            { label: t('chal.dailyTime'), note: t('chal.dailyTimeNote'), href: '/hifz/goals' },
            { label: t('chal.dailyPages'), note: t('chal.dailyPagesNote'), href: '/hifz/goals' },
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

      {/* Read a Quran, Give a Quran — annual Ramadan 90% challenge */}
      <section aria-labelledby="rqgq-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="rqgq-heading" className="text-xl font-bold text-[#102E26]">{t('chal.rqgq')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Each Ramadan: read or recite 90% or more of the Quran during the month, and a physical
          mushaf is donated on your behalf to a Muslim in need. One per person. Free to join.
        </p>
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-bold text-[#102E26]">0% {t('chal.progressWord')}</span>
            <span className="text-[#5b6b62]">30 {t('chal.daysLeft')} · 604 {t('chal.pagesTotal')}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100} aria-label="Ramadan challenge progress">
            <div className="h-full rounded-full bg-[#57D798]" style={{ width: '0%' }} />
          </div>
          <p className="mt-2 text-sm text-[#5b6b62]">
            Reading, listening and recitation all count; off-platform sessions logged on My
            Progress count too. Your live percentage appears here once Ramadan begins — at 90%
            you get an in-app confirmation that a mushaf will be donated on your behalf.
          </p>
          <Link href="/hifz/my-progress" className="inline-flex min-h-11 items-center justify-center mt-3 inline-block rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]">
            {t('chal.logSessions')}
          </Link>
        </div>
      </section>

      {/* Quran League — time-boxed, goal-led, points, teams */}
      <section aria-labelledby="league-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="league-heading" className="text-xl font-bold text-[#102E26]">{t('chal.league')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          A time-boxed race to goodness: join a League, set a memorisation goal (for example 80
          pages in 80 days, one page a day), get a daily plan until the deadline, and earn points
          by reciting or revising. Points move you up the leaderboard.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { name: 'Ramadan 1448 League', goal: '80 pages in 80 days', note: 'One page a day until Ramadan' },
            { name: 'Surah Al-Baqarah Challenge', goal: '48 pages in 48 days', note: 'The longest surah, one page a day' },
            { name: 'Surah Ali ’Imran Team', goal: 'Your pace, your team', note: 'Memorise together, revise together' },
          ].map((l) => (
            <article key={l.name} className="rounded-xl border border-[#E5E7EB] p-4">
              <h3 className="font-bold text-[#102E26]">{l.name}</h3>
              <p className="mt-1 text-sm text-[#5b6b62]">{l.goal}</p>
              <p className="text-xs text-[#5b6b62]">{l.note}</p>
              <Link href="/hifz/goals" className="mt-3 inline-block rounded-full bg-[#57D798] px-4 py-2 text-sm font-bold text-[#102E26] hover:brightness-105">
                {t('chal.joinGoal')}
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#5b6b62]">
          Leagues run on the same no-account group challenges above: create a challenge, share
          its link, and your group&apos;s progress is the leaderboard. No prizes are promised
          here — points and places are the reward.
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
      <section aria-labelledby="create-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
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

      {/* Join with a bare code */}
      <section aria-labelledby="join-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="join-heading" className="text-xl font-bold text-[#102E26]">{t('chal.joinCode')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Got a code but no link? Enter it here with the surah, target and length your
          group agreed. (A full share link joins automatically — no form needed.)
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
          <label className="block text-sm font-semibold">
            {t('chal.yourName')}
            <input
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder={t('chal.nameAhmed')}
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="block text-sm font-semibold">
              {t('common.surah')}
              <select
                value={joinSurahSlug}
                onChange={(e) => setJoinSurahSlug(e.target.value)}
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
                value={joinTarget}
                onChange={(e) => setJoinTarget(Number(e.target.value))}
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
                value={joinDays}
                onChange={(e) => setJoinDays(Number(e.target.value))}
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
            onClick={doJoinBareCode}
            disabled={!joinCode.trim()}
            className="rounded-full bg-[#102E26] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1FA36B] disabled:opacity-50"
          >
            {t('chal.joinWithCode')}
          </button>
        </div>
      </section>
    </div>
  );
}
