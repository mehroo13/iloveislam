// app/hifz/components/SearchablePicker.tsx — searchable grouped picker
// (Stage 8, §26–27).
//
// The old translation / tafsir controls were plain <select>s with
// <optgroup>s: 105 translations across 65 languages + transliteration
// and 21 tafsirs are unusable as a blind dropdown — the user had to
// scroll the whole list to find a translator. This is a button +
// dropdown panel with a search box: type a translator name or a
// language ("urdu", "jalandhari", "kathir") and the list filters to
// matching items, still grouped by language with the translator name
// shown. Selection is identical to the old control (an id), so the
// existing persistence (settings.translationId / TAFSIR_KEY) is
// untouched. The panel closes on selection, Escape, or tapping
// outside; options are plain buttons, so keyboard tabbing works.
// Interface strings come from the i18n store via the caller.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface PickerGroup {
  lang: string;
  items: { id: number; name: string }[];
}

export default function SearchablePicker({
  label,
  value,
  groups,
  onChange,
  searchPlaceholder,
  noResults,
}: {
  /** Visible label, e.g. "Translation" (rendered by the caller). */
  label: string;
  /** Currently selected id. */
  value: number;
  /** Options grouped by language, in display order. */
  groups: PickerGroup[];
  onChange: (id: number) => void;
  searchPlaceholder: string;
  noResults: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentName = useMemo(() => {
    for (const g of groups) {
      const hit = g.items.find((i) => i.id === value);
      if (hit) return hit.name;
    }
    return '';
  }, [groups, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        lang: g.lang,
        items: g.items.filter(
          (i) => i.name.toLowerCase().includes(q) || g.lang.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  const total = useMemo(() => filtered.reduce((n, g) => n + g.items.length, 0), [filtered]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [open ]);

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${currentName}`}
        onClick={() => {
          setQuery('');
          setOpen((v) => !v);
        }}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-2 text-start text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
      >
        <span className="min-w-0 truncate">{currentName}</span>
        <span aria-hidden="true" className="shrink-0 text-xs text-[#5b6b62]">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 z-50 mt-1 max-h-80 overflow-auto rounded-xl border border-[#E5E7EB] bg-white shadow-xl"
        >
          <div className="sticky top-0 border-b border-[#E5E7EB] bg-white p-2">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full min-h-10 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm outline-none focus:border-[#1FA36B]"
            />
          </div>
          {total === 0 ? (
            <p className="px-3 py-4 text-sm text-[#5b6b62]">{noResults}</p>
          ) : (
            filtered.map((g) => (
              <div key={g.lang}>
                <p className="bg-[#FFFBF2] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#5b6b62]">
                  {g.lang}
                </p>
                <ul>
                  {g.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={item.id === value}
                        onClick={() => {
                          onChange(item.id);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-start text-sm hover:bg-[#FFFBF2] ${
                          item.id === value ? 'bg-[#E4FFF2] font-bold text-[#102E26]' : ''
                        }`}
                      >
                        <span>{item.name}</span>
                        {item.id === value && (
                          <span aria-hidden="true" className="text-[#1FA36B]">
                            ✓
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
