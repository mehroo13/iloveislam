import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
const ARTICLES = [
  { slug: 'how-to-calculate-zakat', title: 'How to Calculate Zakat: A Complete Step-by-Step Guide', excerpt: 'Zakat is one of the Five Pillars of Islam. Learn exactly how to calculate your annual Zakat, understand the Nisab threshold, and what assets are included.', category: 'Finance', emoji: '💰', readTime: '5 min read' },
  { slug: 'what-is-mizan-islamic-blueprint', title: 'What is the Mizan Islamic Life Blueprint?', excerpt: 'Discover how the Mizan tool uses the ancient Abjad numerology system, the 99 Names of Allah, and Quranic guidance to reveal your Islamic archetype and life purpose.', category: 'Self-Discovery', emoji: '✦', readTime: '4 min read' },
  { slug: 'qibla-direction-guide', title: 'How to Find the Qibla Direction Anywhere in the World', excerpt: 'The Qibla is the direction Muslims face during Salah. Learn how to find it accurately using our free Qibla Finder tool, and understand the calculation behind it.', category: 'Prayer', emoji: '🧭', readTime: '3 min read' },
  { slug: 'prayer-times-guide', title: 'Understanding Islamic Prayer Times: Fajr, Dhuhr, Asr, Maghrib & Isha', excerpt: 'A complete guide to the five daily prayers — what they are, when they occur, and how to find accurate prayer times for your city anywhere in the world.', category: 'Prayer', emoji: '🕐', readTime: '6 min read' },
  { slug: 'hijri-calendar-explained', title: 'The Islamic Hijri Calendar Explained — And How to Convert Dates', excerpt: 'The Hijri calendar is the Islamic lunar calendar used to determine dates of Islamic events. Learn how it works and how to convert between Hijri and Gregorian dates.', category: 'Knowledge', emoji: '🌙', readTime: '4 min read' },
  { slug: '99-names-of-allah-guide', title: 'The 99 Names of Allah (Asma ul Husna) — Meanings & Benefits', excerpt: 'Allah has 99 beautiful names, each reflecting a divine attribute. Learn about all 99 names, their meanings, and the spiritual benefits of reciting them.', category: 'Knowledge', emoji: '⭐', readTime: '8 min read' },
  { slug: 'ramadan-preparation-guide', title: 'How to Prepare for Ramadan: A Complete Muslim Guide', excerpt: 'Ramadan is the holiest month in Islam. Learn how to prepare spiritually, physically, and practically for the blessed month of fasting and worship.', category: 'Ramadan', emoji: '🌙', readTime: '7 min read' },
  { slug: 'halal-travel-tips', title: "10 Essential Tips for Halal Travel — A Muslim Traveller's Guide", excerpt: 'Travelling as a Muslim comes with unique considerations. From finding halal food to maintaining prayer schedules — here is everything you need to know.', category: 'Travel', emoji: '🌍', readTime: '5 min read' },
];

