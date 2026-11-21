// app/hifz/components/ChallengesClient.tsx — group challenges UI (spec §15.9).
// No accounts: challenges live in localStorage; a share link carries the
// challenge + member progress, and opening a teammate's link merges their
// latest progress into this device's copy. Nothing is uploaded anywhere.
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ALL_SURAHS } from '../surahs';
import {
  loadChallenges, saveChallenges, createChallenge, mergeChallenge,
  decodeChallengeParam, shareLink, groupProgress, daysLeft, isEnded,
  logMyAyahs, myMember,
  CHALLENGE_TARGET_OPTIONS, CHALLENGE_DAY_OPTIONS,
  type GroupChallenge,
} from '../lib/challenges';

export default function ChallengesClient() {
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
              ? `Joined “${incoming.name}” (${incoming.code}) — group progress updated.`
              : `“${incoming.name}” (${incoming.code}) is already up to date on this device.`,
          );
        } else {
          setMsg('That challenge link could not be read. Ask the sender to share it again.');
        }
        window.history.replaceState({}, '', '/hifz/challenges');
      } else if (code) {
        setJoinCode(code.toUpperCase());
        setMsg(`Joining ${code.toUpperCase()} — pick the surah, target and length your group agreed, then tap “Join with this code”.`);
      }
    } catch {
      /* ignore malformed URLs */
    }
  }, [persist]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setMsg('Copy failed — long-press the link to copy it by hand.');
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
    setMsg(`Challenge created — code ${c.code}. Share the link below with your group.`);
    setName('');
  };

  const doJoinBareCode = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    if (list.some((c) => c.code === code)) {
      setMsg(`${code} is already on this device.`);
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
    setMsg(`Joined ${code}. Ask a member to share their link so their progress appears here too.`);
  };

  const doLog = (c: GroupChallenge, count: number) => {
    const next = list.map((x) => (x.id === c.id ? logMyAyahs(x, count) : x));
    persist(next);
  };

  const doLeave = (c: GroupChallenge) => {
    persist(list.filter((x) => x.id !== c.id));
    setMsg(`Left “${c.name}”. Your local copy is deleted; the group keeps going without you.`);
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
        <h2 id="accept-heading" className="text-xl font-bold">Accept a Challenge</h2>
        <p className="mt-1 text-sm text-white/70">Suggested challenges — pick one and it becomes a goal with a daily plan.</p>
        <ul className="mt-4 space-y-2">
          {[
            { label: 'Complete the Quran (Khatm)', note: 'Read the whole Quran in 1, 3, 6, 9 or 12 months', href: '/hifz/plans' },
            { label: 'Daily reading — time', note: 'Read every day for a set number of minutes', href: '/hifz/goals' },
            { label: 'Daily reading — pages', note: 'Read a set number of pages every day', href: '/hifz/goals' },
            { label: 'Surah Al-Kahf', note: 'Recite Al-Kahf every Friday', href: '/hifz/goals?preset=kahf' },
            { label: 'Custom Challenge', note: 'Build your own — any surah, any pace', href: '/hifz/goals' },
            { label: 'Habit Building', note: 'Practise 7 days in a row to build the habit', href: '/hifz/my-progress' },
            { label: '7-Day Streak Challenge', note: 'Practise every day for 7 days — keep the flame alive', href: '/hifz/my-progress' },
            { label: '30-Day Streak Challenge', note: 'Practise every day for 30 days — a month of consistency', href: '/hifz/my-progress' },
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
        <h2 id="rqgq-heading" className="text-xl font-bold text-[#102E26]">Read a Quran, Give a Quran</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Each Ramadan: read or recite 90% or more of the Quran during the month, and a physical
          mushaf is donated on your behalf to a Muslim in need. One per person. Free to join.
        </p>
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-bold text-[#102E26]">0% progress</span>
            <span className="text-[#5b6b62]">30 days remaining · 604 pages total</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100} aria-label="Ramadan challenge progress">
            <div className="h-full rounded-full bg-[#57D798]" style={{ width: '0%' }} />
          </div>
          <p className="mt-2 text-sm text-[#5b6b62]">
            Reading, listening and recitation all count; off-platform sessions logged on My
            Progress count too. Your live percentage appears here once Ramadan begins — at 90%
            you get an in-app confirmation that a mushaf will be donated on your behalf.
          </p>
          <Link href="/hifz/my-progress" className="mt-3 inline-block rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]">
            Log sessions on My Progress →
          </Link>
        </div>
      </section>

      {/* Quran League — time-boxed, goal-led, points, teams */}
      <section aria-labelledby="league-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="league-heading" className="text-xl font-bold text-[#102E26]">Quran League</h2>
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
                Join with a goal →
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
          <h2 id="mine-heading" className="text-xl font-bold text-[#102E26]">My challenges</h2>
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
                    {c.code} · {ended ? 'Ended' : `${daysLeft(c)} days left`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5b6b62]">
                  Surah {c.surahName} · {c.targetAyahs} ayahs each · {c.members.length}{' '}
                  {c.members.length === 1 ? 'member' : 'members'}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Group progress for ${c.name}`}>
                  <div className="h-full rounded-full bg-[#1FA36B]" style={{ width: `${prog.pct}%` }} />
                </div>
                <p className="mt-2 text-sm text-[#5b6b62]">
                  Group: {prog.done} / {prog.goal} ayahs ({prog.pct}%)
                </p>
                <ul className="mt-3 space-y-1.5">
                  {c.members.map((m) => (
                    <li key={m.name} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-[#102E26]">
                        {m.name}{m.mine ? ' (you)' : ''}
                      </span>
                      <span className="text-[#5b6b62]">
                        {m.ayahs} / {c.targetAyahs} ayahs
                      </span>
                    </li>
                  ))}
                </ul>
                {!ended && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => doLog(c, 1)}
                      className="rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                    >
                      I did 1 ayah
                    </button>
                    <button
                      type="button"
                      onClick={() => doLog(c, 5)}
                      className="rounded-full border border-[#102E26] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
                    >
                      I did 5 ayahs
                    </button>
                    <Link
                      href={`/hifz/${ALL_SURAHS.find((s) => s.id === c.surahId)?.slug ?? 'al-fatihah'}?mode=recite`}
                      className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
                    >
                      Recite with the coach →
                    </Link>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-3">
                  <button
                    type="button"
                    onClick={() => copyText(shareLink(c, origin), `link-${c.id}`)}
                    className="rounded-full bg-[#FFB800] px-4 py-2 text-sm font-semibold text-[#102E26] hover:brightness-110"
                  >
                    {copied === `link-${c.id}` ? 'Link copied' : 'Copy share link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(c.code, `code-${c.id}`)}
                    className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
                  >
                    {copied === `code-${c.id}` ? 'Code copied' : 'Copy code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => doLeave(c)}
                    className="ml-auto text-sm font-semibold text-red-700 underline"
                  >
                    Leave challenge
                  </button>
                </div>
                {mine && mine.ayahs >= c.targetAyahs && (
                  <p className="mt-3 text-sm font-semibold text-[#1FA36B]">
                    You finished your {c.targetAyahs} ayahs — well done.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* Create */}
      <section aria-labelledby="create-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="create-heading" className="text-xl font-bold text-[#102E26]">Start a challenge</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold">
            Challenge name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Family Al-Mulk week"
              className="mt-1 block w-full rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm font-semibold">
            Your name (shown to the group)
            <input
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder="e.g. Ahmed"
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="block text-sm font-semibold">
              Surah
              <select
                value={surahSlug}
                onChange={(e) => setSurahSlug(e.target.value)}
                className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                {ALL_SURAHS.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name} ({s.ayahCount} ayahs)</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Ayahs each
              <select
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                {CHALLENGE_TARGET_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} ayahs</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Length
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                {CHALLENGE_DAY_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} days</option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={doCreate}
            className="rounded-full bg-[#102E26] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            Create challenge
          </button>
        </div>
      </section>

      {/* Join with a bare code */}
      <section aria-labelledby="join-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="join-heading" className="text-xl font-bold text-[#102E26]">Join with a code</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Got a code but no link? Enter it here with the surah, target and length your
          group agreed. (A full share link joins automatically — no form needed.)
        </p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold">
            Challenge code
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="HIFZ-XXXX"
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm uppercase"
            />
          </label>
          <label className="block text-sm font-semibold">
            Your name (shown to the group)
            <input
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="e.g. Ahmed"
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="block text-sm font-semibold">
              Surah
              <select
                value={joinSurahSlug}
                onChange={(e) => setJoinSurahSlug(e.target.value)}
                className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                {ALL_SURAHS.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name} ({s.ayahCount} ayahs)</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Ayahs each
              <select
                value={joinTarget}
                onChange={(e) => setJoinTarget(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                {CHALLENGE_TARGET_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} ayahs</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Length
              <select
                value={joinDays}
                onChange={(e) => setJoinDays(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                {CHALLENGE_DAY_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} days</option>
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
            Join with this code
          </button>
        </div>
      </section>
    </div>
  );
}
