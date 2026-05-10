// app/faq/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// ==================== TRANSLATIONS ====================
const FAQ_TRANSLATIONS: Record<string, any> = {
  en: {
    title: 'Frequently Asked Questions',
    subtitle: 'Find answers to common questions about I Love Islam tools',
    backToHome: '← Back to Home',
    categories: {
      general: 'General Questions',
      tools: 'About Our Tools',
      technical: 'Technical Questions',
      privacy: 'Privacy & Data',
    },
    faqs: [
      {
        category: 'general',
        q: 'Is I Love Islam completely free?',
        a: 'Yes! All our tools are 100% free to use. No hidden fees, no subscription plans, and no credit card required. We believe every Muslim should have access to quality Islamic tools without financial barriers.',
      },
      {
        category: 'general',
        q: 'Do I need to create an account?',
        a: 'No account needed! You can use all tools immediately without registration. Some features like saving your Dhikr progress use your browser\'s local storage, but no personal data is collected on our servers.',
      },
      {
        category: 'general',
        q: 'How accurate are the prayer times?',
        a: 'Prayer times are calculated using the Aladhan API, which uses accurate astronomical calculations based on your location. Times are adjusted for your specific city and follow standard Islamic calculation methods (Muslim World League by default).',
      },
      {
        category: 'tools',
        q: 'How does the Zakat Calculator work?',
        a: 'Our Zakat Calculator helps you calculate your annual Zakat based on current gold/silver prices. Enter your assets (cash, gold, silver, investments, business goods) and liabilities (debts, expenses) to determine your Zakatable wealth, then calculate 2.5% of that amount.',
      },
      {
        category: 'tools',
        q: 'Is the Qibla Finder accurate?',
        a: 'Yes! The Qibla Finder uses the great-circle calculation method (spherical law of cosines) to find the shortest path to the Kaaba in Makkah. For best accuracy, enable location services and use the compass feature on your mobile device.',
      },
      {
        category: 'tools',
        q: 'What is the Mizan Islamic Life Blueprint?',
        a: 'Mizan is a unique self-discovery tool based on Abjad numerology, the 99 Names of Allah, and Quranic guidance. It analyzes your birth date to reveal your spiritual archetype, life purpose, divine name, recommended Dhikr, and compatibility with others. It\'s designed for reflection and inspiration.',
      },
      {
        category: 'technical',
        q: 'Does this work on mobile phones?',
        a: 'Absolutely! All our tools are fully responsive and work perfectly on smartphones, tablets, and desktop computers. You can also install our app on your phone\'s home screen for quick access (look for "Add to Home Screen" in your browser menu).',
      },
      {
        category: 'technical',
        q: 'Why does the compass not work on my device?',
        a: 'The compass feature requires a device with a magnetometer (most modern smartphones have one). For best results: 1) Grant location permission, 2) Enable compass when prompted, 3) Calibrate by moving your phone in a figure-8 pattern, 4) Keep your phone away from magnetic interference.',
      },
      {
        category: 'privacy',
        q: 'Do you store my personal data?',
        a: 'No! All calculations happen locally in your browser. We do not store any personal information on our servers. Your birth date, location, and Dhikr progress are saved only in your browser\'s local storage and never sent to us.',
      },
      {
        category: 'privacy',
        q: 'Is my location shared with anyone?',
        a: 'Your location is only used to calculate prayer times and Qibla direction within your browser. We never send your location to our servers or share it with third parties. The geolocation API is used locally and results are discarded after calculation.',
      },
    ],
    contactText: 'Still have questions?',
    contactLink: 'Contact us',
    footerText: 'We\'re here to help you on your spiritual journey.',
  },
  ar: {
    title: 'الأسئلة الشائعة',
    subtitle: 'اعثر على إجابات للأسئلة الشائعة حول أدوات أحب الإسلام',
    backToHome: '← العودة إلى الرئيسية',
    categories: {
      general: 'أسئلة عامة',
      tools: 'عن أدواتنا',
      technical: 'أسئلة تقنية',
      privacy: 'الخصوصية والبيانات',
    },
    faqs: [
      {
        category: 'general',
        q: 'هل أحب الإسلام مجاني بالكامل؟',
        a: 'نعم! جميع أدواتنا مجانية 100٪. لا توجد رسوم خفية أو خطط اشتراك أو بطاقة ائتمان مطلوبة. نؤمن بأن كل مسلم يجب أن يحصل على أدوات إسلامية عالية الجودة دون عوائق مالية.',
      },
      {
        category: 'general',
        q: 'هل أحتاج إلى إنشاء حساب؟',
        a: 'لا حاجة لحساب! يمكنك استخدام جميع الأدوات فورًا دون تسجيل. بعض الميزات مثل حفظ تقدم الذكر تستخدم التخزين المحلي للمتصفح، ولكن لا يتم جمع بيانات شخصية على خوادمنا.',
      },
      {
        category: 'tools',
        q: 'ما هو ميزان البصيرة الإسلامية؟',
        a: 'ميزان هي أداة فريدة لاكتشاف الذات تعتمد على علم الأعداد الأبجدي وأسماء الله الحسنى والتوجيه القرآني. تحلل تاريخ ميلادك لتكشف عن نموذجك الروحي وهدف حياتك.',
      },
      {
        category: 'privacy',
        q: 'هل تخزن بياناتي الشخصية؟',
        a: 'لا! تتم جميع العمليات الحسابية محليًا في متصفحك. لا نقوم بتخزين أي معلومات شخصية على خوادمنا. يتم حفظ تاريخ ميلادك وموقعك فقط في التخزين المحلي للمتصفح.',
      },
    ],
    contactText: 'لا تزال لديك أسئلة؟',
    contactLink: 'اتصل بنا',
    footerText: 'نحن هنا لمساعدتك في رحلتك الروحية.',
  },
  ur: {
    title: 'اکثر پوچھے جانے والے سوالات',
    subtitle: 'I Love Islam ٹولز کے بارے میں عام سوالات کے جوابات حاصل کریں',
    backToHome: '← ہوم پیج پر واپس',
    categories: {
      general: 'عمومی سوالات',
      tools: 'ہمارے ٹولز کے بارے میں',
      technical: 'تکنیکی سوالات',
      privacy: 'رازداری اور ڈیٹا',
    },
    faqs: [
      {
        category: 'general',
        q: 'کیا I Love Islam مکمل طور پر مفت ہے؟',
        a: 'جی ہاں! ہمارے تمام ٹولز 100% مفت ہیں۔ کوئی چھپی ہوئی فیس نہیں، کوئی سبسکرپشن نہیں۔ ہر مسلمان کو بغیر کسی رکاوٹ کے معیاری اسلامی ٹولز تک رسائی حاصل ہونی چاہیے۔',
      },
      {
        category: 'general',
        q: 'کیا مجھے اکاؤنٹ بنانے کی ضرورت ہے؟',
        a: 'نہیں! بغیر رجسٹریشن کے فوری طور پر تمام ٹولز استعمال کریں۔ ذاتی ڈیٹا ہمارے سرورز پر محفوظ نہیں کیا جاتا۔',
      },
      {
        category: 'privacy',
        q: 'کیا آپ میرے ذاتی ڈیٹا کو محفوظ کرتے ہیں؟',
        a: 'نہیں! تمام حسابات آپ کے براؤزر میں مقامی طور پر ہوتی ہیں۔ ہم آپ کے سرورز پر کوئی ذاتی معلومات محفوظ نہیں کرتے۔',
      },
    ],
    contactText: 'اب بھی سوالات ہیں؟',
    contactLink: 'ہم سے رابطہ کریں',
    footerText: 'ہم آپ کے روحانی سفر میں آپ کی مدد کے لیے یہاں ہیں۔',
  },
  fr: {
    title: 'Questions Fréquemment Posées',
    subtitle: 'Trouvez des réponses aux questions courantes sur les outils I Love Islam',
    backToHome: '← Retour à l\'accueil',
    categories: {
      general: 'Questions Générales',
      tools: 'À Propos de Nos Outils',
      technical: 'Questions Techniques',
      privacy: 'Confidentialité et Données',
    },
    faqs: [
      {
        category: 'general',
        q: 'I Love Islam est-il complètement gratuit ?',
        a: 'Oui ! Tous nos outils sont 100% gratuits. Pas de frais cachés, pas d\'abonnement. Chaque musulman devrait avoir accès à des outils islamiques de qualité sans barrières financières.',
      },
      {
        category: 'privacy',
        q: 'Stockez-vous mes données personnelles ?',
        a: 'Non ! Tous les calculs sont effectués localement dans votre navigateur. Nous ne stockons aucune information personnelle sur nos serveurs.',
      },
    ],
    contactText: 'Vous avez encore des questions ?',
    contactLink: 'Contactez-nous',
    footerText: 'Nous sommes là pour vous aider dans votre voyage spirituel.',
  },
  tr: {
    title: 'Sıkça Sorulan Sorular',
    subtitle: 'I Love Islam araçları hakkında sık sorulan soruların cevaplarını bulun',
    backToHome: '← Ana Sayfaya Dön',
    categories: {
      general: 'Genel Sorular',
      tools: 'Araçlarımız Hakkında',
      technical: 'Teknik Sorular',
      privacy: 'Gizlilik ve Veri',
    },
    faqs: [
      {
        category: 'general',
        q: 'I Love Islam tamamen ücretsiz mi?',
        a: 'Evet! Tüm araçlarımız %100 ücretsizdir. Gizli ücret yok, abonelik yok. Her Müslümanın kaliteli İslami araçlara erişimi olmalıdır.',
      },
    ],
    contactText: 'Hala sorularınız mı var?',
    contactLink: 'Bize Ulaşın',
    footerText: 'Manevi yolculuğunuzda size yardımcı olmak için buradayız.',
  },
  id: {
    title: 'Pertanyaan yang Sering Diajukan',
    subtitle: 'Temukan jawaban untuk pertanyaan umum tentang alat I Love Islam',
    backToHome: '← Kembali ke Beranda',
    categories: {
      general: 'Pertanyaan Umum',
      tools: 'Tentang Alat Kami',
      technical: 'Pertanyaan Teknis',
      privacy: 'Privasi & Data',
    },
    faqs: [
      {
        category: 'general',
        q: 'Apakah I Love Islam benar-benar gratis?',
        a: 'Ya! Semua alat kami 100% gratis. Tidak ada biaya tersembunyi, tidak ada langganan. Setiap Muslim harus memiliki akses ke alat Islam berkualitas tanpa hambatan finansial.',
      },
    ],
    contactText: 'Masih ada pertanyaan?',
    contactLink: 'Hubungi Kami',
    footerText: 'Kami di sini untuk membantu perjalanan spiritual Anda.',
  },
  ms: {
    title: 'Soalan Lazim',
    subtitle: 'Cari jawapan kepada soalan lazim tentang alat I Love Islam',
    backToHome: '← Kembali ke Utama',
    categories: {
      general: 'Soalan Umum',
      tools: 'Mengenai Alat Kami',
      technical: 'Soalan Teknikal',
      privacy: 'Privasi & Data',
    },
    faqs: [
      {
        category: 'general',
        q: 'Adakah I Love Islam percuma sepenuhnya?',
        a: 'Ya! Semua alat kami 100% percuma. Tiada yuran tersembunyi, tiada langganan. Setiap Muslim harus mempunyai akses kepada alat Islam berkualiti tanpa halangan kewangan.',
      },
    ],
    contactText: 'Masih ada soalan?',
    contactLink: 'Hubungi Kami',
    footerText: 'Kami di sini untuk membantu perjalanan rohani anda.',
  },
  bn: {
    title: 'প্রায়শই জিজ্ঞাসিত প্রশ্নাবলী',
    subtitle: 'I Love Islam টুলস সম্পর্কে সাধারণ প্রশ্নের উত্তর খুঁজুন',
    backToHome: '← হোমে ফিরে যান',
    categories: {
      general: 'সাধারণ প্রশ্ন',
      tools: 'আমাদের টুলস সম্পর্কে',
      technical: 'প্রযুক্তিগত প্রশ্ন',
      privacy: 'গোপনীয়তা এবং ডেটা',
    },
    faqs: [
      {
        category: 'general',
        q: 'I Love Islam কি সম্পূর্ণ বিনামূল্যে?',
        a: 'হ্যাঁ! আমাদের সমস্ত টুল 100% বিনামূল্যে। কোন লুকানো ফি নেই, কোন সাবস্ক্রিপশন নেই। প্রতিটি মুসলিমের আর্থিক বাধা ছাড়াই মানসম্পন্ন ইসলামিক টুলস অ্যাক্সেস করা উচিত।',
      },
    ],
    contactText: 'এখনও প্রশ্ন আছে?',
    contactLink: 'যোগাযোগ করুন',
    footerText: 'আমরা আপনার আধ্যাত্মিক যাত্রায় আপনাকে সাহায্য করতে এখানে আছি।',
  },
};

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'عربي', flag: '🇸🇦' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'ms', label: 'Melayu', flag: '🇲🇾' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
];

