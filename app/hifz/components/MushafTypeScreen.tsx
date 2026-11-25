// app/hifz/components/MushafTypeScreen.tsx — the "Mushaf Type"
// full-screen screen (fourth refinement, 2026-11-25). Opens from the
// "MUSHAF LAYOUT AND FONT" row in the Mushaf Layout sheet. Layout
// follows Mehran's Tarteel reference screenshot (image-46c661cd):
// circular back button + "Mushaf Type" title, "BOOK SETTINGS" +
// info icon, a description line, horizontally swipeable cards each
// with title, preview, description and "15 Lines / 604 pages", and
// a "Show Tajweed Colors" toggle row at the bottom. Our own wording
// and branding throughout — no Tarteel logo, name, artwork or exact
// text; the edition names are factual.
//
// The previews are REAL: the first lines of mushaf page 1 fetched
// from Quran.com and rendered in the edition's own script (the
// shared EditionPreview from BookSettings) — never placeholder art.
// The 1421/1441 cards preview the Madani (1405) page 1 because that
// is the layout the reader will show for them (see
// lib/mushaf-edition.ts — no distinct 1421/1441 line data exists in
// any public source); the honest note on the card says so.
//
// Selection is real and persisted (the `mushafEdition` setting); the
// parent applies it to the reader at once. The Tajweed toggle writes
// the existing `tajweedColors` setting and the parent applies it to
// the reader at once.
'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchMushafPage, type MushafVerse } from '../lib/fetch';
import { MUSHAF_EDITIONS, type MushafEditionId } from '../lib/mushaf-edition';
import { useT } from '../lib/i18n';
import { EditionPreview } from './BookSettings';

function IconBack() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="#9CA3AF" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="0.5" fill="#9CA3AF" />
    </svg>
  );
}

export default function MushafTypeScreen({
  open,
  onClose,
  edition,
  onSelect,
  tajweedOn,
  onToggleTajweed,
}: {
  open: boolean;
  onClose: () => void;
  edition: MushafEditionId;
  onSelect: (id: MushafEditionId) => void;
  tajweedOn: boolean;
  onToggleTajweed: (v: boolean) => void;
}) {
  const t = useT();
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  const [verses, setVerses] = useState<MushafVerse[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  // Mount / fade lifecycle, like the Settings screen.
  useEffect(() => {
    if (open) {
      setRendered(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = window.setTimeout(() => setRendered(false), 200);
    return () => window.clearTimeout(timer);
  }, [open ]);

  // One fetch of page 1 (Al-Fatihah) feeds every card's preview.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetchMushafPage(1)
      .then((v) => {
        if (cancelled) return;
        if (v.length > 0) setVerses(v);
        else setLoadFailed(true);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open ]);

  // Keep the selected card fully visible on open and on change.
  useEffect(() => {
    if (!open) return;
    carouselRef.current
      ?.querySelector(`[data-mushaf-type="${edition}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [edition, open]);

  if (!rendered) return null;

  return (
    <div
      data-mushaf-type-screen
      className="absolute inset-0 z-[70] flex flex-col transition-opacity duration-200"
      style={{ backgroundColor: 'var(--reader-bg)', opacity: shown ? 1 : 0 }}
      role="dialog"
      aria-label={t('rb.mushafType.title')}
    >
      {/* Header: back button + title, like the Settings screen. */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('rb.mushafType.back')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E8EAED]"
        >
          <IconBack />
        </button>
        <h1 className="text-[22px] font-bold leading-tight text-[#111827]">{t('rb.mushafType.title')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {/* BOOK SETTINGS label + description (our own words). */}
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-extrabold uppercase tracking-wide text-[#111827]">
            {t('rb.mushafType.bookSettings')}
          </p>
          <IconInfo />
        </div>
        <p className="pt-1 text-[14px] leading-snug text-[#6B7280]">{t('rb.mushafType.choose')}</p>

        {/* Swipeable edition cards (horizontal scroll-snap, next card
            peeking) — the same pattern as BookSettings. */}
        <div
          ref={carouselRef}
          className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
          role="group"
          aria-label={t('rb.mushafType.edition')}
        >
          {MUSHAF_EDITIONS.map((ed) => {
            const selected = edition === ed.id;
            return (
              <article
                key={ed.id}
                data-mushaf-type={ed.id}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                aria-label={`${ed.name} — ${selected ? t('rb.book.selected') : t('rb.book.select')}`}
                onClick={() => onSelect(ed.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(ed.id);
                  }
                }}
                className="w-[82%] shrink-0 cursor-pointer snap-center focus:outline-none sm:w-[340px]"
              >
                <h3 className="pb-2 text-center text-base font-bold text-[#111827]">{ed.name}</h3>
                <div
                  className={`relative rounded-xl border-2 bg-white p-2 ${
                    selected ? 'border-[#57D798]' : 'border-[#E8EAED]'
                  }`}
                >
                  <EditionPreview script={ed.script} verses={verses} failed={loadFailed} tajweedOn={tajweedOn} />
                  {selected && (
                    <span
                      aria-hidden="true"
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#57D798] text-white shadow ring-2 ring-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">{t(ed.descKey)}</p>
                {ed.honestNoteKey && (
                  <p className="mt-1.5 rounded-lg bg-[#FFF7E6] px-2.5 py-2 text-[13px] leading-snug text-[#7A5A00]">
                    {t(ed.honestNoteKey)}
                  </p>
                )}
                <p className="mt-1.5 text-sm text-[#111827]">
                  <span className="font-bold">{t('rb.mushafType.lines15')}</span> {t('rb.mushafType.ofPages').replace('{n}', '604')}
                </p>
              </article>
            );
          })}
        </div>

        {/* Show Tajweed Colors — the real `tajweedColors` setting. */}
        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-[#E8EAED] bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="font-quran shrink-0 text-2xl leading-none text-[#1FA36B]">
              ج
            </span>
            <p className="text-sm font-semibold text-[#111827]">{t('rb.book.showTajweed')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={tajweedOn}
            aria-label={t('rb.book.showTajweed')}
            onClick={() => onToggleTajweed(!tajweedOn)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              tajweedOn ? 'bg-[#57D798]' : 'bg-[#E8EAED]'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                tajweedOn ? 'start-[22px]' : 'start-0.5'
              }`}
            />
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">{t('rb.book.tajweedHint')}</p>
      </div>
    </div>
  );
}
