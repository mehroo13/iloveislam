'use client';

import Link from 'next/link';
import { useState } from 'react';

export const ARTICLES = [
  {
    slug: 'how-to-calculate-zakat',
    title: 'How to Calculate Zakat: A Complete Step-by-Step Guide',
    excerpt: 'Zakat is one of the Five Pillars of Islam. Learn exactly how to calculate your annual Zakat, understand the Nisab threshold, and what assets are included.',
    category: 'Finance',
    emoji: '💰',
    readTime: '5 min read',
    date: '2025-06-01',
  },
  {
    slug: 'what-is-mizan-islamic-blueprint',
    title: 'What is the Mizan Islamic Life Blueprint?',
    excerpt: 'Discover how the Mizan tool uses the ancient Abjad numerology system, the 99 Names of Allah, and Quranic guidance to reveal your Islamic archetype and life purpose.',
    category: 'Self-Discovery',
    emoji: '✦',
    readTime: '4 min read',
    date: '2025-06-03',
  },
  {
    slug: 'qibla-direction-guide',
    title: 'How to Find the Qibla Direction Anywhere in the World',
    excerpt: 'The Qibla is the direction Muslims face during Salah. Learn how to find it accurately using our free Qibla Finder tool, and understand the calculation behind it.',
    category: 'Prayer',
    emoji: '🧭',
    readTime: '3 min read',
    date: '2025-06-05',
  },
  {
    slug: 'prayer-times-guide',
    title: 'Understanding Islamic Prayer Times: Fajr, Dhuhr, Asr, Maghrib & Isha',
    excerpt: 'A complete guide to the five daily prayers — what they are, when they occur, and how to find accurate prayer times for your city anywhere in the world.',
    category: 'Prayer',
    emoji: '🕐',
    readTime: '6 min read',
    date: '2025-06-07',
  },
  {
    slug: 'hijri-calendar-explained',
    title: 'The Islamic Hijri Calendar Explained — And How to Convert Dates',
    excerpt: 'The Hijri calendar is the Islamic lunar calendar used to determine dates of Islamic events. Learn how it works and how to convert between Hijri and Gregorian dates.',
    category: 'Knowledge',
    emoji: '🌙',
    readTime: '4 min read',
    date: '2025-06-09',
  },
  {
    slug: '99-names-of-allah-guide',
    title: 'The 99 Names of Allah (Asma ul Husna) — Meanings & Benefits',
    excerpt: 'Allah has 99 beautiful names, each reflecting a divine attribute. Learn about all 99 names, their meanings, and the spiritual benefits of reciting them.',
    category: 'Knowledge',
    emoji: '⭐',
    readTime: '8 min read',
    date: '2025-06-11',
  },
  {
    slug: 'ramadan-preparation-guide',
    title: 'How to Prepare for Ramadan: A Complete Muslim Guide',
    excerpt: 'Ramadan is the holiest month in Islam. Learn how to prepare spiritually, physically, and practically for the blessed month of fasting and worship.',
    category: 'Ramadan',
    emoji: '🌙',
    readTime: '7 min read',
    date: '2025-06-13',
  },
  {
    slug: 'halal-travel-tips',
    title: "10 Essential Tips for Halal Travel — A Muslim Traveller's Guide",
    excerpt: 'Travelling as a Muslim comes with unique considerations. From finding halal food to maintaining prayer schedules — here is everything you need to know.',
    category: 'Travel',
    emoji: '🌍',
    readTime: '5 min read',
    date: '2025-06-15',
  },
];

const CATEGORIES = ['All', 'Finance', 'Prayer', 'Knowledge', 'Self-Discovery', 'Ramadan', 'Travel'];

const CATEGORY_COLORS: Record<string, string> = {
  Finance:          'bg-emerald-50 text-emerald-700',
  Prayer:           'bg-blue-50 text-blue-700',
  Knowledge:        'bg-purple-50 text-purple-700',
  'Self-Discovery': 'bg-amber-50 text-amber-700',
  Ramadan:          'bg-indigo-50 text-indigo-700',
  Travel:           'bg-teal-50 text-teal-700',
};

export default function BlogPage() {
  const [active, setActive] = useState('All');

  const filtered = active === 'All'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === active);

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', fontFamily: 'Georgia, serif' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#0a3d2e 0%,#1a6b4a 100%)', padding: '32px 16px 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
            ← Back to Tools
          </Link>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 6px' }}>
            Islamic Knowledge & Guides
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: '0 0 20px' }}>
            Free articles to help you understand and use Islamic tools
          </p>

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

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Results count */}
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
          {active !== 'All' ? ` in ${active}` : ''}
        </p>

        {/* Article grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18, marginBottom: 28 }}>
          {filtered.map(article => (
            <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
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
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#0a3d2e';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(10,61,46,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#ede9e2';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
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
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-600'}`}
                      style={{ display: 'inline-block', marginBottom: 6, fontSize: 11 }}>
                      {article.category}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#bbb' }}>📖 {article.readTime}</span>
                      <span style={{ fontSize: 11, color: '#ddd' }}>·</span>
                      <span style={{ fontSize: 11, color: '#bbb' }}>June 2025</span>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0a3d2e', margin: '0 0 10px', lineHeight: 1.45, flex: 1 }}>
                  {article.title}
                </h2>

                {/* Excerpt */}
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px', lineHeight: 1.6 }}>
                  {article.excerpt}
                </p>

                {/* Read more */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#0a3d2e', fontWeight: 700 }}>Read article →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* More coming */}
        <div style={{ background: '#fff8ee', borderRadius: 14, border: '1px solid #f5e6c8', padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#c8a96e', margin: '0 0 4px', fontWeight: 700 }}>More articles coming soon</p>
          <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>We regularly add new Islamic guides and knowledge articles. JazakAllahu Khayran 🤍</p>
        </div>
      </main>
    </div>
  );
}
