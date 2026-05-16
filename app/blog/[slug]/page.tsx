import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ─── Article Metadata ────────────────────────────────────────────────────────
const ARTICLES = [
  { slug: 'how-to-calculate-zakat', title: 'How to Calculate Zakat: A Complete Step‑by‑Step Guide', excerpt: 'Learn exactly how to calculate your annual Zakat, understand the Nisab threshold, and discover which assets are included.', category: 'Finance', emoji: '💰', readTime: '6 min read', date: '2025-06-01' },
  { slug: 'prayer-times-explained', title: 'Understanding Islamic Prayer Times: Fajr, Dhuhr, Asr, Maghrib & Isha', excerpt: 'A complete guide to the five daily prayers – what they are, when they occur, and how to find accurate times worldwide.', category: 'Prayer', emoji: '🕐', readTime: '7 min read', date: '2025-06-03' },
  { slug: 'qibla-direction-guide', title: 'How to Find the Qibla Direction Anywhere in the World', excerpt: 'Discover the Qibla and learn how to find it accurately using our free Qibla Finder tool, a compass, or Google Maps.', category: 'Prayer', emoji: '🧭', readTime: '5 min read', date: '2025-06-05' },
  { slug: 'hijri-calendar-explained', title: 'The Islamic Hijri Calendar Explained – and How to Convert Dates', excerpt: 'Learn how the Hijri calendar works, why Islamic dates shift each year, and how to convert between Hijri and Gregorian.', category: 'Knowledge', emoji: '🌙', readTime: '6 min read', date: '2025-06-07' },
  { slug: 'ramadan-preparation-guide', title: 'How to Prepare for Ramadan: A Complete Spiritual & Practical Guide', excerpt: 'Get ready for the holy month with spiritual preparation, meal planning, worship goals, and family activities.', category: 'Ramadan', emoji: '🌙', readTime: '8 min read', date: '2025-06-09' },
  { slug: 'what-is-mizan-islamic-blueprint', title: 'What is the Mizan Islamic Life Blueprint?', excerpt: 'Discover how the Mizan tool uses Abjad numerology, the 99 Names of Allah, and Quranic guidance to reveal your Islamic archetype.', category: 'Self-Discovery', emoji: '✦', readTime: '5 min read', date: '2025-06-11' },
  { slug: '99-names-of-allah-guide', title: 'The 99 Names of Allah (Asma ul Husna) – Meanings & Benefits', excerpt: 'Explore all 99 beautiful names of Allah with their meanings, transliterations, and spiritual benefits.', category: 'Knowledge', emoji: '⭐', readTime: '10 min read', date: '2025-06-13' },
  { slug: 'halal-travel-tips', title: '10 Essential Tips for Halal Travel – A Muslim Traveller’s Guide', excerpt: 'Find halal food, locate mosques, manage prayer times, and keep your deen while exploring the world.', category: 'Travel', emoji: '🌍', readTime: '6 min read', date: '2025-06-15' },
  { slug: 'dhikr-guide', title: 'The Power of Dhikr: How to Use the Dhikr Counter for Daily Remembrance', excerpt: 'Learn the importance of Dhikr in Islam and how our free Dhikr Counter can help you build a consistent habit.', category: 'Worship', emoji: '📿', readTime: '6 min read', date: '2025-06-17' },
  { slug: 'inheritance-calculator-guide', title: 'Islamic Inheritance Law: How to Use the Inheritance Calculator', excerpt: 'Understand the basics of Fara’id (Islamic inheritance) and how to distribute an estate according to the Quran.', category: 'Finance', emoji: '⚖️', readTime: '7 min read', date: '2025-06-19' },
  { slug: 'halal-finance-check-guide', title: 'Is My Transaction Halal? A Guide to Using the Halal Finance Check', excerpt: 'Learn how to check any financial deal for Riba, Gharar, and Maysir using our free screening tool.', category: 'Finance', emoji: '☪️', readTime: '6 min read', date: '2025-06-21' },
  { slug: 'kaffarah-calculator-guide', title: 'Kaffarah Explained: How to Calculate Expiation for Broken Oaths & More', excerpt: 'Understand the four types of Kaffarah and how to calculate the monetary or fasting equivalent.', category: 'Knowledge', emoji: '🕊️', readTime: '7 min read', date: '2025-06-23' },
  { slug: 'sadaqah-tracker-guide', title: 'Making Sadaqah a Habit: How to Track Your Charity with the Sadaqah Tracker', excerpt: 'Discover the virtues of daily charity and how our Sadaqah Tracker can help you build a lasting giving habit.', category: 'Worship', emoji: '💚', readTime: '5 min read', date: '2025-06-25' },
  { slug: 'islamic-will-guide', title: 'Writing an Islamic Will (Wasiyyah): Why Every Muslim Needs One', excerpt: 'Learn why a Wasiyyah is important and how our free Islamic Will generator can help you create a Shariah‑compliant draft.', category: 'Finance', emoji: '📜', readTime: '6 min read', date: '2025-06-27' },
  { slug: 'hajj-checklist-guide', title: 'The Ultimate Hajj Checklist: A Step‑by‑Step Guide to Every Rite', excerpt: 'Prepare for Hajj with a complete checklist covering every day, from Ihram to Tawaf al‑Wada.', category: 'Hajj & Umrah', emoji: '🕋', readTime: '8 min read', date: '2025-06-29' },
  { slug: 'quran-reader-guide', title: 'How to Read the Quran Online with Translation and Audio', excerpt: 'Explore the features of our free Quran Reader: Indo‑Pak Mushaf, verse‑by‑verse, English/Urdu translation, and audio recitation.', category: 'Quran', emoji: '📖', readTime: '6 min read', date: '2025-07-01' },
  { slug: 'hadith-search-guide', title: 'How to Search Authentic Hadith: A Guide to the Six Major Collections', excerpt: 'Learn how to find sahih hadith using our Hadith Search tool, covering Bukhari, Muslim, and four other canonical collections.', category: 'Knowledge', emoji: '📚', readTime: '6 min read', date: '2025-07-03' },
  { slug: 'islamic-names-finder-guide', title: 'Choosing a Muslim Name: How to Use the Islamic Names Finder', excerpt: 'Explore over 14,000 authentic Islamic names with meanings, Arabic script, and gender filters.', category: 'Family', emoji: '👶', readTime: '5 min read', date: '2025-07-05' },
  { slug: 'dua-generator-guide', title: 'Authentic Duas from Quran & Sunnah: How to Use the Dua Generator', excerpt: 'Browse a curated collection of over 100 authentic duas with translations, transliterations, and references.', category: 'Worship', emoji: '🤲', readTime: '5 min read', date: '2025-07-07' },
  { slug: 'mosque-finder-guide', title: 'How to Find Mosques Anywhere in the World with Live Prayer Times', excerpt: 'Locate the nearest masjid, get directions, and see today’s prayer times – all from one tool.', category: 'Travel', emoji: '🕌', readTime: '5 min read', date: '2025-07-09' },
  { slug: 'islamic-events-countdown', title: 'Islamic Events & Countdowns: Ramadan, Eid, Ashura and More', excerpt: 'Track upcoming Islamic events with live countdowns and understand their significance.', category: 'Knowledge', emoji: '📅', readTime: '6 min read', date: '2025-07-11' },
  { slug: 'understanding-islamic-calendar', title: 'Understanding the Islamic Calendar: Months, Sacred Days, and Moon Sighting', excerpt: 'A deep dive into the structure of the Islamic lunar year, the four sacred months, and the role of moon sighting.', category: 'Knowledge', emoji: '🌙', readTime: '7 min read', date: '2025-07-13' },
  { slug: 'benefits-of-dhikr', title: 'Spiritual Benefits of Dhikr: Why Remembrance of Allah Changes Your Life', excerpt: 'Discover the transformative power of Dhikr with references from Quran and Hadith, and practical tips.', category: 'Worship', emoji: '📿', readTime: '6 min read', date: '2025-07-15' },
  { slug: 'salah-postures-guide', title: 'Salah Postures and Their Spiritual Meanings', excerpt: 'Learn the inner dimensions of each prayer posture – Qiyam, Ruku, Sujud – and how to enhance your khushu.', category: 'Prayer', emoji: '🕌', readTime: '5 min read', date: '2025-07-17' },
  { slug: 'laylatul-qadr-guide', title: 'Laylatul Qadr: The Night Better Than a Thousand Months', excerpt: 'Understand the significance of the Night of Power, when it falls, and how to maximise its blessings.', category: 'Ramadan', emoji: '✨', readTime: '6 min read', date: '2025-07-19' },
];

