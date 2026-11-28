// app/guides/how-to-memorize-the-quran/page.tsx — SEO guide page
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

const TITLE = 'How to Memorize the Quran — Step by Step';
const DESCRIPTION =
  'Learn how to memorize the Quran step by step: choose a starting point, listen first, recite aloud to the AI coach, and revise every day. Free, no sign-up — all 114 surahs and 30 juz.';

export const metadata: Metadata = {
  title: `${TITLE} | I Love Islam`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/guides/how-to-memorize-the-quran` },
  openGraph: {
    title: `${TITLE} | I Love Islam`,
    description: DESCRIPTION,
    url: `${SITE_URL}/guides/how-to-memorize-the-quran`,
    siteName: 'I Love Islam',
    type: 'article',
    images: [
      {
        url: '/optimized/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'How to Memorize the Quran — Step by Step — I Love Islam',
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
    q: 'How long does it take to memorize the Quran?',
    a: 'There is no fixed time — it depends on how much you memorize each day and how regularly you revise. A small daily portion, revised every day, works better than long sessions done once in a while. The 7-day and 30-day hifz plans on this site break surahs into daily portions so you can see steady progress.',
  },
  {
    q: 'Do I need a teacher to memorize the Quran?',
    a: 'A teacher is still the best guide for learning the Quran properly, especially for tajweed — the rules of recitation. This site’s AI coach is a practice helper: it listens while you recite and checks which words you said correctly, word by word. It does not check tajweed and it is not a replacement for a qualified teacher.',
  },
  {
    q: 'Can I memorize the Quran online for free?',
    a: 'Yes. The whole Quran — all 114 surahs, all 30 juz, all 6,236 ayahs — is here for free, with the AI coach, hifz plans and Test Mode. There is nothing to pay for and no sign-up is needed.',
  },
  {
    q: 'What is the best surah to start memorizing?',
    a: 'Start with something short. Most people begin with Al-Fatihah and then the short surahs at the end of the Quran (Juz Amma). Short surahs let you finish something quickly, practise the method, and build confidence before moving to longer surahs.',
  },
  {
    q: 'How do I stop forgetting what I memorized?',
    a: 'Revise every day. New memorization fades quickly without revision, so set aside time each day to recite what you already learned — not just the new portion. The app’s revision queue and per-surah strength tracking help you see which surahs need more revision.',
  },
  {
    q: 'Does the coach check tajweed?',
    a: 'No. The coach checks word accuracy only: whether you recited the right words, in the right order, without skipping any. It does not judge tajweed, the beauty of your voice, or your understanding of the meaning. For tajweed, a qualified teacher is still needed.',
  },
];

const card = 'rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]';
const h2 = 'text-lg font-bold';
const p = 'mt-2 text-sm leading-relaxed text-[#6B7280]';
const ol = 'mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[#6B7280]';

export default function HowToMemorizeQuranGuide() {
  return (
    <TrustShell title="How to Memorize the Quran">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(
            guideJsonLd({
              slug: 'how-to-memorize-the-quran',
              title: TITLE,
              description: DESCRIPTION,
              faqs: FAQS,
            }),
          ),
        }}
      />
      <GuideBreadcrumb current="How to Memorize the Quran" />
      <div className="space-y-4">
        <div className={card}>
          <p className="text-sm leading-relaxed text-[#6B7280]">
            Memorizing the Quran — hifz — is a long journey, but the method itself is simple:
            listen, recite aloud, check your mistakes, and revise. You do not need a special
            talent to start, and you do not need to memorize a lot at once. What matters is a
            small daily portion, done every day, with your mistakes checked as you go. This
            guide walks through the method step by step, using the free AI coach on this site.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Step 1 — Start small, and start where you are</h2>
          <p className={p}>
            Pick a starting point you can finish. Most people begin with Al-Fatihah and then
            the short surahs at the end of the Quran, in Juz Amma. A short surah lets you
            complete something in one sitting, which keeps you going. Do not start with a long
            surah just because it is famous — you can come back to it once the habit is built.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Step 2 — Listen before you recite</h2>
          <p className={p}>
            Before you try to memorize a passage, listen to it a few times. Listening helps
            you hear the words correctly and fixes the flow of the ayahs in your mind. On this
            site you can listen to recitation by named reciters while following the words on
            the page, in the Madani or Indo-Pak script, with a translation beside it if you
            want to understand what you are memorizing.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Step 3 — Learn a little at a time</h2>
          <p className={p}>
            Take only a few ayahs at a time — one small portion, not a whole page. Read the
            portion, then try to recite it from memory, then look again. Repeat until you can
            say it without looking. The 7-day and 30-day hifz plans on this site break every
            surah into daily portions for you, so you always know exactly how much to learn
            today.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Step 4 — Recite aloud to the coach</h2>
          <p className={p}>
            Memorizing silently is a common mistake: you can think you know a verse when you
            only recognize it. Recite aloud instead, and let the AI coach listen. Open the
            coach, pick your passage, and recite. The coach checks every word as you say it
            and shows you straight away which words were right and which were skipped or
            wrong. Recite the passage again until the coach shows no mistakes. Your recitation
            audio is processed on your device and is never uploaded.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Step 5 — Connect the pieces</h2>
          <p className={p}>
            When you learn a new portion, always recite it together with the portion before
            it. Memorizing in separate pieces is not enough — the pieces have to join up, or
            you will stop at every join. A good check is to recite from the start of the
            surah, or from the start of the page, without stopping.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Step 6 — Revise every day</h2>
          <p className={p}>
            Revision is half of memorization. New ayahs fade fast if you do not go back to
            them, so set aside time each day to recite what you already learned — not only
            the new portion. The app keeps a revision queue and tracks the strength of each
            surah, so you can see which surahs are solid and which need more work. A short
            daily revision session protects everything you have already memorized.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Step 7 — Test yourself regularly</h2>
          <p className={p}>
            Every so often, test yourself properly: hide the text and recite from memory.
            Test Mode on this site does exactly that — it hides the verses and quizzes you,
            like an exam. Testing shows you the gaps that ordinary practice hides, and it is
            the best way to know whether a surah is really memorized or only familiar.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Mistakes to avoid</h2>
          <ol className={ol}>
            <li>Memorizing silently instead of reciting aloud.</li>
            <li>Taking on too much at once and then stopping altogether.</li>
            <li>Learning new portions while skipping revision of the old ones.</li>
            <li>Practising without checking your mistakes — errors you never notice become habits.</li>
            <li>Waiting for the perfect time. A short session today is worth more than a long session you keep postponing.</li>
          </ol>
        </div>

        <GuideCta />
        <GuideFaq faqs={FAQS} />
        <GuideMore except="how-to-memorize-the-quran" />
      </div>
    </TrustShell>
  );
}
