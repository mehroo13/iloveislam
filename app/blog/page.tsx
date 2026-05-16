'use client';

import Link from 'next/link';
import { useState } from 'react';
import Head from 'next/head';

export const ARTICLES = [
  // ── existing 8 ──────────────────────────────────────────────────────────
  {
    slug: 'how-to-calculate-zakat',
    title: 'How to Calculate Zakat: A Complete Step-by-Step Guide',
    excerpt: 'Zakat is one of the Five Pillars of Islam. Learn exactly how to calculate your annual Zakat, understand the Nisab threshold, and what assets are included.',
    category: 'Finance',
    emoji: '💰',
    readTime: '5 min read',
    date: '2025-06-01',
    seoTitle: 'How to Calculate Zakat: Complete Guide with Examples | I Love Islam',
    seoDescription: 'Learn how to calculate Zakat correctly with our step-by-step guide. Includes Nisab calculation, gold/silver values, and common mistakes to avoid.',
    keywords: 'zakat calculation, islamic finance, nisab, zakat on gold, zakat on savings',
  },
  {
    slug: 'what-is-mizan-islamic-blueprint',
    title: 'What is the Mizan Islamic Life Blueprint?',
    excerpt: 'Discover how the Mizan tool uses the ancient Abjad numerology system, the 99 Names of Allah, and Quranic guidance to reveal your Islamic archetype and life purpose.',
    category: 'Self-Discovery',
    emoji: '✦',
    readTime: '4 min read',
    date: '2025-06-03',
    seoTitle: 'Mizan Islamic Life Blueprint: Discover Your Spiritual Archetype',
    seoDescription: 'Discover your Islamic archetype with the Mizan tool. Based on Quranic guidance and your birth date, find your life purpose and spiritual path.',
    keywords: 'mizan islamic blueprint, abjad numerology, islamic archetype, life purpose islam',
  },
  {
    slug: 'qibla-direction-guide',
    title: 'How to Find the Qibla Direction Anywhere in the World',
    excerpt: 'The Qibla is the direction Muslims face during Salah. Learn how to find it accurately using our free Qibla Finder tool, and understand the calculation behind it.',
    category: 'Prayer',
    emoji: '🧭',
    readTime: '3 min read',
    date: '2025-06-05',
    seoTitle: 'Find Qibla Direction: Complete Guide & Online Compass Tool',
    seoDescription: 'Find accurate Qibla direction from any location worldwide. Use our free online Qibla compass tool or learn the calculation formula.',
    keywords: 'qibla direction, find qibla, qibla compass, mecca direction, prayer direction',
  },
  {
    slug: 'prayer-times-guide',
    title: 'Understanding Islamic Prayer Times: Fajr, Dhuhr, Asr, Maghrib & Isha',
    excerpt: 'A complete guide to the five daily prayers — what they are, when they occur, and how to find accurate prayer times for your city anywhere in the world.',
    category: 'Prayer',
    emoji: '🕐',
    readTime: '6 min read',
    date: '2025-06-07',
    seoTitle: 'Islamic Prayer Times: Complete Guide to 5 Daily Prayers',
    seoDescription: 'Learn about Fajr, Dhuhr, Asr, Maghrib, and Isha prayer times. Understand calculation methods and how to find accurate prayer times for your location.',
    keywords: 'prayer times, salah times, islamic prayer, fajr time, dhuhr time, asr time',
  },
  {
    slug: 'hijri-calendar-explained',
    title: 'The Islamic Hijri Calendar Explained — And How to Convert Dates',
    excerpt: 'The Hijri calendar is the Islamic lunar calendar used to determine dates of Islamic events. Learn how it works and how to convert between Hijri and Gregorian dates.',
    category: 'Knowledge',
    emoji: '🌙',
    readTime: '4 min read',
    date: '2025-06-09',
    seoTitle: 'Islamic Hijri Calendar: Complete Guide with Date Converter',
    seoDescription: 'Understand the Islamic lunar calendar (Hijri). Learn how to convert between Hijri and Gregorian dates and find important Islamic dates.',
    keywords: 'hijri calendar, islamic calendar, lunar calendar, hijri to gregorian, islamic months',
  },
  {
    slug: '99-names-of-allah-guide',
    title: 'The 99 Names of Allah (Asma ul Husna) — Meanings & Benefits',
    excerpt: 'Allah has 99 beautiful names, each reflecting a divine attribute. Learn about all 99 names, their meanings, and the spiritual benefits of reciting them.',
    category: 'Knowledge',
    emoji: '⭐',
    readTime: '8 min read',
    date: '2025-06-11',
    seoTitle: '99 Names of Allah (Asma ul Husna): Meanings, Benefits & List',
    seoDescription: 'Complete guide to the 99 Names of Allah. Learn each name, its meaning, translation, and the spiritual benefits of reciting Asma ul Husna.',
    keywords: '99 names of allah, asma ul husna, allah names, islamic names, beautiful names of allah',
  },
  {
    slug: 'ramadan-preparation-guide',
    title: 'How to Prepare for Ramadan: A Complete Muslim Guide',
    excerpt: 'Ramadan is the holiest month in Islam. Learn how to prepare spiritually, physically, and practically for the blessed month of fasting and worship.',
    category: 'Ramadan',
    emoji: '🌙',
    readTime: '7 min read',
    date: '2025-06-13',
    seoTitle: 'Ramadan Preparation Guide: Spiritual & Practical Tips',
    seoDescription: 'Prepare for Ramadan with our complete guide. Learn about spiritual preparation, meal planning, worship goals, and maximizing blessings in the holy month.',
    keywords: 'ramadan preparation, ramadan guide, fasting in ramadan, ramadan tips, islamic fasting',
  },
  {
    slug: 'halal-travel-tips',
    title: "10 Essential Tips for Halal Travel — A Muslim Traveller's Guide",
    excerpt: 'Travelling as a Muslim comes with unique considerations. From finding halal food to maintaining prayer schedules — here is everything you need to know.',
    category: 'Travel',
    emoji: '🌍',
    readTime: '5 min read',
    date: '2025-06-15',
    seoTitle: 'Halal Travel Tips: 10 Essential Tips for Muslim Travellers',
    seoDescription: 'Essential halal travel tips for Muslim travellers. Find halal food, locate prayer rooms, maintain your worship routine, and travel with confidence.',
    keywords: 'halal travel, muslim travel, islamic travel, halal food travel, muslim friendly destinations',
  },

  // ── new articles ─────────────────────────────────────────────────────────
  {
    slug: 'how-to-perform-wudu',
    title: 'How to Perform Wudu (Ablution): Step-by-Step with Duas',
    excerpt: 'Wudu is the ritual purification required before Salah. Learn the correct steps, the Fard and Sunnah acts, and the duas to recite throughout.',
    category: 'Prayer',
    emoji: '💧',
    readTime: '5 min read',
    date: '2025-06-17',
    seoTitle: 'How to Perform Wudu: Complete Step-by-Step Guide with Duas',
    seoDescription: 'Learn how to perform Wudu correctly with our step-by-step guide. Includes Fard acts, Sunnah acts, common mistakes, and duas for each step.',
    keywords: 'how to perform wudu, wudu steps, ablution islam, wudu dua, purification islam',
  },
  {
    slug: 'dhikr-guide-benefits',
    title: 'The Complete Guide to Dhikr — Remembrance of Allah',
    excerpt: 'Dhikr (remembrance of Allah) is the heart of Islamic worship. Learn the most important adhkar, their virtues, and how to build a daily dhikr routine.',
    category: 'Worship',
    emoji: '📿',
    readTime: '6 min read',
    date: '2025-06-19',
    seoTitle: 'Dhikr Guide: Best Adhkar, Benefits & Daily Routine | I Love Islam',
    seoDescription: 'Complete guide to Dhikr in Islam. Learn the most virtuous adhkar, Subhanallah, Alhamdulillah, Allahu Akbar, and how to build a daily remembrance routine.',
    keywords: 'dhikr guide, adhkar islam, remembrance allah, subhanallah benefits, tasbih guide',
  },
  {
    slug: 'how-to-make-dua',
    title: 'How to Make Dua: The Islamic Guide to Supplication',
    excerpt: 'Dua is your direct connection to Allah. Learn the etiquettes, best times, and conditions for dua that the Prophet ﷺ taught us to maximise acceptance.',
    category: 'Worship',
    emoji: '🤲',
    readTime: '6 min read',
    date: '2025-06-21',
    seoTitle: 'How to Make Dua: Complete Guide to Islamic Supplication',
    seoDescription: 'Learn how to make dua correctly. Discover the best times for dua, proper etiquette, powerful duas from the Quran and Sunnah, and conditions for acceptance.',
    keywords: 'how to make dua, dua etiquette, best time for dua, dua acceptance, islamic supplication',
  },
  {
    slug: 'quran-reading-guide',
    title: "Beginner's Guide to Reading the Quran: Where to Start",
    excerpt: 'Starting to read the Quran can feel overwhelming. This guide helps beginners understand how to approach the Quran, which Surahs to start with, and how to build a daily habit.',
    category: 'Quran',
    emoji: '📖',
    readTime: '6 min read',
    date: '2025-06-23',
    seoTitle: "Beginner's Guide to Reading the Quran: How to Start",
    seoDescription: 'New to reading the Quran? Learn which Surahs to start with, how to read with Tajweed, and how to build a consistent Quran reading habit.',
    keywords: 'how to read quran, quran for beginners, quran reading guide, start reading quran, quran habit',
  },
  {
    slug: 'what-is-sadaqah',
    title: 'What is Sadaqah? Types, Benefits & How to Give Charity in Islam',
    excerpt: 'Sadaqah means voluntary charity in Islam. Learn the difference between Sadaqah and Zakat, the types of Sadaqah, and why even a smile counts as charity.',
    category: 'Finance',
    emoji: '💝',
    readTime: '5 min read',
    date: '2025-06-25',
    seoTitle: 'What is Sadaqah? Islamic Charity Guide — Types & Benefits',
    seoDescription: 'Learn about Sadaqah (Islamic charity). Understand the difference between Sadaqah and Zakat, types of charitable giving, and the rewards in Islam.',
    keywords: 'what is sadaqah, sadaqah benefits, islamic charity, sadaqah jariyah, charity in islam',
  },
  {
    slug: 'hajj-guide-beginners',
    title: 'Hajj Explained: A Beginner\'s Complete Guide to the Pilgrimage',
    excerpt: 'Hajj is the fifth Pillar of Islam — a once-in-a-lifetime pilgrimage to Mecca. Learn the rituals, pillars, days, and spiritual significance of Hajj.',
    category: 'Hajj & Umrah',
    emoji: '🕋',
    readTime: '9 min read',
    date: '2025-06-27',
    seoTitle: 'Hajj Guide for Beginners: Rituals, Pillars & How to Prepare',
    seoDescription: 'Complete beginner\'s guide to Hajj. Learn the pillars of Hajj, the five days of rituals, what to pack, and how to prepare spiritually and practically.',
    keywords: 'hajj guide, hajj rituals, pillars of hajj, how to perform hajj, hajj for beginners',
  },
  {
    slug: 'umrah-step-by-step',
    title: 'How to Perform Umrah: A Step-by-Step Guide',
    excerpt: 'Umrah is the lesser pilgrimage that can be performed at any time of year. Learn the four essential steps — Ihram, Tawaf, Sa\'i, and Halq/Taqsir.',
    category: 'Hajj & Umrah',
    emoji: '🕌',
    readTime: '7 min read',
    date: '2025-06-29',
    seoTitle: 'How to Perform Umrah: Complete Step-by-Step Guide',
    seoDescription: 'Step-by-step guide to performing Umrah. Learn the rituals of Ihram, Tawaf, Sa\'i, and Halq with duas and practical tips for first-timers.',
    keywords: 'how to perform umrah, umrah guide, umrah steps, umrah rituals, umrah for beginners',
  },
  {
    slug: 'islamic-inheritance-guide',
    title: 'Islamic Inheritance (Mirath): Rules & How to Calculate Shares',
    excerpt: 'Islam has a detailed and just system of inheritance. Learn the Quranic rules of Mirath, who inherits what, and how to use our free calculator.',
    category: 'Finance',
    emoji: '📜',
    readTime: '7 min read',
    date: '2025-07-01',
    seoTitle: 'Islamic Inheritance (Mirath): Rules, Shares & Calculator',
    seoDescription: 'Learn Islamic inheritance laws (Mirath/Faraid). Understand Quranic rules on who inherits, their shares, and use our free inheritance calculator.',
    keywords: 'islamic inheritance, mirath, faraid, inheritance in islam, islamic will, estate distribution',
  },
  {
    slug: 'writing-islamic-will',
    title: 'Why Every Muslim Needs a Will — And How to Write One',
    excerpt: 'Writing a Will (Wasiyyah) is an Islamic obligation. Learn the Islamic rules of will-writing, what you can and cannot include, and how to get started today.',
    category: 'Finance',
    emoji: '📋',
    readTime: '5 min read',
    date: '2025-07-03',
    seoTitle: 'Islamic Will (Wasiyyah): Why You Need One & How to Write It',
    seoDescription: 'Learn why every Muslim needs an Islamic will (Wasiyyah). Understand the rules, what can be included, and use our free Islamic will tool.',
    keywords: 'islamic will, wasiyyah, muslim will, writing islamic will, islamic estate planning',
  },
  {
    slug: 'halal-finance-guide',
    title: 'Halal Finance: What Is Riba and How to Avoid It',
    excerpt: 'Riba (interest) is strictly prohibited in Islam. Learn what counts as Riba, why it is forbidden, and how to manage your money in a halal way.',
    category: 'Finance',
    emoji: '🏦',
    readTime: '6 min read',
    date: '2025-07-05',
    seoTitle: 'Halal Finance Guide: What Is Riba & How to Avoid Interest in Islam',
    seoDescription: 'Learn about Riba (interest) in Islam — why it is haram, what counts as Riba, and how to manage finances, mortgages, and savings the halal way.',
    keywords: 'halal finance, riba in islam, islamic banking, halal mortgage, interest free banking, halal investing',
  },
  {
    slug: 'kaffarah-guide',
    title: 'What is Kaffarah? Types, Reasons & How to Calculate It',
    excerpt: 'Kaffarah is an expiation required for breaking certain Islamic obligations — like intentionally breaking a fast in Ramadan. Learn when it applies and how to calculate it.',
    category: 'Knowledge',
    emoji: '⚖️',
    readTime: '5 min read',
    date: '2025-07-07',
    seoTitle: 'Kaffarah in Islam: Types, Reasons & Calculation Guide',
    seoDescription: 'Learn about Kaffarah (expiation) in Islam. Understand when it is required, the different types, and how to calculate and fulfil your obligation.',
    keywords: 'kaffarah, kaffarah calculation, expiation islam, broken fast kaffarah, oath kaffarah',
  },
  {
    slug: 'eid-guide',
    title: 'Eid al-Fitr & Eid al-Adha: Complete Guide to Islamic Celebrations',
    excerpt: 'Eid is the greatest celebration in Islam. Learn the significance of both Eids, the Sunnah acts, Eid prayer, and how to celebrate in the spirit of Islam.',
    category: 'Knowledge',
    emoji: '🎉',
    readTime: '6 min read',
    date: '2025-07-09',
    seoTitle: 'Eid Guide: Eid al-Fitr & Eid al-Adha — Meaning, Prayer & Sunnah',
    seoDescription: 'Complete guide to Eid in Islam. Learn the significance of Eid al-Fitr and Eid al-Adha, Eid prayer steps, Sunnah acts, and how to celebrate properly.',
    keywords: 'eid guide, eid al fitr, eid al adha, eid prayer, eid sunnah, islamic celebrations',
  },
  {
    slug: 'how-to-find-mosque',
    title: 'How to Find a Mosque Near You — Anywhere in the World',
    excerpt: 'Finding a mosque is essential for Jumu\'ah, Tarawih, and community connection. Learn how to use our Mosque Finder tool and tips for visiting a new mosque.',
    category: 'Prayer',
    emoji: '🕌',
    readTime: '3 min read',
    date: '2025-07-11',
    seoTitle: 'Find a Mosque Near Me: Mosque Finder Guide for Muslims Worldwide',
    seoDescription: 'Find the nearest mosque using our free Mosque Finder tool. Works worldwide — perfect for travellers, new residents, and anyone seeking their local masjid.',
    keywords: 'find mosque near me, mosque finder, nearest mosque, masjid finder, mosque locator',
  },
  {
    slug: 'hadith-guide',
    title: 'What is Hadith? The 6 Major Hadith Collections Explained',
    excerpt: 'Hadith are the recorded sayings and actions of the Prophet Muhammad ﷺ. Learn what Hadith are, how they are graded, and the importance of the 6 major collections.',
    category: 'Knowledge',
    emoji: '📚',
    readTime: '7 min read',
    date: '2025-07-13',
    seoTitle: 'What is Hadith? The 6 Major Collections Explained | I Love Islam',
    seoDescription: 'Learn about Hadith in Islam — what they are, how scholars grade their authenticity, and why the 6 major Hadith collections (Kutub al-Sittah) matter.',
    keywords: 'what is hadith, hadith collections, sahih bukhari, sahih muslim, hadith grading, kutub al sittah',
  },
  {
    slug: 'islamic-names-guide',
    title: 'How to Choose an Islamic Name: Meanings, Rules & Beautiful Options',
    excerpt: 'A name carries deep meaning in Islam. Learn the Islamic rules for naming children, names to avoid, and how to find the perfect name with good meaning.',
    category: 'Knowledge',
    emoji: '🌸',
    readTime: '5 min read',
    date: '2025-07-15',
    seoTitle: 'Islamic Names Guide: How to Choose a Muslim Baby Name',
    seoDescription: 'Learn how to choose an Islamic name for your child. Discover naming rules in Islam, names to avoid, and use our Names Finder to find beautiful options.',
    keywords: 'islamic names, muslim baby names, arabic names meaning, islamic naming rules, names finder',
  },
  {
    slug: 'kids-islamic-education',
    title: 'Teaching Children About Islam: A Parent\'s Complete Guide',
    excerpt: 'Raising children with strong Islamic values starts early. Learn age-appropriate ways to teach your kids about prayer, the Quran, duas, and Islamic character.',
    category: 'Kids',
    emoji: '👶',
    readTime: '7 min read',
    date: '2025-07-17',
    seoTitle: 'Teaching Children About Islam: Parent\'s Guide to Islamic Education',
    seoDescription: 'Guide for parents on teaching Islam to children. Age-appropriate activities, duas for kids, how to teach prayer, and free Islamic games for children.',
    keywords: 'teaching children islam, kids islamic education, islamic parenting, duas for kids, children learn islam',
  },
  {
    slug: 'five-pillars-of-islam',
    title: 'The Five Pillars of Islam: A Complete Overview',
    excerpt: 'The Five Pillars are the foundation of Muslim life — Shahada, Salah, Zakat, Sawm, and Hajj. Learn what each pillar means, its obligation, and how to fulfil it.',
    category: 'Knowledge',
    emoji: '🏛️',
    readTime: '8 min read',
    date: '2025-07-19',
    seoTitle: 'The Five Pillars of Islam: Complete Guide with Evidence from Quran & Sunnah',
    seoDescription: 'Learn about the Five Pillars of Islam — Shahada, Salah, Zakat, Sawm, and Hajj. Complete guide with Quranic evidence and practical guidance for each.',
    keywords: 'five pillars of islam, shahada, salah, zakat, sawm, hajj, pillars of islam explained',
  },
  {
    slug: 'mosque-etiquette-guide',
    title: 'Mosque Etiquette: Rules & Manners for Visiting a Masjid',
    excerpt: 'The mosque is the house of Allah. Learn the proper etiquette for entering, behaving in, and leaving the mosque — whether you are a regular or a first-time visitor.',
    category: 'Prayer',
    emoji: '🕌',
    readTime: '4 min read',
    date: '2025-07-21',
    seoTitle: 'Mosque Etiquette: Complete Guide to Masjid Manners & Rules',
    seoDescription: 'Learn proper mosque etiquette — how to enter, what to wear, how to behave, and the duas for entering and leaving a masjid.',
    keywords: 'mosque etiquette, masjid manners, mosque rules, how to visit mosque, mosque dua',
  },
];

