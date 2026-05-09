import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Islamic Blog — Guides, Tips & Knowledge | I Love Islam',
  description: 'Free Islamic guides and articles — How to calculate Zakat, understanding Prayer Times, using the Qibla finder, Mizan Islamic Blueprint explained, and more.',
};

const POSTS = [
  {
    slug: 'how-to-calculate-zakat',
    title: 'How to Calculate Zakat: A Complete Step-by-Step Guide',
    excerpt: 'Zakat is one of the Five Pillars of Islam. Learn exactly how to calculate your annual Zakat, understand the Nisab threshold, and what assets are included.',
    category: 'Finance',
    icon: '💰',
    color: 'bg-emerald-50 text-emerald-700',
    readTime: '5 min read',
    date: 'June 2025',
  },
  {
    slug: 'what-is-mizan-islamic-blueprint',
    title: 'What is the Mizan Islamic Life Blueprint?',
    excerpt: 'Discover how the Mizan tool uses the ancient Abjad numerology system, the 99 Names of Allah, and Quranic guidance to reveal your Islamic archetype and life purpose.',
    category: 'Self-Discovery',
    icon: '✦',
    color: 'bg-amber-50 text-amber-700',
    readTime: '4 min read',
    date: 'June 2025',
  },
  {
    slug: 'qibla-direction-guide',
    title: 'How to Find the Qibla Direction Anywhere in the World',
    excerpt: 'The Qibla is the direction Muslims face during Salah. Learn how to find it accurately using our free Qibla Finder tool, and understand the calculation behind it.',
    category: 'Prayer',
    icon: '🧭',
    color: 'bg-blue-50 text-blue-700',
    readTime: '3 min read',
    date: 'June 2025',
  },
  {
    slug: 'prayer-times-guide',
    title: 'Understanding Islamic Prayer Times: Fajr, Dhuhr, Asr, Maghrib & Isha',
    excerpt: 'A complete guide to the five daily prayers — what they are, when they occur, and how to find accurate prayer times for your city anywhere in the world.',
    category: 'Prayer',
    icon: '🕐',
    color: 'bg-blue-50 text-blue-700',
    readTime: '6 min read',
    date: 'June 2025',
  },
  {
    slug: 'hijri-calendar-explained',
    title: 'The Islamic Hijri Calendar Explained — And How to Convert Dates',
    excerpt: 'The Hijri calendar is the Islamic lunar calendar used to determine dates of Islamic events. Learn how it works and how to convert between Hijri and Gregorian dates.',
    category: 'Knowledge',
    icon: '🌙',
    color: 'bg-purple-50 text-purple-700',
    readTime: '4 min read',
    date: 'June 2025',
  },
  {
    slug: '99-names-of-allah-guide',
    title: 'The 99 Names of Allah (Asma ul Husna) — Meanings & Benefits',
    excerpt: 'Allah has 99 beautiful names, each reflecting a divine attribute. Learn about all 99 names, their meanings, and the spiritual benefits of reciting them.',
    category: 'Knowledge',
    icon: '⭐',
    color: 'bg-rose-50 text-rose-700',
    readTime: '8 min read',
    date: 'June 2025',
  },
  {
    slug: 'ramadan-preparation-guide',
    title: 'How to Prepare for Ramadan: A Complete Muslim Guide',
    excerpt: 'Ramadan is the holiest month in Islam. Learn how to prepare spiritually, physically, and practically for the blessed month of fasting and worship.',
    category: 'Ramadan',
    icon: '🌙',
    color: 'bg-indigo-50 text-indigo-700',
    readTime: '7 min read',
    date: 'June 2025',
  },
  {
    slug: 'halal-travel-tips',
    title: '10 Essential Tips for Halal Travel — A Muslim Traveller\'s Guide',
    excerpt: 'Travelling as a Muslim comes with unique considerations. From finding halal food to maintaining prayer schedules — here is everything you need to know.',
    category: 'Travel',
    icon: '🌍',
    color: 'bg-teal-50 text-teal-700',
    readTime: '5 min read',
    date: 'June 2025',
  },
];

const CATEGORIES = ['All', 'Finance', 'Prayer', 'Knowledge', 'Self-Discovery', 'Ramadan', 'Travel'];

export default function Blog() {
  return (
    <div className="min-h-screen" style={{ background: '#f7f6f2' }}>
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        <h1 className="text-white font-medium">Islamic Blog & Guides</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        <div style={{ background: '#0a3d2e' }} className="rounded-2xl p-5 mb-6 text-center">
          <p className="text-white font-semibold mb-1">Islamic Knowledge & Guides</p>
          <p className="text-white/50 text-sm">Free articles to help you understand and use Islamic tools</p>
        </div>

        {/* Category filter — static for SEO, can be made interactive */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <span key={cat}
              className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all ${cat === 'All' ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}
              style={cat === 'All' ? { background: '#0a3d2e' } : {}}>
              {cat}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          {POSTS.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-emerald-200 hover:shadow-md transition-all group">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${post.color}`}>
                  {post.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${post.color}`}>{post.category}</span>
                    <span className="text-xs text-gray-300">{post.readTime}</span>
                    <span className="text-xs text-gray-300">{post.date}</span>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800 leading-tight mb-1 group-hover:text-emerald-700 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-xs text-gray-400 leading-relaxed">{post.excerpt}</p>
                </div>
                <span className="text-gray-300 group-hover:text-emerald-400 transition-colors text-sm flex-shrink-0">→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mt-6 text-center">
          <p className="text-sm font-medium text-amber-700 mb-1">More articles coming soon</p>
          <p className="text-xs text-amber-600">We regularly add new Islamic guides and knowledge articles.</p>
        </div>
      </main>
    </div>
  );
}
