import Link from 'next/link';
import { allArticles } from './content';

export default function BlogPage() {
  const categories = [...new Set(allArticles.map(a => a.category))];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-5 py-2 rounded-full text-sm font-medium mb-6">
            📖 Islamic Knowledge
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
            Islamic Blog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Guidance, knowledge, and inspiration from the Quran and Sunnah
          </p>
        </div>

        {/* Categories & Articles */}
        {categories.map(category => {
          const categoryArticles = allArticles.filter(article => article.category === category);
          
          return (
            <section key={category} className="mb-20">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                {category}
                <span className="text-emerald-600 dark:text-emerald-400 text-2xl">•</span>
                <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                  {categoryArticles.length} articles
                </span>
              </h2>

              {/* Updated Grid - 2 columns on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryArticles.map(article => (
                  <Link 
                    key={article.slug} 
                    href={`/blog/${article.slug}`}
                    className="group block h-full"
                  >
                    <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col">
                      
                      {/* Emoji */}
                      <div className="text-6xl mb-6 transition-transform group-hover:scale-110 duration-300">
                        {article.emoji}
                      </div>

                      {/* Category & Date */}
                      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {article.category}
                        </span>
                        <span>
                          {new Date(article.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-semibold leading-tight text-gray-900 dark:text-white mb-4 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-3">
                        {article.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-gray-600 dark:text-gray-400 text-[15.5px] leading-relaxed flex-1 line-clamp-4">
                        {article.excerpt}
                      </p>

                      {/* Read Time */}
                      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                        Read • {article.readTime}
                        <span className="text-base transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

      </div>
    </main>
  );
}