// app/components/ToolIcon.tsx — one consistent line-icon set for the whole site.
// World-class sites never use emoji as UI icons. Every icon here is inline SVG
// (stroke, currentColor) so it inherits text colour and never depends on a CDN.
// Usage: <ToolIcon name="quran" className="h-5 w-5" />

import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  // Open hands raised in dua.
  dua: (
    <>
      <path d="M11 11V5.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 10.5V6.5a1.5 1.5 0 0 1 3 0V13a5 5 0 0 1-5 5h-.5a5 5 0 0 1-4-2L5 13.5A2 2 0 0 1 8 10.8l1.2 1.2" />
      <path d="M8 11V7.5a1.5 1.5 0 0 1 3 0" />
    </>
  ),
  // Open book.
  quran: (
    <>
      <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
    </>
  ),
  // Clock.
  prayer: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  // Compass.
  qibla: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z" />
    </>
  ),
  // Calculator.
  zakat: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </>
  ),
  // Tasbih beads — a loop of dots with a tassel.
  dhikr: (
    <>
      <circle cx="12" cy="6" r="1.1" />
      <circle cx="17" cy="9" r="1.1" />
      <circle cx="17.5" cy="14.5" r="1.1" />
      <circle cx="13.5" cy="18" r="1.1" />
      <circle cx="8.5" cy="17" r="1.1" />
      <circle cx="6" cy="12.5" r="1.1" />
      <circle cx="7.5" cy="8" r="1.1" />
      <path d="M12 19.5v2.5" />
    </>
  ),
  // Star.
  names: (
    <path d="M12 2.5 14.9 8.7l6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z" />
  ),
  // Magnifier over a book line.
  hadith: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8 11h6" />
    </>
  ),
  // Crescent moon.
  moon: <path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a7 7 0 0 0 10 10Z" />,
  // Moon + star (night).
  night: (
    <>
      <path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a7 7 0 0 0 10 10Z" />
      <path d="M18 3.5l.6 1.6 1.6.6-1.6.6L18 7.9l-.6-1.6-1.6-.6 1.6-.6z" />
    </>
  ),
  // Scales of justice.
  inheritance: (
    <>
      <path d="M12 3v18M8 21h8" />
      <path d="M5 7h14" />
      <path d="M7 7 4 13a3 3 0 0 0 6 0L7 7z" />
      <path d="M17 7l-3 6a3 3 0 0 0 6 0l-3-6z" />
    </>
  ),
  // Heart.
  sadaqah: (
    <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
  ),
  // Check inside a circle.
  finance: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
    </>
  ),
  // Clipboard.
  kaffarah: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  // Kaaba — cube.
  hajj: (
    <>
      <path d="M12 2.5 21 7.5v9l-9 5-9-5v-9z" />
      <path d="m3 7.5 9 5 9-5M12 12.5v9" />
    </>
  ),
  // Globe.
  travel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.8 2.6 4 5.7 4 9s-1.2 6.4-4 9c-2.8-2.6-4-5.7-4-9s1.2-6.4 4-9Z" />
    </>
  ),
  // Pen.
  namesFinder: (
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
  ),
  // Four-point sparkle.
  sparkle: (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </>
  ),
  // Mosque — dome, minarets, arch.
  mosque: (
    <>
      <path d="M12 3c2.6 1.8 4.5 4 4.5 6.5h-9C7.5 7 9.4 4.8 12 3Z" />
      <path d="M5 9.5h14" />
      <path d="M6.5 9.5V19M17.5 9.5V19" />
      <path d="M10 19v-4a2 2 0 0 1 4 0v4" />
      <path d="M3 21h18" />
      <path d="M4 9.5 3 13M20 9.5l1 3.5" />
    </>
  ),
  // Sun.
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  // Sunrise.
  dawn: (
    <>
      <path d="M17 18a5 5 0 0 0-10 0" />
      <path d="M12 3v5M12 8l-2-2M12 8l2-2" />
      <path d="M4.5 15.5 6 13.5M19.5 15.5 18 13.5" />
      <path d="M2 21h20" />
    </>
  ),
  // Sunset.
  sunset: (
    <>
      <path d="M17 18a5 5 0 0 0-10 0" />
      <path d="M12 8V3M12 3l-2 2M12 3l2 2" />
      <path d="M4.5 15.5 6 13.5M19.5 15.5 18 13.5" />
      <path d="M2 21h20" />
    </>
  ),
  // Cloud with sun.
  afternoon: (
    <>
      <path d="M17.5 18a4 4 0 0 0 .4-7.98 6 6 0 0 0-11.7 1.5A3.5 3.5 0 0 0 7 18z" />
      <path d="M16.5 3.5 17 5l1.5.5L17 6l-.5 1.5L16 6l-1.5-.5L16 5z" />
    </>
  ),
  // Location pin.
  pin: (
    <>
      <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  // Gear.
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.7M12 18.5v2.7M2.8 12h2.7M18.5 12h2.7M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M18.5 5.5l-1.9 1.9M7.4 16.6l-1.9 1.9" />
    </>
  ),
  // Search.
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  // Calendar.
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  // Check.
  check: <path d="m4.5 12.5 5 5L19.5 7" />,
  // Chevron down.
  chevronDown: <path d="m6 9 6 6 6-6" />,
  // Menu.
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  // Close.
  close: <path d="M6 6l12 12M18 6 6 18" />,
  // Bookmark.
  bookmark: <path d="M6.5 3.5h11V21L12 17l-5.5 4z" />,
  // Play.
  play: <path d="M7 4.5v15l12-7.5z" />,
  // Share / arrow up-right.
  share: (
    <>
      <path d="M12 20V7M12 7 7 12M12 7l5 5" />
      <path d="M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7" />
    </>
  ),
  // Headphones (audio).
  audio: (
    <>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <rect x="3" y="13" width="4" height="7" rx="1.5" />
      <rect x="17" y="13" width="4" height="7" rx="1.5" />
    </>
  ),
};

export default function ToolIcon({
  name,
  className = 'h-5 w-5',
}: {
  name: string;
  className?: string;
}) {
  const paths = PATHS[name] ?? PATHS.sparkle;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
