// app/blog/content/index.ts
import { zakatArticle } from './zakat';
import { mizanArticle } from './mizan';
import { qiblaArticle } from './qibla';
import { prayerTimesArticle } from './prayer-times';
import { hijriCalendarArticle } from './hijri-calendar';
import { ninetyNineNamesArticle } from './99-names-allah';
import { ramadanPreparationArticle } from './ramadan-preparation';
import { halalTravelArticle } from './halal-travel';
import { wuduArticle } from './wudu-ablution';
import { dhikrGuideArticle } from './dhikr-guide';
import { duaGuideArticle } from './how-to-make-dua';
import { quranBeginnersGuideArticle } from './quran-beginners-guide';
import { sadaqahArticle } from './sadaqah-guide';
import { hajjArticle } from './hajj-guide';
import { umrahArticle } from './umrah-guide';
import { inheritanceArticle } from './islamic-inheritance';
import { islamicWillArticle } from './islamic-will-guide';
import { halalFinanceArticle } from './halal-finance-riba';
import { kaffarahArticle } from './kaffarah-guide';
import { eidArticle } from './eid-guide';
import { mosqueFinderArticle } from './mosque-finder-guide';
import { hadithArticle } from './hadith-guide';
import { islamicNamesArticle } from './islamic-names-guide';
import { teachingChildrenArticle } from './teaching-children-islam';
import { fivePillarsArticle } from './five-pillars-of-islam';
import { mosqueEtiquetteArticle } from './mosque-etiquette';
import { nightRecitationArticle } from './night-recitation-tool';
import { laylatulQadrArticle } from './laylatul-qadr';
import { tahajjudArticle } from './tahajjud-prayer';
import { islamicNewYearArticle } from './islamic-new-year-muharram';
import { halalScannerArticle } from './halal-scanner-guide';

// ==================== ARTICLE TYPE ====================
export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  emoji: string;
  readTime: string;
  date: string;
  content: string;
}

// ==================== ALL ARTICLES ====================
export const allArticles: BlogArticle[] = [
  zakatArticle,
  mizanArticle,
  qiblaArticle,
  prayerTimesArticle,
  hijriCalendarArticle,
  ninetyNineNamesArticle,
  ramadanPreparationArticle,
  halalTravelArticle,
  wuduArticle,
  dhikrGuideArticle,
  duaGuideArticle,
  quranBeginnersGuideArticle,
  sadaqahArticle,
  hajjArticle,
  umrahArticle,
  inheritanceArticle,
  islamicWillArticle,
  halalFinanceArticle,
  kaffarahArticle,
  eidArticle,
  mosqueFinderArticle,
  hadithArticle,
  islamicNamesArticle,
  teachingChildrenArticle,
  fivePillarsArticle,
  mosqueEtiquetteArticle,
  nightRecitationArticle,
  laylatulQadrArticle,
  tahajjudArticle,
  islamicNewYearArticle,
  halalScannerArticle,
];

// ==================== ARTICLE MAP ====================
export const articlesMap: Record<string, BlogArticle> = {};

for (const article of allArticles) {
  articlesMap[article.slug] = article;
}

// Optional: Helper function
export const getArticleBySlug = (slug: string): BlogArticle | undefined => {
  return articlesMap[slug];
};

export const getRelatedArticles = (currentSlug: string, limit = 3): BlogArticle[] => {
  return allArticles
    .filter(a => a.slug !== currentSlug)
    .sort(() => 0.5 - Math.random())
    .slice(0, limit);
};