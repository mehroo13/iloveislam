import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ── Article metadata list (must match page.tsx exactly) ───────────────────
const ARTICLES = [
  { slug: 'how-to-calculate-zakat',        title: 'How to Calculate Zakat: A Complete Step-by-Step Guide',                      excerpt: 'Zakat is one of the Five Pillars of Islam. Learn exactly how to calculate your annual Zakat, understand the Nisab threshold, and what assets are included.',                                                                  category: 'Finance',       emoji: '💰', readTime: '5 min read', date: '2025-06-01' },
  { slug: 'what-is-mizan-islamic-blueprint', title: 'What is the Mizan Islamic Life Blueprint?',                                excerpt: 'Discover how the Mizan tool uses the ancient Abjad numerology system, the 99 Names of Allah, and Quranic guidance to reveal your Islamic archetype and life purpose.',                                                  category: 'Self-Discovery',emoji: '✦',  readTime: '4 min read', date: '2025-06-03' },
  { slug: 'qibla-direction-guide',          title: 'How to Find the Qibla Direction Anywhere in the World',                     excerpt: 'The Qibla is the direction Muslims face during Salah. Learn how to find it accurately using our free Qibla Finder tool, and understand the calculation behind it.',                                                     category: 'Prayer',        emoji: '🧭', readTime: '3 min read', date: '2025-06-05' },
  { slug: 'prayer-times-guide',             title: 'Understanding Islamic Prayer Times: Fajr, Dhuhr, Asr, Maghrib & Isha',      excerpt: 'A complete guide to the five daily prayers — what they are, when they occur, and how to find accurate prayer times for your city anywhere in the world.',                                                           category: 'Prayer',        emoji: '🕐', readTime: '6 min read', date: '2025-06-07' },
  { slug: 'hijri-calendar-explained',       title: 'The Islamic Hijri Calendar Explained — And How to Convert Dates',           excerpt: 'The Hijri calendar is the Islamic lunar calendar used to determine dates of Islamic events. Learn how it works and how to convert between Hijri and Gregorian dates.',                                                category: 'Knowledge',     emoji: '🌙', readTime: '4 min read', date: '2025-06-09' },
  { slug: '99-names-of-allah-guide',        title: 'The 99 Names of Allah (Asma ul Husna) — Meanings & Benefits',              excerpt: 'Allah has 99 beautiful names, each reflecting a divine attribute. Learn about all 99 names, their meanings, and the spiritual benefits of reciting them.',                                                           category: 'Knowledge',     emoji: '⭐', readTime: '8 min read', date: '2025-06-11' },
  { slug: 'ramadan-preparation-guide',      title: 'How to Prepare for Ramadan: A Complete Muslim Guide',                       excerpt: 'Ramadan is the holiest month in Islam. Learn how to prepare spiritually, physically, and practically for the blessed month of fasting and worship.',                                                                  category: 'Ramadan',       emoji: '🌙', readTime: '7 min read', date: '2025-06-13' },
  { slug: 'halal-travel-tips',              title: "10 Essential Tips for Halal Travel — A Muslim Traveller's Guide",           excerpt: 'Travelling as a Muslim comes with unique considerations. From finding halal food to maintaining prayer schedules — here is everything you need to know.',                                                           category: 'Travel',        emoji: '🌍', readTime: '5 min read', date: '2025-06-15' },
  { slug: 'how-to-perform-wudu',            title: 'How to Perform Wudu (Ablution): Step-by-Step with Duas',                   excerpt: 'Wudu is the ritual purification required before Salah. Learn the correct steps, the Fard and Sunnah acts, and the duas to recite throughout.',                                                                      category: 'Prayer',        emoji: '💧', readTime: '5 min read', date: '2025-06-17' },
  { slug: 'dhikr-guide-benefits',           title: 'The Complete Guide to Dhikr — Remembrance of Allah',                       excerpt: 'Dhikr (remembrance of Allah) is the heart of Islamic worship. Learn the most important adhkar, their virtues, and how to build a daily dhikr routine.',                                                              category: 'Worship',       emoji: '📿', readTime: '6 min read', date: '2025-06-19' },
  { slug: 'how-to-make-dua',               title: 'How to Make Dua: The Islamic Guide to Supplication',                        excerpt: 'Dua is your direct connection to Allah. Learn the etiquettes, best times, and conditions for dua that the Prophet ﷺ taught us to maximise acceptance.',                                                             category: 'Worship',       emoji: '🤲', readTime: '6 min read', date: '2025-06-21' },
  { slug: 'quran-reading-guide',            title: "Beginner's Guide to Reading the Quran: Where to Start",                    excerpt: 'Starting to read the Quran can feel overwhelming. This guide helps beginners understand how to approach the Quran, which Surahs to start with, and how to build a daily habit.',                                   category: 'Quran',         emoji: '📖', readTime: '6 min read', date: '2025-06-23' },
  { slug: 'what-is-sadaqah',               title: 'What is Sadaqah? Types, Benefits & How to Give Charity in Islam',           excerpt: 'Sadaqah means voluntary charity in Islam. Learn the difference between Sadaqah and Zakat, the types of Sadaqah, and why even a smile counts as charity.',                                                          category: 'Finance',       emoji: '💝', readTime: '5 min read', date: '2025-06-25' },
  { slug: 'hajj-guide-beginners',           title: "Hajj Explained: A Beginner's Complete Guide to the Pilgrimage",            excerpt: 'Hajj is the fifth Pillar of Islam — a once-in-a-lifetime pilgrimage to Mecca. Learn the rituals, pillars, days, and spiritual significance of Hajj.',                                                               category: 'Hajj & Umrah',  emoji: '🕋', readTime: '9 min read', date: '2025-06-27' },
  { slug: 'umrah-step-by-step',            title: 'How to Perform Umrah: A Step-by-Step Guide',                                excerpt: "Umrah is the lesser pilgrimage that can be performed at any time of year. Learn the four essential steps — Ihram, Tawaf, Sa'i, and Halq/Taqsir.",                                                                  category: 'Hajj & Umrah',  emoji: '🕌', readTime: '7 min read', date: '2025-06-29' },
  { slug: 'islamic-inheritance-guide',      title: 'Islamic Inheritance (Mirath): Rules & How to Calculate Shares',            excerpt: 'Islam has a detailed and just system of inheritance. Learn the Quranic rules of Mirath, who inherits what, and how to use our free calculator.',                                                                    category: 'Finance',       emoji: '📜', readTime: '7 min read', date: '2025-07-01' },
  { slug: 'writing-islamic-will',           title: 'Why Every Muslim Needs a Will — And How to Write One',                     excerpt: 'Writing a Will (Wasiyyah) is an Islamic obligation. Learn the Islamic rules of will-writing, what you can and cannot include, and how to get started today.',                                                        category: 'Finance',       emoji: '📋', readTime: '5 min read', date: '2025-07-03' },
  { slug: 'halal-finance-guide',            title: 'Halal Finance: What Is Riba and How to Avoid It',                          excerpt: 'Riba (interest) is strictly prohibited in Islam. Learn what counts as Riba, why it is forbidden, and how to manage your money in a halal way.',                                                                     category: 'Finance',       emoji: '🏦', readTime: '6 min read', date: '2025-07-05' },
  { slug: 'kaffarah-guide',                 title: 'What is Kaffarah? Types, Reasons & How to Calculate It',                   excerpt: 'Kaffarah is an expiation required for breaking certain Islamic obligations. Learn when it applies and how to calculate it.',                                                                                           category: 'Knowledge',     emoji: '⚖️', readTime: '5 min read', date: '2025-07-07' },
  { slug: 'eid-guide',                      title: 'Eid al-Fitr & Eid al-Adha: Complete Guide to Islamic Celebrations',        excerpt: 'Eid is the greatest celebration in Islam. Learn the significance of both Eids, the Sunnah acts, Eid prayer, and how to celebrate in the spirit of Islam.',                                                          category: 'Knowledge',     emoji: '🎉', readTime: '6 min read', date: '2025-07-09' },
  { slug: 'how-to-find-mosque',             title: 'How to Find a Mosque Near You — Anywhere in the World',                    excerpt: "Finding a mosque is essential for Jumu'ah, Tarawih, and community connection. Learn how to use our Mosque Finder tool and tips for visiting a new mosque.",                                                       category: 'Prayer',        emoji: '🕌', readTime: '3 min read', date: '2025-07-11' },
  { slug: 'hadith-guide',                   title: 'What is Hadith? The 6 Major Hadith Collections Explained',                 excerpt: 'Hadith are the recorded sayings and actions of the Prophet Muhammad ﷺ. Learn what Hadith are, how they are graded, and the importance of the 6 major collections.',                                               category: 'Knowledge',     emoji: '📚', readTime: '7 min read', date: '2025-07-13' },
  { slug: 'islamic-names-guide',            title: 'How to Choose an Islamic Name: Meanings, Rules & Beautiful Options',       excerpt: 'A name carries deep meaning in Islam. Learn the Islamic rules for naming children, names to avoid, and how to find the perfect name with good meaning.',                                                              category: 'Knowledge',     emoji: '🌸', readTime: '5 min read', date: '2025-07-15' },
  { slug: 'kids-islamic-education',         title: "Teaching Children About Islam: A Parent's Complete Guide",                 excerpt: 'Raising children with strong Islamic values starts early. Learn age-appropriate ways to teach your kids about prayer, the Quran, duas, and Islamic character.',                                                        category: 'Kids',          emoji: '👶', readTime: '7 min read', date: '2025-07-17' },
  { slug: 'five-pillars-of-islam',          title: 'The Five Pillars of Islam: A Complete Overview',                           excerpt: 'The Five Pillars are the foundation of Muslim life — Shahada, Salah, Zakat, Sawm, and Hajj. Learn what each pillar means, its obligation, and how to fulfil it.',                                                   category: 'Knowledge',     emoji: '🏛️', readTime: '8 min read', date: '2025-07-19' },
  { slug: 'mosque-etiquette-guide',         title: 'Mosque Etiquette: Rules & Manners for Visiting a Masjid',                  excerpt: 'The mosque is the house of Allah. Learn the proper etiquette for entering, behaving in, and leaving the mosque — whether you are a regular or a first-time visitor.',                                                 category: 'Prayer',        emoji: '🕌', readTime: '4 min read', date: '2025-07-21' },
];

