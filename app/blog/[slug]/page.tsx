// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { articlesMap, allArticles } from '../content';
import RelatedArticles from './RelatedArticles';
import BackButton from './BackButton';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  // Pre‑build all article pages at build time
  return allArticles.map((article) => ({ slug: article.slug }));
}

export default function BlogPostPage({ params }: PageProps) {
  const article = articlesMap[params.slug];

  if (!article) {
    notFound();
  }

  // Helper to get related articles (excluding current)
  const related = allArticles
    .filter((a) => a.slug !== article.slug)
    .sort(() => 0.5 - Math.random()) // randomize
    .slice(0, 3);

  return (
    <main className="blog-post" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <BackButton />
      
      <article>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
            {article.category} • {article.readTime} • {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>{article.title}</h1>
        
        <div className="article-meta" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2rem' }}>{article.emoji}</span>
          <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>{article.excerpt}</span>
        </div>

        <div 
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
          style={{ lineHeight: 1.7, fontSize: '1.05rem' }}
        />

        <hr style={{ margin: '2rem 0' }} />

        <RelatedArticles articles={related} currentSlug={article.slug} />
      </article>

      <style jsx>{`
        .article-body h2 {
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .article-body p {
          margin-bottom: 1rem;
        }
        .article-body ul, .article-body ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .article-body li {
          margin-bottom: 0.5rem;
        }
        .article-body a {
          color: #2b8c4a;
          text-decoration: underline;
        }
      `}</style>
    </main>
  );
}