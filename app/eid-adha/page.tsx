'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'calculator' | 'takbeer' | 'checklist' | 'prayer' | 'distribution' | 'greeting' | 'sunnah' | 'recipes';
type Animal = 'goat' | 'sheep' | 'cow' | 'camel';
type SharePartner = { id: string; name: string; paid: boolean };

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'calculator',   icon: '🐄', label: 'Qurbani Calc'  },
  { id: 'distribution', icon: '🥩', label: 'Meat Split'    },
  { id: 'takbeer',      icon: '📿', label: 'Takbeer'       },
  { id: 'checklist',    icon: '✅', label: 'Checklist'     },
  { id: 'sunnah',       icon: '🌙', label: 'Sunnah Guide'  },
  { id: 'prayer',       icon: '🕌', label: 'Eid Prayer'    },
  { id: 'greeting',     icon: '💌', label: 'Greetings'     },
  { id: 'recipes',      icon: '🍖', label: 'Recipes'       },
];

const ANIMALS: { id: Animal; name: string; icon: string; maxShares: number; minAge: string; desc: string }[] = [
  { id: 'goat',   name: 'Goat',   icon: '🐐', maxShares: 1, minAge: '1 year',   desc: '1 share only — counts for one person or household' },
  { id: 'sheep',  name: 'Sheep',  icon: '🐑', maxShares: 1, minAge: '6 months', desc: '1 share only — 6 months old is sufficient for sheep' },
  { id: 'cow',    name: 'Cow',    icon: '🐄', maxShares: 7, minAge: '2 years',  desc: 'Up to 7 shares — popular for family groups' },
  { id: 'camel',  name: 'Camel',  icon: '🐪', maxShares: 7, minAge: '5 years',  desc: 'Up to 7 shares — highest reward according to scholars' },
];

const COUNTRIES = [
  'Pakistan', 'Bangladesh', 'India', 'Turkey', 'Saudi Arabia', 'Egypt',
  'Indonesia', 'Malaysia', 'UK', 'USA', 'Canada', 'Australia',
  'UAE', 'Qatar', 'Kuwait', 'Nigeria', 'South Africa', 'Other',
];

const CURRENCY_MAP: Record<string, string> = {
  Pakistan: 'PKR', Bangladesh: 'BDT', India: 'INR', Turkey: 'TRY',
  'Saudi Arabia': 'SAR', Egypt: 'EGP', Indonesia: 'IDR', Malaysia: 'MYR',
  UK: 'GBP', USA: 'USD', Canada: 'CAD', Australia: 'AUD',
  UAE: 'AED', Qatar: 'QAR', Kuwait: 'KWD', Nigeria: 'NGN',
  'South Africa': 'ZAR', Other: 'USD',
};

const TAKBEERS = [
  {
    name: 'Takbeer-e-Tashreeq',
    arabic: 'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ لَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ',
    transliteration: 'Allāhu Akbar, Allāhu Akbar, Lā ilāha illallāh, wallāhu Akbar, Allāhu Akbar, wa lillāhil-ḥamd.',
    meaning: 'Allah is the Greatest, Allah is the Greatest, there is no god but Allah, and Allah is the Greatest, Allah is the Greatest, and to Allah belongs all praise.',
    target: 100,
    note: 'Recited from Fajr of 9th Dhul Hijjah to Asr of 13th Dhul Hijjah',
  },
  {
    name: 'Takbeer at Slaughter',
    arabic: 'بِسْمِ اللَّهِ اللَّهُ أَكْبَرُ',
    transliteration: "Bismillāhi, Allāhu Akbar.",
    meaning: 'In the name of Allah, Allah is the Greatest.',
    target: 3,
    note: 'Said before slaughtering the animal',
  },
  {
    name: 'Dua after Slaughter',
    arabic: 'اللَّهُمَّ تَقَبَّلْ مِنِّي كَمَا تَقَبَّلْتَ مِنْ خَلِيلِكَ إِبْرَاهِيمَ وَحَبِيبِكَ مُحَمَّدٍ',
    transliteration: "Allāhumma taqabbal minnī kamā taqabbalta min khalīlika Ibrāhīma wa ḥabībika Muḥammad.",
    meaning: 'O Allah, accept from me as You accepted from Your friend Ibrahim and Your beloved Muhammad ﷺ.',
    target: 1,
    note: 'Dua of acceptance after the Qurbani',
  },
];

const CHECKLIST_ITEMS = [
  { id: 'nisab',    cat: 'Eligibility',  icon: '💰', text: 'Confirm you meet Nisab threshold (owner of 87.5g gold or equivalent)' },
  { id: 'niyyah',   cat: 'Eligibility',  icon: '🤲', text: 'Make your Niyyah (intention) for Qurbani before 10th Dhul Hijjah' },
  { id: 'animal',   cat: 'Animal',       icon: '🐄', text: 'Select a valid animal (goat ≥1yr, sheep ≥6m, cow ≥2yr, camel ≥5yr)' },
  { id: 'healthy',  cat: 'Animal',       icon: '🏥', text: 'Verify the animal is healthy — free from blindness, lameness, major illness' },
  { id: 'shares',   cat: 'Animal',       icon: '👥', text: 'Confirm shares (goat/sheep = 1 person; cow/camel = up to 7)' },
  { id: 'knife',    cat: 'Preparation',  icon: '🔪', text: 'Sharpen the knife beforehand — do not sharpen in front of the animal' },
  { id: 'qibla',    cat: 'Preparation',  icon: '🧭', text: 'Face the animal toward the Qibla' },
  { id: 'bismillah',cat: 'At Slaughter', icon: '📿', text: 'Say Bismillah Allahu Akbar before slaughtering' },
  { id: 'swift',    cat: 'At Slaughter', icon: '⚡', text: 'Slaughter swiftly in one motion — minimize animal pain' },
  { id: 'portions', cat: 'Distribution', icon: '🥩', text: 'Divide meat into 3 equal portions: self, relatives, poor' },
  { id: 'poor',     cat: 'Distribution', icon: '🤝', text: 'Ensure the poor receive their portion — this is the core purpose' },
  { id: 'nosell',   cat: 'Distribution', icon: '🚫', text: 'Do NOT sell the meat, skin, or any part of the Qurbani animal' },
  { id: 'skin',     cat: 'Distribution', icon: '🎁', text: 'Give the skin to the poor, or use it yourself — do not sell it' },
  { id: 'fast',     cat: 'Dhul Hijjah',  icon: '🌙', text: 'Fast on 9th Dhul Hijjah (Day of Arafah) — expiates 2 years of sins' },
  { id: 'takbeer',  cat: 'Dhul Hijjah',  icon: '🔊', text: 'Recite Takbeer-e-Tashreeq from 9th Fajr to 13th Asr' },
  { id: 'charity',  cat: 'Dhul Hijjah',  icon: '💝', text: 'Give extra charity in the 10 days — best days of the year' },
  { id: 'prayer2',  cat: 'Eid Day',      icon: '🕌', text: 'Attend Eid ul Adha prayer — compulsory for those able' },
  { id: 'ghusl',    cat: 'Eid Day',      icon: '🚿', text: 'Perform Ghusl before Eid prayer' },
  { id: 'noeat',    cat: 'Eid Day',      icon: '🍽️', text: 'Do NOT eat before Eid prayer (eat from your Qurbani meat after)' },
  { id: 'route',    cat: 'Eid Day',      icon: '🛤️', text: 'Take a different route returning from Eid prayer (Sunnah)' },
];

