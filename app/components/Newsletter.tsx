'use client';
// app/components/Newsletter.tsx
import { useState } from 'react';

interface TranslationsType {
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterPlaceholder: string;
  newsletterButton: string;
}

export default function Newsletter({ t }: { t: TranslationsType }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('https://formspree.io/f/xpqbybvq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, _subject: 'Newsletter Subscription — I Love Islam' }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
        setTimeout(() => setStatus('idle'), 4000);
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'newsletter_signup', { event_category: 'engagement', event_label: email });
        }
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/50">
      <div className="flex items-center gap-2 mb-1">
        <span>📧</span>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t.newsletterTitle}</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t.newsletterSubtitle}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder={t.newsletterPlaceholder} required
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          type="submit" disabled={status === 'loading'}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#0a3d2e' }}
        >
          {status === 'loading' ? '...' : t.newsletterButton}
        </button>
      </form>
      {status === 'success' && <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-2">✓ JazakAllah Khayran! You're subscribed.</p>}
      {status === 'error' && <p className="text-red-500 text-xs mt-2">Something went wrong. Please try again.</p>}
    </div>
  );
}