// app/prayer-times/page.tsx — Server Component.
// Today's times + the full month are fetched server-side (ISR, 1h) so the
// page renders instantly with real data instead of a blank page waiting on
// geolocation + several client requests. The client component only re-fetches
// when the user changes city or calculation method.
import type { Metadata } from 'next';
import PrayerTimesClient from './PrayerTimesClient';
import {
  fetchTimingsByCity,
  fetchMonthByCity,
  DEFAULT_CITY,
  DEFAULT_COUNTRY,
  DEFAULT_METHOD,
} from '../lib/prayer';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Prayer Times — Accurate Salah Times for Any City | Hifz',
  description:
    'Accurate daily prayer times for any city worldwide — Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha with a live countdown to the next prayer, a 7-day schedule and a full monthly timetable. Muslim World League method by default, with 14 calculation methods to choose from.',
  keywords:
    'prayer times, salah times, fajr time, dhuhr time, asr time, maghrib time, isha time, islamic prayer times, muslim world league, prayer timetable',
  alternates: { canonical: 'https://www.iloveislam.life/prayer-times' },
  openGraph: {
    title: 'Prayer Times — Accurate Salah Times for Any City | Hifz',
    description:
      'Accurate daily prayer times for any city worldwide, with a live countdown to the next prayer and a full monthly timetable.',
    url: 'https://www.iloveislam.life/prayer-times',
    siteName: 'Hifz',
    type: 'website',
  },
};

export default async function PrayerTimesPage() {
  const now = new Date();
  let initialToday = null;
  let initialMonth: Awaited<ReturnType<typeof fetchMonthByCity>> = [];
  try {
    [initialToday, initialMonth] = await Promise.all([
      fetchTimingsByCity(DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_METHOD),
      fetchMonthByCity(DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_METHOD, now.getFullYear(), now.getMonth() + 1),
    ]);
  } catch {
    // Client component falls back to its own fetch if the server fetch fails.
  }

  return (
    <PrayerTimesClient
      initialToday={initialToday}
      initialMonth={initialMonth}
      initialCity={DEFAULT_CITY}
      initialCountry={DEFAULT_COUNTRY}
      initialMethod={DEFAULT_METHOD}
    />
  );
}
