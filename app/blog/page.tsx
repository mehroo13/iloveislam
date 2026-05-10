'use client';

import Link from 'next/link';
import { useState } from 'react';
import Head from 'next/head';

export const ARTICLES = [
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
    title: '10 Essential Tips for Halal Travel — A Muslim Traveller\'s Guide',
    excerpt: 'Travelling as a Muslim comes with unique considerations. From finding halal food to maintaining prayer schedules — here is everything you need to know.',
    category: 'Travel',
    emoji: '🌍',
    readTime: '5 min read',
    date: '2025-06-15',
    seoTitle: 'Halal Travel Tips: 10 Essential Tips for Muslim Travellers',
    seoDescription: 'Essential halal travel tips for Muslim travellers. Find halal food, locate prayer rooms, maintain your worship routine, and travel with confidence.',
    keywords: 'halal travel, muslim travel, islamic travel, halal food travel, muslim friendly destinations',
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

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Generate structured data for blog listing
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
        {/* Primary Meta Tags */}
        <title>Islamic Knowledge & Guides | Learn About Islam - I Love Islam</title>
        <meta name="title" content="Islamic Knowledge & Guides | Learn About Islam - I Love Islam" />
        <meta name="description" content="Free Islamic guides and tutorials. Learn about Zakat, prayer times, Qibla direction, Hijri calendar, 99 Names of Allah, and more." />
        <meta name="keywords" content="islamic guides, learn islam, zakat calculation, prayer times, qibla direction, hijri calendar, 99 names of allah, ramadan preparation, halal travel" />
        <meta name="author" content="I Love Islam" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.iloveislam.life/blog" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.iloveislam.life/blog" />
        <meta property="og:title" content="Islamic Knowledge & Guides - I Love Islam" />
        <meta property="og:description" content="Free Islamic guides and tutorials. Learn about Zakat, prayer times, Qibla direction, and more." />
        <meta property="og:image" content="https://www.iloveislam.life/og-image-blog.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.iloveislam.life/blog" />
        <meta property="twitter:title" content="Islamic Knowledge & Guides - I Love Islam" />
        <meta property="twitter:description" content="Free Islamic guides and tutorials. Learn about Zakat, prayer times, Qibla direction, and more." />
        <meta property="twitter:image" content="https://www.iloveislam.life/og-image-blog.jpg" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
        />
      </Head>

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

            {/* Breadcrumbs for SEO */}
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

        <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px 60px' }}>

          {/* Results count with schema-friendly text */}
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
            {filtered.length} article{filtered.length !== 1 ? 's' : ''}
            {active !== 'All' ? ` in ${active}` : ''}
          </p>

          {/* Article grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18, marginBottom: 28 }}>
            {filtered.map(article => (
              <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
                <article style={{
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
                        <span style={{ fontSize: 11, color: '#bbb' }}>{formatDate(article.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Title with SEO-friendly heading */}
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0a3d2e', margin: '0 0 10px', lineHeight: 1.45, flex: 1 }}>
                    {article.title}
                  </h2>

                  {/* Excerpt */}
                  <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px', lineHeight: 1.6 }}>
                    {article.excerpt}
                  </p>

                  {/* Read more */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#0a3d2e', fontWeight: 700 }}>
                      Read article <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Newsletter Signup for SEO + Engagement */}
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

          {/* Footer note with internal links for SEO */}
          <div style={{ background: '#fff8ee', borderRadius: 14, border: '1px solid #f5e6c8', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#c8a96e', margin: '0 0 8px', fontWeight: 700 }}>More Islamic Resources</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, fontSize: 12, color: '#888' }}>
              <Link href="/prayer-times" style={{ color: '#0a3d2e', textDecoration: 'none' }}>🕌 Prayer Times</Link>
              <Link href="/qibla" style={{ color: '#0a3d2e', textDecoration: 'none' }}>🧭 Qibla Finder</Link>
              <Link href="/dua-generator" style={{ color: '#0a3d2e', textDecoration: 'none' }}>🤲 Dua Generator</Link>
              <Link href="/hijri-date" style={{ color: '#0a3d2e', textDecoration: 'none' }}>📅 Hijri Calendar</Link>
              <Link href="/zakat" style={{ color: '#0a3d2e', textDecoration: 'none' }}>💰 Zakat Calculator</Link>
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