'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const SUBJECTS = [
    'General Question',
    'Bug Report',
    'Tool Suggestion',
    'Islamic Question',
    'Partnership / Collaboration',
    'AdSense / Business',
    'Other',
  ];

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
    <div className="min-h-screen" style={{ background: '#f7f6f2' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 50%, #0a3d2e 100%)' }}
        className="px-4 pt-4 pb-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-8 text-white/5 text-8xl">☽</div>
          <div className="absolute bottom-4 right-8 text-white/5 text-6xl">✦</div>
        </div>
        <div className="relative z-10 flex items-center justify-between mb-6">
          <Link href="/" className="text-white/50 hover:text-white/80 text-xs transition-colors">← Back to Tools</Link>
          <div />
        </div>
        <div className="relative z-10">
          <p className="text-white/40 text-xs tracking-widest uppercase mb-2">I Love Islam</p>
          <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
          <p className="text-white/50 text-sm">We'd love to hear from you — questions, suggestions, bug reports</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-16">

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: '✉️', title: 'Email', desc: 'Send us a message', detail: 'We reply within 48 hours' },
            { icon: '🐛', title: 'Bug Reports', desc: 'Found something broken?', detail: 'Describe the issue and tool' },
            { icon: '💡', title: 'Suggestions', desc: 'New tool ideas?', detail: 'We read every suggestion' },
          ].map(c => (
            <div key={c.title} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-3xl mb-2">{c.icon}</div>
              <p className="font-semibold text-gray-800 text-sm mb-1">{c.title}</p>
              <p className="text-gray-500 text-xs">{c.desc}</p>
              <p className="text-gray-400 text-xs mt-1">{c.detail}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8">
          <h2 className="font-bold text-gray-800 text-lg mb-1">Send a Message</h2>
          <p className="text-gray-400 text-xs mb-6">Your email stays private — we never display or share it.</p>

          {status === 'sent' ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <p className="font-bold text-gray-800 text-lg mb-2">JazakAllah Khair!</p>
              <p className="text-gray-500 text-sm mb-2">Your message has been sent. We'll reply within 48 hours insha'Allah.</p>
              <button onClick={() => setStatus('idle')} className="mt-4 text-xs text-white px-5 py-2 rounded-xl" style={{ background: '#0a3d2e' }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Your Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ahmed / Fatima..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-emerald-300 bg-gray-50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Your Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-emerald-300 bg-gray-50" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Subject</label>
                <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-emerald-300 bg-gray-50">
                  <option value="">Select a subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Message *</label>
                <textarea required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Write your message here..."
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-emerald-300 bg-gray-50 resize-none" />
              </div>

              {status === 'error' && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
                  Something went wrong. Please try emailing us directly at mehrakhanuet3@gmail.com
                </div>
              )}

              <button type="submit" disabled={status === 'sending'}
                className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #0a3d2e, #0d5238)' }}>
                {status === 'sending' ? 'Sending...' : 'Send Message ✉️'}
              </button>

              <p className="text-center text-gray-300 text-xs">
                Your message is sent privately. Your email is never shown publicly.
              </p>
            </form>
          )}
        </div>

        {/* Bismillah footer */}
        <div className="text-center mt-8">
          <p className="font-arabic text-emerald-800 text-xl mb-1">بسم الله الرحمن الرحيم</p>
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
