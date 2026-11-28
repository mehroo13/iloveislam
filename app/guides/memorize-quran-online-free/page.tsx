// app/guides/memorize-quran-online-free/page.tsx — SEO guide page
// (2026-11-28). Original article, written from the app's real features.
// No copied text, no invented hadith or benefits, no tajweed claims:
// the coach checks word accuracy only.
import type { Metadata } from 'next';
import TrustShell from '../../components/TrustShell';
import { SITE_URL } from '../../hifz/lib/fetch';
import {
  GuideBreadcrumb,
  GuideCta,
  GuideFaq,
  GuideMore,
  guideJsonLd,
  jsonLdHtml,
  type Faq,
} from '../guide-shared';

const TITLE = 'Memorize Quran Online Free — No App, No Sign-Up';
const DESCRIPTION =
  'Memorize the Quran online for free in your browser — nothing to install, no sign-up, no payment. Recite aloud and get instant word-by-word feedback from the AI coach.';

export const metadata: Metadata = {
  title: `${TITLE} | I Love Islam`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/guides/memorize-quran-online-free` },
  openGraph: {
    title: `${TITLE} | I Love Islam`,
    description: DESCRIPTION,
    url: `${SITE_URL}/guides/memorize-quran-online-free`,
    siteName: 'I Love Islam',
    type: 'article',
    images: [
      {
        url: '/optimized/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Memorize Quran Online Free — No App, No Sign-Up — I Love Islam',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} | I Love Islam`,
    description: DESCRIPTION,
    images: ['/optimized/og-image.webp'],
  },
};

const FAQS: Faq[] = [
  {
    q: 'Is it really free to memorize the Quran online here?',
    a: 'Yes. Everything on this site is free: the whole Quran, the AI coach, the hifz plans, Test Mode and Voice Search. There is no paid tier, no paywall and no free-trial limit.',
  },
  {
    q: 'Do I need to download an app?',
    a: 'No. This is a website that works in your browser, on a phone, tablet or computer. There is nothing to install and nothing to update — just open the site and start.',
  },
  {
    q: 'Do I need an account or sign-up?',
    a: 'No. Everything works without an account. An account is optional, and it only backs up your progress so you can continue on another device.',
  },
  {
    q: 'Can I memorize the Quran on my phone?',
    a: 'Yes. The site works on phones, tablets and computers. You need a microphone so the coach can hear you recite — every phone and most laptops have one built in.',
  },
  {
    q: 'Does it work for beginners?',
    a: 'Yes. Beginners usually start with Al-Fatihah and the short surahs in Juz Amma, then move to longer surahs. The 7-day and 30-day hifz plans break each surah into small daily portions, so you always know what to learn next.',
  },
  {
    q: 'Is my recitation audio uploaded anywhere?',
    a: 'No. Your recitation audio is processed on your device and never uploaded. Your progress — streaks, memorized ayahs and mistakes — is stored only in your own browser, and you can export or delete it at any time.',
  },
];

const card = 'rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]';
const h2 = 'text-lg font-bold';
const p = 'mt-2 text-sm leading-relaxed text-[#6B7280]';
const ol = 'mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[#6B7280]';

export default function MemorizeQuranOnlineFreeGuide() {
  return (
    <TrustShell title="Memorize Quran Online Free">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(
            guideJsonLd({
              slug: 'memorize-quran-online-free',
              title: TITLE,
              description: DESCRIPTION,
              faqs: FAQS,
            }),
          ),
        }}
      />
      <GuideBreadcrumb current="Memorize Quran Online Free" />
      <div className="space-y-4">
        <div className={card}>
          <p className="text-sm leading-relaxed text-[#6B7280]">
            You can memorize the Quran online, for free, without installing an app and without
            signing up. This site is a web tool: you open it in your browser, pick a surah, and
            recite aloud while the AI coach listens and checks every word. The whole Quran is
            here — all 114 surahs, all 30 juz, all 6,236 ayahs — with hifz plans, Test Mode and
            a revision queue to keep what you learn.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Why memorize in the browser?</h2>
          <p className={p}>
            An app you have to install is one more barrier between you and your daily practice.
            A web tool works on any device you already own — your phone in the morning, your
            laptop in the evening — with nothing to download and nothing to update. Your
            progress is stored in your browser, and an optional account backs it up so you can
            continue on another device. There is no payment step anywhere: everything is free,
            and it stays free.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>How the online coach helps</h2>
          <p className={p}>
            The hardest part of memorizing alone is knowing whether you actually said the verse
            correctly. Reading silently cannot tell you that. The coach solves it: you recite
            aloud into your microphone, and it checks your recitation word by word, showing you
            straight away which words were right and which were skipped or wrong. You repeat
            the passage until it comes out clean. The coach checks word accuracy only — whether
            you said the right words in the right order. It does not check tajweed, and it is
            not a replacement for a qualified teacher.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>What you need to start</h2>
          <ol className={ol}>
            <li>A device with a microphone — a phone, tablet or laptop.</li>
            <li>A quiet place, so the coach can hear you clearly.</li>
            <li>A few minutes a day. A short daily session beats a long session once a week.</li>
          </ol>
          <p className={p}>
            That is all. There is no account to create and nothing to pay before you begin.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>A simple routine that works</h2>
          <p className={p}>
            Pick a plan — the 7-day and 30-day hifz plans break each surah into daily portions.
            Each day, listen to the new portion first, then recite it aloud to the coach until
            it is clean, then recite it together with what you learned yesterday. Finish by
            revising an older surah from your revision queue. Test Mode hides the verses and
            quizzes you, so you can check honestly whether a surah is really memorized. Keep
            the routine small enough to do every day: consistency is what turns new ayahs into
            lasting memorization.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Your privacy</h2>
          <p className={p}>
            Your recitation audio is processed on your device and never uploaded. No personal
            data is collected, and everything works without an account. If you do create an
            optional account, it only backs up your progress to your other devices.
          </p>
        </div>

        <GuideCta />
        <GuideFaq faqs={FAQS} />
        <GuideMore except="memorize-quran-online-free" />
      </div>
    </TrustShell>
  );
}
