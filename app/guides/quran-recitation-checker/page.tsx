// app/guides/quran-recitation-checker/page.tsx — SEO guide page
// (2026-11-28). Original article, written from the app's real features.
// No copied text, no invented hadith or benefits. The tajweed limit is
// stated plainly, here and in the FAQ: the coach checks word accuracy
// only — it does not judge tajweed.
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

const TITLE = 'Quran Recitation Checker — AI Word-by-Word Feedback';
const DESCRIPTION =
  'How the free Quran recitation checker works: recite aloud and the AI coach checks every word as you say it, and shows mistakes word by word. Word accuracy only — it does not judge tajweed.';

export const metadata: Metadata = {
  title: `${TITLE} | I Love Islam`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/guides/quran-recitation-checker` },
  openGraph: {
    title: `${TITLE} | I Love Islam`,
    description: DESCRIPTION,
    url: `${SITE_URL}/guides/quran-recitation-checker`,
    siteName: 'I Love Islam',
    type: 'article',
    images: [
      {
        url: '/optimized/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Quran Recitation Checker — AI Word-by-Word Feedback — I Love Islam',
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
    q: 'Is the Quran recitation checker free?',
    a: 'Yes. The recitation checker is free, with no sign-up and no payment. Open the coach, pick a passage, and recite aloud — the feedback is instant.',
  },
  {
    q: 'Does the recitation checker check tajweed?',
    a: 'No. The checker checks word accuracy only: whether you recited the right words, in the right order, without skipping any. It does not judge tajweed, the rules of recitation. For tajweed, a qualified teacher is still needed, and the checker is never a substitute for one.',
  },
  {
    q: 'What do I need to use the recitation checker?',
    a: 'A browser and a microphone — a phone, tablet or laptop will do. When you open the coach, allow microphone access, pick a surah or passage, and recite aloud. A quiet room helps the checker hear you clearly.',
  },
  {
    q: 'What happens to my voice recording?',
    a: 'Nothing is uploaded. Your recitation audio is processed on your device and never leaves it. Your mistakes and progress are stored only in your own browser, and you can export or delete them at any time.',
  },
  {
    q: 'Can it tell me if my pronunciation is wrong?',
    a: 'It checks which words you recited, not the fine details of how each sound was pronounced. If you skip a word or say a different word, it flags it. The fine points of pronunciation and tajweed are for a qualified teacher to check.',
  },
  {
    q: 'What should I do if it marks a correct word wrong?',
    a: 'Recite the passage again, a little more slowly and clearly, in a quiet room. If the checker keeps flagging a word you said correctly, tell us through the Contact page so we can keep improving it.',
  },
];

const card = 'rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]';
const h2 = 'text-lg font-bold';
const p = 'mt-2 text-sm leading-relaxed text-[#6B7280]';
const ol = 'mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[#6B7280]';
const ul = 'mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#6B7280]';

export default function QuranRecitationCheckerGuide() {
  return (
    <TrustShell title="Quran Recitation Checker">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(
            guideJsonLd({
              slug: 'quran-recitation-checker',
              title: TITLE,
              description: DESCRIPTION,
              faqs: FAQS,
            }),
          ),
        }}
      />
      <GuideBreadcrumb current="Quran Recitation Checker" />
      <div className="space-y-4">
        <div className={card}>
          <p className="text-sm leading-relaxed text-[#6B7280]">
            A Quran recitation checker listens while you recite and tells you, word by word,
            whether you said the verse correctly. On this site the checker is the AI coach:
            free, in your browser, with no sign-up. You recite aloud, and it shows you
            straight away which words were right and which were skipped or wrong — so you can
            fix mistakes at once instead of practising them into habit.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>How it works</h2>
          <ol className={ol}>
            <li>Open the coach and pick a passage — any surah or range of ayahs from the whole Quran.</li>
            <li>Allow microphone access when your browser asks.</li>
            <li>Recite aloud at a natural pace. As you speak, the words you say correctly are marked, so you can follow along.</li>
            <li>When you finish, you see your result: how many words were correct, and which words were skipped or wrong, with a mistake count.</li>
            <li>Recite the passage again until the checker shows no mistakes.</li>
          </ol>
        </div>

        <div className={card}>
          <h2 className={h2}>What it checks: word accuracy</h2>
          <p className={p}>
            The checker checks word accuracy — nothing more, nothing less. It compares what
            you said with the text of the passage and answers three questions: did you say the
            right words, did you say them in the right order, and did you skip any? That is
            exactly what a person memorizing the Quran needs to know most: a skipped word or a
            wrong word is a mistake that has to be fixed before the verse is memorized.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>What it does not do — stated plainly</h2>
          <ul className={ul}>
            <li>It does not check tajweed — the rules of recitation, such as lengthening and pronunciation rules. For tajweed, a qualified teacher is still needed.</li>
            <li>It does not judge the beauty of your voice or your recitation style.</li>
            <li>It does not check your understanding of the meaning.</li>
            <li>It is not a teacher, and its feedback is never a substitute for one.</li>
          </ul>
          <p className={p}>
            Knowing this limit matters: the checker is a practice tool for word accuracy, and
            it is honest about what it can and cannot do.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Using your mistakes</h2>
          <p className={p}>
            A mistake the checker finds is useful only if you act on it. The app keeps a
            mistake log, so you can see which words you keep getting wrong and go back to
            them. The best way to use it is simple: recite the passage, look at the words you
            missed, recite it again, and repeat until it comes out clean. Then test yourself in
            Test Mode, which hides the verses and quizzes you from memory.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Tips for a good check</h2>
          <ul className={ul}>
            <li>Recite in a quiet room — background noise and other voices make the check less reliable.</li>
            <li>Speak clearly, at a natural pace. Do not rush, and do not whisper.</li>
            <li>Hold the device at a normal distance, as if you were talking to someone beside you.</li>
            <li>If the checker flags a word you are sure you said correctly, recite it again slowly. If it keeps happening, report it through the Contact page.</li>
          </ul>
        </div>

        <GuideCta />
        <GuideFaq faqs={FAQS} />
        <GuideMore except="quran-recitation-checker" />
      </div>
    </TrustShell>
  );
}