// ─── Full Article Content (all 25) ───────────────────────────────────────────
const CONTENT: Record<string, React.ReactNode> = {
  'how-to-calculate-zakat': (
    <>
      <h2>What is Zakat?</h2>
      <p>Zakat (زكاة) is the third pillar of Islam. It is an obligatory annual charity on wealth above a minimum threshold (Nisab), distributed to those in need. The word &quot;Zakat&quot; literally means purification – it purifies your wealth and your soul. The Quran instructs: <em>&quot;Take from their wealth a charity by which you purify them and cause them increase.&quot;</em> (9:103).</p>
      <h2>Who Must Pay Zakat?</h2>
      <p>Every adult Muslim, sane, who possesses wealth above the Nisab for one complete lunar year (354 days). If your net assets fall below the Nisab at any point, the year resets.</p>
      <h2>What is the Nisab?</h2>
      <p>The Nisab is the minimum wealth that makes Zakat compulsory. There are two standards:</p>
      <ul>
        <li><strong>Gold Nisab:</strong> 87.48 grams of gold.</li>
        <li><strong>Silver Nisab:</strong> 612.36 grams of silver.</li>
      </ul>
      <p>Most scholars recommend using the <strong>gold Nisab</strong> for cash, investments, and business goods because it represents a higher threshold and benefits fewer people, while the silver Nisab is more inclusive. You can check current gold/silver prices on our <Link href="/zakat">Zakat Calculator</Link>.</p>
      <h2>Assets That Are Zakatable</h2>
      <ul>
        <li><strong>Cash &amp; bank savings</strong> – 2.5% of total.</li>
        <li><strong>Gold &amp; silver</strong> (including jewellery) – 2.5% of market value.</li>
        <li><strong>Business inventory &amp; stock</strong> – 2.5% of current saleable value.</li>
        <li><strong>Shares &amp; investments</strong> – 2.5% of market price.</li>
        <li><strong>Agricultural produce</strong> – 5% if irrigated artificially, 10% if rain‑fed.</li>
        <li><strong>Rental income</strong> – 2.5% of net amount received after deducting expenses.</li>
      </ul>
      <p><strong>Not zakatable:</strong> Your primary home, personal car, furniture, clothing, tools of trade, and equipment needed for work.</p>
      <h2>Step‑by‑Step Calculation</h2>
      <ol>
        <li>Add up the current value of all zakatable assets (cash, gold, silver, stocks, business inventory).</li>
        <li>Subtract short‑term liabilities (debts due within the year).</li>
        <li>Check if the remaining total meets or exceeds the Nisab.</li>
        <li>If yes, multiply by <strong>2.5%</strong> – that’s your Zakat.</li>
      </ol>
      <h2>Example</h2>
      <p>If your total zakatable assets are $10,000 and debts are $2,000, net = $8,000. If gold Nisab is $5,000, you owe 2.5% × $8,000 = $200.</p>
      <h2>Who Can Receive Zakat?</h2>
      <p>The Quran (9:60) lists eight categories: the poor, the needy, Zakat administrators, those whose hearts are to be reconciled, freeing captives, debtors, in the cause of Allah, and stranded travellers.</p>
      <p>Use our <Link href="/zakat">free Zakat Calculator</Link> to calculate your exact Zakat in under 2 minutes.</p>
    </>
  ),
  'prayer-times-explained': (
    <>
      <h2>The 5 Daily Prayers</h2>
      <p>Salah is the second pillar of Islam. The five daily prayers are obligatory on every adult Muslim and must be performed within their specified times. Allah says: <em>&quot;Indeed, prayer has been decreed upon the believers a decree of specified times.&quot;</em> (4:103).</p>
      <h2>Fajr – Dawn Prayer</h2>
      <p><strong>Time:</strong> From true dawn (when a vertical line of light appears on the horizon) until just before sunrise. <strong>Rak&apos;ahs:</strong> 2 Fard. The Prophet ﷺ said: &quot;The two rak&apos;ahs of Fajr are better than the world and everything in it.&quot;</p>
      <h2>Dhuhr – Midday Prayer</h2>
      <p><strong>Time:</strong> After the sun passes its zenith (solar noon) until the shadow of an object equals its length (for Asr). <strong>Rak&apos;ahs:</strong> 4 Fard. On Fridays, Jumu&apos;ah prayer replaces Dhuhr for men.</p>
      <h2>Asr – Afternoon Prayer</h2>
      <p><strong>Time:</strong> Begins when an object&apos;s shadow equals its length (Shafi&apos;i) or twice its length (Hanafi) and lasts until sunset. <strong>Rak&apos;ahs:</strong> 4 Fard.</p>
      <h2>Maghrib – Sunset Prayer</h2>
      <p><strong>Time:</strong> Immediately after sunset until the red twilight disappears (about 1–1.5 hours). <strong>Rak&apos;ahs:</strong> 3 Fard. Do not delay Maghrib.</p>
      <h2>Isha – Night Prayer</h2>
      <p><strong>Time:</strong> After twilight disappears until midnight (or Fajr, according to some). <strong>Rak&apos;ahs:</strong> 4 Fard. The best time is before midnight.</p>
      <h2>Why Times Change Daily</h2>
      <p>Because prayer times are solar‑based, they shift by a few minutes each day. In northern latitudes, Isha and Fajr can be very early/late in summer. Our <Link href="/prayer-times">Prayer Times tool</Link> automatically adjusts for your location and preferred calculation method (ISNA, MWL, Umm al‑Qura, etc.).</p>
      <h2>Calculation Methods</h2>
      <p>Different organisations use slightly different angles for Fajr and Isha. In North America, ISNA is common; in Europe, MWL or Umm al‑Qura are popular. The difference is usually 2–3 minutes.</p>
      <p>Find accurate times for any city: <Link href="/prayer-times">Open Prayer Times →</Link></p>
    </>
  ),
  'qibla-direction-guide': (
    <>
      <h2>What is the Qibla?</h2>
      <p>The Qibla (قبلة) is the direction of the Kaaba in Makkah – the sacred direction all Muslims face during Salah. It symbolises the unity of the Ummah.</p>
      <h2>Method 1 – Our Free Qibla Finder</h2>
      <p>The easiest way: use our <Link href="/qibla">Qibla Finder tool</Link>. It uses your device GPS to calculate the exact great‑circle bearing to the Kaaba. It works in any country and displays the direction visually with a compass.</p>
      <h2>Method 2 – Compass Bearings</h2>
      <p>Approximate Qibla bearings from major cities:</p>
      <ul>
        <li><strong>London:</strong> ~119° (south‑east)</li>
        <li><strong>New York:</strong> ~58° (north‑east)</li>
        <li><strong>Los Angeles:</strong> ~24° (north‑north‑east)</li>
        <li><strong>Karachi:</strong> ~268° (west)</li>
        <li><strong>Sydney:</strong> ~278° (west)</li>
        <li><strong>Johannesburg:</strong> ~3° (north)</li>
        <li><strong>Kuala Lumpur:</strong> ~295° (north‑west)</li>
      </ul>
      <h2>Method 3 – Google Maps</h2>
      <ol>
        <li>Open Google Maps.</li>
        <li>Search for &quot;Kaaba, Mecca&quot; and drop a pin.</li>
        <li>Measure the straight‑line direction from your location to the pin.</li>
        <li>That line is your Qibla direction.</li>
      </ol>
      <h2>Accuracy Tips</h2>
      <p>Indoor compass readings can be affected by metal. For best results, use the tool outdoors, calibrate your device, and ensure location permission is granted. The static bearing shown is always correct.</p>
      <p>Open the tool: <Link href="/qibla">Qibla Finder →</Link></p>
    </>
  ),
  'hijri-calendar-explained': (
    <>
      <h2>What is the Hijri Calendar?</h2>
      <p>The Hijri calendar (التقويم الهجري) is the Islamic lunar calendar. Year 1 marks the Hijra – the Prophet&apos;s ﷺ migration from Makkah to Madinah in 622 CE.</p>
      <h2>Structure – 12 Lunar Months</h2>
      <p>A Hijri year has 354–355 days, about 11 days shorter than the Gregorian solar year. This is why Islamic events like Ramadan and Eid shift roughly 11 days earlier each year.</p>
      <h2>The 12 Months</h2>
      <ol>
        <li><strong>Muharram</strong> – Sacred month; Islamic New Year.</li>
        <li><strong>Safar</strong></li>
        <li><strong>Rabi&apos; al‑Awwal</strong> – Month of the Prophet&apos;s ﷺ birth.</li>
        <li><strong>Rabi&apos; al‑Thani</strong></li>
        <li><strong>Jumada al‑Awwal</strong></li>
        <li><strong>Jumada al‑Thani</strong></li>
        <li><strong>Rajab</strong> – Sacred month.</li>
        <li><strong>Sha&apos;ban</strong> – Month of preparation before Ramadan.</li>
        <li><strong>Ramadan</strong> ⭐ – Month of fasting.</li>
        <li><strong>Shawwal</strong> – Eid al‑Fitr on 1st Shawwal.</li>
        <li><strong>Dhul Qa&apos;dah</strong> – Sacred month.</li>
        <li><strong>Dhul Hijjah</strong> – Month of Hajj; Eid al‑Adha on 10th.</li>
      </ol>
      <h2>The Four Sacred Months</h2>
      <p>Allah mentions four sacred months in the Quran (9:36): Muharram, Rajab, Dhul Qa&apos;dah, and Dhul Hijjah. Fighting is prohibited during these months except in self‑defence.</p>
      <h2>Converting Between Hijri and Gregorian</h2>
      <p>Because the two calendars don&apos;t align, conversion requires an algorithm. Our <Link href="/hijri-calendar">Hijri Calendar converter</Link> uses the Umm al‑Qura algorithm to instantly switch between dates.</p>
      <p>Try it: <Link href="/hijri-calendar">Hijri Calendar Converter →</Link></p>
    </>
  ),
  'ramadan-preparation-guide': (
    <>
      <h2>Why Prepare for Ramadan?</h2>
      <p>Ramadan is the holiest month in Islam. The Prophet ﷺ used to make dua: <em>&quot;O Allah, bless us in Rajab and Sha&apos;ban, and let us reach Ramadan.&quot;</em> Preparation ensures you enter the month spiritually, physically, and practically ready.</p>
      <h2>Spiritual Preparation</h2>
      <ul>
        <li><strong>Make sincere Tawbah (repentance)</strong> before Ramadan begins.</li>
        <li><strong>Increase Quran recitation</strong> in Sha&apos;ban – aim for at least one Juz&apos; daily.</li>
        <li><strong>Set spiritual goals:</strong> How many Quran completions? How many nights of Tarawih? How much sadaqah?</li>
        <li><strong>Make dua to reach Ramadan.</strong></li>
      </ul>
      <h2>Physical Preparation</h2>
      <ul>
        <li>Gradually adjust your sleep schedule to wake up for Suhoor.</li>
        <li>Reduce caffeine intake to avoid withdrawal headaches.</li>
        <li>Practice optional fasts in Sha&apos;ban to prepare your body.</li>
        <li>Prepare healthy Suhoor meals in advance – complex carbs, protein, and plenty of water.</li>
      </ul>
      <h2>Practical Preparation</h2>
      <ul>
        <li>Set up your daily tracker with our <Link href="/ramadan-planner">Ramadan Planner</Link>.</li>
        <li>Look up prayer times using the <Link href="/prayer-times">Prayer Times tool</Link>.</li>
        <li>Calculate your Zakat – many Muslims prefer to give during Ramadan for multiplied reward.</li>
        <li>Shop for Eid gifts and decorations early to avoid last‑minute rush.</li>
      </ul>
      <h2>During Ramadan</h2>
      <ul>
        <li>Do not skip Suhoor – the Prophet ﷺ called it a blessed meal.</li>
        <li>Break your fast with dates and water, following the Sunnah.</li>
        <li>Prioritise the last 10 nights – seek Laylat al‑Qadr.</li>
        <li>Give sadaqah daily, even if small.</li>
      </ul>
      <p>Use our <Link href="/ramadan-planner">Ramadan Planner</Link> to track your fasts, ibadah, and goals.</p>
    </>
  ),
  'what-is-mizan-islamic-blueprint': (
    <>
      <h2>What is Mizan?</h2>
      <p>Mizan (ميزان – &quot;the balance&quot;) is our unique Islamic life blueprint tool. It combines the ancient Abjad numerology system, the 99 Beautiful Names of Allah, and Quranic guidance to generate a personalised spiritual profile.</p>
      <h2>How Abjad Numerology Works</h2>
      <p>Abjad (أبجد) is the traditional Arabic alphanumerical system – each Arabic letter has a numerical value. The system has been used by Islamic scholars for centuries and appears in classical literature. Mizan applies digit‑reduction to your birth date to reveal three core numbers: Life, Soul, and Destiny.</p>
      <h2>What Your Blueprint Includes</h2>
      <ul>
        <li><strong>Your Life Number</strong> – derived from your birth date.</li>
        <li><strong>Your Guiding Name of Allah</strong> – one of the 99 Names aligned with your profile.</li>
        <li><strong>A Quranic Ayah</strong> – personally relevant to your spiritual path.</li>
        <li><strong>Your Spiritual Archetype</strong> – describing your strengths, challenges, and recommended worship.</li>
        <li><strong>Compatibility insights</strong> – which archetypes harmonise with yours.</li>
        <li><strong>Daily verses</strong> – a reflection for each day of the week.</li>
      </ul>
      <h2>Is Mizan Islamic?</h2>
      <p>Mizan is a tool for self‑reflection and inspiration, not fortune‑telling (which is haram). All outputs are rooted in the Names of Allah and Quranic themes. It is a mirror for self‑improvement, encouraging you to connect more deeply with Allah&apos;s attributes.</p>
      <p>Try it now: <Link href="/mizan">Open Mizan →</Link></p>
    </>
  ),
  '99-names-of-allah-guide': (
    <>
      <h2>What are the 99 Names of Allah?</h2>
      <p>The 99 Beautiful Names (Asma ul Husna – الأسماء الحسنى) are the divine attributes of Allah mentioned in the Quran and authentic Hadith. The Prophet ﷺ said: <em>&quot;Allah has ninety‑nine names… Whoever memorises them will enter Paradise.&quot;</em> (Bukhari &amp; Muslim).</p>
      <h2>Selected Names and Meanings</h2>
      <ul>
        <li><strong>Al‑Rahman (الرحمن)</strong> – The Most Merciful</li>
        <li><strong>Al‑Raheem (الرحيم)</strong> – The Especially Merciful</li>
        <li><strong>Al‑Malik (الملك)</strong> – The Sovereign King</li>
        <li><strong>Al‑Quddus (القدوس)</strong> – The Pure, The Holy</li>
        <li><strong>Al‑Salam (السلام)</strong> – The Source of Peace</li>
        <li><strong>Al‑Aziz (العزيز)</strong> – The All‑Mighty</li>
        <li><strong>Al‑Hakim (الحكيم)</strong> – The All‑Wise</li>
        <li><strong>Al‑Latif (اللطيف)</strong> – The Subtle, The Kind</li>
        <li><strong>Al‑Razzaq (الرزاق)</strong> – The Provider</li>
        <li><strong>Al‑Ghaffar (الغفار)</strong> – The Oft‑Forgiving</li>
      </ul>
      <h2>How to Benefit from the Names</h2>
      <p><strong>In Dhikr:</strong> Recite individual names in your daily remembrance.</p>
      <p><strong>In Dua:</strong> Use the relevant name when supplicating. The Quran says: <em>&quot;And to Allah belong the best names, so invoke Him by them.&quot;</em> (7:180).</p>
      <p><strong>In Reflection:</strong> Studying each name deepens your knowledge (Ma&apos;rifah) of Allah and strengthens Iman.</p>
      <h2>Explore All 99 Names</h2>
      <p>Use our interactive <Link href="/names-of-allah">99 Names of Allah tool</Link> to read every name in Arabic with transliteration, meaning, and benefits.</p>
    </>
  ),
  'halal-travel-tips': (
    <>
      <h2>Why Halal Travel?</h2>
      <p>As a Muslim traveller, maintaining your deen while exploring the world is both a right and a responsibility. With the right preparation, you can travel anywhere while staying true to your values.</p>
      <h2>1. Find Prayer Times Before You Go</h2>
      <p>Use our <Link href="/prayer-times">Prayer Times tool</Link> to look up timings for your destination. Screenshot them for offline access.</p>
      <h2>2. Locate Mosques at Your Destination</h2>
      <p>Use the <Link href="/mosque-finder">Mosque Finder</Link> to locate masjids near your hotel before you travel.</p>
      <h2>3. Research Halal Food in Advance</h2>
      <p>Apps like Zabihah.com and HalalTrip can help. In non‑Muslim countries, vegetarian and seafood options are generally safe. Pack halal snacks for long journeys.</p>
      <h2>4. Know the Traveller&apos;s Prayer (Qasr)</h2>
      <p>When travelling more than ~80km, you may shorten Dhuhr, Asr, and Isha to 2 rak&apos;ahs and combine prayers.</p>
      <h2>5. Set Your Qibla Direction at Each Hotel</h2>
      <p>Use our <Link href="/qibla">Qibla Finder</Link> as soon as you arrive.</p>
      <h2>6. Carry a Travel Prayer Mat</h2>
      <p>Compact mats let you pray anywhere – airports, parks, rest stops.</p>
      <h2>7. Make Dua for Safe Travel</h2>
      <p>Recite the travel dua: <em>Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun.</em> (Quran 43:13‑14).</p>
      <h2>8. Use Our Halal Travel Tool</h2>
      <p>Our <Link href="/halal-travel">Halal Travel planner</Link> helps you plan your journey while keeping your deen intact. Safe travels! ✈️</p>
    </>
  ),
  'dhikr-guide': (
    <>
      <h2>The Importance of Dhikr</h2>
      <p>Dhikr (ذِكْر) – the remembrance of Allah – is one of the greatest acts of worship. Allah says: <em>&quot;So remember Me; I will remember you.&quot;</em> (2:152). It brings tranquility to the heart and keeps the soul connected to its Creator.</p>
      <h2>Forms of Dhikr</h2>
      <ul>
        <li><strong>Tasbih:</strong> SubhanAllah (Glory be to Allah).</li>
        <li><strong>Tahmid:</strong> Alhamdulillah (All praise is for Allah).</li>
        <li><strong>Takbir:</strong> Allahu Akbar (Allah is the Greatest).</li>
        <li><strong>Tahlil:</strong> La ilaha illallah (There is no god but Allah).</li>
        <li><strong>Salawat:</strong> Sending blessings upon the Prophet ﷺ.</li>
        <li><strong>Istighfar:</strong> Seeking forgiveness (Astaghfirullah).</li>
      </ul>
      <h2>How to Build a Dhikr Habit</h2>
      <p>Start with a small, consistent target – e.g., 33 times after each prayer. Use our <Link href="/dhikr-counter">Dhikr Counter</Link> to track your daily counts and see your streaks. The tool remembers your progress and shows per‑dhikr statistics.</p>
      <h2>Rewards of Dhikr</h2>
      <p>The Prophet ﷺ said: <em>&quot;Shall I tell you about the best of your deeds, the purest in the sight of your Lord… and better for you than spending gold and silver?&quot;</em> They said: Yes. He said: <em>&quot;Remembrance of Allah.&quot;</em> (Tirmidhi).</p>
      <p>Begin your daily dhikr: <Link href="/dhikr-counter">Dhikr Counter →</Link></p>
    </>
  ),
  'inheritance-calculator-guide': (
    <>
      <h2>What is Fara&apos;id?</h2>
      <p>Fara&apos;id (فرائض) is the Islamic law of inheritance. The Quran provides explicit shares for heirs in Surah An‑Nisa (4:11‑12, 176). After paying funeral expenses, debts, and fulfilling any bequests (up to one‑third), the remaining estate is distributed among heirs according to fixed fractions.</p>
      <h2>Who Inherits?</h2>
      <p>Primary heirs: spouse, children, parents. Secondary: grandparents, siblings, uncles/aunts. The shares vary depending on the combination of surviving relatives.</p>
      <h2>Using the Inheritance Calculator</h2>
      <p>Our <Link href="/inheritance-calculator">Inheritance Calculator</Link> follows the Hanafi fiqh. Enter the total estate value, deduct funeral costs, debts, and wasiyyah. Then specify the number of each type of heir. The tool calculates the exact monetary share for each person.</p>
      <h2>Important Notes</h2>
      <ul>
        <li>This tool provides an estimate for educational purposes. For actual estate division, consult a qualified Islamic scholar and a local lawyer.</li>
        <li>Inheritance laws vary by country; a legal will must comply with local regulations.</li>
      </ul>
      <p>Try it: <Link href="/inheritance-calculator">Inheritance Calculator →</Link></p>
    </>
  ),
  'halal-finance-check-guide': (
    <>
      <h2>What is Halal Finance?</h2>
      <p>Islamic finance prohibits <strong>Riba</strong> (interest), <strong>Gharar</strong> (excessive uncertainty), and <strong>Maysir</strong> (gambling). Transactions must be asset‑backed and involve clear terms.</p>
      <h2>How the Halal Finance Check Works</h2>
      <p>Our <Link href="/halal-finance">Halal Finance Check</Link> asks you a few specific questions about a financial deal – loan, mortgage, investment, insurance, crypto, or rental. It then calculates a risk score and highlights red flags and positive factors. It also suggests Shariah‑compliant alternatives.</p>
      <h2>Example: Checking a Loan</h2>
      <p>If a loan charges fixed interest, the tool flags it as Riba. If it&apos;s secured with an asset and offered by an Islamic bank using Murabaha, it passes the check.</p>
      <h2>Important Disclaimer</h2>
      <p>This tool is for screening only. For a binding ruling, consult a qualified Islamic finance scholar.</p>
      <p>Check a deal: <Link href="/halal-finance">Halal Finance Check →</Link></p>
    </>
  ),
  'kaffarah-calculator-guide': (
    <>
      <h2>What is Kaffarah?</h2>
      <p>Kaffarah (كفارة) is an obligatory expiation for specific sins or violations. It is a form of worship that atones for the wrong, and it must be accompanied by sincere repentance (Tawbah).</p>
      <h2>Types of Kaffarah</h2>
      <ul>
        <li><strong>Broken Oath (Yamin):</strong> Feed 10 poor people, clothe them, or fast 3 days.</li>
        <li><strong>Zihar:</strong> Free a slave (not applicable today), then fast 60 consecutive days, then feed 60 poor people.</li>
        <li><strong>Accidental Killing:</strong> Free a believing slave (not applicable today), fast 2 consecutive months. Diyah (blood money) must also be paid separately.</li>
        <li><strong>Broken Ramadan Fast (by intercourse):</strong> Free a slave (N/A), fast 60 consecutive days, feed 60 poor people.</li>
      </ul>
      <h2>Using the Kaffarah Calculator</h2>
      <p>Select the type of kaffarah, adjust the cost per meal or garment according to your local prices, and set the number of occurrences. The <Link href="/kaffarah-calculator">Kaffarah Calculator</Link> shows the monetary equivalent or fasting days required.</p>
      <h2>Important: Consult a Scholar</h2>
      <p>This is a general guide based on majority Sunni fiqh. For your specific case, always consult a qualified Islamic scholar.</p>
      <p>Calculate your kaffarah: <Link href="/kaffarah-calculator">Kaffarah Calculator →</Link></p>
    </>
  ),
  'sadaqah-tracker-guide': (
    <>
      <h2>The Virtue of Sadaqah</h2>
      <p>Sadaqah (صدقة) – voluntary charity – is highly encouraged in Islam. The Prophet ﷺ said: <em>&quot;Sadaqah extinguishes sin as water extinguishes fire.&quot;</em> (Tirmidhi). Even a smile is sadaqah.</p>
      <h2>Making Sadaqah a Habit</h2>
      <p>Small, consistent acts are beloved to Allah. Our <Link href="/sadaqah-tracker">Sadaqah Tracker</Link> lets you log every donation, categorise it (food, education, water, etc.), and track your daily streaks and monthly totals.</p>
      <h2>Features of the Sadaqah Tracker</h2>
      <ul>
        <li>Quick log form with amount, category, recipient, and date.</li>
        <li>Breakdown of donations by category with progress bars.</li>
        <li>Inspiration tab with Quranic verses about charity.</li>
        <li>Streak counter to encourage daily giving.</li>
      </ul>
      <p>Start tracking: <Link href="/sadaqah-tracker">Sadaqah Tracker →</Link></p>
    </>
  ),
  'islamic-will-guide': (
    <>
      <h2>What is an Islamic Will (Wasiyyah)?</h2>
      <p>A Wasiyyah (وصية) is a will that allows a Muslim to distribute up to one‑third of their estate to non‑heirs or charity, while the remaining two‑thirds are divided according to fixed inheritance shares (Fara&apos;id). It is recommended to have one, especially if you have specific charitable wishes.</p>
      <h2>Why Every Muslim Needs a Will</h2>
      <ul>
        <li>Ensures your debts are paid and your funeral is arranged according to Islamic rites.</li>
        <li>Allows you to leave sadaqah jariyah (ongoing charity).</li>
        <li>Prevents family disputes and ensures a smooth distribution of assets.</li>
      </ul>
      <h2>Using the Islamic Will Generator</h2>
      <p>Our <Link href="/islamic-will">Islamic Will generator</Link> creates a basic Shariah‑compliant draft. Fill in your details, executor, debts, charitable bequests, and print the document. Always consult a scholar and lawyer to make it legally binding in your country.</p>
      <p>Create your will: <Link href="/islamic-will">Islamic Will Generator →</Link></p>
    </>
  ),
  'hajj-checklist-guide': (
    <>
      <h2>The Ultimate Hajj Checklist</h2>
      <p>Hajj is a once‑in‑a‑lifetime obligation. Careful preparation ensures you focus on worship rather than logistics. Our <Link href="/hajj-checklist">Hajj Checklist</Link> covers every rite, day by day.</p>
      <h2>Before You Leave</h2>
      <ul>
        <li>Obtain Hajj visa and Nusuk permit.</li>
        <li>Learn the Manasik (rites) of Hajj.</li>
        <li>Pack unscented toiletries, Ihram garments, comfortable sandals.</li>
        <li>Arrange travel insurance, vaccinations, and emergency contacts.</li>
      </ul>
      <h2>Day‑by‑Day Rites</h2>
      <ul>
        <li><strong>8th Dhul Hijjah (Yawm at‑Tarwiyah):</strong> Enter Ihram, travel to Mina, pray five prayers there.</li>
        <li><strong>9th Dhul Hijjah (Day of Arafah):</strong> Stand at Arafat – the greatest pillar. Spend the day in du&apos;a and dhikr.</li>
        <li><strong>10th Dhul Hijjah (Eid al‑Adha):</strong> Stone Jamarat al‑Aqaba, offer sacrifice, shave/trim hair, perform Tawaf al‑Ifadah.</li>
        <li><strong>11th‑13th Dhul Hijjah (Ayyam at‑Tashreeq):</strong> Stone the three Jamarat each day, stay in Mina.</li>
        <li><strong>Farewell Tawaf (Tawaf al‑Wada):</strong> Before departing Makkah.</li>
      </ul>
      <h2>Essential Duas</h2>
      <p>Recite the Talbiyah abundantly: <em>Labbayk Allahumma labbayk…</em></p>
      <p>Track your progress: <Link href="/hajj-checklist">Hajj Checklist →</Link></p>
    </>
  ),
  'quran-reader-guide': (
    <>
      <h2>Reading the Quran Online</h2>
      <p>Our <Link href="/quran-reader">Quran Reader</Link> brings the Holy Quran to your browser with a beautiful Indo‑Pak Mushaf display, verse‑by‑verse mode, and multiple translations.</p>
      <h2>Key Features</h2>
      <ul>
        <li><strong>Indo‑Pak Mushaf</strong> – authentic 15‑line Arabic script.</li>
        <li><strong>Verse‑by‑Verse</strong> – read with translation and audio.</li>
        <li><strong>English &amp; Urdu Translations</strong> – toggle instantly.</li>
        <li><strong>Audio Recitation</strong> – tap any verse to hear a renowned Qari.</li>
        <li><strong>Bookmarking</strong> – double‑tap to save your place.</li>
      </ul>
      <h2>How to Use</h2>
      <p>Select a surah from the list. Switch between Mushaf and verse view, adjust font size, and enable continuous playback to listen to the entire surah.</p>
      <p>Start reading: <Link href="/quran-reader">Quran Reader →</Link></p>
    </>
  ),
  'hadith-search-guide': (
    <>
      <h2>The Six Canonical Collections</h2>
      <p>The most authentic hadith collections in Sunni Islam are: Sahih Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami&apos; at‑Tirmidhi, Sunan an‑Nasa&apos;i, and Sunan Ibn Majah. Our <Link href="/hadith-search">Hadith Search</Link> lets you search across all six.</p>
      <h2>How to Find a Hadith</h2>
      <p>Enter a keyword (e.g., &quot;prayer&quot;, &quot;fasting&quot;, &quot;kindness&quot;), filter by book, and browse the results. Each hadith shows its source, grade, and text.</p>
      <h2>Language Support</h2>
      <p>The tool loads both English and Urdu editions. You can switch language at any time without re‑searching.</p>
      <h2>Bookmark and Share</h2>
      <p>Save hadiths to your personal list and copy them to share with others.</p>
      <p>Search now: <Link href="/hadith-search">Hadith Search →</Link></p>
    </>
  ),
  'islamic-names-finder-guide': (
    <>
      <h2>Choosing a Muslim Name</h2>
      <p>Naming a child is an important responsibility. The Prophet ﷺ said: <em>&quot;On the Day of Resurrection, you will be called by your names and the names of your fathers. So choose good names.&quot;</em> (Abu Dawud).</p>
      <h2>Using the Islamic Names Finder</h2>
      <p>Our <Link href="/islamic-names">Islamic Names Finder</Link> contains over 14,585 names from an authentic dataset. You can search by meaning (e.g., &quot;brave&quot;, &quot;flower&quot;), filter by gender, and see the Arabic script, transliteration, and meaning.</p>
      <h2>Saving Favourites</h2>
      <p>Tap the bookmark icon to save names for later. Your saved list is always available in the &quot;Saved&quot; tab.</p>
      <p>Browse names: <Link href="/islamic-names">Islamic Names Finder →</Link></p>
    </>
  ),
  'dua-generator-guide': (
    <>
      <h2>The Power of Dua</h2>
      <p>Dua (supplication) is the essence of worship. The Prophet ﷺ said: <em>&quot;Dua is worship.&quot;</em> (Tirmidhi). Allah promises: <em>&quot;Call upon Me; I will respond to you.&quot;</em> (40:60).</p>
      <h2>Authentic Duas at Your Fingertips</h2>
      <p>Our <Link href="/dua-generator">Dua Generator</Link> offers a curated collection of duas from the Quran and Sahih hadith. Each dua includes Arabic text, transliteration, translation (English/Urdu), and reference. Categories cover anxiety, health, travel, parents, and more.</p>
      <h2>Daily Dua</h2>
      <p>A featured &quot;Dua of the Day&quot; appears at the top. You can also search by keyword or browse by category.</p>
      <p>Make du&apos;a: <Link href="/dua-generator">Dua Generator →</Link></p>
    </>
  ),
  'mosque-finder-guide': (
    <>
      <h2>Find Mosques Anywhere</h2>
      <p>Our <Link href="/mosque-finder">Mosque Finder</Link> uses OpenStreetMap data to locate mosques near your current location or any city you search for.</p>
      <h2>Live Prayer Times for Each Masjid</h2>
      <p>Tap on any mosque to see today&apos;s prayer times calculated for that exact location, powered by the Aladhan API. You can also get directions via Google Maps.</p>
      <h2>Radius Selection</h2>
      <p>Choose a search radius from 2km to 20km to filter results by distance.</p>
      <p>Find a mosque: <Link href="/mosque-finder">Mosque Finder →</Link></p>
    </>
  ),
  'islamic-events-countdown': (
    <>
      <h2>Track Islamic Events</h2>
      <p>Our <Link href="/islamic-events">Islamic Events page</Link> shows live countdowns to major Islamic dates – Ramadan, Eid al‑Fitr, Eid al‑Adha, Day of Arafah, Islamic New Year, Ashura, Mawlid, and more.</p>
      <h2>How It Works</h2>
      <p>Dates are calculated using the Kuwaiti Hijri algorithm and update every year automatically. Each event card shows the Hijri date, Gregorian date, countdown in days, and significance.</p>
      <h2>Pin Events</h2>
      <p>Pin the events most important to you to the top of the list for quick access.</p>
      <p>See the countdowns: <Link href="/islamic-events">Islamic Events →</Link></p>
    </>
  ),
  'understanding-islamic-calendar': (
    <>
      <h2>Structure of the Islamic Year</h2>
      <p>The Islamic calendar is lunar, consisting of 12 months of 29 or 30 days, depending on moon sighting. The year is 354–355 days long, about 11 days shorter than the Gregorian year.</p>
      <h2>Sacred Months</h2>
      <p>Allah designated four months as sacred: Muharram, Rajab, Dhul Qa&apos;dah, and Dhul Hijjah (Quran 9:36). Fighting is prohibited during these months except in self‑defence.</p>
      <h2>Moon Sighting</h2>
      <p>The start of each month is determined by the sighting of the new crescent moon. Different countries may start the month on slightly different days. Our <Link href="/hijri-calendar">Hijri Calendar converter</Link> uses the Umm al‑Qura estimation, but actual dates may vary by one day.</p>
      <p>Learn more: <Link href="/hijri-calendar">Hijri Calendar →</Link></p>
    </>
  ),
  'benefits-of-dhikr': (
    <>
      <h2>Why Dhikr Matters</h2>
      <p>Dhikr is the lifeline of the believer. It keeps the heart attached to Allah amidst the distractions of daily life. Allah says: <em>&quot;Those who believe and whose hearts find rest in the remembrance of Allah. Verily, in the remembrance of Allah do hearts find rest.&quot;</em> (13:28).</p>
      <h2>Benefits of Dhikr</h2>
      <ul>
        <li>Brings inner peace and reduces anxiety.</li>
        <li>Erases sins and raises ranks in Paradise.</li>
        <li>Attracts angels and repels Shaytan.</li>
        <li>Strengthens willpower and taqwa.</li>
      </ul>
      <h2>Practical Ways to Increase Dhikr</h2>
      <p>Set aside 5 minutes after each prayer. Use our <Link href="/dhikr-counter">Dhikr Counter</Link> to track your daily targets and see your progress over time.</p>
      <p>Start your daily dhikr: <Link href="/dhikr-counter">Dhikr Counter →</Link></p>
    </>
  ),
  'salah-postures-guide': (
    <>
      <h2>The Inner Dimensions of Salah</h2>
      <p>Each posture in prayer carries a deep spiritual meaning. Understanding these can increase your khushu&apos; (concentration and humility).</p>
      <h2>Qiyam (Standing)</h2>
      <p>Standing upright represents readiness to serve Allah. It is the posture of respect and alertness. Focus on the meaning of the words you recite.</p>
      <h2>Ruku (Bowing)</h2>
      <p>Bowing symbolises humility and submission. It is a physical declaration that you lower yourself only before Allah.</p>
      <h2>Sujud (Prostration)</h2>
      <p>The highest state of submission. The forehead – the symbol of pride – touches the ground. The Prophet ﷺ said: <em>&quot;The closest a servant is to his Lord is when he is prostrating.&quot;</em> (Muslim). Make abundant du&apos;a in this position.</p>
      <h2>Tashahhud (Sitting)</h2>
      <p>The sitting posture is a moment of intimate conversation with Allah, reciting the testimony of faith and sending blessings upon the Prophet ﷺ.</p>
      <p>Learn more about prayer times: <Link href="/prayer-times">Prayer Times →</Link></p>
    </>
  ),
  'laylatul-qadr-guide': (
    <>
      <h2>What is Laylatul Qadr?</h2>
      <p>Laylatul Qadr (ليلة القدر) – the Night of Power – is the holiest night in Islam. It is the night the Quran was first revealed. Worship on this night is better than a thousand months (Quran 97:3).</p>
      <h2>When is Laylatul Qadr?</h2>
      <p>It falls in the last ten nights of Ramadan, most likely on an odd night (21st, 23rd, 25th, 27th, or 29th). Many scholars lean towards the 27th night, but the exact date is hidden so that Muslims strive in worship throughout the last ten nights.</p>
      <h2>How to Maximise Laylatul Qadr</h2>
      <ul>
        <li>Perform I&apos;tikaf (seclusion in the mosque) if possible.</li>
        <li>Increase Quran recitation, dhikr, and du&apos;a.</li>
        <li>Recite the recommended du&apos;a: <em>Allahumma innaka &apos;afuwwun tuhibbul &apos;afwa fa&apos;fu &apos;anni</em> (O Allah, You are Forgiving and love forgiveness, so forgive me).</li>
        <li>Give sadaqah generously.</li>
      </ul>
      <p>Track Ramadan nights with our <Link href="/ramadan-planner">Ramadan Planner</Link>.</p>
    </>
  ),
};

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find(a => a.slug === slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `https://iloveislam.life/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://iloveislam.life/blog/${article.slug}`,
      type: 'article',
      publishedTime: article.date,
    },
  };
}