// ── Full article content keyed by slug ─────────────────────────────────────
const CONTENT: Record<string, React.ReactNode> = {
  'how-to-calculate-zakat': (
    <>
      <h2>What is Zakat?</h2>
      <p>Zakat (زكاة) is one of the Five Pillars of Islam. It is an obligatory annual payment on wealth above a minimum threshold (Nisab), distributed to those in need. The word "Zakat" literally means purification — it purifies your wealth and soul.</p>

      <h2>Who Must Pay Zakat?</h2>
      <p>Zakat is obligatory on every Muslim who is an adult, of sound mind, and owns wealth above the Nisab for one complete lunar year.</p>

      <h2>What is the Nisab?</h2>
      <p>The Nisab is the minimum amount of wealth before Zakat becomes compulsory:</p>
      <ul>
        <li><strong>Gold Nisab:</strong> 87.48 grams of gold</li>
        <li><strong>Silver Nisab:</strong> 612.36 grams of silver</li>
      </ul>
      <p>Most scholars recommend using the gold Nisab for cash and investments. Check the current gold price to determine your Nisab value.</p>

      <h2>What Assets are Zakatable?</h2>
      <ul>
        <li><strong>Cash & bank savings</strong> — 2.5%</li>
        <li><strong>Gold & silver</strong> (including jewellery) — 2.5%</li>
        <li><strong>Business inventory & stock</strong> — 2.5%</li>
        <li><strong>Shares & investments</strong> — 2.5% of current market value</li>
        <li><strong>Agricultural produce</strong> — 5% (irrigated) or 10% (rain-fed)</li>
        <li><strong>Rental income</strong> — 2.5% of net received</li>
      </ul>
      <p><strong>Not zakatable:</strong> your primary home, personal car, furniture, clothing, or tools used for work.</p>

      <h2>Step-by-Step Calculation</h2>
      <ol>
        <li>Add up all your zakatable assets (cash + gold value + stocks + business inventory)</li>
        <li>Subtract short-term liabilities (debts due within the year)</li>
        <li>Check if the total meets or exceeds the Nisab</li>
        <li>If yes, multiply by <strong>2.5%</strong> — that is your Zakat</li>
      </ol>

      <h2>Who Receives Zakat?</h2>
      <p>The Quran (9:60) specifies 8 categories: the poor, the needy, Zakat administrators, those whose hearts are to be reconciled, to free people from bondage, those in debt, in the cause of Allah, and stranded travellers.</p>

      <p>Use our <Link href="/zakat">free Zakat Calculator</Link> to calculate your exact amount in under 2 minutes.</p>
    </>
  ),

  'what-is-mizan-islamic-blueprint': (
    <>
      <h2>What is Mizan?</h2>
      <p>Mizan (ميزان — "the balance") is our unique Islamic life blueprint tool. It combines the ancient Abjad numerology system, the 99 Beautiful Names of Allah, and Quranic guidance to generate a personalised Islamic spiritual profile.</p>

      <h2>What is Abjad Numerology?</h2>
      <p>Abjad (أبجد) is the traditional Arabic alphanumerical system — each Arabic letter has a numerical value. This system has been used by Islamic scholars for centuries and appears in classical Islamic literature. The total numerical value of your name and birth date is used to reveal your Islamic archetype.</p>

      <h2>How to Use the Mizan Tool</h2>
      <ol>
        <li>Go to <Link href="/mizan">Mizan</Link> from the home page</li>
        <li>Enter your full name</li>
        <li>Enter your date of birth</li>
        <li>Press "Discover Your Blueprint"</li>
      </ol>

      <h2>What Your Blueprint Includes</h2>
      <ul>
        <li><strong>Your Life Number</strong> — derived from your birth date</li>
        <li><strong>Your Guiding Name of Allah</strong> — one of the 99 Names aligned with your profile (e.g. Al-Hakim, Al-Latif, Al-Qadir)</li>
        <li><strong>A Quranic Ayah</strong> — personally relevant to your spiritual path</li>
        <li><strong>Your Spiritual Archetype</strong> — describing your strengths, challenges, and recommended worship</li>
      </ul>

      <h2>Is This Tool Islamic?</h2>
      <p>Mizan is an inspirational and reflective tool — not fortune-telling, which is haram. All outputs are rooted in the Names of Allah and Quranic themes. Think of it as a mirror for self-improvement, encouraging you to connect more deeply with Allah's attributes.</p>

      <p>Try it now: <Link href="/mizan">Open Mizan →</Link></p>
    </>
  ),

  'qibla-direction-guide': (
    <>
      <h2>What is the Qibla?</h2>
      <p>The Qibla (قبلة) is the direction of the Kaaba in Mecca, Saudi Arabia — the direction all Muslims face during their five daily prayers. It is a symbol of unity for the 1.8 billion Muslims worldwide.</p>

      <h2>Method 1 — Use Our Free Qibla Finder (Easiest)</h2>
      <p>The fastest and most accurate method is our <Link href="/qibla">free Qibla Finder tool</Link>. It uses your GPS location to calculate the exact compass bearing toward Mecca, works in any country, and works offline once loaded.</p>

      <h2>Method 2 — Use a Compass</h2>
      <p>Approximate Qibla compass bearings:</p>
      <ul>
        <li><strong>From UK / Western Europe:</strong> ~119° (south-east)</li>
        <li><strong>From USA East Coast:</strong> ~59° (north-east)</li>
        <li><strong>From USA West Coast:</strong> ~24° (north-north-east)</li>
        <li><strong>From Pakistan:</strong> ~263° (west)</li>
        <li><strong>From Australia:</strong> ~278° (west)</li>
        <li><strong>From South Africa:</strong> ~2° (north)</li>
        <li><strong>From Malaysia / Indonesia:</strong> ~295° (north-west)</li>
      </ul>

      <h2>Method 3 — Google Maps</h2>
      <ol>
        <li>Open Google Maps</li>
        <li>Search "Kaaba, Mecca" and drop a pin</li>
        <li>Drop another pin on your current location</li>
        <li>The line between them is your Qibla direction</li>
      </ol>

      <h2>Common Questions</h2>
      <p><strong>Does the Qibla change by location?</strong> Yes — significantly. From New York it faces north-east; from Jakarta it faces north-west.</p>
      <p><strong>What if I can't find the Qibla?</strong> Pray in your best estimation (Ijtihad) — your prayer is valid.</p>

      <p><Link href="/qibla">Open the Qibla Finder →</Link></p>
    </>
  ),

  'prayer-times-guide': (
    <>
      <h2>The 5 Daily Prayers</h2>
      <p>The five daily prayers (Salah) are the second Pillar of Islam — obligatory on every adult Muslim. Their times are determined by the sun's position, which is why they shift slightly each day and vary by location.</p>

      <h2>Fajr — Dawn Prayer</h2>
      <p><strong>Time:</strong> From true dawn until sunrise. <strong>Rak'ahs:</strong> 2 Fard. This is considered the most virtuous prayer of the day. The Prophet ﷺ said: "The two rak'ahs of Fajr are better than this world and everything in it." (Muslim)</p>

      <h2>Dhuhr — Midday Prayer</h2>
      <p><strong>Time:</strong> After the sun passes its peak (solar noon) until Asr begins. <strong>Rak'ahs:</strong> 4 Fard. On Fridays, Jumu'ah prayer replaces Dhuhr for men.</p>

      <h2>Asr — Afternoon Prayer</h2>
      <p><strong>Time:</strong> When an object's shadow equals its length (Shafi'i) or double its length (Hanafi) until sunset. <strong>Rak'ahs:</strong> 4 Fard. The Prophet ﷺ especially warned against missing Asr.</p>

      <h2>Maghrib — Sunset Prayer</h2>
      <p><strong>Time:</strong> Immediately after sunset until the red twilight disappears — about 1–1.5 hours. <strong>Rak'ahs:</strong> 3 Fard. Do not delay Maghrib.</p>

      <h2>Isha — Night Prayer</h2>
      <p><strong>Time:</strong> After twilight disappears until midnight. <strong>Rak'ahs:</strong> 4 Fard. The best time is before midnight.</p>

      <h2>Why Prayer Times Change Daily</h2>
      <p>Because times are based on the sun's position, they shift by 1–3 minutes each day as Earth orbits the sun. In northern countries like Norway, summer Fajr can be very early.</p>

      <h2>Find Accurate Prayer Times</h2>
      <p>Use our free <Link href="/prayer-times">Prayer Times tool</Link> — enter your city or allow GPS access and get precise daily times automatically.</p>
    </>
  ),

  'hijri-calendar-explained': (
    <>
      <h2>What is the Hijri Calendar?</h2>
      <p>The Hijri calendar (التقويم الهجري) is the Islamic lunar calendar. Year 1 marks the Prophet Muhammad's ﷺ migration (Hijra) from Mecca to Medina in 622 CE. It was formalised by Caliph Umar ibn Al-Khattab (RA) in 638 CE.</p>

      <h2>Structure — 12 Lunar Months</h2>
      <p>The Hijri year has 354–355 days — about 11 days shorter than the Gregorian solar year. This is why Islamic events like Ramadan and Eid shift approximately 11 days earlier each Gregorian year.</p>

      <h2>The 12 Months</h2>
      <ol>
        <li><strong>Muharram</strong> — Sacred month; Islamic New Year</li>
        <li><strong>Safar</strong></li>
        <li><strong>Rabi' al-Awwal</strong> — Month of the Prophet's ﷺ birth (Milad un Nabi)</li>
        <li><strong>Rabi' al-Thani</strong></li>
        <li><strong>Jumada al-Awwal</strong></li>
        <li><strong>Jumada al-Thani</strong></li>
        <li><strong>Rajab</strong> — Sacred month</li>
        <li><strong>Sha'ban</strong> — Month of preparation before Ramadan</li>
        <li><strong>Ramadan</strong> ⭐ — Month of fasting</li>
        <li><strong>Shawwal</strong> — Eid al-Fitr on 1st Shawwal</li>
        <li><strong>Dhul Qa'dah</strong> — Sacred month</li>
        <li><strong>Dhul Hijjah</strong> — Month of Hajj; Eid al-Adha on 10th</li>
      </ol>

      <h2>The Four Sacred Months</h2>
      <p>Allah mentions four sacred months in the Quran (9:36): Muharram, Rajab, Dhul Qa'dah, and Dhul Hijjah. These are months of heightened spiritual importance.</p>

      <h2>How to Convert Dates</h2>
      <p>Use our free <Link href="/hijri">Hijri Calendar converter</Link> to convert any Gregorian date to Hijri and vice versa, and to see today's Islamic date.</p>
    </>
  ),

  '99-names-of-allah-guide': (
    <>
      <h2>What are the 99 Names of Allah?</h2>
      <p>The 99 Beautiful Names (Asma ul Husna — الأسماء الحسنى) are the divine attributes of Allah mentioned in the Quran and authentic Hadith. The Prophet ﷺ said: <em>"Allah has ninety-nine names... Whoever memorises them will enter Paradise."</em> (Bukhari & Muslim)</p>

      <h2>Selected Names and Meanings</h2>
      <ul>
        <li><strong>Al-Rahman (الرحمن)</strong> — The Most Merciful (unconditional mercy for all creation)</li>
        <li><strong>Al-Raheem (الرحيم)</strong> — The Especially Merciful (special mercy for believers)</li>
        <li><strong>Al-Malik (الملك)</strong> — The Sovereign King</li>
        <li><strong>Al-Quddus (القدوس)</strong> — The Pure, The Holy</li>
        <li><strong>Al-Salam (السلام)</strong> — The Source of Peace</li>
        <li><strong>Al-Aziz (العزيز)</strong> — The All-Mighty</li>
        <li><strong>Al-Hakim (الحكيم)</strong> — The All-Wise</li>
        <li><strong>Al-Latif (اللطيف)</strong> — The Subtle, The Kind</li>
        <li><strong>Al-Razzaq (الرزاق)</strong> — The Provider</li>
        <li><strong>Al-Ghaffar (الغفار)</strong> — The Oft-Forgiving</li>
      </ul>

      <h2>How to Benefit from the Names</h2>
      <p><strong>In Dhikr:</strong> Recite individual names in your daily remembrance — "Ya Rahman Ya Raheem" after prayer is a beautiful practice.</p>
      <p><strong>In Dua:</strong> Use the relevant name when supplicating. The Quran says: <em>"And to Allah belong the best names, so invoke Him by them."</em> (7:180). Ask Al-Shafi for healing, Al-Razzaq for provision, Al-Ghaffar for forgiveness.</p>
      <p><strong>In Reflection:</strong> Studying each name deepens your knowledge (Ma'rifah) of Allah and strengthens Iman. Ibn al-Qayyim wrote entire books on the Names.</p>

      <h2>Explore All 99 Names</h2>
      <p>Use our interactive <Link href="/names">99 Names of Allah tool</Link> to read every name in Arabic with transliteration, meaning, and dhikr guidance.</p>
    </>
  ),

  'ramadan-preparation-guide': (
    <>
      <h2>Why Prepare for Ramadan?</h2>
      <p>Ramadan is the holiest month in Islam — the month the Quran was revealed, in which rewards are multiplied, and in which sincere worship can change your life. The Prophet ﷺ used to prepare for Ramadan months in advance. With preparation, you maximise every blessed moment.</p>

      <h2>Spiritual Preparation</h2>
      <ul>
        <li><strong>Make sincere Tawbah (repentance)</strong> before Ramadan begins</li>
        <li><strong>Increase Quran recitation</strong> in Sha'ban (the month before) — the Prophet ﷺ would increase his recitation in Sha'ban</li>
        <li><strong>Set spiritual goals:</strong> How many Juz' of Quran will you complete? How many nights of Tarawih will you attend?</li>
        <li><strong>Make dua to reach Ramadan</strong> — the Salaf used to make this dua 6 months in advance</li>
      </ul>

      <h2>Physical Preparation</h2>
      <ul>
        <li>Gradually adjust your sleep schedule to accommodate Suhoor</li>
        <li>Start reducing caffeine intake to avoid withdrawal headaches</li>
        <li>Practice optional fasts in Sha'ban to prepare your body</li>
        <li>Prepare healthy Suhoor meal options in advance</li>
      </ul>

      <h2>Practical Preparation</h2>
      <ul>
        <li>Set up your Suhoor and Iftar schedule using our <Link href="/ramadan">Ramadan Planner</Link></li>
        <li>Find your local prayer and Iftar times using our <Link href="/prayer-times">Prayer Times tool</Link></li>
        <li>Plan your Zakat — many Muslims prefer to give Zakat during Ramadan for maximum reward</li>
        <li>Stock your pantry with wholesome Suhoor foods: oats, dates, eggs, whole grains</li>
      </ul>

      <h2>During Ramadan</h2>
      <ul>
        <li>Do not skip Suhoor — the Prophet ﷺ called it a blessed meal</li>
        <li>Break your fast with dates and water, following the Sunnah</li>
        <li>Prioritise the last 10 nights — seek Laylat al-Qadr</li>
        <li>Give Sadaqah daily, even if small</li>
      </ul>

      <p>Use our <Link href="/ramadan">Ramadan Planner</Link> to track your Suhoor, Iftar, and daily ibadah goals.</p>
    </>
  ),

  'halal-travel-tips': (
    <>
      <h2>Why Halal Travel?</h2>
      <p>As a Muslim traveller, maintaining your deen while travelling is both a right and a responsibility. With the right preparation, you can travel anywhere in the world while staying true to your values — and many destinations are becoming increasingly Muslim-friendly.</p>

      <h2>Tip 1 — Find Prayer Times Before You Go</h2>
      <p>Use our <Link href="/prayer-times">Prayer Times tool</Link> to look up prayer times for your destination. Download or screenshot them before travel — you won't always have internet access.</p>

      <h2>Tip 2 — Locate Mosques at Your Destination</h2>
      <p>Use our <Link href="/mosque">Mosque Finder</Link> to find mosques at your destination before you travel. Many mosques welcome travellers and can advise on local halal food as well.</p>

      <h2>Tip 3 — Research Halal Food in Advance</h2>
      <ul>
        <li>Apps like Zabihah.com and HalalTrip help find halal restaurants worldwide</li>
        <li>In non-Muslim countries, look for kosher options as an alternative — they follow similar slaughter standards</li>
        <li>Vegetarian and seafood options are generally safe when halal meat is unavailable</li>
        <li>Pack halal snacks (nuts, dried fruits, crackers) for journeys where food may be limited</li>
      </ul>

      <h2>Tip 4 — Know the Traveller's Prayer (Salat al-Qasr)</h2>
      <p>Islam provides ease for travellers: when travelling more than approximately 80km, you may shorten (Qasr) Dhuhr, Asr, and Isha from 4 rak'ahs to 2. You may also combine prayers (Jam') when needed. This concession (rukhsah) is a mercy from Allah.</p>

      <h2>Tip 5 — Book Muslim-Friendly Accommodation</h2>
      <ul>
        <li>Look for hotels with Qibla direction indicated in rooms</li>
        <li>Request rooms without alcohol minibars if this concerns you</li>
        <li>HalalBooking.com specialises in Muslim-friendly resorts</li>
      </ul>

      <h2>Tip 6 — Set Your Qibla Direction at Each Hotel</h2>
      <p>Use our <Link href="/qibla">Qibla Finder</Link> as soon as you arrive at your hotel to mark the prayer direction. Some travellers put a small sticker on the floor to remember it.</p>

      <h2>Tip 7 — Carry a Travel Prayer Mat</h2>
      <p>Compact travel prayer mats are available online and are lightweight. Combined with knowing your prayer times, they mean you can pray anywhere — airports, parks, rest stops.</p>

      <h2>Tip 8 — Be Aware of Local Dress Codes</h2>
      <p>In Muslim-majority countries, modest dress is generally expected and respected. In Western countries, you have every right to dress modestly — do so with confidence.</p>

      <h2>Tip 9 — Make Dua for Safe Travel</h2>
      <p>Recite the travel dua (du'a al-safar) when departing: <em>"Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun."</em> (The one who has made this (vehicle) subservient to us, for we could never have done it ourselves, and to our Lord we shall return.) — Quran 43:13-14</p>

      <h2>Tip 10 — Use Our Halal Travel Tool</h2>
      <p>Our <Link href="/travel">Halal Travel planner</Link> helps you plan your journey while keeping your deen intact. Safe travels! ✈️</p>
    </>
  ),
};

