'use client';

import Link from 'next/link';
import { useState } from 'react';

type ArticleMeta = {
  slug: string;
  title: string;
  emoji: string;
  readTime: string;
  category: string;
  excerpt: string;
  date: string;
};

export default function RelatedArticles({ articles }: { articles: ArticleMeta[] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0a3d2e', margin: '0 0 12px' }}>Related Articles</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {articles.map(r => (
          <RelatedCard key={r.slug} article={r} />
        ))}
      </div>
    </div>
  );
}

function RelatedCard({ article }: { article: ArticleMeta }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: `1px solid ${hovered ? '#0a3d2e' : '#ede9e2'}`,
          padding: '16px',
          transition: 'border-color .15s',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ fontSize: 24, marginBottom: 8 }}>{article.emoji}</div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0a3d2e', margin: '0 0 4px', lineHeight: 1.3 }}>{article.title}</p>
        <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>{article.readTime}</p>
      </div>
    </Link>
  );
}