const SUNNAH_TIMELINE = [
  { time: 'Days 1–8',       icon: '📅', title: '10 Blessed Days',          desc: 'Increase ALL good deeds. The Prophet ﷺ said: "There are no days in which good deeds are more beloved to Allah than these ten days." Recite Takbeer, Tahmeed, Tahleel, and Tasbeeh abundantly.' },
  { time: 'Day 9 (Arafah)', icon: '🌄', title: 'Fast the Day of Arafah',   desc: 'The Prophet ﷺ said: "Fasting on the Day of Arafah expiates the sins of the past year and the coming year." This is one of the most virtuous acts of worship.' },
  { time: 'Night of Eid',   icon: '🌙', title: 'Stay Awake in Worship',    desc: 'Whoever spends the nights of Eid ul Fitr and Eid ul Adha in worship, their heart will not die on the day when hearts die. Recite Takbeer through the night.' },
  { time: 'Eid Morning',    icon: '🚿', title: 'Ghusl & Best Clothes',     desc: 'Perform Ghusl (ritual bath) and wear your best or new clothes. Apply attar (non-alcoholic perfume). This is the Sunnah of the Prophet ﷺ.' },
  { time: 'Eid Morning',    icon: '🚶', title: 'Walk to Eid Prayer',        desc: 'Walk to Eid prayer reciting Takbeer aloud. Do NOT eat before Eid ul Adha prayer — eat from the Qurbani meat after the prayer.' },
  { time: 'Eid Prayer',     icon: '🕌', title: '2 Rak\'ahs Eid Salah',    desc: '2 rak\'ahs with 6 extra Takbeers (3 in first raka\'ah before Fatihah, 3 in second after standing). Listen attentively to the Khutbah — it is Sunnah Mu\'akkadah.' },
  { time: 'After Prayer',   icon: '🐄', title: 'Perform Qurbani',           desc: 'Qurbani is valid from after Eid prayer on 10th until sunset of 13th Dhul Hijjah. Say Bismillah Allahu Akbar, face the Qibla, and slaughter swiftly.' },
  { time: 'After Qurbani',  icon: '🥩', title: 'Distribute the Meat',      desc: 'Divide into 3 portions: 1/3 for yourself and family, 1/3 for relatives and friends, 1/3 for the poor and needy. You may vary proportions but must give to the poor.' },
  { time: 'Eid Day',        icon: '👨‍👩‍👧', title: 'Visit Family & Give Gifts', desc: 'Strengthen family ties on Eid day. Visit relatives, exchange gifts, and spread the salam. Say "Taqabbalallahu minna wa minkum" to Muslims you meet.' },
  { time: 'Days 11–13',     icon: '📿', title: 'Days of Tashreeq',          desc: 'Continue reciting Takbeer-e-Tashreeq after every fard prayer until Asr on 13th. These are also days of eating, drinking, and remembrance of Allah.' },
];

const GREETINGS = [
  { lang: 'Arabic',  text: 'عِيدُ الأَضْحَى مُبَارَك',                                 transliteration: 'Eid ul Adha Mubarak',        meaning: 'Blessed Eid ul Adha' },
  { lang: 'Arabic',  text: 'تَقَبَّلَ اللَّهُ مِنَّا وَمِنكُم',                          transliteration: "Taqabbalallahu minna wa minkum", meaning: 'May Allah accept from us and from you' },
  { lang: 'Arabic',  text: 'كُلُّ عَامٍ وَأَنتُم بِخَيْر',                              transliteration: "Kullu 'aam wa antum bi-khayr", meaning: 'May you be well every year' },
  { lang: 'Urdu',    text: 'عید الاضحیٰ مبارک ہو',                                      transliteration: 'Eid ul Adha Mubarak Ho',      meaning: 'Blessed Eid ul Adha (Urdu)' },
  { lang: 'Turkish', text: 'Kurban Bayramınız mübarek olsun',                            transliteration: '',                            meaning: 'May your Eid of Sacrifice be blessed' },
  { lang: 'Malay',   text: 'Selamat Hari Raya Haji',                                    transliteration: '',                            meaning: 'Happy Hajj Celebration Day' },
  { lang: 'Bengali', text: 'ঈদুল আযহা মোবারক',                                          transliteration: 'Eidul Azha Mubarak',          meaning: 'Blessed Eid ul Adha (Bengali)' },
  { lang: 'English', text: 'May Allah accept your Qurbani and all your good deeds. Eid Mubarak! 🐄🌙', transliteration: '', meaning: 'English Eid greeting' },
  { lang: 'WhatsApp',text: '🌙🐄 *Eid ul Adha Mubarak!* 🐄🌙\n\n"Taqabbalallahu minna wa minkum"\nMay Allah accept from us and from you.\n\nMay your Qurbani be accepted, your duas answered, and your family blessed. 💚\n\n#EidMubarak #EidulAdha', transliteration: '', meaning: 'WhatsApp message' },
  { lang: 'Instagram', text: '✨ Eid ul Adha Mubarak to all! ✨\n\nMay Allah accept our Qurbani, forgive our sins, and fill our homes with barakah 🌙\n\nTaqabbalallahu minna wa minkum 🤍\n\n#EidulAdha #EidMubarak #Qurbani #Alhamdulillah #Muslim', transliteration: '', meaning: 'Instagram caption' },
];

