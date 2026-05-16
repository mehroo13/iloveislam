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
      {/* Compact Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-4 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Back
          </Link>
          <h1 className="text-lg font-bold tracking-wide">Contact Us</h1>
          <div className="w-6" />
        </div>
        <p className="text-center text-white/60 text-xs mt-2">
          We reply within 48 hours inshaAllah
        </p>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 pb-16">
        {/* The Form – instantly visible */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {status === 'sent' ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <p className="font-bold text-gray-800 text-lg mb-2">JazakAllah Khair!</p>
              <p className="text-gray-500 text-sm mb-4">We'll reply within 48 hours inshaAllah.</p>
              <button
                onClick={() => setStatus('idle')}
                className="px-5 py-2 bg-emerald-800 text-white rounded-xl text-sm font-medium"
              >
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50"
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
                  Something went wrong. Please try again or email us at{' '}
                  <a href="mailto:contact@iloveislam.life" className="underline">contact@iloveislam.life</a>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm transition disabled:opacity-60 shadow-sm"
              >
                {status === 'sending' ? 'Sending...' : 'Send Message ✉️'}
              </button>

              <p className="text-center text-gray-300 text-xs">
                Your email is never shown publicly.
              </p>
            </form>
          )}
        </div>

        {/* Short footer */}
        <div className="text-center mt-10">
          <p className="font-arabic text-emerald-800 text-lg mb-1">بسم الله الرحمن الرحيم</p>
          <p className="text-xs text-gray-400">Made with ❤️ for the Ummah · Always Free</p>
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