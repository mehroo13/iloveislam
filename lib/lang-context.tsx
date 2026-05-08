'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ar' | 'ur';

interface LangContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
}

const translations: Record<Language, any> = {
  en: {
    siteName: "I Love Islam",
    tagline: "Free Islamic Tools for Every Muslim",
    badge: "FREE FOREVER",
    search: "Search tools...",
    found: "Found",
    results: "results",
    result: "result",
    noResults: "No results for",
    trySearching: "Try different keywords",
    clearSearch: "Clear Search",
    cats: {
      mostUsed: "Most Used",
      dailyPractice: "Daily Practice",
      finance: "Finance & Charity",
      travel: "Travel & Community",
    },
    footer: {
      bismillah: "بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم",
      bismillahTranslation: "In the name of Allah, the Most Gracious, the Most Merciful",
      blog: "Blog",
      about: "About",
      privacy: "Privacy Policy",
      copyright: "© 2026 I Love Islam. All rights reserved.",
    },
    mizan: {
      badge: "NEW",
      title: "Discover Your Islamic Life Blueprint",
      desc: "Take the Mizan Assessment",
      sub: "Know your strengths & spiritual goals",
      cta: "Start Free Assessment",
    },
  },
  ar: {
    siteName: "أحب الإسلام",
    tagline: "أدوات إسلامية مجانية لكل مسلم",
    badge: "مجاني إلى الأبد",
    search: "ابحث عن الأدوات...",
    footer: {
      bismillah: "بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم",
      bismillahTranslation: "بسم الله الرحمن الرحيم",
      blog: "المدونة",
      about: "عن الموقع",
      privacy: "سياسة الخصوصية",
    },
  },
  ur: {
    siteName: "I Love Islam",
    tagline: "ہر مسلمان کے لیے مفت اسلامی ٹولز",
    badge: "ہمیشہ مفت",
    search: "ٹولز تلاش کریں...",
    footer: {
      bismillah: "بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم",
      bismillahTranslation: "اللہ کے نام سے جو بہت مہربان نہایت رحم والا ہے",
      blog: "بلاگ",
      about: "ہمارے بارے میں",
      privacy: "رازداری کی پالیسی",
    },
  },
};

const LangContext = createContext<LangContextType | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  const t = translations[lang];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => {
  const context = useContext(LangContext);
  if (context === undefined) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
};

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', flag: '🇵🇰' },
] as const;