const RECIPES = [
  { name: 'Eid Biryani',        icon: '🍛', time: '90 min', serves: 8, origin: 'South Asian', ingredients: ['1 kg qurbani beef/mutton', '3 cups basmati rice', '2 large onions', '1 cup yogurt', '4 tbsp biryani spice mix', 'Saffron in warm milk', 'Ghee & whole spices', 'Fresh mint & coriander'], steps: ['Marinate meat with yogurt and spices for 2 hours', 'Fry onions golden, add marinated meat and cook 30 min', 'Par-boil rice with whole spices to 70% done', 'Layer rice over meat in pot', 'Drizzle saffron milk and ghee', 'Seal with dough and cook on dum for 25 min', 'Rest 10 min before serving'], tip: 'The longer you marinate the meat, the more tender the biryani.' },
  { name: 'Slow-Cooked Nihari', icon: '🍲', time: '4 hrs',  serves: 6, origin: 'Pakistani',   ingredients: ['1 kg beef shank/leg', '4 tbsp nihari masala', '1 tbsp ginger-garlic paste', '4 tbsp ghee', '1/4 cup whole wheat flour', 'Salt to taste', 'Julienned ginger, lime, coriander for garnish'], steps: ['Heat ghee, add ginger-garlic paste and fry', 'Add meat and nihari masala, brown well', 'Add water to cover, simmer 3–4 hours on low heat', 'Mix flour with water, add to thicken broth', 'Season, garnish generously, serve with naan'], tip: 'Nihari is traditionally eaten at Fajr — slow cook overnight for best results.' },
  { name: 'Kabsa (Gulf-Style)', icon: '🍚', time: '2 hrs',  serves: 8, origin: 'Arabic',      ingredients: ['1.5 kg lamb or goat pieces', '3 cups basmati rice', '2 tomatoes', '1 can tomato purée', 'Kabsa spice mix', 'Rose water', 'Raisins & toasted almonds', 'Ghee'], steps: ['Brown meat in ghee with onions', 'Add tomatoes, purée, and kabsa spices', 'Add water, cook meat until tender (1.5 hrs)', 'Add washed rice to the broth, cook 20 min', 'Fluff rice, arrange meat on top', 'Garnish with raisins and toasted almonds', 'Sprinkle rose water before serving'], tip: 'Rose water is the signature touch of authentic Kabsa — don\'t skip it.' },
  { name: 'Mutton Karahi',      icon: '🫕', time: '60 min', serves: 4, origin: 'Pakistani',   ingredients: ['750g mutton (bone-in)', '4 tomatoes chopped', '4 tbsp oil', '1 tbsp ginger-garlic paste', '1 tsp each: cumin, coriander, red chilli', 'Julienned ginger, green chilli, coriander'], steps: ['Heat oil in karahi/wok, add meat', 'Cook on high heat without water for 10 min', 'Add ginger-garlic, cook until fragrant', 'Add tomatoes and spices, cook covered 30 min', 'Dry up excess liquid on high heat', 'Garnish with ginger, chilli, coriander'], tip: 'Never add water — the meat releases its own juices which creates the authentic karahi flavour.' },
  { name: 'Seekh Kebab',        icon: '🍢', time: '45 min', serves: 6, origin: 'Middle Eastern', ingredients: ['500g minced lamb or beef', '1 onion finely grated', '2 tsp seekh kebab spice', '1 tsp each: garam masala, chilli', 'Fresh coriander & mint', 'Salt & black pepper', 'Oil for grilling'], steps: ['Mix mince with all spices and herbs thoroughly', 'Refrigerate mixture for 30 min', 'Wrap around flat skewers in sausage shape', 'Grill on BBQ or tawa on medium-high heat', 'Turn every 3–4 min until cooked through', 'Serve with naan, chutney, and sliced onion'], tip: 'Grating the onion (not chopping) prevents the kebab from falling off the skewer.' },
  { name: 'Harees (Emirati)',   icon: '🥣', time: '3 hrs',  serves: 6, origin: 'Gulf/Emirati', ingredients: ['500g lamb or chicken', '2 cups whole wheat (harees grain)', '1 tsp cinnamon', 'Salt to taste', 'Ghee for serving', 'Ground cinnamon & sugar to garnish'], steps: ['Soak wheat overnight', 'Boil meat until very tender, shred', 'Cook soaked wheat in meat broth 2 hours stirring', 'Add shredded meat, stir vigorously until paste-like', 'Season with cinnamon and salt', 'Serve hot topped generously with ghee'], tip: 'Harees is a traditional Eid dish across the Gulf — simple but deeply satisfying.' },
];