export function generateStaticParams() {
  return ARTICLES.map(a => ({ slug: a.slug }));
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES.find(a => a.slug === slug);
  if (!article) notFound();

  const content = CONTENT[article.slug];
  const related = ARTICLES.filter(a => a.slug !== article.slug && a.category === article.category).slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-8 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="text-white/70 hover:text-white text-sm flex items-center gap-1 mb-4">
            ← Back to Blog
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-amber-400 text-emerald-900 text-[10px] font-bold px-3 py-1 rounded-full">{article.category}</span>
            <span className="text-white/60 text-xs">📖 {article.readTime}</span>
            <span className="text-white/60 text-xs">{new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
          <p className="text-white/70 text-sm">{article.excerpt}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 pb-20">
        <article className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm prose prose-stone prose-lg max-w-none">
          {content}
        </article>

        {/* CTA */}
        <div className="bg-emerald-800 text-white rounded-2xl p-6 text-center mt-8 shadow-md">
          <h2 className="font-bold text-xl mb-2">Try Our Free Islamic Tools</h2>
          <p className="text-white/70 text-sm mb-4">20+ free tools – no sign‑up required.</p>
          <Link href="/" className="inline-block bg-amber-400 text-emerald-900 px-6 py-2 rounded-full font-bold hover:bg-amber-300 transition">
            Explore All Tools →
          </Link>
        </div>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Related Articles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {related.map(r => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all group">
                  <span className="text-2xl">{r.emoji}</span>
                  <h3 className="font-semibold text-gray-800 mt-2 group-hover:text-emerald-800">{r.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{r.readTime}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.excerpt,
          datePublished: article.date,
          author: { '@type': 'Organization', name: 'I Love Islam' },
          publisher: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
        })}} />
      </main>
    </div>
  );
}