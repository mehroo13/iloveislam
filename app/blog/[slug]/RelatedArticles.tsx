'use client';
import Link from 'next/link';

interface RelatedArticle {
  slug: string;
  title: string;
  excerpt: string;
  emoji: string;
  readTime: string;
  category: string;
}

export default function RelatedArticles({ 
  articles, 
  currentSlug 
}: { 
  articles: RelatedArticle[], 
  currentSlug: string 
}) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-16">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
        📚 You May Also Like
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article) => (
          <Link 
            key={article.slug} 
            href={`/blog/${article.slug}`}
            className="group block"
          >
            <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-7 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              
              {/* Emoji */}
              <div className="text-5xl mb-5 transition-transform group-hover:scale-110 duration-300">
                {article.emoji}
              </div>

              {/* Category & Read Time */}
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
                <span>{article.category}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>{article.readTime}</span>
              </div>

              {/* Title */}
              <h4 className="text-xl font-semibold leading-tight text-gray-900 dark:text-white mb-4 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {article.title}
              </h4>

              {/* Excerpt */}
              <p className="text-gray-600 dark:text-gray-400 line-clamp-3 text-[15px] leading-relaxed">
                {article.excerpt}
              </p>

              <div className="mt-6 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Read article 
                <span className="text-base transition-transform group-hover:translate-x-0.5">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}