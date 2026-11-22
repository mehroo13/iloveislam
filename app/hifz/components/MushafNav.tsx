// app/hifz/components/MushafNav.tsx — client island for mushaf paging:
// previous / next page links, "Page X of 604", and a jump-to-page box.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MUSHAF_TOTAL_PAGES } from '../mushaf';
import { useT } from '../lib/i18n';

export default function MushafNav({ page }: { page: number }) {
  const t = useT();
  const router = useRouter();
  const [jump, setJump] = useState('');

  function go(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(jump);
    if (Number.isInteger(n) && n >= 1 && n <= MUSHAF_TOTAL_PAGES) {
      router.push(`/hifz/mushaf/${n}`);
    }
  }

  return (
    <nav aria-label={t('mushaf.pagesNav')} className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {page > 1 ? (
        <Link
          href={`/hifz/mushaf/${page - 1}`}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2]"
        >
          {t('mushaf.prevPage')}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm font-semibold text-[#102E26]">
        {t('mushaf.pageOf').replace('{page}', String(page)).replace('{total}', String(MUSHAF_TOTAL_PAGES))}
      </span>
      <form onSubmit={go} className="flex items-center gap-2">
        <label htmlFor="mushaf-jump" className="sr-only">
          {t('mushaf.goToPage')}
        </label>
        <input
          id="mushaf-jump"
          type="number"
          min={1}
          max={MUSHAF_TOTAL_PAGES}
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          placeholder={t('mushaf.pagePlaceholder')}
          className="w-24 min-h-11 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#1FA36B]"
        />
        <button
          type="submit"
          className="min-h-11 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
        >
          {t('mushaf.go')}
        </button>
      </form>
      {page < MUSHAF_TOTAL_PAGES ? (
        <Link
          href={`/hifz/mushaf/${page + 1}`}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2]"
        >
          {t('mushaf.nextPage')}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
