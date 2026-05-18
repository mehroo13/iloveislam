import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Islamic Alarm & Night Companion | I Love Islam",
  description:
    "Beautiful Islamic alarm with Fajr & Tahajjud wake-up, night Quran sleep player, duas, dhikr, and Sunnah sleep/wake checklists.",
};

export default function IslamicAlarmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}