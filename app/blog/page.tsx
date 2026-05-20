// app/blog/page.tsx
import Link from 'next/link';
import { allArticles } from './content';

export default function BlogPage() {
  // Optional: group by category
  const categories = [...new Set(allArticles.map(a => a.category))];

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Islamic Blog</h1>
      <p style={{ color: '#6c757d', marginBottom: '2rem' }}>Guidance, knowledge, and inspiration from the Quran and Sunnah</p>

      {categories.map(category => (
        <section key={category} style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', borderBottom: '2px solid #2b8c4a', paddingBottom: '0.25rem', marginBottom: '1.25rem' }}>
            {category}
          </h2>
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {allArticles
              .filter(article => article.category === category)
              .map(article => (
                <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    background: '#ffffff',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{article.emoji}</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: '#1a1a1a' }}>{article.title}</h3>
                    <p style={{ color: '#6c757d', marginBottom: '0.5rem' }}>{article.excerpt.substring(0, 120)}...</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#adb5bd' }}>
                      <span>{article.readTime}</span>
                      <span>{new Date(article.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}