import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — I Love Islam | Free Islamic Tools',
  description:
    'Get in touch with the I Love Islam team. Report bugs, suggest new tools, ask Islamic questions, or discuss partnerships. We reply within 48 hours inshaAllah.',
  openGraph: {
    title: 'Contact Us — I Love Islam',
    description: 'Reach out to the I Love Islam team. We’re here to help.',
    type: 'website',
    url: 'https://iloveislam.life/contact',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us — I Love Islam',
    description: 'Report bugs, suggest tools, or just say salam.',
  },
  alternates: { canonical: 'https://iloveislam.life/contact' },
  robots: { index: true, follow: true },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <section className="max-w-xl mx-auto px-4 py-8 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-3">How Can We Help You?</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            We welcome all feedback, questions, and suggestions from our community. Whether you have found a bug in one of our tools, want to suggest a new feature, have a question about how a tool works, or simply want to share your experience — we would love to hear from you. Our team reads every message personally and strives to respond within 48 hours.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            I Love Islam is built for the Ummah, by the Ummah. Many of our tools and improvements have come directly from user suggestions. Your feedback helps us make this platform better for millions of Muslims worldwide. Do not hesitate to reach out — no question is too small, and every suggestion is valued.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-3">Common Reasons to Contact Us</h3>
          <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Bug Reports:</strong> If a tool is not working correctly, please describe what happened, which device and browser you are using, and any error messages you see. Screenshots are very helpful.</p>
            <p><strong className="text-gray-800">Tool Suggestions:</strong> Have an idea for a new Islamic tool? We are always looking to expand our collection based on community needs.</p>
            <p><strong className="text-gray-800">Content Corrections:</strong> If you notice any Islamic content that needs correction (a hadith reference, Quranic verse, or calculation method), please let us know with the correct source.</p>
            <p><strong className="text-gray-800">Translation Help:</strong> We support 8 languages and are always looking for native speakers to help improve translations.</p>
            <p><strong className="text-gray-800">Partnership Inquiries:</strong> If you represent an Islamic organization, mosque, or educational institution and would like to collaborate, we are open to discussions.</p>
          </div>
        </div>
      </section>
    </>
  );
}