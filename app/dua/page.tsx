'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { type Dua } from '@/lib/duas';
import { ALL_DUAS, searchAllDuas, DUA_CATEGORIES } from '@/lib/duasExtra';

// ─── Situation chips (same set as Dua for This Moment) ────────────────────────
const CHIPS: { label: string; query: string }[] = [
  { label: 'Anxious', query: 'anxiety' },
  { label: "Can't sleep", query: 'sleep' },
  { label: 'Waking up', query: 'waking' },
  { label: 'Travelling', query: 'travel' },
  { label: 'Eating', query: 'food' },
  { label: 'At home', query: 'home' },
  { label: 'Need forgiveness', query: 'forgiveness' },
  { label: 'Need patience', query: 'patience' },
  { label: 'Someone is sick', query: 'sick' },
  { label: 'Marriage & family', query: 'marriage' },
  { label: 'Money & work', query: 'provision' },
  { label: 'Angry', query: 'anger' },
  { label: 'Exams', query: 'exams' },
  { label: 'Grateful', query: 'gratitude' },
  { label: 'Starting something hard', query: 'ease' },
  { label: 'Parents', query: 'parents' },
  { label: 'Learning', query: 'knowledge' },
];

// Theme category for each of the flagship 18 (extra duas carry their own).
const FLAGSHIP_CATEGORY: Record<string, string> = {
  anxiety: 'Hardship & Patience',
  sleep: 'Daily Life',
  waking: 'Morning & Evening',
  parents: 'Family & Children',
  knowledge: 'Guidance & Faith',
  travel: 'Daily Life',
  'before-eating': 'Daily Life',
  'after-eating': 'Daily Life',
  'entering-home': 'Daily Life',
  forgiveness: 'Forgiveness & Mercy',
  patience: 'Hardship & Patience',
  sick: 'Hardship & Patience',
  marriage: 'Family & Children',
  provision: 'Provision & Work',
  anger: 'Hardship & Patience',
  exams: 'Hardship & Patience',
  gratitude: 'Worship & Gratitude',
  ease: 'Hardship & Patience',
};

function categoryOf(dua: Dua): string {
  return dua.category ?? FLAGSHIP_CATEGORY[dua.id] ?? 'Daily Life';
}

const FAVORITES_KEY = 'ili_dua_favorites';

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private mode etc.) — favorites just won't persist.
  }
}

