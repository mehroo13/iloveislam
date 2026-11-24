// app/hifz/components/ReaderMistakes.tsx — the "Mistakes" modal
// (Phase 1). Opens from the Mistakes pill in the reader's bottom bar.
//
// MOCK DATA — the entries below are SAMPLES ONLY, written here so the
// list UI can be verified. Real mistakes come from the recitation
// coach (Tilawa): wrong_word, omitted_word, added_word,
// skipped_passage — and will replace this list when the coach writes
// its mistake events. The modal says so in plain text at the bottom.

'use client';

import { useEffect, useState } from 'react';

const INK = '#111827';
const MUTED = '#9CA3AF';

/** Sample mistakes (MOCK — see the header comment). */
const MOCK_MISTAKES: {
  ref: string;
  word: string;
  type: string;
  date: string;
}[] = [
  { ref: 'Al-Fatihah · Ayah 4', word: 'مَـٰلِكِ', type: 'Wrong word', date: 'Nov 23' },
  { ref: "Al-Baqarah · Ayah 255", word: 'ٱلْحَىُّ', type: 'Missed word', date: 'Nov 22' },
  { ref: "Al-Baqarah · Ayah 2", word: 'هُدًى', type: 'Extra word', date: 'Nov 21' },
  { ref: 'Al-Fatihah · Ayah 7', word: '—', type: 'Skipped passage', date: 'Nov 20' },
];

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
}: {
  open: boolean;
  onClose: () => void;
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
          Recent mistakes from your recitation sessions.
        </p>

        <ul className="mt-4 px-5 pb-2">
          {MOCK_MISTAKES.map((m) => (
            <li
              key={`${m.ref}-${m.type}`}
              className="flex items-center gap-3 border-t border-[#F0F0F0] py-3.5"
            >
              <span className="min-w-0 flex-1">
                <span dir="rtl" lang="ar" className="font-quran-madani block text-right text-[20px] leading-snug" style={{ color: INK }}>
                  {m.word}
                </span>
                <span className="block pt-0.5 text-[12.5px] leading-tight" style={{ color: MUTED }}>
                  {m.ref}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-[#FEF2F2] px-2.5 py-1 text-[12px] font-semibold text-[#DC2626]">
                {m.type}
              </span>
              <span className="w-14 shrink-0 text-right text-[12.5px]" style={{ color: MUTED }}>
                {m.date}
              </span>
            </li>
          ))}
        </ul>

        <p className="px-5 pb-8 pt-1 text-center text-[12.5px] leading-snug" style={{ color: MUTED }}>
          Sample data — your real mistakes will appear here after recitation sessions.
        </p>
      </div>
    </div>
  );
}
