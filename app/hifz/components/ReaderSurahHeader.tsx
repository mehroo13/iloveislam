// app/hifz/components/ReaderSurahHeader.tsx — ornate surah header for
// the reader screen, in the style of a printed mushaf header: a white
// rectangle with a thick black frame, a black floral arabesque at each
// end (with an empty white circle), and a white arched cartouche in
// the middle holding the surah name. Our own SVG ornament — drawn
// from the reference screenshot's style, not copied artwork.

export default function ReaderSurahHeader({ name }: { name: string }) {
  return (
    <div className="w-full px-1" dir="rtl">
      <svg
        viewBox="0 0 600 66"
        className="h-auto w-full"
        role="img"
        aria-label={name}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Outer frame: thick black border + thin inner hairline */}
        <rect x="2" y="2" width="596" height="62" style={{ fill: 'var(--reader-card)', stroke: 'var(--reader-ink)' }} strokeWidth="3.5" />
        <rect x="8" y="8" width="584" height="50" fill="none" style={{ stroke: 'var(--reader-ink)' }} strokeWidth="1" />
        {/* End ornaments (left + mirrored right) */}
        <Ornament transform="translate(10 9)" />
        <Ornament transform="translate(590 9) scale(-1 1)" />
        {/* Centre cartouche: arched top/bottom, pointed ends tucked
            behind the ornament circles */}
        <path
          d="M 160 33 Q 170 12 202 10 L 398 10 Q 430 12 440 33 Q 430 54 398 56 L 202 56 Q 170 54 160 33 Z"
          style={{ fill: 'var(--reader-card)', stroke: 'var(--reader-ink)' }}
          strokeWidth="2"
        />
        {/* Surah name */}
        <text
          x="300"
          y="35"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Amiri', serif"
          fontSize="26"
          style={{ fill: 'var(--reader-ink)' }}
        >
          {name}
        </text>
      </svg>
    </div>
  );
}

/** One end ornament: dense black floral scrollwork with an empty
 *  white circle near its inner edge — filled edge-to-edge like the
 *  printed mushaf's surah band (2026-11-25 final pass: the old
 *  drawing left large white gaps in the panel). Drawn in a
 *  132 x 48 box. */
function Ornament({ transform }: { transform: string }) {
  return (
    <g transform={transform} fill="none" style={{ stroke: 'var(--reader-ink)' }} strokeWidth="2.25" strokeLinecap="round">
      {/* Outer rosette: eight filled petals around a centre, plus a
          second ring of eight smaller petals between them. */}
      <g style={{ fill: 'var(--reader-ink)' }} stroke="none">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d="M 16 24 C 12 16 12 10 16 7 C 20 10 20 16 16 24 Z" transform={`rotate(${a} 16 24)`} />
        ))}
        {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((a) => (
          <path key={a} d="M 16 24 C 13.5 19 13.5 15 16 13 C 18.5 15 18.5 19 16 24 Z" transform={`rotate(${a} 16 24)`} />
        ))}
        <circle cx="16" cy="24" r="3.2" />
      </g>
      {/* Dense scrolls: thick curls overlapping across the panel,
          top and bottom mirrored, plus a middle S-scroll. */}
      <path d="M 28 24 C 34 10 50 8 56 16 C 61 22 54 30 46 27 C 40 24 43 15 50 16" />
      <path d="M 28 24 C 34 38 50 40 56 32 C 61 26 54 18 46 21 C 40 24 43 33 50 32" />
      <path d="M 52 12 C 62 4 76 6 80 14 C 83 20 76 26 68 24" />
      <path d="M 52 36 C 62 44 76 42 80 34 C 83 28 76 22 68 24" />
      <path d="M 30 12 C 38 4 48 4 52 10 C 55 15 49 19 44 17" />
      <path d="M 30 36 C 38 44 48 44 52 38 C 55 33 49 29 44 31" />
      <path d="M 84 12 C 90 6 100 6 104 12 C 107 17 101 21 96 19" />
      <path d="M 84 36 C 90 42 100 42 104 36 C 107 31 101 27 96 29" />
      {/* Palmette leaves filling the middle, top and bottom. */}
      <g style={{ fill: 'var(--reader-ink)' }} stroke="none">
        <path d="M 44 12 C 40 5 40 1 44 0 C 48 2 49 8 44 12 Z" />
        <path d="M 44 36 C 40 43 40 47 44 48 C 48 46 49 40 44 36 Z" />
        <path d="M 66 10 C 62 4 63 0 67 0 C 71 2 71 8 66 10 Z" />
        <path d="M 66 38 C 62 44 63 48 67 48 C 71 46 71 40 66 38 Z" />
        <path d="M 84 14 C 88 8 90 5 93 6 C 94 11 90 15 84 14 Z" />
        <path d="M 84 34 C 88 40 90 43 93 42 C 94 37 90 33 84 34 Z" />
        <path d="M 24 8 C 21 3 22 0 25 0 C 28 2 28 7 24 8 Z" />
        <path d="M 24 40 C 21 45 22 48 25 48 C 28 46 28 41 24 40 Z" />
        <path d="M 102 8 C 99 3 100 0 103 0 C 106 2 106 7 102 8 Z" />
        <path d="M 102 40 C 99 45 100 48 103 48 C 106 46 106 41 102 40 Z" />
      </g>
      {/* Tendrils curling into the circle */}
      <path d="M 78 16 C 86 8 96 8 100 14" />
      <path d="M 78 32 C 86 40 96 40 100 34" />
      {/* Small dots filling the gaps */}
      <g style={{ fill: 'var(--reader-ink)' }} stroke="none">
        <circle cx="34" cy="24" r="2" />
        <circle cx="60" cy="24" r="2" />
        <circle cx="90" cy="24" r="1.6" />
        <circle cx="26" cy="16" r="1.5" />
        <circle cx="26" cy="32" r="1.5" />
        <circle cx="72" cy="16" r="1.5" />
        <circle cx="72" cy="32" r="1.5" />
        <circle cx="106" cy="24" r="1.4" />
      </g>
      {/* Empty white circle near the inner edge */}
      <circle cx="112" cy="24" r="15" style={{ fill: 'var(--reader-card)', stroke: 'var(--reader-ink)' }} strokeWidth="1.75" />
      <circle cx="112" cy="24" r="11.5" fill="none" style={{ stroke: 'var(--reader-ink)' }} strokeWidth="0.75" />
    </g>
  );
}
