'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DUAS, getDuaOfTheDay, searchDuas, type Dua } from '@/lib/duas';

// ─── Situation chips ──────────────────────────────────────────────────────────
// Each chip maps to a plain-words query run through searchDuas().
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

// ─── Dua card ─────────────────────────────────────────────────────────────────
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
type View = 'find' | 'favorites' | 'all';

export default function DuaForThisMomentPage() {
  const [view, setView] = useState<View>('find');
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const duaOfTheDay = useMemo(() => getDuaOfTheDay(), []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  };

  const results = useMemo(() => {
    if (search.trim()) return searchDuas(search);
    if (activeChip) {
      const chip = CHIPS.find((c) => c.label === activeChip);
      return chip ? searchDuas(chip.query) : DUAS;
    }
    return [];
  }, [search, activeChip]);

  const hasQuery = search.trim() !== '' || activeChip !== null;
  const favoriteDuas = DUAS.filter((d) => favorites.includes(d.id));

  const pickChip = (label: string) => {
    setSearch('');
    setActiveChip((prev) => (prev === label ? null : label));
  };

  const tabButton = (v: View, label: string) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
      view === v ? 'bg-[#0B3D2E] text-white' : 'bg-white text-[#0B3D2E] border border-[#E7E2D5] hover:border-[#C9A227]'
    }`;

  return (
    <main className="min-h-screen bg-[#F7F5EF] text-[#1C2420]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B3D2E] text-white px-4 pt-12 pb-10 sm:pt-16 sm:pb-14 scroll-mt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: 'url(/hero-pattern.svg)', backgroundSize: '96px 96px' }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-[#C9A227] text-sm font-semibold tracking-widest uppercase">Dua for This Moment</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3 leading-tight">What&rsquo;s happening right now?</h1>
          <p className="text-white/80 mt-3 leading-relaxed">
            Tap what you&rsquo;re feeling or facing, and find the right dua — in Arabic, with
            transliteration and translation — in seconds.
          </p>
          <div className="mt-6">
            <Link
              href="/dua"
              className="inline-block px-5 py-2.5 rounded-full bg-[#C9A227] text-[#0B3D2E] text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Browse the full Dua Library →
            </Link>
          </div>
          <Image
            src="/mosque-silhouette.svg"
            alt=""
            width={320}
            height={130}
            priority
            className="mx-auto mt-8 w-[320px] max-w-full opacity-90"
          />
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Dua of the Day */}
        <section aria-label="Dua of the day">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#C9A227]" aria-hidden="true" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-[#146B4D]">Dua of the Day</h2>
          </div>
          <DuaCard dua={duaOfTheDay} isFavorite={favorites.includes(duaOfTheDay.id)} onToggleFavorite={toggleFavorite} />
        </section>

        {/* View tabs */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Dua views">
          <button type="button" role="tab" aria-selected={view === 'find'} onClick={() => setView('find')} className={tabButton('find', 'Find a dua')}>
            Find a dua
          </button>
          <button type="button" role="tab" aria-selected={view === 'favorites'} onClick={() => setView('favorites')} className={tabButton('favorites', 'My Favorites')}>
            My Favorites{favorites.length > 0 ? ` (${favorites.length})` : ''}
          </button>
          <button type="button" role="tab" aria-selected={view === 'all'} onClick={() => setView('all')} className={tabButton('all', 'All 18 duas')}>
            All 18 duas
          </button>
        </div>

        {/* Find view */}
        {view === 'find' && (
          <section aria-label="Find a dua">
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

            <label htmlFor="dua-search" className="sr-only">
              Search duas in plain words
            </label>
            <input
              id="dua-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveChip(null);
              }}
              placeholder="Or describe it in plain words — e.g. “can’t sleep”, “money worries”…"
              className="w-full mt-4 px-4 py-3 rounded-xl border border-[#E7E2D5] bg-white text-[#1C2420] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
            />

            <div className="mt-6 space-y-5">
              {!hasQuery && (
                <p className="text-[#6B7280] leading-relaxed">
                  Tap a situation above, or type how you feel in your own words — for example{' '}
                  <em>insomnia</em>, <em>nervous</em>, <em>test</em> or <em>thankful</em>.
                </p>
              )}
              {hasQuery && results.length === 0 && (
                <div className="bg-white rounded-2xl border border-[#E7E2D5] p-6 text-center">
                  <p className="font-bold text-lg">No dua matches that — try one of these situations</p>
                  <p className="text-[#6B7280] mt-2 leading-relaxed">
                    Tap a situation above, or{' '}
                    <button type="button" onClick={() => setView('all')} className="text-[#146B4D] font-semibold underline underline-offset-2">
                      browse all 18 duas
                    </button>
                    .
                  </p>
                </div>
              )}
              {results.map((dua) => (
                <DuaCard
                  key={dua.id}
                  dua={dua}
                  isFavorite={favorites.includes(dua.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </section>
        )}

        {/* Favorites view */}
        {view === 'favorites' && (
          <section aria-label="My favorites">
            {favoriteDuas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E7E2D5] p-6 text-center">
                <p className="font-bold text-lg">No favorites saved yet</p>
                <p className="text-[#6B7280] mt-2 leading-relaxed">
                  Tap <strong>Save</strong> on any dua to keep it here for quick access — your
                  favorites are stored on this device only.
                </p>
                <button
                  type="button"
                  onClick={() => setView('find')}
                  className="mt-4 px-5 py-2.5 rounded-full bg-[#0B3D2E] text-white text-sm font-bold hover:bg-[#146B4D] transition-colors"
                >
                  Find a dua
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {favoriteDuas.map((dua) => (
                  <DuaCard
                    key={dua.id}
                    dua={dua}
                    isFavorite
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* All 18 view */}
        {view === 'all' && (
          <section aria-label="All 18 duas">
            <p className="text-[#6B7280] leading-relaxed mb-5">
              All 18 duas in the collection, each from the Quran or an authentic hadith source.
            </p>
            <div className="space-y-5">
              {DUAS.map((dua) => (
                <DuaCard
                  key={dua.id}
                  dua={dua}
                  isFavorite={favorites.includes(dua.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </section>
        )}

        <p className="text-center text-sm text-[#6B7280] pb-4">
          Every dua here is from the Quran or an authentic hadith collection, with its source shown
          on the card. <Link href="/dua" className="text-[#146B4D] font-semibold underline underline-offset-2">See the full Dua Library →</Link>
        </p>
      </div>
    </main>
  );
}
