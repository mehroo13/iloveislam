import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kids Islamic Games — Fun & Educational | I Love Islam",
  description:
    "Free Islamic games for kids! Memory match, prayer guide, Arabic letters, dua learning, and 5 pillars quiz. 100% free, no ads, no sign-up. Help your children learn about Islam through play.",
  keywords: [
    "Islamic games for kids",
    "kids Islamic learning",
    "Islamic memory game",
    "learn prayer for kids",
    "Arabic letters for kids",
    "Islamic quiz",
    "5 pillars of Islam game",
    "free Islamic games",
    "children Islamic education",
  ],
  openGraph: {
    title: "Kids Islamic Games — Fun & Educational | I Love Islam",
    description:
      "Free Islamic games for kids! Memory match, prayer guide, Arabic letters, and more. 100% free, no ads.",
    url: "https://www.iloveislam.life/kids",
    siteName: "I Love Islam",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kids Islamic Games — Fun & Educational | I Love Islam",
    description: "Free Islamic games for kids! Memory match, prayer guide, Arabic letters, and more.",
  },
};

export default function KidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}