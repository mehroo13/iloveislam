// app/hifz/components/VirtuesBlock.tsx — sourced virtues (spec §4.1.7).
// Server component. Surahs without an entry render NOTHING — never invented text.
import { getVirtue } from '../virtues';

export default function VirtuesBlock({ slug }: { slug: string }) {
  const virtue = getVirtue(slug);
  if (!virtue) return null;
  return (
    <section aria-labelledby="virtues-heading" className="mt-8 rounded-2xl border border-[#C9A227]/40 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9A227]">Why memorise it</p>
      <h2 id="virtues-heading" className="mt-1 text-xl font-bold text-[#0B3D2E]">{virtue.title}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-[#1C2420]/85">{virtue.text}</p>
      <p className="mt-3 text-sm text-[#5b6b62]">
        Source: {virtue.source} · Graded {virtue.grading}
        {virtue.gradingNote ? ` — ${virtue.gradingNote}` : ''}
      </p>
      {virtue.weakReportNote && (
        <p className="mt-3 rounded-xl bg-[#F7F5EF] border border-[#e5e0d3] px-4 py-3 text-sm leading-relaxed text-[#5b6b62]">
          {virtue.weakReportNote}
        </p>
      )}
    </section>
  );
}
