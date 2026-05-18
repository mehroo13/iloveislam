import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Night Recitation | I Love Islam",
  description:
    "Sleep peacefully with the soothing recitation of Surah Mulk, Surah Rahman, and Surah Ad-Duha. Set your repeat count, choose a combo, and drift into rest with the blessed words of the Quran.",
  keywords: [
    "Surah Mulk",
    "Surah Rahman",
    "Surah Duha",
    "Quran sleep",
    "Islamic sleep aid",
    "Quran recitation",
    "night Quran",
    "I Love Islam",
  ],
  openGraph: {
    title: "Night Recitation | I Love Islam",
    description:
      "Let the Quran bring peace to your night. Play Surah Mulk, Rahman, or Duha with auto-stop after your chosen repeats.",
    url: "https://www.iloveislam.life/night",
    siteName: "I Love Islam",
    type: "website",
  },
};

export default function NightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {children}
    </section>
  );
}