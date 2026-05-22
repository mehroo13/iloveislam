"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { allArticles } from './content';

export default function BlogPage() {
  const categories = useMemo(() => {
    const unique = [...new Set(allArticles.map(a => a.category))];
    return ['All', ...unique];
  }, []);

  const [selected, setSelected] = useState<string>('All');

  const filtered = useMemo(() => {
    return selected === 'All' ? allArticles : allArticles.filter(a => a.category === selected);
  }, [selected]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-5 py-2 rounded-full text-sm font-medium mb-4">
            📖 Islamic Knowledge
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            Islamic Blog
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Guidance, knowledge, and inspiration from the Quran and Sunnah
          </p>
        </div>

        {/* Category Selector */}
        <div className="mb-8">
          <nav className="flex items-center gap-3 overflow-x-auto py-2">
            {categories.map(cat => {
              const active = cat === selected;
              return (
                <button
                  key={cat}
                  onClick={() => setSelected(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none ${active ? 'bg-emerald-600 text-white shadow-lg transform scale-105' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:scale-[1.03]'}`}
                  aria-pressed={active}
                >
                  {cat}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Articles Grid */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {selected === 'All' ? 'All Articles' : `${selected} — ${filtered.length} articles`}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(article => (
              <Link 
                key={article.slug} 
                href={`/blog/${article.slug}`}
                className="group block h-full"
              >
                <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col">
                  <div className="text-6xl mb-6 transition-transform group-hover:scale-110 duration-300">
                    {article.emoji}
                  </div>

                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {article.category}
                    </span>
                    <span>
                      {new Date(article.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="text-2xl font-semibold leading-tight text-gray-900 dark:text-white mb-4 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-3">
                    {article.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400 text-[15.5px] leading-relaxed flex-1 line-clamp-4">
                    {article.excerpt}
                  </p>

                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                    Read • {article.readTime}
                    <span className="text-base transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}