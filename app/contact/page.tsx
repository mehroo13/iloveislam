'use client';

import { useState } from 'react';
import Link from 'next/link';

const SUBJECTS = [
  'General Question',
  'Bug Report',
  'Tool Suggestion',
  'Islamic Question',
  'Partnership / Collaboration',
  'AdSense / Business',
  'Other',
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('sending');
    try {
      const res = await fetch('https://formspree.io/f/xpqbybvq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          _replyto: form.email,
        }),
      });
      if (res.ok) {
        setStatus('sent');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-5 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-2 left-4 text-8xl">☽</div>
          <div className="absolute bottom-2 right-4 text-6xl">✦</div>
        </div>
        <div className="max-w-2xl mx-auto relative z-10 flex items-center justify-between mb-6">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Back to Tools
          </Link>
          <div />
        </div>
        <div className="relative z-10 text-center">
          <p className="text-white/50 text-xs tracking-widest uppercase mb-2">I Love Islam</p>
          <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            Questions, suggestions, or bug reports — we reply within 48 hours inshaAllah
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-16 space-y-8">
        {/* Primary Contact – Email (prominent) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
          <div className="text-3xl mb-2">✉️</div>
          <h2 className="font-bold text-gray-800 text-lg mb-1">Email Us Directly</h2>
          <a
            href="mailto:contact@iloveislam.life"
            className="inline-block text-xl font-bold text-emerald-800 hover:text-emerald-600 transition mt-2"
          >
            contact@iloveislam.life
          </a>
          <p className="text-xs text-gray-400 mt-2">
            For urgent matters, email is the fastest way to reach us.
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🐛', title: 'Bug Report', desc: 'Found something broken?', detail: 'Describe the issue & tool' },
            { icon: '💡', title: 'Suggest a Tool', desc: 'What should we build next?', detail: 'We read every suggestion' },
            { icon: '🤝', title: 'Partnership', desc: 'Work with us', detail: 'Collabs, business, AdSense' },
          ].map(c => (
            <div key={c.title} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
              <div className="text-3xl mb-2">{c.icon}</div>
              <p className="font-semibold text-gray-800 text-sm mb-1">{c.title}</p>
              <p className="text-gray-500 text-xs">{c.desc}</p>
              <p className="text-gray-400 text-xs mt-1">{c.detail}</p>
            </div>
          ))}
        </div>

        {/* Message Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-7">
          <h2 className="font-bold text-gray-800 text-lg mb-1">Send a Message</h2>
          <p className="text-gray-400 text-xs mb-6">Your email stays private — we never share it.</p>

          {status === 'sent' ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">✅</div>
              <p className="font-bold text-gray-800 text-lg mb-2">JazakAllah Khair!</p>
              <p className="text-gray-500 text-sm mb-4">Your message has been sent. We'll reply within 48 hours inshaAllah.</p>
              <button onClick={() => setStatus('idle')} className="px-5 py-2 bg-emerald-800 text-white rounded-xl text-sm font-medium">
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ahmed / Fatima..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Subject</label>
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50"
                >
                  <option value="">Select a subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Message *</label>
                <textarea
                  required
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Write your message here..."
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50 resize-none"
                />
              </div>

              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                  Something went wrong. Please email us directly at{' '}
                  <a href="mailto:contact@iloveislam.life" className="underline">contact@iloveislam.life</a>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm transition disabled:opacity-60 shadow-md"
              >
                {status === 'sending' ? 'Sending...' : 'Send Message ✉️'}
              </button>

              <p className="text-center text-gray-300 text-xs">
                Your message is sent privately. Your email is never shown publicly.
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-100">
          <p className="font-arabic text-emerald-800 text-xl mb-2">بسم الله الرحمن الرحيم</p>
          <p className="text-xs text-gray-400">Made with ❤️ for the Ummah · Always Free · No Sign-up</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">Home</Link>
            <Link href="/about" className="text-xs text-gray-400 hover:text-gray-600">About</Link>
            <Link href="/faq" className="text-xs text-gray-400 hover:text-gray-600">FAQ</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}