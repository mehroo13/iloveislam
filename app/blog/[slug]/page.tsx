import { notFound } from 'next/navigation';
import { articlesMap, allArticles } from '../content';
import RelatedArticles from './RelatedArticles';
import BackButton from './BackButton';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const article = articlesMap[slug];

  if (!article) {
    notFound();
  }

  const related = allArticles
    .filter((a) => a.slug !== article.slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* Back Button */}
        <BackButton />

        <article className="pt-6">
          
          {/* Meta Info */}
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
              {article.category}
            </span>
            <span>{article.readTime}</span>
            <span>•</span>
            <span>
              {new Date(article.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Title + Emoji */}
          <div className="flex gap-4 items-start mb-6">
            <span className="text-5xl sm:text-6xl flex-shrink-0 mt-1">{article.emoji}</span>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-gray-900 dark:text-white tracking-tight">
              {article.title}
            </h1>
          </div>

          {/* Excerpt */}
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-10 border-l-4 border-emerald-500 pl-6">
            {article.excerpt}
          </p>

          {/* Article Content */}
          <div
            className="article-body prose prose-lg dark:prose-invert max-w-none
                       prose-headings:text-gray-900 dark:prose-headings:text-white
                       prose-headings:font-semibold
                       prose-p:text-gray-700 dark:prose-p:text-gray-300
                       prose-a:text-emerald-600 dark:prose-a:text-emerald-400
                       prose-a:font-medium hover:prose-a:underline
                       prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-50 dark:prose-blockquote:bg-emerald-950/50
                       prose-li:marker:text-emerald-600"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Call to Action */}
          <div className="my-16 p-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-3xl border border-emerald-100 dark:border-emerald-900 text-center">
            <p className="text-emerald-700 dark:text-emerald-300 font-medium mb-4">
              Liked this article? Help your family plan according to Islam
            </p>
            <a
              href="/inheritance"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all hover:scale-105"
            >
              Try Free Inheritance Calculator →
            </a>
          </div>

          <hr className="my-12 border-gray-200 dark:border-gray-800" />

          {/* Related Articles */}
          <RelatedArticles articles={related} currentSlug={article.slug} />

        </article>
      </div>

      {/* Global Article Styles */}
      <style jsx global>{`
        .article-body {
          line-height: 1.75;
          font-size: 1.08rem;
        }

        .article-body h2 {
          font-size: 2.1rem;
          margin-top: 3rem;
          margin-bottom: 1.25rem;
          color: #10b981;
        }

        .article-body h3 {
          font-size: 1.55rem;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }

        .article-body p {
          margin-bottom: 1.4rem;
        }

        .article-body ul, .article-body ol {
          margin-bottom: 1.6rem;
          padding-left: 1.4rem;
        }

        .article-body li {
          margin-bottom: 0.75rem;
        }

        .article-body a {
          color: #10b981;
          text-decoration: underline;
          text-underline-offset: 6px;
          transition: all 0.2s;
        }

        .article-body a:hover {
          color: #059669;
        }

        /* Beautiful boxes for highlighted content */
        .article-body .bg-gradient-to-br {
          border-radius: 20px;
        }
      `}</style>
    </main>
  );
}