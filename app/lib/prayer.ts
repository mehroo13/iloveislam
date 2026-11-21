// app/lib/prayer.ts — ONE source of truth for prayer times across the site.
// Aladhan method IDs are fixed by the API: 1 = Karachi, 2 = ISNA,
// 3 = Muslim World League, 4 = Umm al-Qura, 5 = Egyptian. The old
// prayer-times page had these scrambled (it labelled id 1 as MWL), which
// made its times disagree with the homepage. Never duplicate this list.

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

export const PRAYER_METHODS = [
  { id: 3, label: 'Muslim World League' },
  { id: 2, label: 'ISNA (North America)' },
  { id: 4, label: 'Umm al-Qura (Makkah)' },
  { id: 5, label: 'Egyptian General Authority' },
  { id: 1, label: 'Univ. of Islamic Sciences, Karachi' },
  { id: 15, label: 'Diyanet (Turkey)' },
  { id: 11, label: 'Majlis Ugama Islam Singapura' },
  { id: 7, label: 'Shia Ithna-Ashari (Jafari)' },
  { id: 8, label: 'Gulf Region' },
  { id: 9, label: 'Kuwait' },
  { id: 10, label: 'Qatar' },
  { id: 12, label: 'France (UOIF)' },
  { id: 13, label: 'Turkey (Diyanet Alt)' },
  { id: 14, label: 'Spiritual Admin. of Muslims, Russia' },
] as const;

export const DEFAULT_METHOD = 3; // Muslim World League — site-wide default.
export const DEFAULT_CITY = 'Sydney';
export const DEFAULT_COUNTRY = 'Australia';

export const CITY_KEY = 'ili_city';
export const METHOD_KEY = 'ili_prayer_method';
export const COORDS_KEY = 'ili_prayer_coords';

export const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export const ALL_PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export function methodLabel(id: number): string {
  return PRAYER_METHODS.find((m) => m.id === id)?.label ?? 'Muslim World League';
}

export function isValidMethod(id: number): boolean {
  return PRAYER_METHODS.some((m) => m.id === id);
}

/** Aladhan returns times like "05:12 (AEST)" — strip the zone suffix. */
export function cleanTime(t: string): string {
  return t.split(' ')[0];
}

export function formatPrayerTime(t: string): string {
  const [h, m] = cleanTime(t).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return cleanTime(t);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

function parseTimeToDate(timeStr: string, base: Date): Date | null {
  const [h, m] = cleanTime(timeStr).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export function nextPrayer(
  timings: PrayerTimings,
  now: Date,
): { name: (typeof PRAYER_ORDER)[number]; time: Date; tomorrow: boolean } | null {
  for (const name of PRAYER_ORDER) {
    const d = parseTimeToDate(timings[name], now);
    if (d && d.getTime() > now.getTime()) return { name, time: d, tomorrow: false };
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = parseTimeToDate(timings.Fajr, tomorrow);
  return d ? { name: 'Fajr', time: d, tomorrow: true } : null;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export interface AladhanDay {
  timings: PrayerTimings;
  hijri: string;
  gregorian: string;
}

const ALADHAN = 'https://api.aladhan.com/v1';

/** Fetch one day of timings by city. Server-safe (pass `revalidate` for ISR). */
export async function fetchTimingsByCity(
  city: string,
  country: string,
  method: number,
  revalidateSeconds = 3600,
): Promise<AladhanDay | null> {
  try {
    const res = await fetch(
      `${ALADHAN}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`,
      { next: { revalidate: revalidateSeconds } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const t = data?.data?.timings;
    const h = data?.data?.date?.hijri;
    const g = data?.data?.date?.gregorian;
    if (!t?.Fajr || !t?.Dhuhr || !t?.Asr || !t?.Maghrib || !t?.Isha) return null;
    return {
      timings: {
        Fajr: String(t.Fajr),
        Sunrise: t.Sunrise ? String(t.Sunrise) : '',
        Dhuhr: String(t.Dhuhr),
        Asr: String(t.Asr),
        Maghrib: String(t.Maghrib),
        Isha: String(t.Isha),
      },
      hijri: h?.day && h?.month?.en && h?.year ? `${h.day} ${h.month.en} ${h.year} AH` : '',
      gregorian: g?.date ?? '',
    };
  } catch {
    return null;
  }
}

export interface MonthDay {
  date: string;
  weekday: string;
  timings: PrayerTimings;
  hijri: string;
}

/** Fetch a full Hijri/Gregorian month of timings by city (one request). */
export async function fetchMonthByCity(
  city: string,
  country: string,
  method: number,
  year: number,
  month: number,
  revalidateSeconds = 3600,
): Promise<MonthDay[]> {
  try {
    const res = await fetch(
      `${ALADHAN}/calendarByCity/${year}/${month}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`,
      { next: { revalidate: revalidateSeconds } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.data)) return [];
    return data.data.map((d: { timings?: Record<string, string>; date?: { gregorian?: { weekday?: { en?: string }; date?: string }; hijri?: { day?: string; month?: { en?: string }; year?: string } } }) => ({
      date: d.date?.gregorian?.date ?? '',
      weekday: d.date?.gregorian?.weekday?.en ?? '',
      timings: {
        Fajr: String(d.timings?.Fajr ?? ''),
        Sunrise: String(d.timings?.Sunrise ?? ''),
        Dhuhr: String(d.timings?.Dhuhr ?? ''),
        Asr: String(d.timings?.Asr ?? ''),
        Maghrib: String(d.timings?.Maghrib ?? ''),
        Isha: String(d.timings?.Isha ?? ''),
      },
      hijri: d.date?.hijri ? `${d.date.hijri.day} ${d.date.hijri.month?.en} ${d.date.hijri.year}` : '',
    }));
  } catch {
    return [];
  }
}
