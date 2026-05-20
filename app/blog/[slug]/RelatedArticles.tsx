// app/blog/[slug]/RelatedArticles.tsx
import Link from 'next/link';

interface RelatedArticle {
  slug: string;
  title: string;
  excerpt: string;
  emoji: string;
  readTime: string;
  category: string;
}

export default function RelatedArticles({ articles, currentSlug }: { articles: RelatedArticle[], currentSlug: string }) {
  if (articles.length === 0) return null;

  return (
    <section style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>📚 You may also like</h3>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {articles.map((article) => (
          <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '1rem',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              background: '#fafafa',
              transition: 'transform 0.2s, box-shadow 0.2s',
              height: '100%',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{article.emoji}</div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1a1a1a' }}>{article.title}</h4>
              <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.5rem' }}>{article.excerpt.substring(0, 80)}...</p>
              <div style={{ fontSize: '0.75rem', color: '#adb5bd' }}>
                {article.category} • {article.readTime}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}