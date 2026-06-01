'use client';

import Link from 'next/link';
import { usePWA } from '../components/PWAProvider';

export default function InstallPage() {
  const { canInstall, installApp, isInstalled } = usePWA();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #071e14 0%, #0a3d2e 60%, #0d5238 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 text-center relative z-10">
          <Link href="/" className="inline-block mb-4 text-white/50 hover:text-white/80 text-sm transition-colors">← Back to Tools</Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'serif' }}>
            📲 Install I Love Islam
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-lg mx-auto">
            Get instant access to all Islamic tools from your home screen. Works offline — no app store needed.
          </p>

          {/* Install button if available */}
          {canInstall && !isInstalled && (
            <button
              onClick={installApp}
              className="mt-6 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-3 rounded-2xl text-sm transition-all active:scale-95 shadow-lg"
            >
              ⬇️ Install Now — It&apos;s Free
            </button>
          )}
          {isInstalled && (
            <div className="mt-6 inline-flex items-center gap-2 bg-emerald-800/50 text-emerald-300 px-6 py-3 rounded-2xl text-sm font-semibold">
              ✅ Already Installed
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">

        {/* Benefits Section */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">Why Install?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '⚡', title: 'Instant Access', desc: 'Open directly from your home screen — no browser needed' },
              { icon: '📡', title: 'Works Offline', desc: 'Dhikr, Zakat, Duas, 99 Names and more work without internet' },
              { icon: '🔔', title: 'Notifications', desc: 'Get prayer time reminders and daily dua notifications' },
              { icon: '💾', title: 'No Storage Needed', desc: 'Uses less than 5MB — much smaller than native apps' },
              { icon: '🔒', title: 'Always Updated', desc: 'Auto-updates in background — always the latest version' },
              { icon: '🆓', title: '100% Free', desc: 'No ads, no subscriptions, no app store fees' },
            ].map((item) => (
              <div key={item.title} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Installation Instructions */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">How to Install</h2>

          {/* iPhone / Safari */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🍎</span>
              <h3 className="font-bold text-gray-800 dark:text-gray-200">iPhone / iPad (Safari)</h3>
            </div>
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Open <strong className="text-gray-800 dark:text-gray-200">iloveislam.life</strong> in Safari (not Chrome)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>Tap the <strong className="text-gray-800 dark:text-gray-200">Share button</strong> (square with arrow) at the bottom</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                <span>Scroll down and tap <strong className="text-gray-800 dark:text-gray-200">&quot;Add to Home Screen&quot;</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">4</span>
                <span>Tap <strong className="text-gray-800 dark:text-gray-200">&quot;Add&quot;</strong> — the app icon appears on your home screen</span>
              </li>
            </ol>
          </div>

          {/* Android / Chrome */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="font-bold text-gray-800 dark:text-gray-200">Android (Chrome)</h3>
            </div>
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Open <strong className="text-gray-800 dark:text-gray-200">iloveislam.life</strong> in Chrome</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>Tap the <strong className="text-gray-800 dark:text-gray-200">three dots menu</strong> (⋮) in the top right</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">3</span>
                <span>Tap <strong className="text-gray-800 dark:text-gray-200">&quot;Add to Home screen&quot;</strong> or &quot;Install app&quot;</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">4</span>
                <span>Tap <strong className="text-gray-800 dark:text-gray-200">&quot;Install&quot;</strong> — done! Find it in your app drawer</span>
              </li>
            </ol>
          </div>

          {/* Windows / Mac */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💻</span>
              <h3 className="font-bold text-gray-800 dark:text-gray-200">Windows / Mac (Chrome / Edge)</h3>
            </div>
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Open <strong className="text-gray-800 dark:text-gray-200">iloveislam.life</strong> in Chrome or Edge</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>Look for the <strong className="text-gray-800 dark:text-gray-200">install icon</strong> (⊕) in the address bar</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">3</span>
                <span>Click <strong className="text-gray-800 dark:text-gray-200">&quot;Install&quot;</strong> — the app opens in its own window</span>
              </li>
            </ol>
          </div>
        </section>

        {/* Offline Status Section */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">What Works Offline?</h2>

          <div className="space-y-3">
            {/* Full Offline */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm mb-2">🟢 Works Fully Offline</h3>
              <div className="flex flex-wrap gap-2">
                {['Dhikr Counter', 'Zakat Calculator', '99 Names', 'Hijri Calendar', 'Dua Generator', 'Kids Games', 'Ramadan Planner', 'Sadaqah Tracker', 'Islamic Will', 'Inheritance Calc', 'Halal Finance', 'Kaffarah Calc', 'Name Finder', 'Hadith Search', 'Night Recitation'].map((tool) => (
                  <span key={tool} className="bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700">{tool}</span>
                ))}
              </div>
            </div>

            {/* Limited Offline */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-2">🟡 Limited Offline (cached data)</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Prayer Times', note: 'cached last location' },
                  { name: 'Qibla Finder', note: 'cached last location' },
                  { name: 'Halal Scanner', note: 'local database only' },
                  { name: 'Quran Reader', note: 'cached last surahs' },
                ].map((tool) => (
                  <span key={tool.name} className="bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 text-xs px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-700">
                    {tool.name} <span className="text-amber-500 dark:text-amber-500">({tool.note})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Needs Internet */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
              <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm mb-2">🔴 Needs Internet</h3>
              <div className="flex flex-wrap gap-2">
                {['Mosque Finder', 'Halal Travel Guide', 'Hajj Checklist'].map((tool) => (
                  <span key={tool} className="bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-700">{tool}</span>
                ))}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">These tools require live map data or location services that need an active connection.</p>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">Browser vs Installed App</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left p-3 text-gray-500 dark:text-gray-400 font-medium text-xs">Feature</th>
                  <th className="text-center p-3 text-gray-500 dark:text-gray-400 font-medium text-xs">Browser</th>
                  <th className="text-center p-3 text-emerald-600 dark:text-emerald-400 font-medium text-xs">Installed</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-600 dark:text-gray-400">
                {[
                  ['Home screen icon', '❌', '✅'],
                  ['Works offline', '❌', '✅'],
                  ['Full screen (no URL bar)', '❌', '✅'],
                  ['Push notifications', '❌', '✅'],
                  ['Instant loading', '⚠️ Slow', '✅ Fast'],
                  ['Background updates', '❌', '✅'],
                  ['App shortcuts', '❌', '✅'],
                  ['Storage needed', '0 MB', '< 5 MB'],
                ].map(([feature, browser, installed]) => (
                  <tr key={feature} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="p-3 font-medium text-gray-700 dark:text-gray-300">{feature}</td>
                    <td className="p-3 text-center">{browser}</td>
                    <td className="p-3 text-center">{installed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          {canInstall && !isInstalled ? (
            <button
              onClick={installApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-10 py-4 rounded-2xl text-base transition-all active:scale-95 shadow-xl"
            >
              ⬇️ Install I Love Islam — Free
            </button>
          ) : isInstalled ? (
            <div className="space-y-3">
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">✅ App is installed!</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Find &quot;I Love Islam&quot; on your home screen or app drawer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Follow the instructions above for your device to install.</p>
              <Link href="/" className="inline-block text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline">
                ← Back to all tools
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