// ── Static params ─────────────────────────────────────────────────────────
export function generateStaticParams() {
  return ARTICLES.map(a => ({ slug: a.slug }));
}

// ── Per-article metadata ──────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = ARTICLES.find(a => a.slug === params.slug);
  if (!article) return { title: 'Not Found' };
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://www.iloveislam.life/blog/${article.slug}`,
      type: 'article',
      publishedTime: article.date,
    },
  };
}

// ── Article page ──────────────────────────────────────────────────────────
export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = ARTICLES.find(a => a.slug === params.slug);
  if (!article) notFound();

  const content = CONTENT[article.slug];
  const related = ARTICLES.filter(a => a.slug !== article.slug && a.category === article.category).slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', fontFamily: 'Georgia, serif' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#0a3d2e 0%,#1a6b4a 100%)', padding: '28px 16px 40px' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <Link href="/blog" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← Back to Blog</Link>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: '#c8a96e', color: '#0a3d2e', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px' }}>{article.category}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>📖 {article.readTime}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>June 2025</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.35 }}>{article.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>{article.excerpt}</p>
        </div>
      </div>

      <main style={{ maxWidth: 740, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Article body */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #ede9e2', padding: '32px 28px', fontSize: 15, color: '#444', lineHeight: 1.8 }}
          className="article-body">
          <style>{`
            .article-body h2 { font-size:20px; font-weight:700; color:#0a3d2e; margin:28px 0 12px; padding-bottom:8px; border-bottom:1px solid #f0ede8; }
            .article-body h3 { font-size:17px; font-weight:700; color:#0a3d2e; margin:20px 0 8px; }
            .article-body p  { margin:0 0 14px; }
            .article-body ul, .article-body ol { margin:0 0 16px; padding-left:20px; }
            .article-body li { margin-bottom:6px; }
            .article-body a  { color:#0a3d2e; font-weight:600; }
            .article-body em { font-style:italic; color:#555; background:#f9f7f4; padding:2px 6px; border-left:3px solid #c8a96e; display:block; margin:10px 0; }
            .article-body strong { color:#0a3d2e; }
          `}</style>
          {content}
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg,#0a3d2e,#1a5c3a)', borderRadius: 16, padding: '24px', textAlign: 'center', margin: '24px 0' }}>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Try Our Free Islamic Tools</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 16px' }}>20 free tools — no sign-up required</p>
          <Link href="/" style={{ background: '#c8a96e', color: '#0a3d2e', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
            Explore All Tools →
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0a3d2e', margin: '0 0 12px' }}>Related Articles</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {related.map(r => (
                <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ede9e2', padding: '16px' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{r.emoji}</div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0a3d2e', margin: '0 0 4px', lineHeight: 1.3 }}>{r.title}</p>
                    <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>{r.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.excerpt,
          datePublished: article.date,
          author: { '@type': 'Organization', name: 'I Love Islam' },
          publisher: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
          url: `https://www.iloveislam.life/blog/${article.slug}`,
        })}} />
      </main>
    </div>
  );
}