const CATEGORIES = ['All', 'Finance', 'Prayer', 'Knowledge', 'Worship', 'Quran', 'Ramadan', 'Hajj & Umrah', 'Travel', 'Self-Discovery', 'Kids'];

const CATEGORY_COLORS: Record<string, string> = {
  Finance:          'bg-emerald-50 text-emerald-700',
  Prayer:           'bg-blue-50 text-blue-700',
  Knowledge:        'bg-purple-50 text-purple-700',
  'Self-Discovery': 'bg-amber-50 text-amber-700',
  Ramadan:          'bg-indigo-50 text-indigo-700',
  Travel:           'bg-teal-50 text-teal-700',
  Worship:          'bg-rose-50 text-rose-700',
  Quran:            'bg-yellow-50 text-yellow-700',
  'Hajj & Umrah':   'bg-orange-50 text-orange-700',
  Kids:             'bg-pink-50 text-pink-700',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function generateBlogListSchema(articles: typeof ARTICLES) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': 'Islamic Knowledge & Guides - I Love Islam',
    'description': 'Free Islamic guides, tutorials, and educational content about Islamic practices, prayer, Zakat, and more.',
    'url': 'https://www.iloveislam.life/blog',
    'blogPost': articles.map(article => ({
      '@type': 'BlogPosting',
      'headline': article.title,
      'description': article.excerpt,
      'datePublished': article.date,
      'url': `https://www.iloveislam.life/blog/${article.slug}`,
    })),
  };
}

