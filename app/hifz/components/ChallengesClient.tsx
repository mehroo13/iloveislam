// app/hifz/components/ChallengesClient.tsx — group challenges UI (spec §15.9).
// No accounts: challenges live in localStorage; a share link carries the
// challenge + member progress, and opening a teammate's link merges their
// latest progress into this device's copy. Nothing is uploaded anywhere.
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { LAUNCH_SURAHS } from '../surahs';
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
  const [surahSlug, setSurahSlug] = useState('al-mulk');
  const [target, setTarget] = useState<number>(10);
  const [days, setDays] = useState<number>(7);

  // Join form (bare code — no payload)
  const [joinCode, setJoinCode] = useState('');
  const [joinSurahSlug, setJoinSurahSlug] = useState('al-mulk');
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
    const surah = LAUNCH_SURAHS.find((s) => s.slug === surahSlug) ?? LAUNCH_SURAHS[0];
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
    const surah = LAUNCH_SURAHS.find((s) => s.slug === joinSurahSlug) ?? LAUNCH_SURAHS[0];
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
        <p role="status" className="rounded-xl border border-[#e5e0d3] bg-white px-4 py-3 text-sm font-semibold text-[#146B4D]">
          {msg}
        </p>
      )}

      {/* How it works — one short line, not a dashboard of cards */}
      <p className="rounded-xl bg-[#eaf3ee] px-4 py-3 text-sm leading-relaxed text-[#0B3D2E]">
        How it works: create a challenge and share its link. When a member opens your link,
        your progress joins their view — and when they share their link back, their progress
        joins yours. No accounts, no server, nothing uploaded.
      </p>

      {/* My challenges */}
      {list.length > 0 && (
        <section aria-labelledby="mine-heading" className="space-y-4">
          <h2 id="mine-heading" className="text-xl font-bold text-[#0B3D2E]">My challenges</h2>
          {list.map((c) => {
            const prog = groupProgress(c);
            const mine = myMember(c);
            const ended = isEnded(c);
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            return (
              <article key={c.id} className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#0B3D2E]">{c.name}</h3>
                  <span className="rounded-full bg-[#F7F5EF] px-3 py-1 text-xs font-bold text-[#5b6b62]">
                    {c.code} · {ended ? 'Ended' : `${daysLeft(c)} days left`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5b6b62]">
                  Surah {c.surahName} · {c.targetAyahs} ayahs each · {c.members.length}{' '}
                  {c.members.length === 1 ? 'member' : 'members'}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e5e0d3]" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Group progress for ${c.name}`}>
                  <div className="h-full rounded-full bg-[#146B4D]" style={{ width: `${prog.pct}%` }} />
                </div>
                <p className="mt-2 text-sm text-[#5b6b62]">
                  Group: {prog.done} / {prog.goal} ayahs ({prog.pct}%)
                </p>
                <ul className="mt-3 space-y-1.5">
                  {c.members.map((m) => (
                    <li key={m.name} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-[#0B3D2E]">
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
                      className="rounded-full bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]"
                    >
                      I did 1 ayah
                    </button>
                    <button
                      type="button"
                      onClick={() => doLog(c, 5)}
                      className="rounded-full border border-[#0B3D2E] px-4 py-2 text-sm font-semibold text-[#0B3D2E] hover:bg-[#eaf3ee]"
                    >
                      I did 5 ayahs
                    </button>
                    <Link
                      href={`/hifz/${LAUNCH_SURAHS.find((s) => s.id === c.surahId)?.slug ?? 'al-mulk'}?mode=recite`}
                      className="rounded-full border border-[#e5e0d3] px-4 py-2 text-sm font-semibold hover:border-[#146B4D]"
                    >
                      Recite with the coach →
                    </Link>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#f0ede4] pt-3">
                  <button
                    type="button"
                    onClick={() => copyText(shareLink(c, origin), `link-${c.id}`)}
                    className="rounded-full bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B3D2E] hover:brightness-110"
                  >
                    {copied === `link-${c.id}` ? 'Link copied' : 'Copy share link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(c.code, `code-${c.id}`)}
                    className="rounded-full border border-[#e5e0d3] px-4 py-2 text-sm font-semibold hover:border-[#146B4D]"
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
                  <p className="mt-3 text-sm font-semibold text-[#146B4D]">
                    You finished your {c.targetAyahs} ayahs — well done.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* Create */}
      <section aria-labelledby="create-heading" className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="create-heading" className="text-xl font-bold text-[#0B3D2E]">Start a challenge</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold">
            Challenge name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Family Al-Mulk week"
              className="mt-1 block w-full rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm font-semibold">
            Your name (shown to the group)
            <input
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder="e.g. Ahmed"
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="block text-sm font-semibold">
              Surah
              <select
                value={surahSlug}
                onChange={(e) => setSurahSlug(e.target.value)}
                className="mt-1 block rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
              >
                {LAUNCH_SURAHS.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name} ({s.ayahCount} ayahs)</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Ayahs each
              <select
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
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
                className="mt-1 block rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
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
            className="rounded-full bg-[#0B3D2E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#146B4D]"
          >
            Create challenge
          </button>
        </div>
      </section>

      {/* Join with a bare code */}
      <section aria-labelledby="join-heading" className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="join-heading" className="text-xl font-bold text-[#0B3D2E]">Join with a code</h2>
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
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm uppercase"
            />
          </label>
          <label className="block text-sm font-semibold">
            Your name (shown to the group)
            <input
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="e.g. Ahmed"
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="block text-sm font-semibold">
              Surah
              <select
                value={joinSurahSlug}
                onChange={(e) => setJoinSurahSlug(e.target.value)}
                className="mt-1 block rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
              >
                {LAUNCH_SURAHS.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name} ({s.ayahCount} ayahs)</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Ayahs each
              <select
                value={joinTarget}
                onChange={(e) => setJoinTarget(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
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
                className="mt-1 block rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
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
            className="rounded-full bg-[#0B3D2E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#146B4D] disabled:opacity-50"
          >
            Join with this code
          </button>
        </div>
      </section>
    </div>
  );
}
