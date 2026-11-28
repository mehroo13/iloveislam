// app/hifz/components/WordByWord.tsx — word-by-word breakdown for one ayah.
// Fetches through the existing same-origin /api/quran proxy (?words=true).
// Display words always come from the verse's own Indo-Pak text (split by
// whitespace); the words payload supplies translation + transliteration by
// position — its `text` field is a Uthmani code glyph and is never shown.
// Degrades gracefully: on failure the ayah still shows Arabic + translation
// and this block says "Word-by-word is unavailable right now".
// RECITER LIMIT (verified live against api.quran.com 2026-11-23): the word
// clips (`wbw/*.mp3`) are one fixed voice — `audio=<reciterId>` does not
// change them (probed with reciters 2 and 7: identical audio_url), so the
// "Hear it" clips deliberately ignore the selected reciter. There is no
// per-reciter word-clip variant in Quran.com v4; do not wire a reciter id
// in here expecting it to change the voice.
'use client';

import { useEffect, useState } from 'react';
import { API, AUDIO_BASE } from '../../quran/lib';
import { pairWordRows } from '../lib/fetch';
import { useT } from '../lib/i18n';

interface WordRow {
  arabic: string;
  translation: string;
  transliteration: string;
  audioUrl?: string;
}

export default function WordByWord({
  surahId,
  ayah,
  indopakText,
}: {
  surahId: number;
  ayah: number;
  indopakText: string;
}) {
  const t = useT();
  const [words, setWords] = useState<WordRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/verses/by_key/${surahId}:${ayah}?fields=text_indopak&words=true`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const raw = (data?.verse?.words ?? []) as Record<string, unknown>[];
        const infos = raw
          .filter((w) => w.char_type_name === 'word')
          .map((w) => ({
            translation: String((w.translation as { text?: string } | undefined)?.text ?? ''),
            transliteration: String(
              (w.transliteration as { text?: string } | undefined)?.text ?? '',
            ),
            audioUrl: typeof w.audio_url === 'string' ? w.audio_url : undefined,
          }));
        // Shared pairing (lib/fetch pairWordRows, audit C4): standalone
        // pause-mark tokens do not consume a payload slot, and a split
        // "وَ" + word merges with the payload's one word — otherwise
        // every following word shows the NEXT word's meaning (2:255).
        setWords(pairWordRows(indopakText, infos));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [surahId, ayah, indopakText]);

  if (failed) {
    return <p className="mt-3 text-sm text-[#5b6b62]">{t('wbw.unavailable')}</p>;
  }
  if (words === null) {
    return <p className="mt-3 text-sm text-[#5b6b62]">{t('wbw.loading')}</p>;
  }
  return (
    <div className="mt-3">
      <ul className="flex flex-wrap gap-2" aria-label={`${t('ayah.wordByWord')} ${surahId}:${ayah}`}>
        {words.map((w, i) => (
          <li
            key={i}
            className="rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2.5 py-1.5 text-center"
          >
            <span dir="rtl" lang="ar" translate="no" className="font-quran block text-xl leading-snug text-[#102E26]">
              {w.arabic}
            </span>
            {w.transliteration && (
              <span lang="ar-Latn" translate="no" className="block text-[11px] italic text-[#5b6b62]">{w.transliteration}</span>
            )}
            {w.translation && <span lang="en" translate="no" className="block text-[11px] text-[#1C2420]/75">{w.translation}</span>}
            {w.audioUrl && (
              <button
                type="button"
                aria-label={`${t('wbw.hearIt')} — ${w.transliteration || w.arabic}`}
                onClick={() => {
                  const audio = new Audio(`${AUDIO_BASE}${w.audioUrl}`);
                  setPlaying(i);
                  audio.play().catch(() => setPlaying(null));
                  audio.addEventListener('ended', () => setPlaying(null), { once: true });
                }}
                className="mt-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#1FA36B] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
              >
                {playing === i ? t('wbw.playing') : t('wbw.hearIt')}
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[#5b6b62]">{t('wbw.via')}</p>
    </div>
  );
}
