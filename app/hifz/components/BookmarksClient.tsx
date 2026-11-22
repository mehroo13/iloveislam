// app/hifz/components/BookmarksClient.tsx — bookmarks list page (Stage 5, §6).
//
// Reads the shared 'quran_bookmarks_v2' store (lib/bookmarks.ts): ayah
// bookmarks saved from the surah reader / ayah page, and Mushaf page
// bookmarks saved from the reader toolbar. Each item can carry a note
// (added here), be opened, or be removed. Removing here removes it
// everywhere — the store is one list, not a copy.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  loadBookmarks,
  saveBookmarks,
  bookmarkKey,
  type BookmarkEntry,
} from '../lib/bookmarks';
import { getSurahById } from '../surahs';

export default function BookmarksClient() {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[] | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  const update = (next: BookmarkEntry[]) => {
    saveBookmarks(next);
    setBookmarks(next);
  };

  const remove = (b: BookmarkEntry) => {
    if (!bookmarks) return;
    update(bookmarks.filter((x) => bookmarkKey(x) !== bookmarkKey(b)));
  };

  const saveNote = (b: BookmarkEntry) => {
    if (!bookmarks) return;
    const note = noteDraft.trim();
    update(
      bookmarks.map((x) =>
        bookmarkKey(x) === bookmarkKey(b)
          ? { ...x, ...(note ? { note } : { note: undefined }) }
          : x,
      ),
    );
    setEditingNote(null);
    setNoteDraft('');
  };

  if (bookmarks === null) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#5b6b62]">Loading bookmarks…</p>
      </div>
    );
  }

  const ayahMarks = bookmarks.filter((b) => b.kind === 'ayah');
  const pageMarks = bookmarks.filter((b) => b.kind === 'page');

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm leading-relaxed text-[#5b6b62]">
          No bookmarks yet. Tap the bookmark button on any ayah, or “Bookmark this page” in
          the Mushaf reader toolbar, and it appears here. Bookmarks are saved on this device
          only, and they travel with your progress export.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/hifz"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#102E26] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            Browse surahs →
          </Link>
          <Link
            href="/hifz/mushaf"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] px-5 py-2 text-sm font-semibold hover:border-[#1FA36B]"
          >
            Open the Mushaf →
          </Link>
        </div>
      </div>
    );
  }

  const renderNoteRow = (b: BookmarkEntry) => {
    const k = bookmarkKey(b);
    if (editingNote === k) {
      return (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="flex-1 text-xs font-semibold text-[#5b6b62]">
            Note
            <input
              type="text"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Why did you save this? (optional)"
              maxLength={200}
              className="mt-1 block w-full min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm font-normal"
            />
          </label>
          <button
            type="button"
            onClick={() => saveNote(b)}
            className="min-h-11 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            Save note
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingNote(null);
              setNoteDraft('');
            }}
            className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold"
          >
            Cancel
          </button>
        </div>
      );
    }
    return (
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {b.note && <span className="text-xs italic text-[#5b6b62]">“{b.note}”</span>}
        <button
          type="button"
          onClick={() => {
            setEditingNote(k);
            setNoteDraft(b.note ?? '');
          }}
          className="text-xs font-semibold text-[#1FA36B] underline"
        >
          {b.note ? 'Edit note' : 'Add a note'}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {ayahMarks.length > 0 && (
        <section aria-labelledby="ayah-bookmarks-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <h2 id="ayah-bookmarks-heading" className="text-xl font-bold text-[#102E26]">
            Saved ayahs ({ayahMarks.length})
          </h2>
          <ul className="mt-3 space-y-3">
            {[...ayahMarks]
              .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))
              .map((b) => {
                const s = getSurahById(b.surahNumber ?? 0);
                const when = b.addedAt
                  ? new Date(b.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  : '';
                return (
                  <li key={bookmarkKey(b)} className="rounded-xl bg-[#FFFBF2] px-3 py-2.5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#102E26]">
                        {s ? s.name : b.surahName ?? `Surah ${b.surahNumber}`} {b.surahNumber}:{b.verseNumber}
                      </span>
                      {when && <span className="text-xs text-[#5b6b62]">{when}</span>}
                      <span className="ml-auto flex gap-2">
                        {s && (
                          <Link
                            href={`/hifz/${s.slug}/${b.surahNumber}-${b.verseNumber}`}
                            className="font-semibold text-[#1FA36B] underline"
                          >
                            Open
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(b)}
                          className="font-semibold text-red-700 underline"
                        >
                          Remove
                        </button>
                      </span>
                    </div>
                    {renderNoteRow(b)}
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      {pageMarks.length > 0 && (
        <section aria-labelledby="page-bookmarks-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <h2 id="page-bookmarks-heading" className="text-xl font-bold text-[#102E26]">
            Saved Mushaf pages ({pageMarks.length})
          </h2>
          <ul className="mt-3 space-y-3">
            {[...pageMarks]
              .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))
              .map((b) => {
                const when = b.addedAt
                  ? new Date(b.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  : '';
                return (
                  <li key={bookmarkKey(b)} className="rounded-xl bg-[#FFFBF2] px-3 py-2.5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#102E26]">Mushaf page {b.page}</span>
                      {when && <span className="text-xs text-[#5b6b62]">{when}</span>}
                      <span className="ml-auto flex gap-2">
                        <Link
                          href={`/hifz/mushaf?page=${b.page}`}
                          className="font-semibold text-[#1FA36B] underline"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(b)}
                          className="font-semibold text-red-700 underline"
                        >
                          Remove
                        </button>
                      </span>
                    </div>
                    {renderNoteRow(b)}
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      <p className="text-xs leading-relaxed text-[#5b6b62]">
        Bookmarks live only on this device. They are included when you export your progress
        from My Progress, and restored when you import that file on another device.
      </p>
    </div>
  );
}
