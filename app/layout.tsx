import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a3d2e",
};

export const metadata: Metadata = {
  title: {
    default: "I Love Islam — Free Islamic Tools | Zakat, Prayer Times, Quran & More",
    template: "%s | I Love Islam",
  },
  description:
    "Free Islamic tools for every Muslim. Calculate Zakat, find Prayer Times, locate Qibla, read the Quran, convert Hijri dates, use Dhikr counter and 20+ more free tools. No sign-up needed.",
  keywords: [
    "zakat calculator", "prayer times", "qibla finder", "quran reader online",
    "hijri calendar converter", "dhikr counter", "99 names of allah",
    "islamic tools", "free muslim tools", "salah times", "islamic date today",
    "halal food finder", "mosque finder", "ramadan planner",
    "islamic inheritance calculator", "kaffarah calculator",
    "mizan islamic destiny", "islamic will", "sadaqah tracker",
    "halal finance", "islamic name finder", "dua generator",
    "زكاة", "أوقات الصلاة", "القرآن الكريم",
    "زکوٰۃ کیلکولیٹر", "نماز کے اوقات",
  ],
  authors: [{ name: "I Love Islam", url: "https://www.iloveislam.life" }],
  creator: "I Love Islam",
  publisher: "I Love Islam",
  metadataBase: new URL("https://www.iloveislam.life"),
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      ar: "/ar",
      ur: "/ur",
      fr: "/fr",
      tr: "/tr",
      id: "/id",
      ms: "/ms",
      bn: "/bn",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.iloveislam.life",
    siteName: "I Love Islam",
    title: "I Love Islam — Free Islamic Tools for Every Muslim",
    description:
      "Calculate Zakat, find Prayer Times, locate Qibla, read Quran, convert Hijri dates and 20+ more free Islamic tools. No sign-up needed.",
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
      "Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Kaffarah Calculator and 20+ more free Islamic tools.",
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
    google: "S6Q7IIFvzrp0iRkQqkMmJm7EV4IPTZlrAAMmd66qN1I",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "I Love Islam",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2264561932019289"
          crossOrigin="anonymous"
        />

        <link rel="canonical" href="https://www.iloveislam.life" />

        {/* PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="I Love Islam" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="I Love Islam" />
        <meta name="msapplication-TileColor" content="#0a3d2e" />
        <meta name="msapplication-TileImage" content="/icon-144.png" />

        {/* Icons */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "I Love Islam",
              url: "https://www.iloveislam.life",
              description:
                "Free Islamic tools for every Muslim — Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader and 20+ more tools.",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://www.iloveislam.life/?search={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "I Love Islam",
              url: "https://www.iloveislam.life",
              logo: "https://www.iloveislam.life/icon-512.png",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                url: "https://www.iloveislam.life/contact",
              },
            }),
          }}
        />
      </head>

      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {children}
      </body>
    </html>
  );
}