// app/guides/learn-quran-online/page.tsx — SEO guide page
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

const TITLE = 'Learn Quran Online Free — Read, Listen & Recite';
const DESCRIPTION =
  'Learn the Quran online for free: read the Madani Mushaf page by page, listen to recitation, and practise aloud with instant word-by-word feedback. No sign-up needed.';

export const metadata: Metadata = {
  title: `${TITLE} | I Love Islam`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/guides/learn-quran-online` },
  openGraph: {
    title: `${TITLE} | I Love Islam`,
    description: DESCRIPTION,
    url: `${SITE_URL}/guides/learn-quran-online`,
    siteName: 'I Love Islam',
    type: 'article',
    images: [
      {
        url: '/optimized/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Learn Quran Online Free — Read, Listen & Recite — I Love Islam',
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
    q: 'Can I learn the Quran online as a complete beginner?',
    a: 'Yes. A good place to start is Al-Fatihah and the short surahs at the end of the Quran (Juz Amma). You can read them in the Mushaf, listen to them recited, and practise them aloud with the coach — all on this site, for free.',
  },
  {
    q: 'Is it free to learn the Quran online here?',
    a: 'Yes. Everything is free: the whole Quran, the Mushaf reader, recitation audio, translations, tafsir, the AI coach and the hifz plans. There is no paid tier, no paywall and no sign-up needed.',
  },
  {
    q: 'Can I listen to the Quran online here?',
    a: 'Yes. You can listen to recitation by named reciters, including Mishary Alafasy, while following the words on the page. Listening is a good way to learn how the verses sound before you try to recite them yourself.',
  },
  {
    q: 'Are translations available?',
    a: 'Yes. The site offers translations in many languages, along with tafsir and word-by-word breakdowns that show the meaning of each word. Reading the translation beside the Arabic helps you understand what you are learning.',
  },
  {
    q: 'Do I need to know Arabic first?',
    a: 'No. You can start by reading the translation and listening to the recitation, and learn the Arabic words a few at a time. The word-by-word view shows each Arabic word with its meaning, and the coach listens to your Arabic recitation and checks it word by word.',
  },
  {
    q: 'How much time do I need each day?',
    a: 'Even a short daily session helps. A few minutes of reading, listening or reciting every day builds more than an occasional long session. Pick a small daily goal you can keep — for example, one short surah or a few ayahs — and keep it up.',
  },
];

const card = 'rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]';
const h2 = 'text-lg font-bold';
const p = 'mt-2 text-sm leading-relaxed text-[#6B7280]';
const ol = 'mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[#6B7280]';

export default function LearnQuranOnlineGuide() {
  return (
    <TrustShell title="Learn Quran Online">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(
            guideJsonLd({
              slug: 'learn-quran-online',
              title: TITLE,
              description: DESCRIPTION,
              faqs: FAQS,
            }),
          ),
        }}
      />
      <GuideBreadcrumb current="Learn Quran Online" />
      <div className="space-y-4">
        <div className={card}>
          <p className="text-sm leading-relaxed text-[#6B7280]">
            Learning the Quran online means you can read, listen, understand and practise —
            all in your browser, for free, with no sign-up. This site brings the whole Quran
            together in one place: the Mushaf to read, recitation to listen to, translations
            and tafsir to understand, and an AI coach that listens while you recite aloud and
            checks every word. This guide explains how to use each part, whether you are
            starting from the beginning or working on memorization.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>1. Read — the Mushaf, page by page</h2>
          <p className={p}>
            Start by reading. Mushaf mode shows the Quran page by page, all 604 pages, exactly
            like the printed Madani Mushaf, from Al-Fatihah to An-Nas. You can read in the
            Madani or Indo-Pak script, whichever you are used to. Reading a little every day —
            even one page — is the foundation everything else builds on.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>2. Listen — hear how it sounds</h2>
          <p className={p}>
            Listening helps you learn how the verses sound before you try to say them yourself.
            You can listen to recitation by named reciters, including Mishary Alafasy, while
            following the words on the page. Listen to a passage a few times first, then try to
            recite along with it, and then try it on your own.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>3. Understand — translation, tafsir, word by word</h2>
          <p className={p}>
            Understanding what you read makes learning far easier. The site offers translations
            in many languages, tafsir for explanation, and a word-by-word view that shows the
            meaning of each Arabic word. If you are memorizing, knowing the meaning of a verse
            helps you remember it — and helps you connect one verse to the next.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>4. Practise aloud — with the coach</h2>
          <p className={p}>
            Reading silently is not the same as reciting. Open the coach, pick a passage, and
            recite aloud. The coach listens and checks every word as you say it, showing you
            straight away which words were right and which were skipped or wrong. Your
            recitation audio is processed on your device and never uploaded. The coach checks
            word accuracy only — it does not judge tajweed, and it is not a replacement for a
            qualified teacher. When a passage comes out clean, test yourself in Test Mode,
            which hides the verses and quizzes you from memory.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>A beginner’s first week</h2>
          <ol className={ol}>
            <li>Day 1–2: Read and listen to Al-Fatihah. Practise it aloud with the coach until it comes out clean.</li>
            <li>Day 3–4: Move to a short surah from Juz Amma. Listen first, then recite it aloud.</li>
            <li>Day 5–6: Learn a second short surah, and revise the first one every day.</li>
            <li>Day 7: Test yourself in Test Mode, and pick your next surah.</li>
          </ol>
          <p className={p}>
            After the first week, keep the same pattern: a small new portion, daily revision of
            what you already learned, and a regular test. The 7-day and 30-day hifz plans turn
            that pattern into a daily schedule for any surah.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Learning and memorizing are different goals</h2>
          <p className={p}>
            Learning to read and understand the Quran and memorizing it are related, but they
            are not the same goal, and they need different routines. If your goal is reading
            fluently, spend most of your time reading and listening. If your goal is
            memorization, spend most of your time reciting aloud to the coach and revising. You
            can do both — just be clear which one you are working on each day, so your practice
            matches your goal.
          </p>
        </div>

        <GuideCta />
        <GuideFaq faqs={FAQS} />
        <GuideMore except="learn-quran-online" />
      </div>
    </TrustShell>
  );
}
