'use client';

import Link from 'next/link';
import { useState } from 'react';

const ARTICLES = [
  {
    slug: 'how-to-calculate-zakat',
    title: 'How to Calculate Zakat: A Complete Step‑by‑Step Guide',
    excerpt: 'Learn exactly how to calculate your annual Zakat, understand the Nisab threshold, and discover which assets are included.',
    category: 'Finance',
    emoji: '💰',
    readTime: '6 min read',
    date: '2025-06-01',
  },
  {
    slug: 'prayer-times-explained',
    title: 'Understanding Islamic Prayer Times: Fajr, Dhuhr, Asr, Maghrib & Isha',
    excerpt: 'A complete guide to the five daily prayers – what they are, when they occur, and how to find accurate times worldwide.',
    category: 'Prayer',
    emoji: '🕐',
    readTime: '7 min read',
    date: '2025-06-03',
  },
  {
    slug: 'qibla-direction-guide',
    title: 'How to Find the Qibla Direction Anywhere in the World',
    excerpt: 'Discover the Qibla and learn how to find it accurately using our free Qibla Finder tool, a compass, or Google Maps.',
    category: 'Prayer',
    emoji: '🧭',
    readTime: '5 min read',
    date: '2025-06-05',
  },
  {
    slug: 'hijri-calendar-explained',
    title: 'The Islamic Hijri Calendar Explained – and How to Convert Dates',
    excerpt: 'Learn how the Hijri calendar works, why Islamic dates shift each year, and how to convert between Hijri and Gregorian.',
    category: 'Knowledge',
    emoji: '🌙',
    readTime: '6 min read',
    date: '2025-06-07',
  },
  {
    slug: 'ramadan-preparation-guide',
    title: 'How to Prepare for Ramadan: A Complete Spiritual & Practical Guide',
    excerpt: 'Get ready for the holy month with spiritual preparation, meal planning, worship goals, and family activities.',
    category: 'Ramadan',
    emoji: '🌙',
    readTime: '8 min read',
    date: '2025-06-09',
  },
  {
    slug: 'what-is-mizan-islamic-blueprint',
    title: 'What is the Mizan Islamic Life Blueprint?',
    excerpt: 'Discover how the Mizan tool uses Abjad numerology, the 99 Names of Allah, and Quranic guidance to reveal your Islamic archetype.',
    category: 'Self-Discovery',
    emoji: '✦',
    readTime: '5 min read',
    date: '2025-06-11',
  },
  {
    slug: '99-names-of-allah-guide',
    title: 'The 99 Names of Allah (Asma ul Husna) – Meanings & Benefits',
    excerpt: 'Explore all 99 beautiful names of Allah with their meanings, transliterations, and spiritual benefits.',
    category: 'Knowledge',
    emoji: '⭐',
    readTime: '10 min read',
    date: '2025-06-13',
  },
  {
    slug: 'halal-travel-tips',
    title: '10 Essential Tips for Halal Travel – A Muslim Traveller’s Guide',
    excerpt: 'Find halal food, locate mosques, manage prayer times, and keep your deen while exploring the world.',
    category: 'Travel',
    emoji: '🌍',
    readTime: '6 min read',
    date: '2025-06-15',
  },
  {
    slug: 'dhikr-guide',
    title: 'The Power of Dhikr: How to Use the Dhikr Counter for Daily Remembrance',
    excerpt: 'Learn the importance of Dhikr in Islam and how our free Dhikr Counter can help you build a consistent habit.',
    category: 'Worship',
    emoji: '📿',
    readTime: '6 min read',
    date: '2025-06-17',
  },
  {
    slug: 'inheritance-calculator-guide',
    title: 'Islamic Inheritance Law: How to Use the Inheritance Calculator',
    excerpt: 'Understand the basics of Fara’id (Islamic inheritance) and how to distribute an estate according to the Quran.',
    category: 'Finance',
    emoji: '⚖️',
    readTime: '7 min read',
    date: '2025-06-19',
  },
  {
    slug: 'halal-finance-check-guide',
    title: 'Is My Transaction Halal? A Guide to Using the Halal Finance Check',
    excerpt: 'Learn how to check any financial deal for Riba, Gharar, and Maysir using our free screening tool.',
    category: 'Finance',
    emoji: '☪️',
    readTime: '6 min read',
    date: '2025-06-21',
  },
  {
    slug: 'kaffarah-calculator-guide',
    title: 'Kaffarah Explained: How to Calculate Expiation for Broken Oaths & More',
    excerpt: 'Understand the four types of Kaffarah and how to calculate the monetary or fasting equivalent.',
    category: 'Knowledge',
    emoji: '🕊️',
    readTime: '7 min read',
    date: '2025-06-23',
  },
  {
    slug: 'sadaqah-tracker-guide',
    title: 'Making Sadaqah a Habit: How to Track Your Charity with the Sadaqah Tracker',
    excerpt: 'Discover the virtues of daily charity and how our Sadaqah Tracker can help you build a lasting giving habit.',
    category: 'Worship',
    emoji: '💚',
    readTime: '5 min read',
    date: '2025-06-25',
  },
  {
    slug: 'islamic-will-guide',
    title: 'Writing an Islamic Will (Wasiyyah): Why Every Muslim Needs One',
    excerpt: 'Learn why a Wasiyyah is important and how our free Islamic Will generator can help you create a Shariah‑compliant draft.',
    category: 'Finance',
    emoji: '📜',
    readTime: '6 min read',
    date: '2025-06-27',
  },
  {
    slug: 'hajj-checklist-guide',
    title: 'The Ultimate Hajj Checklist: A Step‑by‑Step Guide to Every Rite',
    excerpt: 'Prepare for Hajj with a complete checklist covering every day, from Ihram to Tawaf al‑Wada.',
    category: 'Hajj & Umrah',
    emoji: '🕋',
    readTime: '8 min read',
    date: '2025-06-29',
  },
  {
    slug: 'quran-reader-guide',
    title: 'How to Read the Quran Online with Translation and Audio',
    excerpt: 'Explore the features of our free Quran Reader: Indo‑Pak Mushaf, verse‑by‑verse, English/Urdu translation, and audio recitation.',
    category: 'Quran',
    emoji: '📖',
    readTime: '6 min read',
    date: '2025-07-01',
  },
  {
    slug: 'hadith-search-guide',
    title: 'How to Search Authentic Hadith: A Guide to the Six Major Collections',
    excerpt: 'Learn how to find sahih hadith using our Hadith Search tool, covering Bukhari, Muslim, and four other canonical collections.',
    category: 'Knowledge',
    emoji: '📚',
    readTime: '6 min read',
    date: '2025-07-03',
  },
  {
    slug: 'islamic-names-finder-guide',
    title: 'Choosing a Muslim Name: How to Use the Islamic Names Finder',
    excerpt: 'Explore over 14,000 authentic Islamic names with meanings, Arabic script, and gender filters.',
    category: 'Family',
    emoji: '👶',
    readTime: '5 min read',
    date: '2025-07-05',
  },
  {
    slug: 'dua-generator-guide',
    title: 'Authentic Duas from Quran & Sunnah: How to Use the Dua Generator',
    excerpt: 'Browse a curated collection of over 100 authentic duas with translations, transliterations, and references.',
    category: 'Worship',
    emoji: '🤲',
    readTime: '5 min read',
    date: '2025-07-07',
  },
  {
    slug: 'mosque-finder-guide',
    title: 'How to Find Mosques Anywhere in the World with Live Prayer Times',
    excerpt: 'Locate the nearest masjid, get directions, and see today’s prayer times – all from one tool.',
    category: 'Travel',
    emoji: '🕌',
    readTime: '5 min read',
    date: '2025-07-09',
  },
  {
    slug: 'islamic-events-countdown',
    title: 'Islamic Events & Countdowns: Ramadan, Eid, Ashura and More',
    excerpt: 'Track upcoming Islamic events with live countdowns and understand their significance.',
    category: 'Knowledge',
    emoji: '📅',
    readTime: '6 min read',
    date: '2025-07-11',
  },
  {
    slug: 'understanding-islamic-calendar',
    title: 'Understanding the Islamic Calendar: Months, Sacred Days, and Moon Sighting',
    excerpt: 'A deep dive into the structure of the Islamic lunar year, the four sacred months, and the role of moon sighting.',
    category: 'Knowledge',
    emoji: '🌙',
    readTime: '7 min read',
    date: '2025-07-13',
  },
  {
    slug: 'benefits-of-dhikr',
    title: 'Spiritual Benefits of Dhikr: Why Remembrance of Allah Changes Your Life',
    excerpt: 'Discover the transformative power of Dhikr with references from Quran and Hadith, and practical tips.',
    category: 'Worship',
    emoji: '📿',
    readTime: '6 min read',
    date: '2025-07-15',
  },
  {
    slug: 'salah-postures-guide',
    title: 'Salah Postures and Their Spiritual Meanings',
    excerpt: 'Learn the inner dimensions of each prayer posture – Qiyam, Ruku, Sujud – and how to enhance your khushu.',
    category: 'Prayer',
    emoji: '🕌',
    readTime: '5 min read',
    date: '2025-07-17',
  },
  {
    slug: 'laylatul-qadr-guide',
    title: 'Laylatul Qadr: The Night Better Than a Thousand Months',
    excerpt: 'Understand the significance of the Night of Power, when it falls, and how to maximise its blessings.',
    category: 'Ramadan',
    emoji: '✨',
    readTime: '6 min read',
    date: '2025-07-19',
  },
];

