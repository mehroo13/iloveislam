// app/hifz/components/SharedSheets.tsx — shared Tarteel-style UI pieces
// (spec §22, screenshot rebuild 2026-11-21): bottom sheets, mistake
// history, session analytics, Tajweed guide, range wheel, hidden-verse
// rules. All our own code and wording; no copied assets.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MistakeEntry } from '../progress';
import { ALL_SURAHS } from '../surahs';
import { ShareAudioButtons, type SharedRecording } from './ShareAudio';
import { useT } from '../lib/i18n';

/* ---------------- Bottom sheet ---------------- */

export function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#102E26]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-full border border-[#E5E7EB] px-3 py-1 text-sm font-bold"
          >
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Mistake history (screenshot 3) ---------------- */

export function MistakeHistorySheet({
  mistakes,
  onRemove,
  onClose,
}: {
  mistakes: MistakeEntry[];
  onRemove: (idx: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const visible = mistakes.filter((_, i) => !removed.has(i));
  return (
    <BottomSheet title={t('sheet.mistakeHistory')} onClose={onClose}>
      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#5b6b62]">
          {t('sheet.noMistakes')}
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((m, i) => {
            const wrong = m.heard && m.heard !== m.expected;
            const label = wrong ? t('sheet.incorrectWords') : t('sheet.missedWords');
            const time = new Date(m.date);
            const hh = String(time.getHours()).padStart(2, '0');
            const mm = String(time.getMinutes()).padStart(2, '0');
            return (
              <li key={`${m.surah}:${m.ayah}:${m.word}:${i}`} className="rounded-2xl border border-[#E5E7EB] p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-[#E5E7EB] px-2 py-0.5 text-xs font-bold">
                    {m.surah}:{m.ayah}
                  </span>
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="ml-auto rounded-md border border-[#E5E7EB] px-2 py-0.5 text-xs text-[#5b6b62]">
                    {hh}:{mm}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove this mistake (${m.word})`}
                    title={t('sheet.removeWrongly')}
                    onClick={() => {
                      onRemove(i);
                      setRemoved((s) => new Set(s).add(i));
                    }}
                    className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-xs font-bold text-[#B42318] hover:border-[#B42318]"
                  >
                    {t('sheet.remove')}
                  </button>
                </div>
                <div className="mt-3 rounded-xl border border-[#E5E7EB] p-3">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-semibold text-[#5b6b62]">{t('common.expected')}</span>
                    <span dir="rtl" lang="ar" className="font-quran text-xl text-right">
                      <span className="font-bold text-[#16A34A]">{m.expected}</span>
                    </span>
                  </p>
                  <p className="mt-2 flex items-baseline justify-between gap-3 border-t border-[#E5E7EB] pt-2">
                    <span className="text-xs font-semibold text-[#5b6b62]">{t('common.recited')}</span>
                    <span dir="rtl" lang="ar" className="font-quran text-xl text-right">
                      {m.heard ? (
                        <span className="font-bold text-[#DC2626]">{m.heard}</span>
                      ) : (
                        <span className="text-[#5b6b62]">{t('common.notHeard')}</span>
                      )}
                    </span>
                  </p>
                </div>
                <p className="mt-2 text-xs text-[#5b6b62]">
                  {t('sheet.seen')} {m.attempts} {m.attempts === 1 ? t('common.time') : t('common.times')} ·{' '}
                  {Math.max(0, 3 - m.attempts)} {t('sheet.moreToClear')}
                </p>
                <Link
                  href={`/hifz/search?q=${encodeURIComponent(m.expected)}`}
                  className="mt-3 block rounded-full bg-[#102E26] py-2.5 text-center text-sm font-bold text-white hover:bg-[#1FA36B]"
                >
                  {t('common.searchThisWord')}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-center text-xs text-[#5b6b62]">
        ⓘ The checker flags words, not tajweed. If a word was flagged wrongly, remove it —
        it stops counting in your history and test scores.
      </p>
    </BottomSheet>
  );
}

/* ---------------- Session analytics (screenshot 7 + report §4.6) ---------------- */

export interface HistoryRow {
  date: string;
  range: string;
  accuracy: number;
  mistakesPerPage: number;
}

export function SessionAnalyticsSheet({
  accuracy,
  mistakesPerPage,
  words,
  history,
  /** The just-finished session's recording, if one was captured. Only the
   * current browser session can have audio — recordings are never saved,
   * so past sessions have none (the UI says so below). */
  latestSessionAudio,
  onClose,
}: {
  accuracy: number;
  mistakesPerPage: number;
  words: number;
  history: HistoryRow[];
  latestSessionAudio?: (SharedRecording & { range: string; date: string }) | null;
  onClose: () => void;
}) {
  const t = useT();
  const [metric, setMetric] = useState<'pg' | 'pct'>('pg');
  const pts = history.slice(0, 12).reverse();
  const max = Math.max(6, ...pts.map((r) => (metric === 'pg' ? r.mistakesPerPage : 100 - r.accuracy)));
  const coords = pts.map((r, i) => {
    const v = metric === 'pg' ? r.mistakesPerPage : 100 - r.accuracy;
    const x = pts.length <= 1 ? 50 : 10 + (i * 180) / (pts.length - 1);
    const y = 60 - (v / max) * 50;
    return `${x},${y}`;
  });
  const dot = (acc: number) => (acc >= 99 ? '#16A34A' : acc >= 97 ? '#F2C94C' : '#EA580C');
  return (
    <BottomSheet title={t('coach.sessionAnalytics')} onClose={onClose}>
      <p className="text-xs font-bold uppercase tracking-wider text-[#5b6b62]">{t('sheet.currentSession')}</p>
      <div className="mt-1 flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-[#102E26]">{words} {t('sheet.wordsRecited')}</p>
          <p className="text-sm text-[#5b6b62]">{mistakesPerPage.toFixed(1)} {t('sheet.mistakesPerPage')}</p>
        </div>
        <div
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full bg-[#B5F5A5] text-[#102E26]"
          aria-label={`${accuracy.toFixed(1)} percent accuracy`}
        >
          <span className="text-xl font-bold">{accuracy.toFixed(1)}%</span>
          <span className="text-xs font-semibold">{mistakesPerPage.toFixed(1)} m/p</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[#5b6b62]">{t('sheet.trend')}</p>
        <div className="flex gap-1" role="group" aria-label="Trend metric">
          {(['pg', 'pct'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                metric === m ? 'bg-[#E5E7EB] text-[#102E26]' : 'border border-[#E5E7EB] text-[#5b6b62]'
              }`}
            >
              {m === 'pg' ? 'PG' : '%'}
            </button>
          ))}
        </div>
      </div>
      {pts.length > 1 ? (
        <svg viewBox="0 0 200 70" className="mt-2 w-full" role="img" aria-label="Accuracy trend across recent sessions">
          <polyline points={coords.join(' ')} fill="none" stroke="#EA580C" strokeWidth="2" strokeLinejoin="round" />
          {coords.map((c, i) => {
            const [x, y] = c.split(',').map(Number);
            return <circle key={i} cx={x} cy={y} r="3" fill="#16A34A" />;
          })}
        </svg>
      ) : (
        <p className="mt-2 text-sm text-[#5b6b62]">{t('sheet.trendEmpty')}</p>
      )}
      <p className="text-xs text-[#5b6b62]">Long press on the graph to browse between sessions (web: hover a dot).</p>

      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#5b6b62]">{t('sheet.sessionHistory')}</p>
      {latestSessionAudio ? (
        <div className="mt-2 rounded-xl border border-[#FFB800] bg-[#FFFBF2] p-3">
          <p className="text-sm font-bold text-[#102E26]">
            {t('sheet.thisSession')} {latestSessionAudio.range} · {latestSessionAudio.date}
          </p>
          <p className="mt-1 text-xs text-[#5b6b62]">
            Your recording is still on this device. Share it with your teacher, or download it to send yourself.
          </p>
          <div className="mt-2">
            <ShareAudioButtons recording={latestSessionAudio} />
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-[#5b6b62]">
          Recordings are kept only in this browser session and are not saved, so past sessions have no audio to share. Recite with the microphone and the session you just finished will offer sharing here.
        </p>
      )}
      {history.length === 0 ? (
        <p className="mt-2 text-sm text-[#5b6b62]">{t('sheet.noSessions')}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {history.slice(0, 8).map((r, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm">
              <span className="w-20 shrink-0 font-semibold">{r.date}</span>
              <span className="min-w-0 flex-1 truncate text-[#5b6b62]">{r.range}</span>
              <span className="font-bold">{r.accuracy.toFixed(1)}%</span>
              <span className="text-xs text-[#5b6b62]">{r.mistakesPerPage.toFixed(1)} m/p</span>
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: dot(r.accuracy) }} />
              <span className="w-full text-xs text-[#5b6b62]">{t('sheet.noAudioSaved')}</span>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}

/* ---------------- Tajweed colours — display only ---------------- */

const TAJWEED_GUIDE: { cls: string; name: string; note: string }[] = [
  { cls: 'tj-madd-laazim', name: 'Madd Laazim (6 counts)', note: 'Longest stretch, e.g. الضَّالِّينَ' },
  { cls: 'tj-madd-wajib', name: 'Madd Wajib Muttasil (4–5 counts)', note: 'Hamzah after a madd letter, e.g. سَمَاء' },
  { cls: 'tj-madd-aarid', name: "Madd 'Aarid li-Sukoon (2/4/6 at stopping)", note: 'At a stop, e.g. الْعَالَمِينَ' },
  { cls: 'tj-madd-tabeei', name: "Madd Tabee'i (2 counts)", note: 'Natural stretch, e.g. قَالَ' },
  { cls: 'tj-ghunna', name: 'Ghunna (nasal, 2 counts)', note: 'Noon / meem with shaddah' },
  { cls: 'tj-qalqalah', name: 'Qalqalah', note: 'ق ط ب ج د with sukoon' },
  { cls: 'tj-tafkhim', name: 'Tafkhim (heavy letters)', note: 'خ ص ض غ ط ق ظ and heavy ر' },
  { cls: 'tj-silent', name: 'Silent letters', note: 'Letters not pronounced' },
];

/** Word-level Tajweed colour (whole word coloured, so Arabic letter-joining
 * is never broken). Approximate display layer only — this app does NOT
 * detect tajweed mistakes, and neither does the reference app. */
export function tajweedClass(word: string): string {
  const w = word;
  if (/[ٓ]/.test(w)) return 'tj-madd-laazim';
  if (/[ء]/.test(w) && /[اوي]/.test(w)) return 'tj-madd-wajib';
  if (/[نّمّ]/.test(w)) return 'tj-ghunna';
  if (/[قطبجد]ْ/.test(w)) return 'tj-qalqalah';
  if (/[خصضغطقظ]/.test(w)) return 'tj-tafkhim';
  if (/[اويٰ]/.test(w)) return 'tj-madd-tabeei';
  return '';
}

export function TajweedGuide({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <BottomSheet title={t('sheet.tajweedTitle')} onClose={onClose}>
      <p className="text-sm text-[#5b6b62]">
        These colours show where a tajweed rule <em>applies</em> in the text. They do not
        check your recitation — this app checks words only, never tajweed. A teacher is
        still needed for tajweed.
      </p>
      <ul className="mt-3 space-y-2">
        {TAJWEED_GUIDE.map((g) => (
          <li key={g.name} className="flex items-baseline gap-3 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm">
            <span aria-hidden="true" className={`font-quran text-xl ${g.cls}`}>
              بِسْمِ
            </span>
            <span>
              <span className="font-bold">{g.name}</span>
              <span className="block text-xs text-[#5b6b62]">{g.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}

/* ---------------- Range wheel (Test Mode) ---------------- */

export type RangeKind = 'surah' | 'juz' | 'hizb' | 'rub' | 'page';
export interface RangeSelection {
  kind: RangeKind;
  id: number;
}

const RANGE_COUNTS: Record<RangeKind, number> = { surah: 114, juz: 30, hizb: 60, rub: 240, page: 604 };
function rangeLabels(t: (key: string) => string): Record<RangeKind, string> {
  return {
    surah: t('sheet.kindSurah'),
    juz: t('sheet.kindJuz'),
    hizb: t('sheet.kindHizb'),
    rub: t('sheet.kindRub'),
    page: t('sheet.kindPage'),
  };
}

export function RangeWheel({
  selected,
  onChange,
}: {
  selected: RangeSelection[];
  onChange: (next: RangeSelection[]) => void;
}) {
  const t = useT();
  const RANGE_LABELS = rangeLabels(t);
  const [kind, setKind] = useState<RangeKind>('surah');
  const [rangeName, setRangeName] = useState('');
  const [rangeEmoji, setRangeEmoji] = useState('📖');
  const [saved, setSaved] = useState<{ name: string; emoji: string; items: RangeSelection[] }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ili_test_ranges_v1') ?? '[]') as {
        name: string;
        emoji: string;
        items: RangeSelection[];
      }[];
    } catch {
      return [];
    }
  });

  const isSelected = (id: number) => selected.some((s) => s.kind === kind && s.id === id);
  const toggle = (id: number) => {
    onChange(
      isSelected(id)
        ? selected.filter((s) => !(s.kind === kind && s.id === id))
        : [...selected, { kind, id }],
    );
  };
  const saveRange = () => {
    if (!rangeName.trim() || selected.length === 0) return;
    const next = [...saved, { name: rangeName.trim(), emoji: rangeEmoji, items: selected }];
    setSaved(next);
    try {
      localStorage.setItem('ili_test_ranges_v1', JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setRangeName('');
  };

  const count = RANGE_COUNTS[kind];
  return (
    <div>
      <div className="flex flex-wrap gap-1" role="group" aria-label={t('sheet.rangeType')}>
        {(Object.keys(RANGE_LABELS) as RangeKind[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`min-h-11 rounded-full px-3 py-1.5 text-sm font-semibold ${
              kind === k ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB]'
            }`}
          >
            {RANGE_LABELS[k]}
          </button>
        ))}
      </div>
      <div className="mt-3 grid max-h-44 grid-cols-5 gap-1.5 overflow-y-auto rounded-xl border border-[#E5E7EB] p-2 sm:grid-cols-8">
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={isSelected(n)}
            onClick={() => toggle(n)}
            title={kind === 'surah' ? ALL_SURAHS[n - 1]?.name ?? `Surah ${n}` : `${RANGE_LABELS[kind]} ${n}`}
            className={`min-h-10 rounded-lg px-1 py-1.5 text-xs font-bold ${
              isSelected(n) ? 'bg-[#57D798] text-[#102E26]' : 'bg-[#FFFBF2] hover:bg-[#E4FFF2]'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange([])}
          className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold"
        >
          {t('sheet.clear')}
        </button>
        <span className="text-sm text-[#5b6b62]">
          {selected.length} {selected.length === 1 ? t('sheet.section') : t('sheet.sections')} {t('sheet.selected')}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={rangeEmoji}
          onChange={(e) => setRangeEmoji(e.target.value)}
          aria-label={t('sheet.rangeEmoji')}
          className="w-12 rounded-lg border border-[#E5E7EB] px-2 py-2 text-center text-sm"
        />
        <input
          value={rangeName}
          onChange={(e) => setRangeName(e.target.value)}
          placeholder={t('sheet.rangeNamePlaceholder')}
          aria-label={t('sheet.rangeName')}
          className="min-w-0 flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={saveRange}
          disabled={!rangeName.trim() || selected.length === 0}
          className="rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {t('sheet.saveRange')}
        </button>
      </div>
      {saved.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-semibold">{t('sheet.yourRanges')}</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {saved.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onChange(r.items)}
                  className="rounded-full border border-[#E5E7EB] px-3 py-1.5 text-sm font-semibold hover:border-[#1FA36B]"
                >
                  {r.emoji} {r.name} ({r.items.length})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- Hidden verses (memorisation) ---------------- */

/** One thin grey rule per hidden word + faint rosette at ayah ends
 * (screenshots 2 + 4). `revealed` = how many words are shown. */
export function HiddenWords({
  words,
  revealed,
  rosette,
}: {
  words: string[];
  revealed: number;
  rosette?: string;
}) {
  return (
    <span>
      {words.map((w, i) =>
        i < revealed ? (
          <span key={i}>{w} </span>
        ) : (
          <span key={i} className="hidden-word-rule" style={{ width: `${Math.max(1.2, w.length * 0.45)}em` }} />
        ),
      )}
      {rosette && <span className="hidden-ayah-rosette">{rosette}</span>}
    </span>
  );
}
