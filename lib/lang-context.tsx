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
    tagline: "The complete toolkit for every Muslim — 20 free tools in one place",
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
      finance: "Finance & Giving",
      travel: "Travel & Knowledge",
    },

    mizan: {
      badge: "NEW",
      title: "Mizan — Your Islamic Life Blueprint",
      desc: "Discover your personality, life purpose & spiritual path",
      sub: "Based on Abjad numerology • 99 Names of Allah • Quranic guidance",
      cta: "Discover Yours →",
    },

    footer: {
      bismillah: "بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم",
      bismillahTranslation: "In the name of Allah, the Most Gracious, the Most Merciful",
      blog: "Blog",
      about: "About",
      privacy: "Privacy Policy",
      copyright: "© 2026 I Love Islam. All rights reserved.",
    },
  },

  ar: {
    siteName: "أحب الإسلام",
    tagline: "مجموعة كاملة من الأدوات الإسلامية — 20 أداة مجانية في مكان واحد",
    badge: "مجاني إلى الأبد",
    search: "ابحث عن الأدوات...",
    mizan: {
      badge: "جديد",
      title: "ميزان — مخطط حياتك الإسلامية",
      desc: "اكتشف شخصيتك وهدف حياتك والطريق الروحي",
      cta: "اكتشف الآن →",
    },
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
    tagline: "ہر مسلمان کے لیے مکمل ٹول کٹ — ایک جگہ پر 20 مفت ٹولز",
    badge: "ہمیشہ مفت",
    search: "ٹولز تلاش کریں...",
    mizan: {
      badge: "نیا",
      title: "میزان — آپ کا اسلامی لائف بلیو پرنٹ",
      desc: "اپنی شخصیت، زندگی کے مقصد اور روحانی راستہ دریافت کریں",
      cta: "ابھی دریافت کریں →",
    },
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

  const t = translations[lang] || translations.en;

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
  { code: 'ar', label: 'Arabic',  nativeLabel: 'العربية', flag: '🇸🇦' },
  { code: 'ur', label: 'Urdu',    nativeLabel: 'اردو', flag: '🇵🇰' },
] as const;