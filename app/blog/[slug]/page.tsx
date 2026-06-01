import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { articlesMap, allArticles } from '../content';
import RelatedArticles from './RelatedArticles';
import BackButton from './BackButton';
import Breadcrumbs from '../../components/Breadcrumbs';
import { processAnchors } from '../../lib/linkUtils';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = articlesMap[params.slug];
  if (!article) return {} as Metadata;
  const url = `https://www.iloveislam.life/blog/${article.slug}`;
  return {
    title: `${article.title} | I Love Islam Blog`,
    description: article.excerpt,
    keywords: [article.category, 'islamic guide', 'muslim tips', article.slug.replace(/-/g, ' ')],
    alternates: { canonical: url },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url,
      type: 'article',
      siteName: 'I Love Islam',
      locale: 'en_US',
      publishedTime: article.date,
      authors: ['I Love Islam'],
      images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: ['/optimized/og-image.webp'],
      creator: '@iloveislam_life',
    },
  } as Metadata;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const article = articlesMap[slug];

  if (!article) {
    notFound();
  }

  const url = `https://www.iloveislam.life/blog/${article.slug}`;

  const related = allArticles
    .filter((a) => a.slug !== article.slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  const processed = processAnchors(article.content);

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Article structured data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "mainEntityOfPage": { "@type": "WebPage", "@id": url },
            "headline": article.title,
            "description": article.excerpt,
            "datePublished": article.date,
            "author": { "@type": "Organization", "name": "I Love Islam" },
            "publisher": {
              "@type": "Organization",
              "name": "I Love Islam",
              "logo": { "@type": "ImageObject", "url": "https://www.iloveislam.life/icon-512.png" }
            }
          }),
        }}
      />
      {/* BreadcrumbList structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iloveislam.life/" },
              { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.iloveislam.life/blog" },
              { "@type": "ListItem", "position": 3, "name": article.title, "item": `https://www.iloveislam.life/blog/${article.slug}` }
            ]
          })
        }}
      />

      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: article.title }]} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        
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
                       prose-headings:font-semibold prose-h2:text-emerald-700 dark:prose-h2:text-emerald-400
                       prose-p:text-gray-700 dark:prose-p:text-gray-300
                       prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:font-medium
                       prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-50 dark:prose-blockquote:bg-emerald-950/50
                       prose-li:marker:text-emerald-600"
            dangerouslySetInnerHTML={{ __html: processed }}
          />

          {/* Call to Action Box */}
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

          <RelatedArticles articles={related} currentSlug={article.slug} />

        </article>
      </div>
    </main>
  );
}