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
import { rightsOfParentsArticle } from './rights-of-parents';
import { fivePillarsArticle } from './five-pillars-of-islam';
import { mosqueEtiquetteArticle } from './mosque-etiquette';
import { nightRecitationArticle } from './night-recitation-tool';
import { laylatulQadrArticle } from './laylatul-qadr';
import { islamWorldReligionsComparisonToolArticle } from './islam-world-religions-comparison-tool';
import { tahajjudArticle } from './tahajjud-prayer';
import { islamicNewYearArticle } from './islamic-new-year-muharram';
import { halalScannerArticle } from './halal-scanner-guide';
import { readingFoodLabelsArticle } from './reading-food-labels';
import { halalTravelEssentialsArticle } from './halal-travel-essentials';
import { ninetyNineNamesComplete } from './99-names-of-allah-complete';
import { islamicDuasCollection } from './islamic-duas-collection';
import { halalFoodIngredientsGuide } from './halal-food-ingredients-guide';
import { hijriCalendar2026 } from './hijri-calendar-2026';
import { ramadan2027Dates } from './ramadan-2027-dates';
import { islamicGamesForKids } from './islamic-games-for-kids';
import { prayerTimesGuide } from './prayer-times-guide';
import { zakatNisab2026 } from './zakat-nisab-2026';
import { whatIsHalal } from './what-is-halal';
import { morningDuaGuide } from './morning-dua';
import { duaBeforeSleeping } from './dua-before-sleeping';
import { islamicNewYear2026 } from './islamic-new-year-2026';
import { halalENumbersList } from './halal-e-numbers-list';
import { howToPerformHajj } from './how-to-perform-hajj';
import { zakatOnGold } from './zakat-on-gold';
import { laylatulQadr2027 } from './laylatul-qadr-2027';
import { islamicBabyNames } from './islamic-baby-names';
import { duaForAnxiety } from './dua-for-anxiety';
import { howToCalculateZakatGuide } from './how-to-calculate-zakat-guide';
import { qiblaDirectionGuide } from './qibla-direction-guide';

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
  rightsOfParentsArticle,
  fivePillarsArticle,
  mosqueEtiquetteArticle,
  nightRecitationArticle,
  laylatulQadrArticle,
  islamWorldReligionsComparisonToolArticle,
  tahajjudArticle,
  islamicNewYearArticle,
  readingFoodLabelsArticle,
  halalTravelEssentialsArticle,
  halalScannerArticle,
  ninetyNineNamesComplete,
  islamicDuasCollection,
  halalFoodIngredientsGuide,
  hijriCalendar2026,
  ramadan2027Dates,
  islamicGamesForKids,
  prayerTimesGuide,
  zakatNisab2026,
  whatIsHalal,
  morningDuaGuide,
  duaBeforeSleeping,
  islamicNewYear2026,
  halalENumbersList,
  howToPerformHajj,
  zakatOnGold,
  laylatulQadr2027,
  islamicBabyNames,
  duaForAnxiety,
  howToCalculateZakatGuide,
  qiblaDirectionGuide,
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