const DHUL_HIJJAH_DAYS = [
  { day: 1,  special: 'Start of 10 blessed days', deed: 'Increase dhikr, Quran, fasting' },
  { day: 2,  special: '',                          deed: 'Give extra charity today' },
  { day: 3,  special: '',                          deed: 'Recite Takbeer, Tahmeed, Tahleel' },
  { day: 4,  special: '',                          deed: 'Fast if able — great reward' },
  { day: 5,  special: '',                          deed: 'Read extra Quran' },
  { day: 6,  special: '',                          deed: 'Perform 2 rak\'ah Nafl after each prayer' },
  { day: 7,  special: '',                          deed: 'Make abundant Istighfar' },
  { day: 8,  special: 'Day of Tarwiyah',           deed: 'Fast today — Sunnah of Hujjaj' },
  { day: 9,  special: '⭐ Day of Arafah',           deed: 'FAST — expiates 2 years of sins!' },
  { day: 10, special: '🎉 Eid ul Adha',             deed: 'Eid prayer + Qurbani — do NOT fast' },
  { day: 11, special: 'Day of Tashreeq',           deed: 'Takbeer after every fard prayer' },
  { day: 12, special: 'Day of Tashreeq',           deed: 'Takbeer after every fard prayer' },
  { day: 13, special: 'Last Day of Tashreeq',      deed: 'Takbeer until Asr — conclude Eid' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function saveLS(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function loadLS<T>(k: string, fb: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } }

// Hijri date calculation (approximate — good enough for countdown)
function getNextEidDate(): Date {
  const today = new Date();
  // Eid ul Adha 2025: June 6, 2025
  // Eid ul Adha 2026: May 27, 2026
  const eidDates = [
    new Date('2025-06-07'),
    new Date('2026-05-27'),
    new Date('2027-05-16'),
  ];
  for (const d of eidDates) {
    if (d >= today) return d;
  }
  return eidDates[eidDates.length - 1];
}

function useCountdown(target: Date) {
  const [diff, setDiff] = useState({ days: 0, hours: 0, mins: 0, secs: 0, passed: false });
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const ms = target.getTime() - now;
      if (ms <= 0) { setDiff({ days: 0, hours: 0, mins: 0, secs: 0, passed: true }); return; }
      const days  = Math.floor(ms / 86400000);
      const hours = Math.floor((ms % 86400000) / 3600000);
      const mins  = Math.floor((ms % 3600000) / 60000);
      const secs  = Math.floor((ms % 60000) / 1000);
      setDiff({ days, hours, mins, secs, passed: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return diff;
}

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  bg:         '#0d1117',
  bgCard:     '#161b22',
  bgCard2:    '#1c2330',
  gold:       '#c8a96e',
  goldLight:  '#e8c98e',
  goldPale:   '#2a2010',
  green:      '#238636',
  greenLight: '#3fb950',
  greenPale:  '#0d2218',
  border:     '#30363d',
  text:       '#e6edf3',
  muted:      '#7d8590',
  white:      '#ffffff',
  red:        '#f85149',
  blue:       '#58a6ff',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EidulAdha() {
  const [tab, setTab] = useState<Tab>('calculator');
  const eidDate = getNextEidDate();
  const countdown = useCountdown(eidDate);

  // ── Calculator state ──
  const [animal, setAnimal]       = useState<Animal>('cow');
  const [country, setCountry]     = useState('Pakistan');
  const [totalPrice, setTotalPrice] = useState('');
  const [numShares, setNumShares] = useState(7);
  const [partners, setPartners]   = useState<SharePartner[]>([
    { id: '1', name: 'Me', paid: false },
  ]);

  // ── Takbeer state ──
  const [takbeerIdx, setTakbeerIdx]   = useState(0);
  const [takbeerCount, setTakbeerCount] = useState(0);
  const [takbeerFlash, setTakbeerFlash] = useState(false);
  const [takbeerRipples, setTakbeerRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);

  // ── Checklist state ──
  const [checked, setChecked] = useState<Record<string, boolean>>(() => loadLS('eid_checklist', {}));
  useEffect(() => { saveLS('eid_checklist', checked); }, [checked]);

  // ── Distribution state ──
  const [meatKg, setMeatKg]         = useState('');
  const [selfPct, setSelfPct]       = useState(33);
  const [relPct, setRelPct]         = useState(33);
  const [poorPct, setPoorPct]       = useState(34);
  const [distAnimal, setDistAnimal] = useState<Animal>('cow');

  // ── Greeting state ──
  const [copiedIdx, setCopiedIdx]   = useState<number | null>(null);

  // ── Day tracker ──
  const [completedDays, setCompletedDays] = useState<number[]>(() => loadLS('eid_days', []));
  useEffect(() => { saveLS('eid_days', completedDays); }, [completedDays]);

  // ── Recipe modal ──
  const [openRecipe, setOpenRecipe] = useState<number | null>(null);

  // ─── Calculator logic ───────────────────────────────────────────────────────
  const animalInfo = ANIMALS.find(a => a.id === animal)!;
  const maxShares  = animalInfo.maxShares;
  const effectiveShares = Math.min(numShares, maxShares);
  const priceNum   = parseFloat(totalPrice) || 0;
  const perShare   = priceNum > 0 && effectiveShares > 0 ? priceNum / effectiveShares : 0;
  const currency   = CURRENCY_MAP[country] || 'USD';

  const addPartner = () => {
    if (partners.length >= maxShares) return;
    setPartners(p => [...p, { id: Date.now().toString(), name: `Person ${p.length + 1}`, paid: false }]);
    setNumShares(s => Math.min(s + 1, maxShares));
  };

  const removePartner = (id: string) => {
    setPartners(p => p.filter(x => x.id !== id));
    setNumShares(s => Math.max(s - 1, 1));
  };

  // ─── Distribution logic ─────────────────────────────────────────────────────
  const distAnimalInfo = ANIMALS.find(a => a.id === distAnimal)!;
  const estimatedKg = meatKg ? parseFloat(meatKg) : (distAnimal === 'goat' || distAnimal === 'sheep' ? 12 : distAnimal === 'cow' ? 120 : 200);
  const selfKg = ((selfPct / 100) * estimatedKg).toFixed(1);
  const relKg  = ((relPct  / 100) * estimatedKg).toFixed(1);
  const poorKg = ((poorPct / 100) * estimatedKg).toFixed(1);

  // ─── Takbeer handler ────────────────────────────────────────────────────────
  const handleTakbeer = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    const t = TAKBEERS[takbeerIdx];
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const id = ++rippleId.current;
      setTakbeerRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setTakbeerRipples(prev => prev.filter(r => r.id !== id)), 600);
    }
    if (navigator.vibrate) navigator.vibrate(15);
    setTakbeerFlash(true);
    setTimeout(() => setTakbeerFlash(false), 80);
    const next = takbeerCount + 1;
    setTakbeerCount(next);
    if (next >= t.target) {
      setTimeout(() => setTakbeerCount(0), 1200);
    }
  }, [takbeerCount, takbeerIdx]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleTakbeer(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleTakbeer]);

  // ─── Copy greeting ──────────────────────────────────────────────────────────
  const copyGreeting = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalItems   = CHECKLIST_ITEMS.length;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Georgia', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Scheherazade+New:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.gold}44; border-radius: 4px; }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ripple { 0% { transform:scale(0);opacity:.5; } 100% { transform:scale(5);opacity:0; } }
        @keyframes glow   { 0%,100% { box-shadow:0 0 20px ${C.gold}33; } 50% { box-shadow:0 0 40px ${C.gold}66; } }
        @keyframes pulse  { 0%,100%{opacity:1;} 50%{opacity:.6;} }
        @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
        .fade-up { animation: fadeUp 0.35s ease both; }
        .glow-btn { animation: glow 3s ease infinite; }
        .tab-scroll { scrollbar-width: none; }
        .tab-scroll::-webkit-scrollbar { display: none; }
        input[type=range] { accent-color: ${C.gold}; }
        input::placeholder { color: ${C.muted}; }
        input:focus, select:focus { outline: none; border-color: ${C.gold} !important; box-shadow: 0 0 0 2px ${C.gold}22; }
        button:active { transform: scale(0.97); }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ background: `linear-gradient(160deg, #0d1117 0%, #1a1200 50%, #0d1117 100%)`, borderBottom: `1px solid ${C.border}`, padding: '0 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 8px' }}>
            <Link href="/" style={{ color: C.muted, fontSize: 13, textDecoration: 'none', fontFamily: 'Lora, Georgia, serif' }}>← Back</Link>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: C.gold, fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'Amiri, Georgia, serif', letterSpacing: 0.5 }}>🐄 Eid ul Adha</h1>
              <p style={{ color: C.muted, fontSize: 10, margin: '2px 0 0', letterSpacing: 1.5, textTransform: 'uppercase' }}>Complete Islamic Toolkit</p>
            </div>
            <div style={{ width: 50 }} />
          </div>

          {/* Countdown */}
          {!countdown.passed && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, paddingBottom: 12 }}>
              {[
                { v: countdown.days,  l: 'Days'    },
                { v: countdown.hours, l: 'Hours'   },
                { v: countdown.mins,  l: 'Minutes' },
                { v: countdown.secs,  l: 'Seconds' },
              ].map(s => (
                <div key={s.l} style={{ background: C.goldPale, border: `1px solid ${C.gold}33`, borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: C.gold, margin: 0, fontFamily: 'Lora, Georgia, serif', lineHeight: 1 }}>{String(s.v).padStart(2, '0')}</p>
                  <p style={{ fontSize: 9, color: C.muted, margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.l}</p>
                </div>
              ))}
            </div>
          )}
          {countdown.passed && (
            <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
              <p style={{ color: C.gold, fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'Amiri, Georgia, serif' }}>🎉 Eid ul Adha Mubarak! تَقَبَّلَ اللَّهُ مِنَّا وَمِنكُم 🎉</p>
            </div>
          )}
        </div>
      </header>

      {/* ── TAB BAR ── */}
      <div className="tab-scroll" style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, overflowX: 'auto', position: 'sticky', top: countdown.passed ? 60 : 112, zIndex: 40 }}>
        <div style={{ display: 'flex', padding: '8px 12px', gap: 6, minWidth: 'max-content', maxWidth: 800, margin: '0 auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{
                padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: tab === t.id ? C.gold : 'transparent',
                color: tab === t.id ? '#0d1117' : C.muted,
                fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
                fontFamily: 'Lora, Georgia, serif', whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '18px 14px 80px' }}>

        {/* ════════════════════════════════════════
            🐄 QURBANI CALCULATOR
        ════════════════════════════════════════ */}
        {tab === 'calculator' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Animal selector */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }}>
              <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: '0 0 12px', fontFamily: 'Lora, serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>Select Your Animal</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ANIMALS.map(a => (
                  <button key={a.id} onClick={() => { setAnimal(a.id); setNumShares(Math.min(numShares, a.maxShares)); setPartners(p => p.slice(0, a.maxShares)); }}
                    style={{
                      padding: '14px 12px', borderRadius: 14, border: `2px solid ${animal === a.id ? C.gold : C.border}`,
                      background: animal === a.id ? C.goldPale : C.bgCard2,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 24 }}>{a.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: animal === a.id ? C.gold : C.text }}>{a.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: animal === a.id ? C.gold : C.muted, background: animal === a.id ? `${C.gold}22` : C.bgCard, padding: '2px 7px', borderRadius: 10, border: `1px solid ${animal === a.id ? C.gold : C.border}` }}>
                        {a.maxShares === 1 ? '1 share' : `up to ${a.maxShares}`}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.4 }}>{a.desc}</p>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: '10px 14px', background: C.bgCard2, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                  ⚡ Min age: <strong style={{ color: C.goldLight }}>{animalInfo.minAge}</strong> &nbsp;·&nbsp;
                  Shares: <strong style={{ color: C.goldLight }}>1–{animalInfo.maxShares}</strong>
                </p>
              </div>
            </div>

            {/* Price & country */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }}>
              <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: '0 0 12px', fontFamily: 'Lora, serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>Price & Location</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 5 }}>Country</label>
                  <select value={country} onChange={e => setCountry(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 13, fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 5 }}>Total Animal Price ({currency})</label>
                  <input type="number" value={totalPrice} onChange={e => setTotalPrice(e.target.value)}
                    placeholder={`e.g. ${currency === 'PKR' ? '80000' : currency === 'USD' ? '500' : '1000'}`}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 13, fontFamily: 'Georgia, serif' }} />
                </div>
              </div>
            </div>

            {/* Shares & partners */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: 'Lora, serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>Share Partners ({partners.length}/{maxShares})</p>
                {partners.length < maxShares && (
                  <button onClick={addPartner}
                    style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${C.gold}`, background: C.goldPale, color: C.gold, fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                    + Add Person
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {partners.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.goldPale, border: `1px solid ${C.gold}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: C.gold, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <input
                      value={p.name}
                      onChange={e => setPartners(prev => prev.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 13, fontFamily: 'Georgia, serif' }}
                    />
                    <button
                      onClick={() => setPartners(prev => prev.map(x => x.id === p.id ? { ...x, paid: !x.paid } : x))}
                      style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${p.paid ? C.green : C.border}`, background: p.paid ? C.greenPale : C.bgCard2, color: p.paid ? C.greenLight : C.muted, fontSize: 11, cursor: 'pointer' }}>
                      {p.paid ? '✅ Paid' : 'Unpaid'}
                    </button>
                    {partners.length > 1 && (
                      <button onClick={() => removePartner(p.id)}
                        style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            {priceNum > 0 && (
              <div style={{ background: `linear-gradient(135deg, #1a1200, #0d1117)`, borderRadius: 18, border: `1px solid ${C.gold}55`, padding: 20 }} className="fade-up">
                <p style={{ color: C.gold, fontSize: 15, fontWeight: 700, margin: '0 0 14px', fontFamily: 'Amiri, serif', textAlign: 'center' }}>🐄 Qurbani Summary</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Animal',           value: `${animalInfo.icon} ${animalInfo.name}` },
                    { label: 'Total Shares',      value: `${effectiveShares} of ${maxShares}` },
                    { label: `Cost per Share`,    value: `${currency} ${perShare.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    { label: 'Total Qurbani Cost',value: `${currency} ${priceNum.toLocaleString()}` },
                  ].map(r => (
                    <div key={r.label} style={{ background: C.bgCard, borderRadius: 12, padding: '12px 14px', border: `1px solid ${C.border}` }}>
                      <p style={{ fontSize: 10, color: C.muted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.label}</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: C.goldLight, margin: 0, fontFamily: 'Lora, serif' }}>{r.value}</p>
                    </div>
                  ))}
                </div>

                {/* Per-person breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {partners.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: C.bgCard, borderRadius: 10, border: `1px solid ${p.paid ? C.green + '55' : C.border}` }}>
                      <span style={{ fontSize: 13, color: C.text }}>{i + 1}. {p.name || `Person ${i + 1}`}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{currency} {perShare.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: p.paid ? C.greenPale : C.bgCard2, color: p.paid ? C.greenLight : C.muted, border: `1px solid ${p.paid ? C.green + '44' : C.border}` }}>
                          {p.paid ? '✅' : '⏳'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Unpaid count */}
                {partners.some(p => !p.paid) && (
                  <div style={{ marginTop: 10, padding: '10px 14px', background: C.bgCard2, borderRadius: 10, border: `1px solid ${C.gold}33` }}>
                    <p style={{ fontSize: 12, color: C.gold, margin: 0 }}>
                      💰 {partners.filter(p => !p.paid).length} person(s) yet to pay · Outstanding: {currency} {(partners.filter(p => !p.paid).length * perShare).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fiqh rules */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }}>
              <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: '0 0 12px', fontFamily: 'Lora, serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>📖 Qurbani Rules (Fiqh)</p>
              {[
                { q: 'Who must perform Qurbani?', a: 'Every adult Muslim who possesses Nisab (87.5g gold or 612.4g silver equivalent) on 10th Dhul Hijjah — after paying all basic needs.' },
                { q: 'Valid animals & minimum age', a: 'Goat/Sheep (min 1 year for goat, 6 months for sheep if plump), Cow/Buffalo (min 2 years), Camel (min 5 years). Must be free from major defects.' },
                { q: 'One share or multiple?', a: 'Goat and sheep = 1 person only. Cow, bull, buffalo, and camel = up to 7 persons. All 7 must have sincere intention of worship.' },
                { q: 'Days of Qurbani', a: '10th, 11th, 12th Dhul Hijjah (Ayyaam al-Nahr). Best time: after Eid prayer on the 10th. Some scholars allow until sunset of the 13th.' },
                { q: 'Can I send Qurbani abroad?', a: 'Yes — permissible according to most scholars, especially if you are in a non-Muslim country. Use a trusted Islamic charity or organisation.' },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 10, padding: '12px 14px', background: C.bgCard2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.goldLight, margin: '0 0 5px' }}>Q: {item.q}</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.7 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            🥩 MEAT DISTRIBUTION
        ════════════════════════════════════════ */}
        {tab === 'distribution' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }}>
              <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: '0 0 14px', fontFamily: 'Lora, serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>🥩 Meat Distribution Calculator</p>

              {/* Animal type */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {ANIMALS.map(a => (
                  <button key={a.id} onClick={() => setDistAnimal(a.id)}
                    style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${distAnimal === a.id ? C.gold : C.border}`, background: distAnimal === a.id ? C.goldPale : C.bgCard2, color: distAnimal === a.id ? C.gold : C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'all 0.2s' }}>
                    {a.icon} {a.name}
                  </button>
                ))}
              </div>

              {/* Weight input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 5 }}>
                  Estimated meat weight (kg) — leave blank to use average ({distAnimal === 'goat' || distAnimal === 'sheep' ? '12 kg' : distAnimal === 'cow' ? '120 kg' : '200 kg'})
                </label>
                <input type="number" value={meatKg} onChange={e => setMeatKg(e.target.value)}
                  placeholder={distAnimal === 'goat' || distAnimal === 'sheep' ? '12' : distAnimal === 'cow' ? '120' : '200'}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, fontFamily: 'Georgia, serif' }} />
              </div>

              {/* Sliders */}
              {[
                { label: 'Yourself & Family', value: selfPct, set: setSelfPct, color: C.gold, icon: '🏠' },
                { label: 'Relatives & Friends', value: relPct, set: setRelPct, color: C.blue, icon: '👨‍👩‍👧' },
                { label: 'Poor & Needy ⭐', value: poorPct, set: setPoorPct, color: C.greenLight, icon: '🤝' },
              ].map(s => (
                <div key={s.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 12, color: C.text }}>{s.icon} {s.label}</label>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={s.value}
                    onChange={e => s.set(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: s.color }} />
                </div>
              ))}

              {/* Total warning */}
              {selfPct + relPct + poorPct !== 100 && (
                <div style={{ padding: '8px 12px', background: '#1a0a00', borderRadius: 8, border: '1px solid #dc262644', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: C.red, margin: 0 }}>⚠️ Total = {selfPct + relPct + poorPct}% — adjust sliders to reach 100%</p>
                </div>
              )}

              {/* Results */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 4 }}>
                {[
                  { label: 'Your Family 🏠', kg: selfKg, color: C.gold, pct: selfPct },
                  { label: 'Relatives 👨‍👩‍👧', kg: relKg,  color: C.blue, pct: relPct  },
                  { label: 'Poor 🤝',         kg: poorKg, color: C.greenLight, pct: poorPct  },
                ].map(r => (
                  <div key={r.label} style={{ background: C.bgCard2, borderRadius: 12, padding: '14px 10px', textAlign: 'center', border: `1px solid ${r.color}44` }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: r.color, margin: '0 0 2px', fontFamily: 'Lora, serif' }}>{r.kg} kg</p>
                    <p style={{ fontSize: 10, color: C.muted, margin: '0 0 3px' }}>{r.pct}%</p>
                    <p style={{ fontSize: 11, color: C.text, margin: 0, lineHeight: 1.3 }}>{r.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sunnah guidance */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }}>
              <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: '0 0 12px', fontFamily: 'Lora, serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>📖 Distribution Rules</p>
              {[
                ['Mandatory minimum', 'At least 1/3 MUST go to the poor — this is a condition for Qurbani validity according to many scholars.'],
                ['Can I keep all the meat?', 'No — giving to the poor is obligatory. Keeping all the meat for yourself invalidates the full reward of Qurbani.'],
                ['Skin & bones', 'The skin must be given to charity or used by yourself — it cannot be sold. Same for bones.'],
                ['Frozen meat', 'You may freeze your portion and eat it throughout the year — no time limit on your own share.'],
                ['Non-Muslims', 'You may give Qurbani meat to non-Muslim neighbours and friends — this is encouraged.'],
              ].map(([q, a]) => (
                <div key={q} style={{ marginBottom: 8, padding: '10px 14px', background: C.bgCard2, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.goldLight, margin: '0 0 4px' }}>{q}</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            📿 TAKBEER COUNTER
        ════════════════════════════════════════ */}
        {tab === 'takbeer' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Takbeer selector */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TAKBEERS.map((t, i) => (
                <button key={t.name} onClick={() => { setTakbeerIdx(i); setTakbeerCount(0); }}
                  style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${takbeerIdx === i ? C.gold : C.border}`, background: takbeerIdx === i ? C.goldPale : C.bgCard, color: takbeerIdx === i ? C.gold : C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'all 0.2s' }}>
                  {t.name}
                </button>
              ))}
            </div>

            {/* Arabic display */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.gold}44`, padding: '20px 18px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Scheherazade New', 'Amiri', serif", fontSize: 28, color: C.gold, direction: 'rtl', lineHeight: 2.2, margin: '0 0 10px' }}>
                {TAKBEERS[takbeerIdx].arabic}
              </p>
              <p style={{ fontSize: 13, color: C.muted, fontStyle: 'italic', margin: '0 0 6px', lineHeight: 1.7 }}>{TAKBEERS[takbeerIdx].transliteration}</p>
              <p style={{ fontSize: 12, color: C.text, margin: '0 0 8px' }}>{TAKBEERS[takbeerIdx].meaning}</p>
              <p style={{ fontSize: 11, color: C.gold + 'aa', background: C.goldPale, padding: '5px 12px', borderRadius: 10, display: 'inline-block' }}>{TAKBEERS[takbeerIdx].note}</p>
            </div>

            {/* Counter */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: '22px 18px', textAlign: 'center' }}>
              {/* Ring */}
              <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 16px' }}>
                <svg viewBox="0 0 100 100" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="44" fill="none" stroke={C.bgCard2} strokeWidth="7" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke={C.gold} strokeWidth="7"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={2 * Math.PI * 44 * (1 - Math.min(takbeerCount / TAKBEERS[takbeerIdx].target, 1))}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.15s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 46, fontWeight: 800, color: C.gold, lineHeight: 1, fontFamily: 'Lora, serif' }}>{takbeerCount}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>of {TAKBEERS[takbeerIdx].target}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: C.bgCard2, borderRadius: 99, height: 5, marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((takbeerCount / TAKBEERS[takbeerIdx].target) * 100, 100)}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, borderRadius: 99, transition: 'width 0.15s ease' }} />
              </div>

              {/* Tap button */}
              <button
                onClick={handleTakbeer}
                className="glow-btn"
                style={{
                  width: '100%', padding: '22px 0', borderRadius: 18,
                  background: takbeerFlash ? C.goldLight : `linear-gradient(135deg, ${C.gold}, #a07030)`,
                  color: '#0d1117', fontSize: 18, fontWeight: 800,
                  border: 'none', cursor: 'pointer',
                  transform: takbeerFlash ? 'scale(0.975)' : 'scale(1)',
                  transition: 'transform 0.08s ease, background 0.08s ease',
                  fontFamily: 'Amiri, Georgia, serif', letterSpacing: 1,
                  position: 'relative', overflow: 'hidden',
                }}>
                {takbeerRipples.map(r => (
                  <span key={r.id} style={{ position: 'absolute', left: r.x, top: r.y, width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', animation: 'ripple 0.6s ease-out forwards', pointerEvents: 'none' }} />
                ))}
                اللَّهُ أَكْبَرُ
              </button>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Tap the button or press Space / Enter</p>

              {takbeerCount > 0 && (
                <button onClick={() => setTakbeerCount(0)}
                  style={{ marginTop: 8, padding: '7px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  🔄 Reset
                </button>
              )}
            </div>

            {/* Dhul Hijjah Day Tracker */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }}>
              <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: '0 0 12px', fontFamily: 'Lora, serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>📅 10 Days of Dhul Hijjah Tracker</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DHUL_HIJJAH_DAYS.map(d => {
                  const done = completedDays.includes(d.day);
                  const isEid = d.day === 10;
                  return (
                    <div key={d.day} onClick={() => setCompletedDays(prev => done ? prev.filter(x => x !== d.day) : [...prev, d.day])}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, border: `1px solid ${isEid ? C.gold + '66' : done ? C.green + '44' : C.border}`, background: isEid ? C.goldPale : done ? C.greenPale : C.bgCard2, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isEid ? C.gold : done ? C.greenLight : C.bgCard, border: `2px solid ${isEid ? C.gold : done ? C.greenLight : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: isEid ? '#0d1117' : done ? '#0d1117' : C.muted, flexShrink: 0 }}>
                        {done ? '✓' : d.day}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: d.special ? 700 : 500, color: isEid ? C.gold : done ? C.greenLight : C.text, margin: '0 0 1px' }}>
                          Day {d.day}{d.special ? ` — ${d.special}` : ''}
                        </p>
                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{d.deed}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 10, textAlign: 'center' }}>Tap a day to mark as completed · {completedDays.length}/13 days tracked</p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            ✅ CHECKLIST
        ════════════════════════════════════════ */}
        {tab === 'checklist' && (
          <div className="fade-up">
            {/* Progress */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: 'Lora, serif' }}>Eid ul Adha Checklist</p>
                <span style={{ fontSize: 13, fontWeight: 700, color: checkedCount === totalItems ? C.greenLight : C.gold }}>{checkedCount}/{totalItems}</span>
              </div>
              <div style={{ background: C.bgCard2, borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(checkedCount / totalItems) * 100}%`, background: checkedCount === totalItems ? `linear-gradient(90deg, ${C.green}, ${C.greenLight})` : `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
              {checkedCount === totalItems && (
                <p style={{ fontSize: 13, color: C.greenLight, textAlign: 'center', margin: '10px 0 0', fontStyle: 'italic' }}>🎉 MashAllah! All items completed. Taqabbalallahu minna wa minkum!</p>
              )}
            </div>

            {/* Grouped items */}
            {Array.from(new Set(CHECKLIST_ITEMS.map(i => i.cat))).map(cat => (
              <div key={cat} style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: '14px 16px', marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {CHECKLIST_ITEMS.filter(i => i.cat === cat).map(item => (
                    <div key={item.id} onClick={() => setChecked(p => ({ ...p, [item.id]: !p[item.id] }))}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: checked[item.id] ? C.greenPale : C.bgCard2, border: `1px solid ${checked[item.id] ? C.green + '55' : C.border}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked[item.id] ? C.greenLight : C.border}`, background: checked[item.id] ? C.greenLight : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
                        {checked[item.id] && <span style={{ color: '#0d1117', fontSize: 13, fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, color: checked[item.id] ? C.muted : C.text, textDecoration: checked[item.id] ? 'line-through' : 'none', lineHeight: 1.5 }}>{item.icon} {item.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={() => setChecked({})}
              style={{ width: '100%', padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              🔄 Reset Checklist
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════
            🌙 SUNNAH GUIDE
        ════════════════════════════════════════ */}
        {tab === 'sunnah' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: `linear-gradient(135deg, ${C.goldPale}, #0d1117)`, borderRadius: 18, border: `1px solid ${C.gold}44`, padding: '18px 20px', textAlign: 'center', marginBottom: 4 }}>
              <p style={{ fontFamily: "'Scheherazade New', serif", fontSize: 26, color: C.gold, direction: 'rtl', lineHeight: 2, margin: '0 0 6px' }}>
                وَلِكُلِّ أُمَّةٍ جَعَلْنَا مَنسَكًا
              </p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0, fontStyle: 'italic' }}>"For every nation We have appointed a rite of sacrifice." — Quran 22:34</p>
            </div>

            {SUNNAH_TIMELINE.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Timeline connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.goldPale, border: `2px solid ${C.gold}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {s.icon}
                  </div>
                  {i < SUNNAH_TIMELINE.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 20, background: `linear-gradient(${C.gold}44, transparent)`, margin: '4px 0' }} />}
                </div>
                <div style={{ flex: 1, background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: '13px 15px', marginBottom: 4 }}>
                  <p style={{ fontSize: 10, color: C.gold, fontWeight: 700, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.time}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 6px', fontFamily: 'Lora, serif' }}>{s.title}</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.75 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════
            🕌 EID PRAYER FINDER
        ════════════════════════════════════════ */}
        {tab === 'prayer' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }}>
              <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: '0 0 6px', fontFamily: 'Lora, serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>🕌 Find Eid Prayer Near You</p>
              <p style={{ fontSize: 12, color: C.muted, margin: '0 0 14px', lineHeight: 1.6 }}>Eid prayer is performed in congregation after sunrise on Eid day. Tap below to find your nearest mosque.</p>
              <button
                onClick={() => window.open('https://www.iloveislam.life/mosque', '_blank')}
                style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: `linear-gradient(135deg, ${C.gold}, #a07030)`, color: '#0d1117', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Lora, Georgia, serif' }}>
                🗺️ Find Nearest Mosque → Halal Travel Tool
              </button>
            </div>

            {/* Eid prayer guide */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }}>
              <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: '0 0 12px', fontFamily: 'Lora, serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>📖 Eid Salah Guide</p>
              {[
                { t: 'When is Eid prayer?',         d: 'After sunrise, before midday (Dhuhr). Typically 7–9 AM depending on location and sunrise time.' },
                { t: 'How many rak\'ahs?',           d: '2 rak\'ahs. In the first: 3 extra Takbeers before Surah Fatihah. In the second: 3 extra Takbeers after standing from Sujood.' },
                { t: 'Is there an Adhan?',           d: 'No Adhan and no Iqamah for Eid prayer — this is unique to the Eid prayers.' },
                { t: 'Is it compulsory?',            d: 'Wajib (obligatory) for all adult Muslim males. Highly recommended for women and children. Excused for the elderly, sick, and travellers.' },
                { t: 'What to do before prayer?',   d: 'Perform Ghusl, wear best clothes, apply attar, eat nothing (Eid ul Adha — eat after prayer from Qurbani meat), take a different route to and from prayer.' },
                { t: 'Khutbah',                     d: 'Unlike Jumu\'ah, the Eid Khutbah is AFTER the prayer. It is Sunnah to listen attentively — do not leave early.' },
              ].map(item => (
                <div key={item.t} style={{ marginBottom: 9, padding: '11px 13px', background: C.bgCard2, borderRadius: 11, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.goldLight, margin: '0 0 4px' }}>{item.t}</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.7 }}>{item.d}</p>
                </div>
              ))}
            </div>

            {/* Slaughter dua */}
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.gold}44`, padding: 18 }}>
              <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: '0 0 12px', fontFamily: 'Lora, serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>🤲 Essential Duas</p>
              {TAKBEERS.map((t, i) => (
                <div key={i} style={{ marginBottom: 10, padding: '14px', background: C.bgCard2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.goldLight, margin: '0 0 6px' }}>{t.name}</p>
                  <p style={{ fontFamily: "'Scheherazade New', serif", fontSize: 20, color: C.gold, direction: 'rtl', lineHeight: 2, margin: '0 0 6px' }}>{t.arabic}</p>
                  <p style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', margin: '0 0 4px' }}>{t.transliteration}</p>
                  <p style={{ fontSize: 11, color: C.text, margin: '0 0 4px' }}>{t.meaning}</p>
                  <p style={{ fontSize: 10, color: C.gold + 'aa', margin: 0 }}>{t.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            💌 GREETING GENERATOR
        ════════════════════════════════════════ */}
        {tab === 'greeting' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: `linear-gradient(135deg, ${C.goldPale}, #0d1117)`, borderRadius: 18, border: `1px solid ${C.gold}44`, padding: '18px 20px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Scheherazade New', serif", fontSize: 32, color: C.gold, direction: 'rtl', lineHeight: 1.8, margin: '0 0 6px' }}>عِيدُ الأَضْحَى مُبَارَك</p>
              <p style={{ fontSize: 13, color: C.muted, margin: 0, fontStyle: 'italic' }}>Tap any greeting to copy it instantly</p>
            </div>

            {GREETINGS.map((g, i) => (
              <div key={i} onClick={() => copyGreeting(g.text, i)}
                style={{ background: C.bgCard, borderRadius: 16, border: `1.5px solid ${copiedIdx === i ? C.gold : C.border}`, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: C.goldPale, padding: '2px 9px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{g.lang}</span>
                  <span style={{ fontSize: 12, color: copiedIdx === i ? C.greenLight : C.muted }}>
                    {copiedIdx === i ? '✅ Copied!' : '📋 Tap to copy'}
                  </span>
                </div>
                <p style={{
                  fontSize: g.lang === 'Arabic' || g.lang === 'Urdu' ? 20 : 13,
                  color: C.text,
                  direction: g.lang === 'Arabic' || g.lang === 'Urdu' ? 'rtl' : 'ltr',
                  fontFamily: g.lang === 'Arabic' || g.lang === 'Urdu' ? "'Scheherazade New', serif" : 'Lora, Georgia, serif',
                  lineHeight: g.lang === 'Arabic' || g.lang === 'Urdu' ? 2 : 1.7,
                  margin: 0,
                  whiteSpace: 'pre-line',
                }}>{g.text}</p>
                {g.transliteration && <p style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', margin: '6px 0 0' }}>{g.transliteration}</p>}
                {g.meaning && g.lang !== 'English' && g.lang !== 'WhatsApp' && g.lang !== 'Instagram' && (
                  <p style={{ fontSize: 11, color: C.muted, margin: '4px 0 0' }}>{g.meaning}</p>
                )}
              </div>
            ))}

            {/* WhatsApp share */}
            <a href={`https://wa.me/?text=${encodeURIComponent(GREETINGS[4].text)}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: '13px 0', background: '#25d366', color: '#fff', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontFamily: 'Lora, Georgia, serif' }}>
              💬 Send on WhatsApp
            </a>
          </div>
        )}

        {/* ════════════════════════════════════════
            🍖 RECIPES
        ════════════════════════════════════════ */}
        {tab === 'recipes' && (
          <div className="fade-up">
            <div style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: '14px 18px', marginBottom: 14, textAlign: 'center' }}>
              <p style={{ color: C.gold, fontSize: 14, fontWeight: 700, margin: '0 0 4px', fontFamily: 'Amiri, serif' }}>🍖 Eid ul Adha Recipes</p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Traditional dishes from across the Muslim world to celebrate Eid</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {RECIPES.map((r, i) => (
                <div key={i} onClick={() => setOpenRecipe(openRecipe === i ? null : i)}
                  style={{ background: C.bgCard, borderRadius: 16, border: `1.5px solid ${openRecipe === i ? C.gold : C.border}`, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  {/* Header */}
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 2px', fontFamily: 'Lora, serif' }}>{r.name}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: C.muted }}>⏱ {r.time}</span>
                        <span style={{ fontSize: 10, color: C.muted }}>👥 Serves {r.serves}</span>
                        <span style={{ fontSize: 10, color: C.gold }}>{r.origin}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 16, color: C.muted, transition: 'transform 0.2s', transform: openRecipe === i ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </div>

                  {/* Expanded */}
                  {openRecipe === i && (
                    <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 7px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ingredients</p>
                          {r.ingredients.map((ing, j) => (
                            <p key={j} style={{ fontSize: 12, color: C.muted, margin: '0 0 4px', display: 'flex', gap: 5 }}>
                              <span style={{ color: C.gold, flexShrink: 0 }}>•</span> {ing}
                            </p>
                          ))}
                        </div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 7px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Method</p>
                          {r.steps.map((step, j) => (
                            <p key={j} style={{ fontSize: 12, color: C.muted, margin: '0 0 5px', display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                              <span style={{ color: C.gold, fontWeight: 700, flexShrink: 0, fontSize: 11 }}>{j + 1}.</span> {step}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: '10px 12px', background: C.goldPale, borderRadius: 10, border: `1px solid ${C.gold}44` }}>
                        <p style={{ fontSize: 12, color: C.gold, margin: 0 }}>💡 <strong>Chef's Tip:</strong> {r.tip}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}