const CATEGORIES = [
  'All',
  'Finance',
  'Prayer',
  'Knowledge',
  'Self-Discovery',
  'Ramadan',
  'Worship',
  'Travel',
  'Family',
  'Hajj & Umrah',
  'Quran',
];

const CATEGORY_COLORS: Record<string, string> = {
  Finance: 'bg-emerald-100 text-emerald-700',
  Prayer: 'bg-blue-100 text-blue-700',
  Knowledge: 'bg-purple-100 text-purple-700',
  'Self-Discovery': 'bg-amber-100 text-amber-700',
  Ramadan: 'bg-indigo-100 text-indigo-700',
  Travel: 'bg-teal-100 text-teal-700',
  Worship: 'bg-rose-100 text-rose-700',
  Family: 'bg-pink-100 text-pink-700',
  'Hajj & Umrah': 'bg-cyan-100 text-cyan-700',
  Quran: 'bg-lime-100 text-lime-700',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPage() {
  const [active, setActive] = useState('All');

  const filtered = active === 'All' ? ARTICLES : ARTICLES.filter(a => a.category === active);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-8 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1 mb-4">
            <span>←</span> Back to Tools
          </Link>
          <h1 className="text-3xl font-bold mb-2">Islamic Knowledge & Guides</h1>
          <p className="text-white/60 text-sm max-w-2xl">
            Free in‑depth articles to help you understand and use our Islamic tools, and deepen your faith.
          </p>
          <nav className="mt-4" aria-label="Breadcrumb">
            <ol className="flex text-xs text-white/50">
              <li><Link href="/" className="hover:text-white/80">Home</Link></li>
              <li className="mx-2">/</li>
              <li className="text-emerald-300">Islamic Guides</li>
            </ol>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 pb-20">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                active === cat
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-6">
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
          {active !== 'All' && ` in ${active}`}
        </p>

        {/* Articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(article => (
            <Link key={article.slug} href={`/blog/${article.slug}`} className="group">
              <article className="bg-white rounded-2xl border border-gray-100 p-5 h-full flex flex-col shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{article.emoji}</span>
                  <div>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-600'}`}>
                      {article.category}
                    </span>
                    <div className="flex gap-2 mt-1 text-[10px] text-gray-400">
                      <span>📖 {article.readTime}</span>
                      <span>·</span>
                      <span>{formatDate(article.date)}</span>
                    </div>
                  </div>
                </div>
                <h2 className="font-bold text-gray-800 text-base leading-snug mb-2 group-hover:text-emerald-800 transition-colors">
                  {article.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-3">
                  {article.excerpt}
                </p>
                <div className="flex justify-end">
                  <span className="text-xs font-semibold text-emerald-800 group-hover:translate-x-1 transition-transform">
                    Read article →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Newsletter & footer links */}
        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center shadow-sm">
          <h3 className="font-bold text-amber-800 text-lg mb-2">📧 Never Miss a Guide</h3>
          <p className="text-sm text-amber-700 mb-4">Join 5,000+ subscribers. Get new Islamic guides weekly.</p>
          <form className="flex justify-center gap-2 max-w-md mx-auto">
            <input type="email" placeholder="Your email" required className="flex-1 px-4 py-2 rounded-xl border border-amber-300 text-sm" />
            <button type="submit" className="bg-emerald-800 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700">Subscribe</button>
          </form>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
          <h3 className="font-bold text-gray-800 mb-2">Explore Free Tools</h3>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            <Link href="/prayer-times" className="hover:text-emerald-800">🕌 Prayer Times</Link>
            <Link href="/qibla" className="hover:text-emerald-800">🧭 Qibla Finder</Link>
            <Link href="/zakat" className="hover:text-emerald-800">💰 Zakat Calculator</Link>
            <Link href="/quran-reader" className="hover:text-emerald-800">📖 Quran Reader</Link>
            <Link href="/ramadan-planner" className="hover:text-emerald-800">🌙 Ramadan Planner</Link>
            <Link href="/dua-generator" className="hover:text-emerald-800">🤲 Dua Generator</Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          JazakAllahu Khayran for seeking knowledge. May these articles benefit you and the Ummah. 🤍
        </p>
      </main>
    </div>
  );
}