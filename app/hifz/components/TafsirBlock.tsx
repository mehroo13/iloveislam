// app/hifz/components/TafsirBlock.tsx — lazy per-ayah tafsir (Ibn Kathir Abridged, id 169).
// CRITICAL (commit 12a3449): tafsir blocks render ONLY in Tafsir view mode.
// This component is only ever mounted when viewMode === 'tafsir' — callers
// must not mount it in other modes. Loads on scroll-into-view like the reader.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API, TAFSIR_NAME, stripHtml } from '../../quran/lib';

export default function TafsirBlock({ verseKey }: { verseKey: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<{ loading: boolean; text: string; error: string }>({
    loading: false,
    text: '',
    error: '',
  });
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setState({ loading: true, text: '', error: '' });
    try {
      const res = await fetch(`${API}/tafsirs/169/by_ayah/${verseKey}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text = stripHtml(String(data.tafsir?.text ?? ''));
      setState({
        loading: false,
        text: text || 'No tafsir text was returned for this verse.',
        error: '',
      });
    } catch {
      setState({
        loading: false,
        text: '',
        error: 'Could not load the tafsir. Check your connection and try again.',
      });
    }
  }, [verseKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void load();
          obs.disconnect();
        }
      },
      { rootMargin: '800px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [load]);

  return (
    <div ref={ref} className="mt-4 rounded-xl bg-[#FFFBF2] border border-[#E5E7EB] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#1FA36B]">{TAFSIR_NAME}</p>
      {state.loading && <p className="mt-2 text-sm text-[#1C2420]/60">Loading tafsir…</p>}
      {state.error && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      {state.text && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#1C2420]/85">{state.text}</p>}
    </div>
  );
}
