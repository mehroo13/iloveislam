// app/hifz/components/ReaderMistakes.tsx — the "Mistakes" modal
// (Phase 5). Opens from the Mistakes pill in the reader's bottom bar.
//
// REAL DATA ONLY: the list is the current take's mistakes, as
// confirmed by the Tilawa checker (wrong_word / omitted_word /
// skipped_passage) or by the final per-word result (words the
// reciter demonstrably went past). The Phase 1 mock entries are
// gone — there is no sample data anywhere in this file.
//
// The modal shows the CURRENT session only (this take on this
// page). Mistakes from finished takes live in the saved session
// record (coach store `ili_coach_sessions_v1`, Phase 4) and in the
// Activity tab's session history — this modal is the live review,
// not the archive.
//
// Tashkeel (diacritic) mistakes are NOT listed here: the
// FastConformer pass that could detect them is not wired up (see
// the Phase 5 report). No "tajweed" wording anywhere — this is
// word accuracy only.

'use client';

import { useEffect, useState } from 'react';
import { surahName } from '../lib/reader-sessions';
import { mistakeTypeLabel, type ReaderMistake } from '../lib/reader-mistakes';

const INK = '#111827';
const MUTED = '#9CA3AF';

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#6B7280" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function ReaderMistakes({
  open,
  onClose,
  mistakes,
  hasRecited,
  recording,
}: {
  open: boolean;
  onClose: () => void;
  /** The current take's mistakes, in passage order. */
  mistakes: ReaderMistake[];
  /** True once a take has started this visit. */
  hasRecited: boolean;
  /** True while a take is recording (live mistakes may still arrive). */
  recording: boolean;
}) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = window.setTimeout(() => setRendered(false), 320);
    return () => window.clearTimeout(timer);
  }, [open ]);

  if (!rendered) return null;

  return (
    <div className="absolute inset-0 z-40">
      <button
        type="button"
        aria-label="Close mistakes"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        style={{ opacity: shown ? 1 : 0 }}
      />
      <div
        role="dialog"
        aria-label="Recent mistakes"
        className="absolute inset-x-0 bottom-0 max-h-[82%] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: shown ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <p className="text-[20px] font-bold leading-tight" style={{ color: INK }}>
            Mistakes
          </p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center"
          >
            <IconClose />
          </button>
        </div>
        <p className="px-5 pt-1 text-[14px] leading-snug" style={{ color: MUTED }}>
          Mistakes from this recitation session.
        </p>

        {mistakes.length === 0 ? (
          <p data-testid="mistakes-empty" className="px-5 pb-8 pt-6 text-center text-[14px] leading-snug" style={{ color: MUTED }}>
            {!hasRecited
              ? 'Tap the mic and recite — any mistakes will appear here.'
              : recording
                ? 'No mistakes so far — keep reciting.'
                : 'No mistakes in this session — well done.'}
          </p>
        ) : (
          <ul className="mt-4 px-5 pb-2">
            {mistakes.map((m) => (
              <li
                key={m.key}
                data-testid={`mistake-row-${m.key.replace(/:/g, '-')}`}
                className="flex items-center gap-3 border-t border-[#F0F0F0] py-3.5"
              >
                <span className="min-w-0 flex-1">
                  <span dir="rtl" lang="ar" className="font-quran-madani block text-right text-[20px] leading-snug" style={{ color: INK }}>
                    {m.display}
                  </span>
                  <span className="block pt-0.5 text-[12.5px] leading-tight" style={{ color: MUTED }}>
                    {surahName(m.surah)} · Ayah {m.ayah}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-[#FEF2F2] px-2.5 py-1 text-[12px] font-semibold text-[#DC2626]">
                  {mistakeTypeLabel(m.type)}
                </span>
                <span className="w-14 shrink-0 text-right text-[12.5px]" style={{ color: MUTED }}>
                  Today
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="px-5 pb-8 pt-1 text-center text-[12.5px] leading-snug" style={{ color: MUTED }}>
          Detected on your device as you recite. Word accuracy only — tap a red word on the page to see what was
          expected.
        </p>
      </div>
    </div>
  );
}