// ── Full article content ──────────────────────────────────────────────────
// All internal links use ONLY routes confirmed to exist in your /app folder:
// /zakat /prayer-times /qibla /dua /hijri /dhikr /quran /names /names-finder
// /mosque /ramadan /hajj /sadaqah /inheritance /will /halal-finance /kaffarah
// /eid /hadith /kids /mizan /travel /about /contact /faq
// ─────────────────────────────────────────────────────────────────────────
const CONTENT: Record<string, React.ReactNode> = {

  'how-to-calculate-zakat': (
    <>
      <h2>What is Zakat?</h2>
      <p>Zakat (زكاة) is one of the Five Pillars of Islam — an obligatory annual payment on wealth above a minimum threshold (Nisab), distributed to those in need. The word &quot;Zakat&quot; literally means purification: it purifies your wealth and your soul.</p>

      <h2>Who Must Pay Zakat?</h2>
      <p>Zakat is obligatory on every Muslim who is an adult, of sound mind, and owns wealth above the Nisab for one complete lunar year (Hawl).</p>

      <h2>What is the Nisab?</h2>
      <p>The Nisab is the minimum amount of wealth before Zakat becomes compulsory:</p>
      <ul>
        <li><strong>Gold Nisab:</strong> 87.48 grams of gold</li>
        <li><strong>Silver Nisab:</strong> 612.36 grams of silver</li>
      </ul>
      <p>Most scholars recommend using the silver Nisab for cash and savings, as it includes more people and is more widely applicable. Check the current silver price to determine your Nisab value in your currency.</p>

      <h2>What Assets are Zakatable?</h2>
      <ul>
        <li><strong>Cash &amp; bank savings</strong> — 2.5%</li>
        <li><strong>Gold &amp; silver</strong> (including jewellery held as investment) — 2.5%</li>
        <li><strong>Business inventory &amp; trade stock</strong> — 2.5%</li>
        <li><strong>Shares &amp; investments</strong> — 2.5% of current market value</li>
        <li><strong>Money owed to you</strong> (debts others owe you that are likely to be repaid) — 2.5%</li>
        <li><strong>Agricultural produce</strong> — 5% (irrigated) or 10% (rain-fed)</li>
      </ul>
      <p><strong>Not zakatable:</strong> your primary home, personal car, clothing, furniture, or tools used for earning a livelihood.</p>

      <h2>Step-by-Step Calculation</h2>
      <ol>
        <li>List all zakatable assets: cash + gold/silver value + stocks + business inventory + owed debts</li>
        <li>Subtract short-term liabilities (debts due within the next year)</li>
        <li>Check if the net total meets or exceeds the Nisab</li>
        <li>If yes, and you have held this amount for one lunar year, multiply by <strong>2.5%</strong> — that is your Zakat</li>
      </ol>

      <h2>Example Calculation</h2>
      <p>Savings: £10,000 | Gold value: £2,000 | Stocks: £3,000 | Debts owed to you: £1,000 | Short-term debts you owe: £2,000</p>
      <p><strong>Total zakatable wealth:</strong> £10,000 + £2,000 + £3,000 + £1,000 − £2,000 = £14,000</p>
      <p><strong>Zakat due:</strong> £14,000 × 2.5% = <strong>£350</strong></p>

      <h2>Who Receives Zakat?</h2>
      <p>The Quran (9:60) specifies eight categories: the poor, the needy, Zakat administrators, those whose hearts are to be reconciled, to free people from bondage, those in debt, in the cause of Allah, and stranded travellers.</p>

      <h2>Common Mistakes to Avoid</h2>
      <ul>
        <li>Forgetting to include gold jewellery held as an asset</li>
        <li>Not checking the Hawl (one lunar year has passed)</li>
        <li>Deducting long-term debts (like mortgages) in full — only deduct what is due within the year</li>
      </ul>

      <p>Use our <Link href="/zakat">free Zakat Calculator</Link> to calculate your exact amount in under 2 minutes. May Allah accept it from you.</p>
    </>
  ),

  'what-is-mizan-islamic-blueprint': (
    <>
      <h2>What is Mizan?</h2>
      <p>Mizan (ميزان — &quot;the balance&quot;) is our unique Islamic life blueprint tool. It combines the ancient Abjad numerology system, the 99 Beautiful Names of Allah, and Quranic guidance to generate a personalised Islamic spiritual profile based on your name and date of birth.</p>

      <h2>What is Abjad Numerology?</h2>
      <p>Abjad (أبجد) is the traditional Arabic alphanumerical system — each Arabic letter carries a specific numerical value. Scholars have used this system in classical Islamic literature for centuries to derive meaning and patterns. Mizan uses your name and birth date to calculate a number, which then maps to a divine attribute from the 99 Names of Allah.</p>

      <h2>How to Use the Mizan Tool</h2>
      <ol>
        <li>Go to <Link href="/mizan">Mizan</Link> from the home page</li>
        <li>Enter your full name as given at birth</li>
        <li>Enter your date of birth</li>
        <li>Press &quot;Discover Your Blueprint&quot;</li>
      </ol>

      <h2>What Your Blueprint Includes</h2>
      <ul>
        <li><strong>Your Life Number</strong> — derived from your birth date using the Abjad system</li>
        <li><strong>Your Guiding Name of Allah</strong> — one of the 99 Names most aligned with your profile</li>
        <li><strong>A Quranic Ayah</strong> — personally relevant to your spiritual path</li>
        <li><strong>Your Spiritual Archetype</strong> — describing your strengths, challenges, and recommended acts of worship</li>
        <li><strong>Dhikr Recommendation</strong> — a specific remembrance to build your daily practice</li>
      </ul>

      <h2>Is This Tool Islamic?</h2>
      <p>Mizan is an inspirational and reflective tool — not fortune-telling (which is haram). All outputs are rooted in the Names of Allah and Quranic themes. Think of it as a mirror for self-improvement, encouraging you to deepen your connection with Allah&apos;s attributes. It does not claim to predict the future or know the unseen.</p>

      <h2>Explore the 99 Names</h2>
      <p>Want to learn more about the divine names that power the Mizan tool? Visit our <Link href="/names">99 Names of Allah</Link> page to read every name with its meaning, transliteration, and dhikr guidance.</p>

      <p>Try it now: <Link href="/mizan">Open Mizan →</Link></p>
    </>
  ),

  'qibla-direction-guide': (
    <>
      <h2>What is the Qibla?</h2>
      <p>The Qibla (قبلة) is the direction of the Kaaba in Mecca, Saudi Arabia — the direction all Muslims face during their five daily prayers. It is one of the most powerful symbols of unity for the 1.8 billion Muslims worldwide, all turning together toward the same point.</p>

      <h2>Method 1 — Use Our Free Qibla Finder (Easiest)</h2>
      <p>The fastest and most accurate method is our <Link href="/qibla">free Qibla Finder tool</Link>. It uses your GPS location to calculate the exact compass bearing toward Mecca, works in any country, and works offline once loaded. Simply open it, allow location access, and the arrow will point to Mecca.</p>

      <h2>Method 2 — Use a Compass</h2>
      <p>Approximate Qibla compass bearings from major regions:</p>
      <ul>
        <li><strong>From UK / Western Europe:</strong> ~119° (south-east)</li>
        <li><strong>From USA East Coast:</strong> ~59° (north-east)</li>
        <li><strong>From USA West Coast:</strong> ~24° (north-north-east)</li>
        <li><strong>From Pakistan:</strong> ~263° (west)</li>
        <li><strong>From Australia:</strong> ~278° (west)</li>
        <li><strong>From South Africa:</strong> ~2° (north)</li>
        <li><strong>From Malaysia / Indonesia:</strong> ~295° (north-west)</li>
      </ul>

      <h2>Method 3 — Use the Sun</h2>
      <p>In the Arabian Peninsula and surrounding regions, the sun can help determine direction. At solar noon, the sun is due south — useful as a rough reference. However, this varies by season and latitude, so use it only as an estimate.</p>

      <h2>Common Questions</h2>
      <p><strong>Does the Qibla change by location?</strong> Yes — significantly. From New York it faces north-east; from Jakarta it faces north-west. This is because we are on a curved earth, so the shortest path (great circle route) to Mecca varies dramatically.</p>
      <p><strong>What if I genuinely cannot find the Qibla?</strong> Pray in your best estimation (Ijtihad) — your prayer is valid. The obligation is sincere effort, not perfection.</p>
      <p><strong>Does facing exactly north-east vs 59° make a difference?</strong> Scholars agree that a reasonable approximation is sufficient. You do not need to be precise to the degree.</p>

      <p>Find your exact direction now: <Link href="/qibla">Open the Qibla Finder →</Link></p>
    </>
  ),

  'prayer-times-guide': (
    <>
      <h2>The 5 Daily Prayers</h2>
      <p>The five daily prayers (Salah) are the second Pillar of Islam — obligatory on every adult Muslim. Their times are determined by the sun&apos;s position, which is why they shift slightly each day and vary by location. Understanding the logic behind prayer times helps you never miss a prayer, wherever you are.</p>

      <h2>Fajr — Dawn Prayer</h2>
      <p><strong>Time:</strong> From true dawn (Fajr Sadiq) until sunrise. <strong>Rak&apos;ahs:</strong> 2 Fard + 2 Sunnah before. This is considered the most virtuous prayer — the Prophet ﷺ said the two Sunnah of Fajr are better than the world and all it contains.</p>

      <h2>Dhuhr — Midday Prayer</h2>
      <p><strong>Time:</strong> After the sun passes its peak (solar noon) until Asr begins. <strong>Rak&apos;ahs:</strong> 4 Fard + 4 Sunnah before + 2 Sunnah after. On Fridays, the Jumu&apos;ah prayer (2 Fard) replaces Dhuhr for men in congregation.</p>

      <h2>Asr — Afternoon Prayer</h2>
      <p><strong>Time:</strong> When an object&apos;s shadow equals its length (Shafi&apos;i/Maliki/Hanbali) or double its length (Hanafi) until sunset. <strong>Rak&apos;ahs:</strong> 4 Fard. The Prophet ﷺ gave special warning against missing Asr.</p>

      <h2>Maghrib — Sunset Prayer</h2>
      <p><strong>Time:</strong> Immediately after sunset until the red twilight disappears from the horizon — approximately 1 to 1.5 hours. <strong>Rak&apos;ahs:</strong> 3 Fard + 2 Sunnah after. Scholars agree Maghrib should not be delayed.</p>

      <h2>Isha — Night Prayer</h2>
      <p><strong>Time:</strong> After the red and white twilight disappears until midnight (or dawn, though delaying beyond midnight is disliked). <strong>Rak&apos;ahs:</strong> 4 Fard + 2 Sunnah after + 3 Witr. The best time is before midnight.</p>

      <h2>Why Prayer Times Change Daily</h2>
      <p>Because times are based on the sun&apos;s position, they shift by 1 to 3 minutes each day as Earth orbits the sun and the length of daylight changes. In northern countries like Norway or Sweden, summer Fajr can be as early as 2:00 AM, while winter Asr may be before 3:00 PM.</p>

      <h2>Calculation Methods</h2>
      <p>Different organisations calculate prayer times using slightly different angles for dawn and dusk. Common methods include ISNA (North America), MWL (Muslim World League), and Karachi (South Asia). Our tool lets you select the method most appropriate for your region.</p>

      <p>Get accurate times for your location: <Link href="/prayer-times">Open Prayer Times →</Link></p>
    </>
  ),

  'hijri-calendar-explained': (
    <>
      <h2>What is the Hijri Calendar?</h2>
      <p>The Hijri calendar (التقويم الهجري) is the Islamic lunar calendar. Year 1 AH (After Hijra) marks the Prophet Muhammad&apos;s ﷺ migration (Hijra) from Mecca to Medina in 622 CE. As of 2025 CE, we are in the year 1447 AH.</p>

      <h2>How is it Structured?</h2>
      <p>The Hijri year has 354 to 355 days — approximately 11 days shorter than the Gregorian solar year. Each month begins with the sighting of the new crescent moon (hilal). This is why Islamic events like Ramadan and Eid rotate through all seasons over roughly 33 years.</p>

      <h2>The 12 Months</h2>
      <ol>
        <li><strong>Muharram</strong> — Sacred month; the Islamic New Year begins on 1 Muharram</li>
        <li><strong>Safar</strong></li>
        <li><strong>Rabi&apos; al-Awwal</strong> — Month of the Prophet&apos;s ﷺ birth (12th); Mawlid al-Nabi</li>
        <li><strong>Rabi&apos; al-Thani</strong></li>
        <li><strong>Jumada al-Awwal</strong></li>
        <li><strong>Jumada al-Thani</strong></li>
        <li><strong>Rajab</strong> — Sacred month; Isra&apos; and Mi&apos;raj on 27th</li>
        <li><strong>Sha&apos;ban</strong> — Month of preparation; the Prophet ﷺ fasted frequently in Sha&apos;ban</li>
        <li><strong>Ramadan</strong> ⭐ — Month of fasting; Laylat al-Qadr in the last 10 nights</li>
        <li><strong>Shawwal</strong> — Eid al-Fitr on 1st Shawwal; fasting 6 days is highly recommended</li>
        <li><strong>Dhul Qa&apos;dah</strong> — Sacred month; Hajj preparation begins</li>
        <li><strong>Dhul Hijjah</strong> — Month of Hajj; best 10 days of the year; Eid al-Adha on 10th</li>
      </ol>

      <h2>The Four Sacred Months</h2>
      <p>Allah mentions four sacred (Hurum) months in the Quran (9:36): Muharram, Rajab, Dhul Qa&apos;dah, and Dhul Hijjah. Sins in these months are considered more grave, and good deeds more rewarding.</p>

      <h2>Why Does Ramadan Move Each Year?</h2>
      <p>Because the Hijri year is approximately 11 days shorter than the Gregorian year, Ramadan begins about 11 days earlier each year in the Gregorian calendar. Over 33 years, Ramadan completes a full cycle through all seasons.</p>

      <p>Convert any date now: <Link href="/hijri">Open the Hijri Calendar Converter →</Link></p>
    </>
  ),

  '99-names-of-allah-guide': (
    <>
      <h2>What are the 99 Names of Allah?</h2>
      <p>The 99 Beautiful Names (Asma ul Husna — الأسماء الحسنى) are the divine attributes of Allah mentioned in the Quran and authentic Hadith. The Prophet ﷺ said: <em>Allah has ninety-nine names. Whoever memorises and acts upon them will enter Paradise.</em> (Bukhari and Muslim)</p>

      <h2>Selected Names and Their Meanings</h2>
      <ul>
        <li><strong>Al-Rahman (الرحمن)</strong> — The Most Merciful (general mercy encompassing all creation)</li>
        <li><strong>Al-Raheem (الرحيم)</strong> — The Especially Merciful (specific mercy for believers)</li>
        <li><strong>Al-Malik (الملك)</strong> — The Sovereign King</li>
        <li><strong>Al-Quddus (القدوس)</strong> — The Pure, The Holy</li>
        <li><strong>Al-Salam (السلام)</strong> — The Source of Peace</li>
        <li><strong>Al-Aziz (العزيز)</strong> — The All-Mighty, The Irresistible</li>
        <li><strong>Al-Hakim (الحكيم)</strong> — The All-Wise</li>
        <li><strong>Al-Latif (اللطيف)</strong> — The Subtle, The Gentle, The Kind</li>
        <li><strong>Al-Razzaq (الرزاق)</strong> — The Provider, The Sustainer</li>
        <li><strong>Al-Ghaffar (الغفار)</strong> — The Oft-Forgiving</li>
        <li><strong>Al-Wadud (الودود)</strong> — The Most Loving</li>
        <li><strong>Al-Qadir (القادر)</strong> — The All-Powerful</li>
      </ul>

      <h2>How to Benefit from the Names</h2>
      <p><strong>In Dhikr:</strong> Recite individual names in your daily remembrance. Visit our <Link href="/dhikr">Dhikr Counter</Link> to track your daily adhkar.</p>
      <p><strong>In Dua:</strong> Use the relevant name when supplicating. The Quran says: <em>And to Allah belong the best names, so invoke Him by them.</em> (7:180). Visit our <Link href="/dua">Dua Generator</Link> to find duas using the names.</p>
      <p><strong>In Reflection:</strong> Studying each name (tadabbur) deepens your knowledge of Allah (Ma&apos;rifah) and strengthens Iman. The <Link href="/mizan">Mizan tool</Link> can reveal which of Allah&apos;s names is most relevant to your spiritual journey.</p>

      <h2>Explore All 99 Names</h2>
      <p>Read every name in Arabic with transliteration, meaning, and dhikr guidance: <Link href="/names">Open the 99 Names of Allah Tool →</Link></p>
      <p>Also try our <Link href="/names-finder">Islamic Names Finder</Link> if you are looking for a name for a child with a beautiful meaning.</p>
    </>
  ),

  'ramadan-preparation-guide': (
    <>
      <h2>Why Prepare for Ramadan?</h2>
      <p>Ramadan is the holiest month in Islam — the month the Quran was revealed, in which the gates of Paradise are opened, the gates of Hell are closed, and rewards are multiplied immeasurably. The companions of the Prophet ﷺ would make dua six months in advance to reach Ramadan.</p>

      <h2>Spiritual Preparation</h2>
      <ul>
        <li><strong>Make sincere Tawbah (repentance)</strong> — enter Ramadan with a clean slate</li>
        <li><strong>Increase Quran recitation in Sha&apos;ban</strong> — use our <Link href="/quran">Quran Reader</Link> to build the habit now</li>
        <li><strong>Set clear spiritual goals:</strong> How many Juz&apos; will you complete? How many Tarawih nights will you attend?</li>
        <li><strong>Make dua to reach Ramadan</strong> — the du&apos;a of the Salaf: &quot;O Allah, allow us to reach Ramadan.&quot;</li>
        <li><strong>Begin increasing dhikr</strong> — use our <Link href="/dhikr">Dhikr Counter</Link> to build a consistent habit</li>
      </ul>

      <h2>Physical Preparation</h2>
      <ul>
        <li>Gradually adjust your sleep schedule to accommodate Suhoor (pre-dawn meal)</li>
        <li>Reduce caffeine intake two weeks before Ramadan to avoid withdrawal headaches</li>
        <li>Practice voluntary fasts in Sha&apos;ban — Mondays, Thursdays, or the white days — to prepare your body</li>
        <li>Plan healthy Suhoor options in advance: slow-release foods like oats, eggs, and fruit</li>
      </ul>

      <h2>Practical Preparation</h2>
      <ul>
        <li>Find your prayer times using our <Link href="/prayer-times">Prayer Times tool</Link></li>
        <li>Locate your nearest mosque for Tarawih using our <Link href="/mosque">Mosque Finder</Link></li>
        <li>Calculate and plan your Zakat — many Muslims prefer to give during Ramadan: <Link href="/zakat">Zakat Calculator</Link></li>
        <li>Set up your <Link href="/ramadan">Ramadan Planner</Link> with Suhoor, Iftar, and ibadah goals</li>
      </ul>

      <h2>The Last 10 Nights</h2>
      <p>Laylat al-Qadr (the Night of Power) is hidden within the last 10 nights of Ramadan, most likely on an odd night (21st, 23rd, 25th, 27th, or 29th). This single night is better than 1,000 months of worship (Quran 97:3). Maximise these nights with prayer, dua, Quran, and seeking forgiveness.</p>

      <p>Start planning today: <Link href="/ramadan">Open the Ramadan Planner →</Link></p>
    </>
  ),

  'halal-travel-tips': (
    <>
      <h2>Why Halal Travel?</h2>
      <p>As a Muslim traveller, maintaining your deen while travelling is both a right and a responsibility. With the right preparation, you can travel anywhere in the world while staying true to your values — whether for business, leisure, or visiting family.</p>

      <h2>Tip 1 — Find Prayer Times Before You Go</h2>
      <p>Look up prayer times for your destination using our <Link href="/prayer-times">Prayer Times tool</Link> before departure. Screenshot the times — you may not have internet on arrival.</p>

      <h2>Tip 2 — Find the Qibla at Your Hotel</h2>
      <p>Use our <Link href="/qibla">Qibla Finder</Link> as soon as you arrive at each new accommodation. Mark the direction with a piece of tape or note if needed.</p>

      <h2>Tip 3 — Locate Mosques in Advance</h2>
      <p>Use our <Link href="/mosque">Mosque Finder</Link> to identify mosques near your hotel and destination before you travel. Save the addresses offline.</p>

      <h2>Tip 4 — Research Halal Food</h2>
      <ul>
        <li>Apps like Zabihah.com and HalalTrip help find certified halal restaurants worldwide</li>
        <li>In non-Muslim countries, vegetarian and seafood options are generally safe — confirm no alcohol is used in cooking</li>
        <li>Pack halal snacks (dates, nuts, sealed halal meat) for long journeys</li>
        <li>In Muslim-majority countries, most food will be halal by default — verify for alcohol in sauces</li>
      </ul>

      <h2>Tip 5 — Know the Traveller&apos;s Prayer (Salat al-Qasr)</h2>
      <p>When travelling more than approximately 80km, you may shorten Dhuhr, Asr, and Isha from 4 rak&apos;ahs to 2. You may also combine Dhuhr with Asr, and Maghrib with Isha, when genuinely needed during travel.</p>

      <h2>Tip 6 — Carry a Travel Prayer Mat</h2>
      <p>A compact travel prayer mat means you can pray anywhere — airports, parks, rest stops, or hotel rooms. Many fold to the size of a large envelope.</p>

      <h2>Tip 7 — Recite the Travel Dua</h2>
      <p>When departing, recite: <em>Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun.</em> (Quran 43:13-14). Find more travel duas in our <Link href="/dua">Dua Generator</Link>.</p>

      <h2>Tip 8 — Plan Your Journey</h2>
      <p>Use our <Link href="/travel">Halal Travel Planner</Link> to find Muslim-friendly destinations, prayer-friendly itineraries, and practical tips for specific countries. Safe travels! ✈️</p>
    </>
  ),

  'how-to-perform-wudu': (
    <>
      <h2>What is Wudu?</h2>
      <p>Wudu (وضوء) is the ritual purification (ablution) that is required before performing Salah (prayer), touching the Quran, and certain other acts of worship. It is a physical and spiritual preparation — the Prophet ﷺ said that when a Muslim performs wudu, their sins fall from the parts of the body being washed.</p>

      <h2>When is Wudu Required?</h2>
      <ul>
        <li>Before performing any of the 5 daily prayers</li>
        <li>Before performing any voluntary (nafl) prayer</li>
        <li>Before touching or reciting the Quran (with physical copy)</li>
        <li>Before performing Tawaf around the Kaaba</li>
      </ul>

      <h2>The Fard (Obligatory) Acts of Wudu</h2>
      <p>Without these, the wudu is invalid:</p>
      <ol>
        <li><strong>Wash the face</strong> — from the hairline to the chin, and ear to ear</li>
        <li><strong>Wash both arms</strong> — including the elbows, right then left</li>
        <li><strong>Wipe (masah) over the head</strong> — at least a quarter of the head</li>
        <li><strong>Wash both feet</strong> — including the ankles, right then left</li>
      </ol>

      <h2>The Sunnah Acts of Wudu</h2>
      <ul>
        <li>Begin with Bismillah</li>
        <li>Wash both hands up to the wrists three times before starting</li>
        <li>Use miswak (or brush teeth) before rinsing the mouth</li>
        <li>Rinse the mouth three times (madmadah)</li>
        <li>Sniff water into the nose three times (istinshaq)</li>
        <li>Wipe the entire head, then the ears</li>
        <li>Perform each act three times</li>
        <li>Maintain the correct order (tartib)</li>
      </ul>

      <h2>Duas for Wudu</h2>
      <p><strong>Before Wudu:</strong> Bismillah al-Rahman al-Raheem (In the name of Allah, the Most Merciful, the Most Compassionate)</p>
      <p><strong>After Wudu:</strong> Ashhadu an la ilaha illallah wahdahu la sharika lah, wa ashhadu anna Muhammadan abduhu wa rasuluh. Allahummaj&apos;alni minat-tawwabeen waj&apos;alni minal-mutatahhireen.</p>
      <p>Find more duas in our <Link href="/dua">Dua Generator</Link>.</p>

      <h2>What Breaks Wudu?</h2>
      <ul>
        <li>Passing wind, urine, or stool</li>
        <li>Deep sleep (where consciousness is lost)</li>
        <li>Loss of consciousness or sanity</li>
        <li>Touching private parts directly (according to some scholars)</li>
      </ul>

      <p>Once you have completed wudu, check our <Link href="/prayer-times">Prayer Times</Link> to ensure you pray in time.</p>
    </>
  ),

  'dhikr-guide-benefits': (
    <>
      <h2>What is Dhikr?</h2>
      <p>Dhikr (ذكر) means remembrance — specifically, the remembrance of Allah through words, phrases, and prayers. The Quran commands: <em>Remember Allah with much remembrance</em> (33:41), and <em>Verily, in the remembrance of Allah do hearts find rest</em> (13:28).</p>

      <h2>The Most Virtuous Adhkar</h2>
      <ul>
        <li><strong>Subhanallah</strong> (سبحان الله) — Glory be to Allah</li>
        <li><strong>Alhamdulillah</strong> (الحمد لله) — All praise be to Allah</li>
        <li><strong>Allahu Akbar</strong> (الله أكبر) — Allah is the Greatest</li>
        <li><strong>La ilaha illallah</strong> (لا إله إلا الله) — There is no god but Allah</li>
        <li><strong>Astaghfirullah</strong> (أستغفر الله) — I seek forgiveness from Allah</li>
        <li><strong>SubhanAllahi wa bihamdihi, SubhanAllahil Azeem</strong> — The Prophet ﷺ said these two phrases are light on the tongue, heavy on the Scale, and beloved to the Most Merciful</li>
      </ul>

      <h2>The Tasbih After Prayer</h2>
      <p>After every obligatory prayer, the Prophet ﷺ taught us to recite:</p>
      <ul>
        <li>Subhanallah — 33 times</li>
        <li>Alhamdulillah — 33 times</li>
        <li>Allahu Akbar — 33 times</li>
        <li>Then: La ilaha illallahu wahdahu la sharika lah, lahul mulku wa lahul hamdu wa huwa ala kulli shay&apos;in qadir — once</li>
      </ul>

      <h2>Morning and Evening Adhkar</h2>
      <p>The Prophet ﷺ was consistent in his morning (after Fajr) and evening (after Asr) dhikr. This included Ayat al-Kursi, the three Quls, and specific duas for protection. These adhkar are a shield for the day and night.</p>

      <h2>Building a Daily Dhikr Habit</h2>
      <ul>
        <li>Start with just 100 repetitions of &quot;SubhanAllahi wa bihamdihi&quot; daily</li>
        <li>Use our free <Link href="/dhikr">Dhikr Counter</Link> to track your progress</li>
        <li>Attach dhikr to existing habits — in the car, while walking, before sleeping</li>
        <li>Use tasbih beads to maintain count during physical dhikr</li>
      </ul>

      <p>Begin your dhikr practice now: <Link href="/dhikr">Open the Dhikr Counter →</Link></p>
    </>
  ),

  'how-to-make-dua': (
    <>
      <h2>What is Dua?</h2>
      <p>Dua (دعاء) is supplication — calling upon Allah directly. The Prophet ﷺ said: <em>Dua is worship itself</em> (Abu Dawud). It is one of the most powerful tools a Muslim has, available at any time, in any language, for any need.</p>

      <h2>The Etiquette of Dua</h2>
      <ul>
        <li><strong>Face the Qibla</strong> where possible — use our <Link href="/qibla">Qibla Finder</Link></li>
        <li><strong>Be in a state of Wudu</strong> (not obligatory but recommended)</li>
        <li><strong>Raise your hands</strong> to shoulder height, palms upward</li>
        <li><strong>Begin with praising Allah</strong> and sending salawat on the Prophet ﷺ</li>
        <li><strong>Be specific and sincere</strong> — mention exactly what you need</li>
        <li><strong>Repeat your dua three times</strong></li>
        <li><strong>End with Ameen</strong></li>
      </ul>

      <h2>The Best Times for Dua</h2>
      <ul>
        <li><strong>The last third of the night</strong> — when Allah descends (in a manner befitting His majesty) and asks: &quot;Who is calling upon Me?&quot;</li>
        <li><strong>Between the Adhan and Iqamah</strong></li>
        <li><strong>In Sujood (prostration)</strong> — you are closest to Allah in this position</li>
        <li><strong>After the obligatory prayers</strong></li>
        <li><strong>On Fridays</strong> — there is an hour on Friday when dua is accepted</li>
        <li><strong>When fasting</strong>, especially at the time of breaking the fast</li>
        <li><strong>On the Day of Arafah</strong> (9th Dhul Hijjah)</li>
        <li><strong>During rain</strong></li>
      </ul>

      <h2>Conditions for Acceptance</h2>
      <p>Scholars mention several conditions that increase the chance of dua being accepted:</p>
      <ul>
        <li>Eat halal food and earn from halal sources</li>
        <li>Have certainty (yaqeen) that Allah will respond</li>
        <li>Do not be hasty — the Prophet ﷺ warned against saying &quot;I made dua and it was not answered&quot;</li>
        <li>Avoid asking for something sinful or for severing family ties</li>
      </ul>

      <h2>Powerful Duas from the Quran</h2>
      <p>Some of the most powerful duas are in the Quran itself — such as the dua of Prophet Ibrahim (2:127), the dua of Prophet Yunus (21:87), and Rabbana duas throughout the Quran.</p>

      <p>Find duas for every occasion: <Link href="/dua">Open the Dua Generator →</Link></p>
    </>
  ),

  'quran-reading-guide': (
    <>
      <h2>Why Read the Quran?</h2>
      <p>The Quran is the direct word of Allah. The Prophet ﷺ said: <em>The best of you are those who learn the Quran and teach it.</em> (Bukhari). Reading even a single letter brings ten rewards — and this is multiplied when read with understanding and reflection.</p>

      <h2>Where to Start as a Beginner</h2>
      <p>If you are new to reading the Quran, begin with shorter Surahs that are frequently recited in prayer:</p>
      <ul>
        <li><strong>Surah Al-Fatiha (1)</strong> — The Opening; recited in every rak&apos;ah of prayer</li>
        <li><strong>Surah Al-Ikhlas (112)</strong> — Pure Monotheism; equivalent to one-third of the Quran</li>
        <li><strong>Surah Al-Falaq (113)</strong> and <strong>Surah Al-Nas (114)</strong> — Protection</li>
        <li><strong>Surah Al-Kawthar (108)</strong> — The shortest Surah; beautiful and easy to memorise</li>
        <li><strong>Surah Al-Asr (103)</strong> — Three verses summarising the essence of success in Islam</li>
      </ul>

      <h2>How to Learn Tajweed</h2>
      <p>Tajweed is the set of rules for reciting the Quran correctly. While advanced Tajweed takes time, basic rules include:</p>
      <ul>
        <li>Pronouncing Arabic letters from their correct points of articulation (Makhraj)</li>
        <li>Observing lengthening (Madd) where required</li>
        <li>Stopping and pausing at the correct points</li>
        <li>The rules of Noon Sakinah and Tanween (Idgham, Iqlab, Ikhfa, Idhar)</li>
      </ul>
      <p>Begin by learning from a qualified teacher or an established online Quran platform with audio.</p>

      <h2>Building a Daily Quran Habit</h2>
      <ul>
        <li><strong>Start small:</strong> Even one page (half a side) daily is better than nothing</li>
        <li><strong>Same time each day:</strong> After Fajr is the most blessed time for Quran</li>
        <li><strong>Read with meaning:</strong> Even reading a translation alongside Arabic deepens impact</li>
        <li><strong>Track your progress:</strong> Note which Juz&apos; and page you are on</li>
      </ul>

      <h2>How to Complete the Quran (Khatm)</h2>
      <p>The Quran has 30 Juz&apos; (parts) and 604 pages. Reading 4 pages after each of the 5 daily prayers = 20 pages = approximately 1 Juz&apos; per day = Khatm in 30 days (one month). Many Muslims complete the Quran in Ramadan using this method.</p>

      <p>Start reading now: <Link href="/quran">Open the Quran Reader →</Link></p>
    </>
  ),

  'what-is-sadaqah': (
    <>
      <h2>What is Sadaqah?</h2>
      <p>Sadaqah (صدقة) means voluntary charity in Islam — any act of giving that is done for the sake of Allah, beyond the obligatory Zakat. The word comes from the root Sidq (truth), as it reflects the sincerity of a believer&apos;s faith.</p>

      <h2>Sadaqah vs Zakat — What is the Difference?</h2>
      <ul>
        <li><strong>Zakat</strong> is obligatory — a fixed percentage on specific wealth above the Nisab, calculated annually. Use our <Link href="/zakat">Zakat Calculator</Link>.</li>
        <li><strong>Sadaqah</strong> is voluntary — any amount, at any time, in any form. No minimum, no maximum.</li>
      </ul>

      <h2>Types of Sadaqah</h2>
      <ul>
        <li><strong>Financial Sadaqah</strong> — donating money to the poor, building wells, funding education</li>
        <li><strong>Sadaqah Jariyah</strong> — ongoing charity whose rewards continue after death: planting a tree, building a masjid, teaching someone the Quran</li>
        <li><strong>Non-Financial Sadaqah</strong> — the Prophet ﷺ said: &quot;A smile in the face of your brother is Sadaqah.&quot; (Tirmidhi)</li>
        <li><strong>Knowledge Sadaqah</strong> — sharing beneficial knowledge is one of the most rewarding forms</li>
        <li><strong>Removing harm from the path</strong> — removing a stone, thorn, or obstacle from a walkway</li>
      </ul>

      <h2>The Rewards of Sadaqah</h2>
      <p>The Prophet ﷺ said: <em>Sadaqah extinguishes sin as water extinguishes fire.</em> (Tirmidhi). Allah says in the Quran: <em>Those who spend their wealth in the way of Allah are like a grain of corn that sprouts seven ears, each bearing a hundred grains.</em> (2:261) — a 700-fold multiplication.</p>

      <h2>When to Give Sadaqah</h2>
      <ul>
        <li>During Ramadan — rewards are multiplied many times over</li>
        <li>During the first 10 days of Dhul Hijjah</li>
        <li>On Fridays</li>
        <li>When making dua — sadaqah before dua is a cause for acceptance</li>
        <li>In times of difficulty — it removes hardship</li>
      </ul>

      <p>Track your giving: <Link href="/sadaqah">Open the Sadaqah Tracker →</Link></p>
    </>
  ),

  'hajj-guide-beginners': (
    <>
      <h2>What is Hajj?</h2>
      <p>Hajj (حج) is the fifth and final Pillar of Islam — an obligatory once-in-a-lifetime pilgrimage to Mecca for every Muslim who is physically and financially able. It takes place in the Islamic month of Dhul Hijjah and is performed by millions of Muslims from every country on Earth.</p>

      <h2>Who Must Perform Hajj?</h2>
      <p>Hajj is obligatory (Fard) on every adult Muslim who is: (1) physically able, (2) financially able to afford the journey and leave provision for dependants, and (3) able to travel safely. It is required only once in a lifetime.</p>

      <h2>The Five Days of Hajj</h2>
      <ol>
        <li><strong>8th Dhul Hijjah (Yawm al-Tarwiyah):</strong> Enter Ihram, travel to Mina, spend the day and night in prayer</li>
        <li><strong>9th Dhul Hijjah (Day of Arafah):</strong> The essential pillar of Hajj — stand at the plain of Arafah from Dhuhr to sunset in dua and remembrance. The Prophet ﷺ said: <em>Hajj is Arafah.</em></li>
        <li><strong>Night of 9th-10th:</strong> Travel to Muzdalifah, pray Maghrib and Isha combined, collect pebbles, sleep under the stars</li>
        <li><strong>10th Dhul Hijjah (Eid al-Adha):</strong> Stone the Jamarat, sacrifice an animal, shave or cut hair, perform Tawaf al-Ifadah and Sa&apos;i</li>
        <li><strong>11th–13th Dhul Hijjah (Ayyam al-Tashreeq):</strong> Remain in Mina, stone the three Jamarat each day</li>
      </ol>

      <h2>The Four Pillars (Arkan) of Hajj</h2>
      <ol>
        <li><strong>Ihram</strong> — the intention and state of consecration</li>
        <li><strong>Wuquf at Arafah</strong> — standing at Arafah on the 9th</li>
        <li><strong>Tawaf al-Ifadah</strong> — circling the Kaaba seven times</li>
        <li><strong>Sa&apos;i</strong> — walking seven times between Safa and Marwa</li>
      </ol>

      <h2>Spiritual Preparation</h2>
      <ul>
        <li>Repent sincerely before leaving — Hajj wipes away all previous sins if accepted</li>
        <li>Learn the rituals in detail before you travel</li>
        <li>Go with the intention of Hajj Mabrur (accepted Hajj)</li>
        <li>Make dua upon entering Mecca, the Haram, and at first sight of the Kaaba</li>
      </ul>

      <p>Learn the rituals in detail: <Link href="/hajj">Open the Hajj Guide Tool →</Link></p>
    </>
  ),

  'umrah-step-by-step': (
    <>
      <h2>What is Umrah?</h2>
      <p>Umrah (عمرة) is the lesser pilgrimage to Mecca — a highly recommended act of worship that can be performed at any time of the year (unlike Hajj, which is restricted to Dhul Hijjah). While not obligatory, the Prophet ﷺ strongly encouraged it: <em>Umrah to Umrah is expiation for what is between them.</em> (Bukhari)</p>

      <h2>The Four Steps of Umrah</h2>

      <h3>Step 1 — Ihram</h3>
      <p>Ihram is the state of sacred consecration entered before crossing the Miqat (designated boundary). Men wear two white seamless cloths (izar and rida). Women dress modestly with face and hands uncovered. Make the intention (niyyah) and recite the Talbiyah: <em>Labbayk Allahumma labbayk, labbayk la sharika laka labbayk, innal hamda wan-ni&apos;mata laka wal-mulk, la sharika lak.</em></p>

      <h3>Step 2 — Tawaf</h3>
      <p>Upon arriving at the Masjid al-Haram, perform seven circuits around the Kaaba (Tawaf al-Umrah). Begin from the Black Stone (Hajar al-Aswad), keeping the Kaaba on your left. Make dua throughout. Pray 2 rak&apos;ahs behind Maqam Ibrahim after completing the 7 circuits.</p>

      <h3>Step 3 — Sa&apos;i</h3>
      <p>Walk seven times between the hills of Safa and Marwa, commemorating Hajar (Hagar) seeking water for her son Ismail. Begin at Safa (this counts as the first leg), end at Marwa. Men may jog between the green lights; women walk the entire distance.</p>

      <h3>Step 4 — Halq or Taqsir</h3>
      <p>Men shave the head (Halq — more rewarding) or cut at least an inch from the hair (Taqsir). Women cut a finger&apos;s length from the ends of their hair. This marks the end of Umrah and the state of Ihram.</p>

      <h2>Tips for First-Timers</h2>
      <ul>
        <li>Learn the boundaries of the Miqat for your country before travelling</li>
        <li>Bring a small booklet of duas for Tawaf and Sa&apos;i</li>
        <li>Go at less crowded times — early morning Tawaf is quieter</li>
        <li>Stay hydrated — the Haram can be hot and physically demanding</li>
        <li>Make extensive dua at the Multazam (between the Black Stone and the door of the Kaaba)</li>
      </ul>

      <p>Find the Qibla from your location: <Link href="/qibla">Open Qibla Finder →</Link></p>
    </>
  ),

  'islamic-inheritance-guide': (
    <>
      <h2>What is Islamic Inheritance (Mirath)?</h2>
      <p>Islamic inheritance law (علم الفرائض — Ilm al-Fara&apos;id) is one of the most precisely detailed areas of Islamic jurisprudence, derived directly from the Quran (4:11-12, 4:176). It ensures wealth is distributed fairly among family members after death.</p>

      <h2>Why Have an Islamic Inheritance Plan?</h2>
      <ul>
        <li>It fulfils the Quranic obligation on the deceased</li>
        <li>It protects your family from disputes</li>
        <li>Without a will, non-Muslim countries will distribute your estate by their own law, which likely differs from Islamic law</li>
      </ul>

      <h2>Primary Heirs and Their Shares</h2>
      <ul>
        <li><strong>Husband:</strong> 1/4 (if children exist) or 1/2 (if no children)</li>
        <li><strong>Wife:</strong> 1/8 (if children exist) or 1/4 (if no children)</li>
        <li><strong>Daughter (one):</strong> 1/2 | Two or more daughters: 2/3</li>
        <li><strong>Son:</strong> Receives double the share of a daughter (as Asabah)</li>
        <li><strong>Father:</strong> 1/6 (if the deceased has children)</li>
        <li><strong>Mother:</strong> 1/6 (if the deceased has children or multiple siblings) or 1/3</li>
      </ul>

      <h2>What is Deducted First?</h2>
      <p>Before inheritance is distributed, three things are settled from the estate in order:</p>
      <ol>
        <li>Funeral and burial expenses</li>
        <li>Outstanding debts (including unpaid Zakat or Kaffarah)</li>
        <li>The Wasiyyah (will) — up to one-third of the remaining estate can be bequeathed to non-heirs</li>
      </ol>

      <h2>Writing Your Will</h2>
      <p>Every Muslim should have a valid Islamic will. Use our <Link href="/will">Islamic Will tool</Link> to create yours, and our <Link href="/inheritance">Inheritance Calculator</Link> to understand how your estate will be divided.</p>

      <p>Calculate inheritance shares now: <Link href="/inheritance">Open the Inheritance Calculator →</Link></p>
    </>
  ),

  'writing-islamic-will': (
    <>
      <h2>Why Do You Need an Islamic Will?</h2>
      <p>The Prophet ﷺ said: <em>It is not permissible for a Muslim who has something to bequeath to spend even two nights without having his will written and kept ready.</em> (Bukhari and Muslim). Writing a will (Wasiyyah) is not optional — it is a strong Islamic obligation.</p>

      <h2>What Can You Include in a Wasiyyah?</h2>
      <p>A Wasiyyah can be used to bequeath up to <strong>one-third</strong> of your net estate (after debts). This portion can go to:</p>
      <ul>
        <li>Non-Muslim relatives who do not inherit under Islamic law</li>
        <li>Charitable causes (mosques, schools, wells) — a form of Sadaqah Jariyah</li>
        <li>Friends, or anyone who would not otherwise inherit</li>
      </ul>
      <p><strong>You cannot</strong> bequeath more than one-third to non-heirs, and you cannot use the will to change the fixed shares of Quranic heirs.</p>

      <h2>What Else Should a Muslim Will Include?</h2>
      <ul>
        <li>Declaration of faith (Shahada) and confirmation you are Muslim</li>
        <li>Funeral and burial instructions — Islamic burial, no cremation</li>
        <li>Who you appoint as executor (Wasi)</li>
        <li>Guardianship of minor children</li>
        <li>Outstanding debts, loans, or Zakat owed</li>
        <li>Outstanding religious obligations (missed fasts, Kaffarah) for which Fidyah should be paid</li>
      </ul>

      <h2>Making it Legally Valid</h2>
      <p>In most Western countries, your will must be: written (not verbal), signed in front of two independent witnesses who also sign, and you must be of sound mind when signing. Consult a solicitor or Islamic legal advisor to ensure it is valid in your country.</p>

      <h2>The Inheritance Calculator</h2>
      <p>Before writing your will, understand how your estate will be distributed. Use our <Link href="/inheritance">Inheritance Calculator</Link> to see exactly who inherits what under Islamic law.</p>

      <p>Write your will today: <Link href="/will">Open the Islamic Will Tool →</Link></p>
    </>
  ),

  'halal-finance-guide': (
    <>
      <h2>What is Halal Finance?</h2>
      <p>Halal finance means managing money in a way that is compliant with Islamic law (Shariah). The most fundamental rule is the prohibition of Riba (ربا — interest or usury), which is mentioned as a major sin in the Quran and Sunnah.</p>

      <h2>What is Riba?</h2>
      <p>Riba literally means &quot;increase&quot; or &quot;excess.&quot; In Islamic law it refers to any guaranteed, predetermined return on a loan or exchange — i.e., interest. Allah says in the Quran: <em>Allah has permitted trade and forbidden Riba.</em> (2:275). The Prophet ﷺ cursed the one who gives riba, the one who takes it, the one who writes the contract, and the two witnesses — saying they are all equal in sin (Muslim).</p>

      <h2>Common Types of Riba</h2>
      <ul>
        <li><strong>Riba al-Nasi&apos;ah:</strong> Interest on loans — bank interest, credit card interest, payday loans</li>
        <li><strong>Riba al-Fadl:</strong> Unequal exchange of the same commodity (e.g., exchanging gold for gold of different weights)</li>
      </ul>

      <h2>Halal Alternatives for Common Financial Products</h2>
      <ul>
        <li><strong>Mortgage:</strong> Islamic home finance uses Murabaha (cost-plus sale), Diminishing Musharakah (shared ownership), or Ijara (lease-to-own) structures</li>
        <li><strong>Savings:</strong> Islamic savings accounts use profit-sharing (Mudarabah) instead of fixed interest</li>
        <li><strong>Investment:</strong> Invest in Shariah-compliant stocks — avoiding alcohol, tobacco, weapons, conventional finance, and adult entertainment sectors</li>
        <li><strong>Insurance:</strong> Takaful is the Islamic alternative based on mutual cooperation</li>
        <li><strong>Credit cards:</strong> Some Islamic banks offer charge cards with no interest — balance must be paid in full monthly</li>
      </ul>

      <h2>Is Paying Interest Permissible in Necessity?</h2>
      <p>Scholars differ on this. The majority position is that Riba is prohibited even in necessity, as there are halal alternatives available in most countries. A minority of scholars permit it in cases of extreme necessity where no alternative exists. Consult a qualified Islamic scholar for your specific situation.</p>

      <p>Learn more about Islamic finance: <Link href="/halal-finance">Open Halal Finance Tools →</Link></p>
    </>
  ),

  'kaffarah-guide': (
    <>
      <h2>What is Kaffarah?</h2>
      <p>Kaffarah (كفارة) means expiation or atonement — a specific act of worship required to compensate for breaking certain serious Islamic obligations. It is not a punishment but an act of mercy: a way for a Muslim to &quot;wipe the slate clean&quot; after a violation.</p>

      <h2>When is Kaffarah Required?</h2>

      <h3>1. Intentionally Breaking the Fast in Ramadan</h3>
      <p>If a person intentionally breaks their Ramadan fast by eating, drinking, or engaging in marital relations (without a valid excuse), they must:</p>
      <ul>
        <li><strong>Option 1:</strong> Free a slave (not applicable today)</li>
        <li><strong>Option 2:</strong> Fast for 60 consecutive days</li>
        <li><strong>Option 3:</strong> Feed 60 poor people one meal each</li>
      </ul>
      <p>These are in order — you must take the first option available to you.</p>

      <h3>2. Breaking an Oath (Yamin)</h3>
      <p>If you swear by Allah to do something and then break the oath, Kaffarah is:</p>
      <ul>
        <li>Feed 10 poor people, or clothe 10 poor people, or free a slave — or if unable, fast 3 days</li>
      </ul>

      <h3>3. Zihar (a specific form of unlawful oath in marriage)</h3>
      <p>The same sequence as the Ramadan kaffarah: free a slave, then fast 60 days, then feed 60 people.</p>

      <h3>4. Accidental Killing</h3>
      <p>Free a slave, or if unable, fast 2 consecutive months.</p>

      <h2>Feeding 60 Poor People — What Counts?</h2>
      <p>Scholars differ slightly, but generally: provide one meal (or the equivalent food value) to 60 people in need, or give one day&apos;s food to one person 60 times. The food should be from the staple of your local community.</p>

      <p>Calculate your Kaffarah: <Link href="/kaffarah">Open the Kaffarah Calculator →</Link></p>
    </>
  ),

  'eid-guide': (
    <>
      <h2>What is Eid?</h2>
      <p>Eid (عيد) means &quot;festivity&quot; or &quot;recurring happiness.&quot; Muslims celebrate two major Eids each year — Eid al-Fitr and Eid al-Adha — both of which were established by the Prophet ﷺ as days of joy, gratitude, and community.</p>

      <h2>Eid al-Fitr — Celebrating the End of Ramadan</h2>
      <p><strong>When:</strong> 1st Shawwal — the day after Ramadan ends. <strong>Meaning:</strong> &quot;The Feast of Breaking the Fast.&quot;</p>
      <ul>
        <li><strong>Zakat al-Fitr (Fitrana)</strong> must be paid before the Eid prayer — an obligatory sadaqah given on behalf of every household member</li>
        <li>Eat something sweet (dates) before going to the Eid prayer</li>
        <li>Take a different route to and from the Eid prayer (Sunnah)</li>
        <li>Recite the Takbir: Allahu Akbar, Allahu Akbar, La ilaha illallah, Allahu Akbar, Allahu Akbar, wa lillahil hamd</li>
      </ul>

      <h2>Eid al-Adha — The Feast of Sacrifice</h2>
      <p><strong>When:</strong> 10th Dhul Hijjah — the day after the pilgrims stand at Arafah. <strong>Meaning:</strong> &quot;The Feast of the Sacrifice,&quot; commemorating the willingness of Prophet Ibrahim ﷺ to sacrifice his son.</p>
      <ul>
        <li><strong>Udhiyah (Qurbani)</strong> — the sacrifice of a sheep, goat, cow, or camel is obligatory for those who can afford it</li>
        <li>Do not eat before the Eid prayer — the Sunnah is to eat from the sacrifice afterward</li>
        <li>Qurbani can be performed on the 10th, 11th, or 12th of Dhul Hijjah</li>
        <li>The meat is divided: one-third for yourself, one-third for family and friends, one-third for the poor</li>
      </ul>

      <h2>Sunnah Acts on Both Eids</h2>
      <ul>
        <li>Perform Ghusl (full bath) before the prayer</li>
        <li>Wear your best or new clothes</li>
        <li>Attend the Eid prayer in congregation — find your local mosque: <Link href="/mosque">Mosque Finder</Link></li>
        <li>Exchange greetings: &quot;Eid Mubarak&quot; or &quot;Taqabbalallahu minna wa minkum&quot;</li>
        <li>Visit family and maintain ties of kinship (Silat al-Rahim)</li>
      </ul>

      <p>Find Eid prayer times and local mosques: <Link href="/mosque">Open Mosque Finder →</Link></p>
    </>
  ),

  'how-to-find-mosque': (
    <>
      <h2>Why Finding a Mosque Matters</h2>
      <p>The Prophet ﷺ said: <em>Prayer in congregation is twenty-seven times more rewarding than prayer alone.</em> (Bukhari). The mosque (masjid) is also the heart of the Muslim community — a place of learning, brotherhood, and support.</p>

      <h2>Use Our Free Mosque Finder</h2>
      <p>Our <Link href="/mosque">Mosque Finder tool</Link> uses your GPS location to show all nearby mosques with their addresses, prayer times, and directions. It works worldwide and is updated regularly.</p>

      <h2>Finding a Mosque When Travelling</h2>
      <ul>
        <li>Search our <Link href="/mosque">Mosque Finder</Link> with your destination city before you travel</li>
        <li>Save the address and map offline in case of limited internet access</li>
        <li>Check if the mosque has facilities for women, ablution areas, and parking</li>
        <li>Note the Jumu&apos;ah (Friday prayer) time — it varies by mosque and country</li>
      </ul>

      <h2>What to Expect at a New Mosque</h2>
      <ul>
        <li>Remove shoes at the entrance and place them in the rack provided</li>
        <li>Perform Wudu if not already in a state of purity</li>
        <li>Men and women pray in separate areas — ask if you are unsure of the layout</li>
        <li>Arrive a few minutes early to pray the tahiyyat al-masjid (greeting prayer)</li>
        <li>Greet with Assalamu Alaykum upon entering</li>
      </ul>

      <h2>Mosque Etiquette Reminders</h2>
      <ul>
        <li>Speak quietly — the mosque is a place of worship</li>
        <li>Dress modestly — men cover from navel to knee minimum; women cover fully including head</li>
        <li>Switch your phone to silent</li>
        <li>Do not step over people who are praying or prostrating</li>
      </ul>

      <p>Find the nearest mosque to you now: <Link href="/mosque">Open Mosque Finder →</Link></p>
    </>
  ),

  'hadith-guide': (
    <>
      <h2>What is Hadith?</h2>
      <p>Hadith (حديث — literally &quot;speech&quot; or &quot;report&quot;) refers to the recorded sayings, actions, and tacit approvals of the Prophet Muhammad ﷺ. Together with the Quran, the Sunnah (embodied in Hadith) forms the foundation of Islamic law and practice.</p>

      <h2>How Hadith are Graded</h2>
      <p>Islamic scholars developed a sophisticated science (Mustalah al-Hadith) to verify the authenticity of each narration:</p>
      <ul>
        <li><strong>Sahih (Authentic):</strong> Continuous chain of trustworthy narrators; no contradictions</li>
        <li><strong>Hasan (Good):</strong> Similar to Sahih but with slightly weaker memory in narrators</li>
        <li><strong>Da&apos;if (Weak):</strong> A flaw in the chain or text — cannot be used as evidence for rulings</li>
        <li><strong>Mawdu&apos; (Fabricated):</strong> Invented and attributed to the Prophet ﷺ — impermissible to narrate without clarifying it is fabricated</li>
      </ul>

      <h2>The 6 Major Hadith Collections (Kutub al-Sittah)</h2>
      <ol>
        <li><strong>Sahih al-Bukhari</strong> — compiled by Imam Muhammad al-Bukhari (d. 870 CE). Widely considered the most authentic book after the Quran.</li>
        <li><strong>Sahih Muslim</strong> — compiled by Imam Muslim ibn al-Hajjaj (d. 875 CE). Second in authority to Bukhari; together they are called &quot;the Two Sahihs&quot; (al-Sahihayn).</li>
        <li><strong>Sunan Abu Dawud</strong> — focuses on legal and juristic narrations</li>
        <li><strong>Jami&apos; al-Tirmidhi</strong> — includes gradings and commentary from Imam Tirmidhi himself</li>
        <li><strong>Sunan al-Nasa&apos;i</strong> — known for its strictness in accepting narrations</li>
        <li><strong>Sunan Ibn Majah</strong> — the sixth of the Kutub al-Sittah</li>
      </ol>

      <h2>How to Learn Hadith</h2>
      <ul>
        <li>Begin with Imam Nawawi&apos;s <em>40 Hadith</em> — a collection of core narrations covering all aspects of Islam</li>
        <li>Then study <em>Riyadh al-Salihin</em> (Gardens of the Righteous) — a broader collection by Imam Nawawi</li>
        <li>For depth, approach a qualified scholar or Islamic studies institution</li>
      </ul>

      <p>Read hadith and learn more: <Link href="/hadith">Open the Hadith Tool →</Link></p>
    </>
  ),

  'islamic-names-guide': (
    <>
      <h2>Why Does a Name Matter in Islam?</h2>
      <p>The Prophet ﷺ said: <em>On the Day of Resurrection, you will be called by your names and your fathers&apos; names, so make your names good.</em> (Abu Dawud). A name is a child&apos;s first gift — it shapes their identity and their relationship with their faith.</p>

      <h2>Rules for Islamic Names</h2>
      <ul>
        <li><strong>Recommended:</strong> Names of prophets (Muhammad, Ibrahim, Yusuf, Maryam), names meaning &quot;servant of Allah&quot; (Abdullah, Abdurrahman), and names with good meanings</li>
        <li><strong>Permitted:</strong> Names with positive, neutral meanings in any language</li>
        <li><strong>Disliked (Makruh):</strong> Names that may lead to embarrassment, or names of oppressors</li>
        <li><strong>Forbidden (Haram):</strong> Names meaning servitude to other than Allah (e.g., Abdul-Lat, Abdul-Uzza), names that imply divinity or absolute attributes (Malik al-Amlak — King of Kings)</li>
      </ul>

      <h2>The Best Names</h2>
      <p>The Prophet ﷺ said: <em>The most beloved names to Allah are Abdullah and Abdurrahman.</em> (Muslim). Names of prophets are also highly recommended. For girls, names like Maryam, Fatimah, Khadijah, Aisha, and Zaynab carry great historical honour.</p>

      <h2>When to Name a Child</h2>
      <p>The Sunnah is to name on the 7th day after birth, along with the Aqiqah (sacrifice). However, naming at birth is also permissible and widely practised. The Adhan is recited in the right ear and the Iqamah in the left ear of the newborn.</p>

      <h2>Find the Perfect Islamic Name</h2>
      <p>Use our <Link href="/names-finder">Islamic Names Finder tool</Link> to search by meaning, letter, or origin and find a beautiful name for your child. You can also explore our <Link href="/names">99 Names of Allah</Link> for inspiration — many parents choose names derived from the divine attributes.</p>

      <p>Search Islamic names now: <Link href="/names-finder">Open Names Finder →</Link></p>
    </>
  ),

  'kids-islamic-education': (
    <>
      <h2>When to Start Teaching Islam to Children</h2>
      <p>Islamic education begins from birth — the Adhan in the ear, the name given on the 7th day, and the environment of a Muslim home all lay the foundation. Formal teaching of Islamic concepts can begin from age 3 to 4, and prayer is taught from age 7 (the Prophet ﷺ commanded parents to teach children to pray at 7 and to be firm about it at 10).</p>

      <h2>Ages 3–6: Foundation Stage</h2>
      <ul>
        <li>Teach the Shahada (La ilaha illallah, Muhammadur Rasulullah)</li>
        <li>Introduce basic duas: before eating (Bismillah), after eating (Alhamdulillah), before sleeping, upon waking</li>
        <li>Teach that Allah created everything and loves us</li>
        <li>Read Islamic picture books and stories of the prophets at bedtime</li>
        <li>Use our <Link href="/kids">Islamic Kids Games</Link> — Memory Match, Arabic Letters, and Dua Memory are perfect for this age</li>
      </ul>

      <h2>Ages 7–10: Learning to Pray</h2>
      <ul>
        <li>Teach Wudu step by step — make it fun, let them splash water</li>
        <li>Teach the physical movements of prayer (Salah) — use our <Link href="/kids">Kids Prayer Guide</Link></li>
        <li>Begin teaching short Surahs: Al-Fatiha, Al-Ikhlas, Al-Falaq, Al-Nas</li>
        <li>Teach the 5 Pillars of Islam — use our <Link href="/kids">5 Pillars Quiz game</Link></li>
        <li>Take children to Jumu&apos;ah — mosque exposure builds lifelong connection</li>
        <li>Use the <Link href="/names">99 Names of Allah</Link> as a teaching tool — start with Al-Rahman and Al-Raheem</li>
      </ul>

      <h2>Ages 11–14: Deepening Understanding</h2>
      <ul>
        <li>Introduce the Quran with meaning — not just recitation</li>
        <li>Discuss Islamic history: the Seerah (life of the Prophet ﷺ) and the stories of the Sahaba</li>
        <li>Teach about Zakat and charity: <Link href="/zakat">Zakat Calculator</Link></li>
        <li>Involve them in Ramadan: set their own ibadah goals using our <Link href="/ramadan">Ramadan Planner</Link></li>
        <li>Open conversations about peer pressure, identity, and being Muslim in a non-Muslim world</li>
      </ul>

      <h2>Creating a Muslim Home Environment</h2>
      <ul>
        <li>Display the 99 Names of Allah, Quranic verses, or Bismillah in the home</li>
        <li>Play Quran recitation in the background at home</li>
        <li>Make dhikr and dua visible — children learn by observation</li>
        <li>Celebrate Islamic occasions: Eid, the Prophet&apos;s ﷺ birthday, Islamic New Year</li>
      </ul>

      <p>Start with free games for children: <Link href="/kids">Open Islamic Kids Games →</Link></p>
    </>
  ),

  'five-pillars-of-islam': (
    <>
      <h2>What Are the Five Pillars?</h2>
      <p>The Five Pillars of Islam (أركان الإسلام) are the core obligations upon every Muslim — the framework of Muslim life. The Prophet ﷺ said: <em>Islam is built upon five pillars...</em> (Bukhari and Muslim). Everything else in Islamic practice connects back to these five foundations.</p>

      <h2>Pillar 1 — Shahada (Declaration of Faith)</h2>
      <p><strong>Arabic:</strong> أشهد أن لا إله إلا الله وأشهد أن محمداً رسول الله</p>
      <p><strong>Meaning:</strong> I bear witness that there is no god but Allah, and I bear witness that Muhammad is the Messenger of Allah.</p>
      <p>The Shahada is the entry point into Islam. Sincerely uttered with understanding and conviction, it makes one Muslim. It must be believed in the heart, uttered by the tongue, and acted upon in daily life.</p>

      <h2>Pillar 2 — Salah (Prayer)</h2>
      <p>Five daily prayers are obligatory — Fajr, Dhuhr, Asr, Maghrib, and Isha. They connect the Muslim to Allah five times every day and serve as a constant reminder of purpose and accountability. Get accurate prayer times: <Link href="/prayer-times">Prayer Times Tool</Link>.</p>

      <h2>Pillar 3 — Zakat (Obligatory Charity)</h2>
      <p>2.5% of qualifying wealth above the Nisab, given annually to eight categories of recipients specified in the Quran (9:60). Zakat purifies wealth, reduces inequality, and builds community solidarity. Calculate yours: <Link href="/zakat">Zakat Calculator</Link>.</p>

      <h2>Pillar 4 — Sawm (Fasting in Ramadan)</h2>
      <p>Fasting from dawn to sunset throughout the month of Ramadan — abstaining from food, drink, smoking, and marital relations. It builds taqwa (God-consciousness), empathy for the poor, and spiritual discipline. Plan your Ramadan: <Link href="/ramadan">Ramadan Planner</Link>.</p>

      <h2>Pillar 5 — Hajj (Pilgrimage to Mecca)</h2>
      <p>Once-in-a-lifetime pilgrimage to Mecca during Dhul Hijjah, obligatory for every Muslim who is physically and financially able. It is the largest annual gathering of people on Earth — a global manifestation of Muslim unity. Learn more: <Link href="/hajj">Hajj Guide</Link>.</p>

      <h2>The Pillars Are Interconnected</h2>
      <p>The Five Pillars are not isolated — Shahada gives meaning to all actions, Salah structures the day, Zakat purifies wealth, Sawm purifies the soul, and Hajj unifies the Ummah. A Muslim who neglects one weakens the structure of their entire deen.</p>
    </>
  ),

  'mosque-etiquette-guide': (
    <>
      <h2>The Masjid — House of Allah</h2>
      <p>The Prophet ﷺ said: <em>The most beloved places to Allah are the mosques.</em> (Muslim). The mosque is not just a prayer hall — it is the house of Allah, deserving of the highest level of respect and mindfulness.</p>

      <h2>Before You Enter</h2>
      <ul>
        <li>Ensure you are in a state of Wudu (ritual purity)</li>
        <li>Dress modestly — men cover from navel to knee minimum, preferably more; women dress fully including head covering</li>
        <li>Remove shoes before entering (at the door or shoe rack provided)</li>
        <li>Switch your phone to silent or off</li>
      </ul>

      <h2>Entering the Mosque</h2>
      <ul>
        <li>Enter with the <strong>right foot</strong> first</li>
        <li>Recite the dua of entering: <em>Bismillah, Allahumma salli ala Muhammad, Allahumma aftah li abwaba rahmatik</em> (O Allah, open for me the gates of Your mercy)</li>
        <li>Greet with Assalamu Alaykum upon entering</li>
        <li>Pray 2 rak&apos;ahs of Tahiyyat al-Masjid (greeting prayer) before sitting — unless the iqamah has been called or prayer is already in progress</li>
      </ul>

      <h2>Inside the Mosque</h2>
      <ul>
        <li>Speak quietly — do not have loud conversations or argue</li>
        <li>Do not step over or in front of someone who is praying</li>
        <li>Do not eat strong-smelling foods before coming — garlic, onion</li>
        <li>Fill rows from the front; do not leave gaps in prayer rows</li>
        <li>Children are welcome but should be supervised to avoid disturbing worshippers</li>
        <li>Do not buy or sell inside the mosque</li>
      </ul>

      <h2>Leaving the Mosque</h2>
      <ul>
        <li>Leave with the <strong>left foot</strong> first</li>
        <li>Recite the dua of leaving: <em>Bismillah, Allahumma salli ala Muhammad, Allahumma inni as&apos;aluka min fadlik</em> (O Allah, I ask You of Your bounty)</li>
      </ul>

      <h2>Find Your Nearest Mosque</h2>
      <p>Use our <Link href="/mosque">Mosque Finder</Link> to locate the nearest mosque wherever you are in the world, including prayer times, facilities, and directions.</p>

      <p>Find a mosque near you: <Link href="/mosque">Open Mosque Finder →</Link></p>
    </>
  ),
};

