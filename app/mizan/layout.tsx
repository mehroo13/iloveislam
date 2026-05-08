import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "I Love Islam — Free Islamic Tools | Zakat, Prayer Times, Quran & More",
    template: "%s | I Love Islam",
  },
  description:
    "Free Islamic tools for every Muslim. Calculate Zakat, find Prayer Times, locate Qibla, read the Quran, convert Hijri dates, use Dhikr counter and 15+ more free tools. No sign-up needed.",
  keywords: [
    "zakat calculator",
    "prayer times",
    "qibla finder",
    "quran reader online",
    "hijri calendar converter",
    "dhikr counter",
    "99 names of allah",
    "islamic tools",
    "free muslim tools",
    "salah times",
    "islamic date today",
    "halal food finder",
    "mosque finder",
    "ramadan planner",
    "islamic inheritance calculator",
    "mizan islamic destiny",
  ],
  authors: [{ name: "I Love Islam", url: "https://www.iloveislam.life" }],
  creator: "I Love Islam",
  publisher: "I Love Islam",
  metadataBase: new URL("https://www.iloveislam.life"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.iloveislam.life",
    siteName: "I Love Islam",
    title: "I Love Islam — Free Islamic Tools for Every Muslim",
    description:
      "Calculate Zakat, find Prayer Times, locate Qibla, read Quran, convert Hijri dates and 15+ more free Islamic tools. No sign-up needed.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "I Love Islam — Free Islamic Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "I Love Islam — Free Islamic Tools for Every Muslim",
    description:
      "Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader and 15+ more free Islamic tools.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "add-your-google-search-console-code-here",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <link rel="canonical" href="https://www.iloveislam.life" />
        <meta name="theme-color" content="#0a3d2e" />
        <link rel="icon" href="/favicon.ico" />
        {/* Structured Data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "I Love Islam",
              url: "https://www.iloveislam.life",
              description:
                "Free Islamic tools for every Muslim — Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader and more.",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://www.iloveislam.life/?search={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
