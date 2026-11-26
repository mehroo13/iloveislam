// app/contact/page.tsx — Contact (rebuilt 2026-11-25 in the new app
// design: light grey, white cards, back button to Home). The form
// itself is unchanged (Formspree POST). The "How Can We Help You?"
// and "Common Reasons" sections used to live in the layout — they
// are now in the page, below the form.
'use client';

import { useState } from 'react';
import TrustShell from '../components/TrustShell';

const SUBJECTS = [
  'General Question',
  'Bug Report',
  'Feature Suggestion',
  'Islamic Question',
  'Partnership / Collaboration',
  'AdSense / Business',
  'Other',
];

const INPUT =
  'w-full rounded-xl border border-[#E5E7EB] bg-[#F8F8F8] px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1FA36B]/30';

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
    <TrustShell title="Contact Us">
      <div className="space-y-4">
        <p className="text-center text-xs text-[#6B7280]">We reply within 48 hours inshaAllah</p>
        {/* Audit m9: the only published address lived in the Terms.
            Show it here too — the form is not the only way to reach us. */}
        <p className="text-center text-sm text-[#6B7280]">
          Prefer email? Write to us at{' '}
          <a href="mailto:contact@iloveislam.life" className="font-semibold text-[#1FA36B] underline">
            contact@iloveislam.life
          </a>
        </p>

        {/* The form — instantly visible */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {status === 'sent' ? (
            <div className="py-12 text-center">
              <p className="text-lg font-bold">JazakAllah Khair!</p>
              <p className="mt-2 text-sm text-[#6B7280]">We&apos;ll reply within 48 hours inshaAllah.</p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-4 rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7280]">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ahmed / Fatima..."
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7280]">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    className={INPUT}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#6B7280]">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className={INPUT}
                >
                  <option value="">Select a subject...</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#6B7280]">Message *</label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Write your message here..."
                  rows={5}
                  className={`${INPUT} resize-none`}
                />
              </div>

              {status === 'error' && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  Something went wrong. Please try again or email us at{' '}
                  <a href="mailto:contact@iloveislam.life" className="underline">
                    contact@iloveislam.life
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full rounded-full bg-[#102E26] py-3.5 text-sm font-semibold text-white transition hover:bg-[#1FA36B] disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-center text-xs text-[#9CA3AF]">Your email is never shown publicly.</p>
            </form>
          )}
        </div>

        {/* How can we help — moved in from the old layout. */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h2 className="text-lg font-bold">How Can We Help You?</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            We welcome all feedback, questions, and suggestions from our community. Whether you have found a bug in
            the app, want to suggest a new feature, have a question about how the coach works, or simply want to share
            your experience — we would love to hear from you. Our team reads every message personally and strives to
            respond within 48 hours.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
            I Love Islam is built for the Ummah. Many features and improvements have come directly from user
            suggestions. Your feedback helps us make this app better for Muslims worldwide. Do not hesitate to reach
            out — no question is too small, and every suggestion is valued.
          </p>
        </div>

        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h3 className="text-base font-bold">Common Reasons to Contact Us</h3>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-[#6B7280]">
            <p>
              <strong className="text-[#111827]">Bug Reports:</strong> If the app is not working correctly, please
              describe what happened, which device and browser you are using, and any error messages you see.
              Screenshots are very helpful.
            </p>
            <p>
              <strong className="text-[#111827]">Feature Suggestions:</strong> Have an idea for a new feature? We are
              always looking to improve the app based on community needs.
            </p>
            <p>
              <strong className="text-[#111827]">Content Corrections:</strong> If you notice any Quranic text,
              translation or reference that needs correction, please let us know with the correct source.
            </p>
            <p>
              <strong className="text-[#111827]">Partnership Inquiries:</strong> If you represent an Islamic
              organization, mosque, or educational institution and would like to collaborate, we are open to
              discussions.
            </p>
          </div>
        </div>

        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <p className="font-quran text-xl text-[#111827]">بسم الله الرحمن الرحيم</p>
        </div>
      </div>
    </TrustShell>
  );
}