// ─── Dua card (same design as Dua for This Moment) ────────────────────────────
function DuaCard({
  dua,
  isFavorite,
  onToggleFavorite,
}: {
  dua: Dua;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const listen = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(dua.arabic);
    utterance.lang = 'ar-SA';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const copy = async () => {
    const text = `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}\n\nSource: ${dua.source}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    const text = `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}\n\nSource: ${dua.source}`;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: dua.title, text });
        return;
      } catch {
        // User cancelled the share sheet, or sharing failed — fall back to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      // Clipboard unavailable — nothing more we can do.
    }
  };

  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <article className="bg-white rounded-2xl border border-[#E7E2D5] shadow-sm p-5 sm:p-6">
      <h3 className="text-lg font-bold text-[#1C2420]">{dua.title}</h3>
      <p className="mt-1">
        <span className="inline-block rounded-full bg-[#F7F5EF] border border-[#E7E2D5] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#146B4D]">
          {categoryOf(dua)}
        </span>
      </p>

      <p dir="rtl" lang="ar" className="font-quran text-2xl sm:text-[1.75rem] text-[#0B3D2E] text-right mt-4">
        {dua.arabic}
      </p>

      <p className="text-[#146B4D] italic mt-3 leading-relaxed">{dua.transliteration}</p>
      <p className="text-[#1C2420] mt-2 leading-relaxed">{dua.translation}</p>
      <p className="text-xs text-[#6B7280] mt-3">Source: {dua.source}</p>

      <div className="flex flex-wrap gap-2 mt-5">
        {speechSupported && (
          <button
            type="button"
            onClick={listen}
            className="px-3 py-2 rounded-full text-sm font-medium bg-[#0B3D2E] text-white hover:bg-[#146B4D] transition-colors"
          >
            {speaking ? 'Listening…' : 'Listen'}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className="px-3 py-2 rounded-full text-sm font-medium bg-[#F7F5EF] text-[#0B3D2E] border border-[#E7E2D5] hover:border-[#C9A227] transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={share}
          className="px-3 py-2 rounded-full text-sm font-medium bg-[#F7F5EF] text-[#0B3D2E] border border-[#E7E2D5] hover:border-[#C9A227] transition-colors"
        >
          {shared ? 'Copied to share!' : 'Share'}
        </button>
        <button
          type="button"
          onClick={() => onToggleFavorite(dua.id)}
          aria-pressed={isFavorite}
          className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
            isFavorite
              ? 'bg-[#C9A227] text-white border-[#C9A227]'
              : 'bg-[#F7F5EF] text-[#0B3D2E] border-[#E7E2D5] hover:border-[#C9A227]'
          }`}
        >
          {isFavorite ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DuaLibraryPage() {
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  };

  const results = useMemo(() => {
    let list = search.trim()
      ? searchAllDuas(search)
      : activeChip
        ? searchAllDuas(CHIPS.find((c) => c.label === activeChip)?.query ?? '')
        : ALL_DUAS;
    if (activeCategory) list = list.filter((d) => categoryOf(d) === activeCategory);
    return list;
  }, [search, activeChip, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of ALL_DUAS) counts.set(categoryOf(d), (counts.get(categoryOf(d)) ?? 0) + 1);
    return counts;
  }, []);

  const pickChip = (label: string) => {
    setSearch('');
    setActiveChip((prev) => (prev === label ? null : label));
  };

  const pickCategory = (category: string) => {
    setSearch('');
    setActiveCategory((prev) => (prev === category ? null : category));
  };

  const clearFilters = () => {
    setSearch('');
    setActiveChip(null);
    setActiveCategory(null);
  };

  return (
    <main className="min-h-screen bg-[#F7F5EF] text-[#1C2420]">
      {/* Hero */}
      <section className="bg-[#0B3D2E] text-white px-4 pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#C9A227] text-sm font-semibold tracking-widest uppercase">Dua Library</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3 leading-tight">Every dua, in one place</h1>
          <p className="text-white/80 mt-3 leading-relaxed">
            {ALL_DUAS.length} authentic duas from the Quran and Sunnah — Arabic, transliteration
            and translation — for the moments that matter most.
          </p>
          <div className="mt-6">
            <Link
              href="/dua-for-this-moment"
              className="inline-block px-5 py-2.5 rounded-full bg-[#C9A227] text-[#0B3D2E] text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Not sure which dua you need? Find it by how you feel →
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <section aria-label="Filter duas">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveCategory(null);
              }}
              aria-pressed={activeCategory === null}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === null
                  ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                  : 'bg-white text-[#0B3D2E] border-[#E7E2D5] hover:border-[#C9A227]'
              }`}
            >
              All {ALL_DUAS.length} duas
            </button>
            {DUA_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => pickCategory(category)}
                aria-pressed={activeCategory === category}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeCategory === category
                    ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                    : 'bg-white text-[#0B3D2E] border-[#E7E2D5] hover:border-[#C9A227]'
                }`}
              >
                {category} ({categoryCounts.get(category) ?? 0})
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mt-5 mb-2">
            Or find one by how you feel
          </p>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => pickChip(chip.label)}
                aria-pressed={activeChip === chip.label}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeChip === chip.label
                    ? 'bg-[#146B4D] text-white border-[#146B4D]'
                    : 'bg-white text-[#0B3D2E] border-[#E7E2D5] hover:border-[#C9A227]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <label htmlFor="dua-library-search" className="sr-only">
            Search the dua library
          </label>
          <input
            id="dua-library-search"
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveChip(null);
              setActiveCategory(null);
            }}
            placeholder="Search in plain words — e.g. “insomnia”, “money”, “thankful”…"
            className="w-full mt-4 px-4 py-3 rounded-xl border border-[#E7E2D5] bg-white text-[#1C2420] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
          />
        </section>

        {/* Results */}
        <section aria-label="Duas">
          {results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E7E2D5] p-6 text-center">
              <p className="font-bold text-lg">No dua matches that — try one of these situations</p>
              <p className="text-[#6B7280] mt-2 leading-relaxed">
                Tap a situation above, or{' '}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[#146B4D] font-semibold underline underline-offset-2"
                >
                  show all {ALL_DUAS.length} duas
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#6B7280] mb-4">
                Showing {results.length} of {ALL_DUAS.length} duas
                {activeCategory ? ` in ${activeCategory}` : ''}
              </p>
              <div className="space-y-5">
                {results.map((dua) => (
                  <DuaCard
                    key={dua.id}
                    dua={dua}
                    isFavorite={favorites.includes(dua.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <p className="text-center text-sm text-[#6B7280] pb-4">
          Looking for the dua that fits this exact moment?{' '}
          <Link href="/dua-for-this-moment" className="text-[#146B4D] font-semibold underline underline-offset-2">
            Try Dua for This Moment →
          </Link>
        </p>
      </div>
    </main>
  );
}