const RTL_LANGS = ['ar', 'ur'];

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tools: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  technical: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  privacy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function FAQPage() {
  const [lang, setLang] = useState('en');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  const t = FAQ_TRANSLATIONS[lang] || FAQ_TRANSLATIONS['en'];
  const isRTL = RTL_LANGS.includes(lang);
  const currentLang = LANGUAGES.find(l => l.code === lang);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('iloveislam_lang');
    if (savedLang && FAQ_TRANSLATIONS[savedLang]) setLang(savedLang);
  }, []);

  const switchLang = (code: string) => {
    setLang(code);
    localStorage.setItem('iloveislam_lang', code);
    setShowLangMenu(false);
  };

  const categories = [
    { id: 'all', name: 'All Questions', nameAr: 'جميع الأسئلة', nameUr: 'تمام سوالات' },
    { id: 'general', name: 'General', nameAr: 'عام', nameUr: 'عمومی' },
    { id: 'tools', name: 'Tools', nameAr: 'الأدوات', nameUr: 'ٹولز' },
    { id: 'technical', name: 'Technical', nameAr: 'تقني', nameUr: 'تکنیکی' },
    { id: 'privacy', name: 'Privacy', nameAr: 'الخصوصية', nameUr: 'رازداری' },
  ];

  const getCategoryName = (id: string) => {
    if (lang === 'ar') {
      const cat = categories.find(c => c.id === id);
      return cat?.nameAr || id;
    }
    if (lang === 'ur') {
      const cat = categories.find(c => c.id === id);
      return cat?.nameUr || id;
    }
    return categories.find(c => c.id === id)?.name || id;
  };

  const filteredFAQs = activeCategory === 'all' 
    ? t.faqs 
    : t.faqs.filter((faq: any) => faq.category === activeCategory);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-emerald-700 dark:text-emerald-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1 mb-4">
            <span>←</span> {t.backToHome}
          </Link>
          
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{t.title}</h1>
              <p className="text-white/60 text-sm">{t.subtitle}</p>
            </div>
            
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white/80 text-sm hover:bg-white/20 transition"
              >
                <span>{currentLang?.flag}</span>
                <span>{currentLang?.label}</span>
                <span>▾</span>
              </button>
              {showLangMenu && (
                <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 w-40">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => switchLang(l.code)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left ${
                        lang === l.code ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {getCategoryName(cat.id)}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.map((faq: any, index: number) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none p-5">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[faq.category]?.split(' ')[0] || 'bg-emerald-500'}`} />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm md:text-base">
                      {faq.q}
                    </h3>
                  </div>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-0">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs mb-3 ${CATEGORY_COLORS[faq.category] || 'bg-gray-100 text-gray-600'}`}>
                    {t.categories[faq.category] || faq.category}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </details>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-6 text-center border border-emerald-100 dark:border-emerald-800">
          <p className="text-gray-700 dark:text-gray-300 mb-3">{t.contactText}</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {t.contactLink} <span>→</span>
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{t.footerText}</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">Made with ❤️ for the Ummah</p>
          <div className="flex flex-wrap justify-center gap-4 mt-3">
            <Link href="/" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">Home</Link>
            <Link href="/about" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">About</Link>
            <Link href="/contact" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">Contact</Link>
            <Link href="/privacy" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}