// ── Static params ─────────────────────────────────────────────────────────
export function generateStaticParams() {
  return ARTICLES.map(a => ({ slug: a.slug }));
}

// ── Per-article metadata ──────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find(a => a.slug === slug);
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
export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = ARTICLES.find(a => a.slug === slug);
  if (!article) notFound();

  const content = CONTENT[article.slug];
  const related = ARTICLES
    .filter(a => a.slug !== article.slug && a.category === article.category)
    .slice(0, 2);

  // Format date for display
  const displayDate = new Date(article.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', fontFamily: 'Georgia, serif' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#0a3d2e 0%,#1a6b4a 100%)', padding: '28px 16px 40px' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <Link href="/blog" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
            ← Back to Blog
          </Link>
          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 6px' }}>/</span>
            <Link href="/blog" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Blog</Link>
            <span style={{ margin: '0 6px' }}>/</span>
            <span style={{ color: '#c8a96e' }}>{article.category}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: '#c8a96e', color: '#0a3d2e', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px' }}>
              {article.category}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>📖 {article.readTime}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{displayDate}</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.35 }}>
            {article.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            {article.excerpt}
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 740, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Article body */}
        <div
          style={{ background: '#fff', borderRadius: 18, border: '1px solid #ede9e2', padding: '32px 28px', fontSize: 15, color: '#444', lineHeight: 1.85 }}
          className="article-body"
        >
          <style>{`
            .article-body h2 { font-size:19px; font-weight:700; color:#0a3d2e; margin:30px 0 12px; padding-bottom:8px; border-bottom:1px solid #f0ede8; }
            .article-body h3 { font-size:16px; font-weight:700; color:#1a5c3a; margin:22px 0 8px; }
            .article-body p  { margin:0 0 14px; }
            .article-body ul, .article-body ol { margin:0 0 16px; padding-left:22px; }
            .article-body li { margin-bottom:7px; line-height:1.7; }
            .article-body a  { color:#0a3d2e; font-weight:600; text-decoration:underline; text-underline-offset:2px; }
            .article-body a:hover { color:#1a6b4a; }
            .article-body em { font-style:italic; color:#555; background:#f9f7f4; padding:4px 10px; border-left:3px solid #c8a96e; display:block; margin:12px 0; border-radius:0 6px 6px 0; }
            .article-body strong { color:#0a3d2e; }
          `}</style>
          {content}
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg,#0a3d2e,#1a5c3a)', borderRadius: 16, padding: '24px', textAlign: 'center', margin: '24px 0' }}>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Try Our Free Islamic Tools</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 16px' }}>25+ free tools — no sign-up required</p>
          <Link href="/" style={{ background: '#c8a96e', color: '#0a3d2e', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
            Explore All Tools →
          </Link>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0a3d2e', margin: '0 0 12px' }}>Related Articles</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {related.map(r => (
                <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff', borderRadius: 12, border: '1px solid #ede9e2', padding: '16px',
                    transition: 'border-color .15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#0a3d2e'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#ede9e2'}
                  >
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: article.title,
              description: article.excerpt,
              datePublished: article.date,
              author: { '@type': 'Organization', name: 'I Love Islam' },
              publisher: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
              url: `https://www.iloveislam.life/blog/${article.slug}`,
            }),
          }}
        />
      </main>
    </div>
  );
}