export default function BlogPage() {
  const [active, setActive] = useState('All');

  const filtered = active === 'All'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === active);

  const blogListSchema = generateBlogListSchema(ARTICLES);

  return (
    <>
      <Head>
        <title>Islamic Knowledge & Guides | Learn About Islam - I Love Islam</title>
        <meta name="title" content="Islamic Knowledge & Guides | Learn About Islam - I Love Islam" />
        <meta name="description" content="Free Islamic guides and tutorials. Learn about Zakat, prayer times, Qibla direction, Hijri calendar, 99 Names of Allah, and more." />
        <meta name="keywords" content="islamic guides, learn islam, zakat calculation, prayer times, qibla direction, hijri calendar, 99 names of allah, ramadan preparation, halal travel, wudu guide, dhikr, dua, quran, hajj, umrah, sadaqah, kaffarah, eid, mosque etiquette" />
        <meta name="author" content="I Love Islam" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.iloveislam.life/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.iloveislam.life/blog" />
        <meta property="og:title" content="Islamic Knowledge & Guides - I Love Islam" />
        <meta property="og:description" content="Free Islamic guides and tutorials. Learn about Zakat, prayer times, Qibla direction, and more." />
        <meta property="og:image" content="https://www.iloveislam.life/og-image-blog.jpg" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.iloveislam.life/blog" />
        <meta property="twitter:title" content="Islamic Knowledge & Guides - I Love Islam" />
        <meta property="twitter:description" content="Free Islamic guides and tutorials." />
        <meta property="twitter:image" content="https://www.iloveislam.life/og-image-blog.jpg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
        />
      </Head>

      <div style={{ minHeight: '100vh', background: '#f7f6f2', fontFamily: 'Georgia, serif' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(160deg,#0a3d2e 0%,#1a6b4a 100%)', padding: '32px 16px 40px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
              ← Back to Tools
            </Link>
            <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 6px' }}>
              Islamic Knowledge & Guides
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: '0 0 20px' }}>
              {ARTICLES.length} free articles to help you understand and practise Islam
            </p>

            {/* Breadcrumbs */}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Home</Link>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ color: '#c8a96e' }}>Islamic Guides</span>
            </div>

            {/* Category filter pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  style={{
                    background: active === cat ? '#c8a96e' : 'rgba(255,255,255,0.12)',
                    color: active === cat ? '#0a3d2e' : 'rgba(255,255,255,0.75)',
                    border: 'none',
                    borderRadius: 20,
                    padding: '6px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 60px' }}>

          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
            {filtered.length} article{filtered.length !== 1 ? 's' : ''}
            {active !== 'All' ? ` in ${active}` : ''}
          </p>

          {/* Article grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18, marginBottom: 28 }}>
            {filtered.map(article => (
              <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
                <article
                  style={{
                    background: '#fff',
                    borderRadius: 18,
                    border: '1px solid #ede9e2',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all .18s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#0a3d2e';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(10,61,46,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#ede9e2';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: '#f0f9f4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, flexShrink: 0,
                    }}>
                      {article.emoji}
                    </div>
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          marginBottom: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: '#f0f9f4',
                          color: '#1a6b4a',
                        }}
                      >
                        {article.category}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#bbb' }}>📖 {article.readTime}</span>
                        <span style={{ fontSize: 11, color: '#ddd' }}>·</span>
                        <span style={{ fontSize: 11, color: '#bbb' }}>{formatDate(article.date)}</span>
                      </div>
                    </div>
                  </div>

                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0a3d2e', margin: '0 0 10px', lineHeight: 1.45, flex: 1 }}>
                    {article.title}
                  </h2>

                  <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px', lineHeight: 1.6 }}>
                    {article.excerpt}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#0a3d2e', fontWeight: 700 }}>
                      Read article <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Newsletter */}
          <div style={{ background: '#fff8ee', borderRadius: 14, border: '1px solid #f5e6c8', padding: '24px 20px', textAlign: 'center', marginBottom: 24 }}>
            <p style={{ fontSize: 14, color: '#c8a96e', margin: '0 0 8px', fontWeight: 700 }}>📧 Never Miss an Article</p>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>
              Join 5,000+ subscribers. Get Islamic guides delivered to your inbox weekly.
            </p>
            <form action="/subscribe" method="POST" style={{ maxWidth: 400, margin: '0 auto', display: 'flex', gap: 8 }}>
              <input
                type="email"
                name="email"
                placeholder="Your email address"
                required
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0d5b5', fontSize: 13 }}
              />
              <button
                type="submit"
                style={{ background: '#0a3d2e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Footer links — all routes verified against your app folder */}
          <div style={{ background: '#fff8ee', borderRadius: 14, border: '1px solid #f5e6c8', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#c8a96e', margin: '0 0 12px', fontWeight: 700 }}>More Islamic Resources</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, fontSize: 12 }}>
              <Link href="/prayer-times" style={{ color: '#0a3d2e', textDecoration: 'none' }}>🕌 Prayer Times</Link>
              <Link href="/qibla"        style={{ color: '#0a3d2e', textDecoration: 'none' }}>🧭 Qibla Finder</Link>
              <Link href="/dua"          style={{ color: '#0a3d2e', textDecoration: 'none' }}>🤲 Dua Generator</Link>
              <Link href="/hijri"        style={{ color: '#0a3d2e', textDecoration: 'none' }}>📅 Hijri Calendar</Link>
              <Link href="/zakat"        style={{ color: '#0a3d2e', textDecoration: 'none' }}>💰 Zakat Calculator</Link>
              <Link href="/dhikr"        style={{ color: '#0a3d2e', textDecoration: 'none' }}>📿 Dhikr Counter</Link>
              <Link href="/quran"        style={{ color: '#0a3d2e', textDecoration: 'none' }}>📖 Quran Reader</Link>
              <Link href="/names"        style={{ color: '#0a3d2e', textDecoration: 'none' }}>⭐ 99 Names</Link>
              <Link href="/mosque"       style={{ color: '#0a3d2e', textDecoration: 'none' }}>🕌 Mosque Finder</Link>
              <Link href="/ramadan"      style={{ color: '#0a3d2e', textDecoration: 'none' }}>🌙 Ramadan Planner</Link>
              <Link href="/hajj"         style={{ color: '#0a3d2e', textDecoration: 'none' }}>🕋 Hajj Guide</Link>
              <Link href="/sadaqah"      style={{ color: '#0a3d2e', textDecoration: 'none' }}>💝 Sadaqah Tracker</Link>
              <Link href="/inheritance"  style={{ color: '#0a3d2e', textDecoration: 'none' }}>📜 Inheritance</Link>
              <Link href="/will"         style={{ color: '#0a3d2e', textDecoration: 'none' }}>📋 Islamic Will</Link>
              <Link href="/halal-finance" style={{ color: '#0a3d2e', textDecoration: 'none' }}>🏦 Halal Finance</Link>
              <Link href="/kaffarah"     style={{ color: '#0a3d2e', textDecoration: 'none' }}>⚖️ Kaffarah</Link>
              <Link href="/eid"          style={{ color: '#0a3d2e', textDecoration: 'none' }}>🎉 Eid</Link>
              <Link href="/hadith"       style={{ color: '#0a3d2e', textDecoration: 'none' }}>📚 Hadith</Link>
              <Link href="/names-finder" style={{ color: '#0a3d2e', textDecoration: 'none' }}>🌸 Names Finder</Link>
              <Link href="/kids"         style={{ color: '#0a3d2e', textDecoration: 'none' }}>👶 Kids Games</Link>
              <Link href="/mizan"        style={{ color: '#0a3d2e', textDecoration: 'none' }}>✦ Mizan</Link>
              <Link href="/travel"       style={{ color: '#0a3d2e', textDecoration: 'none' }}>🌍 Halal Travel</Link>
            </div>
            <p style={{ fontSize: 11, color: '#bbb', margin: '16px 0 0' }}>
              JazakAllahu Khayran for reading. May Allah increase us all in beneficial knowledge. 🤍
            </p>
          </div>
        </main>
      </div>
    </>
  );
}