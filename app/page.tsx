import Link from 'next/link';
import Image from 'next/image';
import { TOOLS_DATA, ALL_FEATURED_TOOLS } from './lib/toolsData';
import HomeInteractiveClient from './components/HomeInteractiveClient';

export default function Home() {
  const tools = TOOLS_DATA();
  const featured = ALL_FEATURED_TOOLS[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #071e14 0%, #0a3d2e 60%, #0d5238 100%)' }}>
        <div className="relative z-10 px-4 pt-3 pb-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              <Link href="/" aria-label="I Love Islam — Home" className="flex-shrink-0 mr-1 hover:opacity-80 transition-opacity">
                <Image src="/logo2.png" alt="I Love Islam" width={52} height={52} className="rounded-xl" priority />
              </Link>
              <nav className="hidden sm:flex gap-2 text-white/45 text-xs items-center">
                <Link href="/about">About</Link>
                <Link href="/blog">Blog</Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              {/* Interactive controls are client-only in HomeInteractive */}
            </div>
          </div>

          <div className="text-center">
            <Link href="/" className="inline-block text-5xl md:text-6xl mb-1.5 hover:opacity-80 transition-opacity cursor-pointer tracking-tight" style={{ color: '#c8a96e', fontFamily: 'serif' }} aria-label="I Love Islam — Home">♡ I Love Islam</Link>
            <p className="text-white/45 text-xs mb-4 tracking-wide">The complete toolkit for every Muslim</p>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            {/* Featured Banner (server-rendered) */}
            {featured && (
              <section className="mb-5 rounded-2xl overflow-hidden" style={{ background: featured.gradient }}>
                <Link href={featured.href} className="block p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${featured.accent}18`, border: `1px solid ${featured.accent}30` }}>{featured.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold tracking-[0.18em] uppercase mb-0.5" style={{ color: featured.accent }}>{featured.badge}</p>
                      <p className="text-white font-semibold text-sm leading-tight mb-0.5 truncate">{featured.title}</p>
                      <p className="text-white/40 text-xs leading-tight truncate">{featured.desc}</p>
                    </div>
                    <div className="flex-shrink-0 text-sm" style={{ color: featured.accent }}>→</div>
                  </div>
                </Link>
              </section>
            )}

            {/* Server-rendered tool grid */}
            {tools.map(section => (
              <section key={section.category} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{section.emoji}</span>
                  <h2 className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400">{section.category}</h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {section.items.map(item => (
                    <Link key={item.href} href={item.href} className="group bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg transition-all flex flex-col items-center text-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 ${item.color}`}>{item.icon}</div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight mb-0.5">{item.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{item.desc}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="lg:w-64 xl:w-72 flex-shrink-0 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">⭐ Popular Tools</p>
              <div className="space-y-0.5">
                <Link href="/halal-scanner" className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-gray-600 dark:text-gray-400 hover:bg-emerald-50">📷 HalalScan <span>→</span></Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Client interactive overlay (search, theme, consent) */}
      <HomeInteractiveClient />
    </div>
  );
}
