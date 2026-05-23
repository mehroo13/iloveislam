'use client';

import FeaturedBanner from './components/FeaturedBanner';
import Newsletter from './components/Newsletter';
import BackToTop from './components/BackToTop';

export default function HomeClient() {
  return (
    <div className="w-full">
      <FeaturedBanner />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-4">Islamic Tools</h2>
          <p className="text-gray-600">
            Explore Zakat, Prayer Times, Qibla Finder, Quran, and more.
          </p>
        </section>

        <Newsletter />
      </main>

      <BackToTop />
    </div>
  );
}
