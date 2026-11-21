// Curated tool list — only the kept tools, grouped for the rebuilt site.
// Do not re-add any tool that was removed in the rebuild.

export const ALL_FEATURED_TOOLS = [
  { href: '/dua-for-this-moment', badge: 'Featured', title: 'Dua for This Moment', desc: 'The right dua for your exact situation, with audio', icon: 'dua', gradient: 'linear-gradient(135deg, #0b3d2e, #146b4d)', accent: '#c9a227' },
  { href: '/quran', badge: 'Quran', title: 'Quran Reader', desc: 'Read and listen in Indo-Pak script with translation', icon: 'quran', gradient: 'linear-gradient(135deg, #0b3d2e, #1a5c44)', accent: '#e7d9a8' },
  { href: '/prayer-times', badge: 'Daily', title: 'Prayer Times', desc: 'Accurate salah times for your location', icon: 'prayer', gradient: 'linear-gradient(135deg, #0b3d2e, #146b4d)', accent: '#7fb89e' },
  { href: '/qibla', badge: 'Travel', title: 'Qibla Finder', desc: 'Find the direction of Mecca instantly', icon: 'qibla', gradient: 'linear-gradient(135deg, #0b3d2e, #3d2f00)', accent: '#c9a227' },
  { href: '/zakat', badge: 'Finance', title: 'Zakat Calculator', desc: 'Calculate your annual Zakat with precision', icon: 'zakat', gradient: 'linear-gradient(135deg, #0b3d2e, #0d5238)', accent: '#e7d9a8' },
  { href: '/dhikr', badge: 'Worship', title: 'Dhikr Counter', desc: 'Your digital tasbih for daily remembrance', icon: 'dhikr', gradient: 'linear-gradient(135deg, #0b3d2e, #1a5c44)', accent: '#a7d3bc' },
];

export const TOOLS_DATA = () => [
  {
    category: 'Most Used', emoji: 'names',
    items: [
      { name: 'Dua for This Moment', desc: 'The right dua for your situation', icon: 'dua', href: '/dua-for-this-moment', color: 'bg-amber-100 text-amber-800' },
      { name: 'Quran Reader', desc: 'Read in Indo-Pak script', icon: 'quran', href: '/quran', color: 'bg-emerald-100 text-emerald-800' },
      { name: 'Prayer Times', desc: 'Daily salah times', icon: 'prayer', href: '/prayer-times', color: 'bg-emerald-100 text-emerald-800' },
      { name: 'Qibla Finder', desc: 'Find Mecca direction', icon: 'qibla', href: '/qibla', color: 'bg-amber-100 text-amber-800' },
      { name: 'Zakat Calculator', desc: 'Calculate your annual zakat', icon: 'zakat', href: '/zakat', color: 'bg-yellow-100 text-yellow-800' },
      { name: 'Dhikr Counter', desc: 'Digital tasbih', icon: 'dhikr', href: '/dhikr', color: 'bg-teal-100 text-teal-800' },
    ],
  },
  {
    category: 'Daily Practice', emoji: 'dua',
    items: [
      { name: '99 Names of Allah', desc: 'Asma ul Husna', icon: 'names', href: '/names', color: 'bg-amber-100 text-amber-800' },
      { name: 'Hadith Search', desc: 'Search hadith books', icon: 'hadith', href: '/hadith', color: 'bg-emerald-100 text-emerald-800' },
      { name: 'Hijri Calendar', desc: 'Islamic date converter', icon: 'moon', href: '/hijri', color: 'bg-teal-100 text-teal-800' },
      { name: 'Ramadan Planner', desc: 'Suhoor & iftar tracker', icon: 'moon', href: '/ramadan', color: 'bg-emerald-100 text-emerald-800' },
      { name: 'Night Recitation', desc: 'Sleep with Quran recitation', icon: 'moon', href: '/night', color: 'bg-teal-100 text-teal-800' },
    ],
  },
  {
    category: 'Finance & Giving', emoji: 'sadaqah',
    items: [
      { name: 'Inheritance Calculator', desc: 'Islamic shares', icon: 'inheritance', href: '/inheritance', color: 'bg-amber-100 text-amber-800' },
      { name: 'Sadaqah Tracker', desc: 'Log your charity', icon: 'sadaqah', href: '/sadaqah', color: 'bg-yellow-100 text-yellow-800' },
      { name: 'Halal Finance', desc: 'Riba-free check', icon: 'finance', href: '/halal-finance', color: 'bg-emerald-100 text-emerald-800' },
      { name: 'Kaffarah Calculator', desc: 'Expiation for oaths & fasts', icon: 'kaffarah', href: '/kaffarah', color: 'bg-amber-100 text-amber-800' },
    ],
  },
  {
    category: 'Travel & Knowledge', emoji: 'quran',
    items: [
      { name: 'Hajj Checklist', desc: 'Pilgrimage guide', icon: 'hajj', href: '/hajj', color: 'bg-emerald-100 text-emerald-800' },
      { name: 'Halal Travel', desc: 'Plan your journey', icon: 'travel', href: '/travel', color: 'bg-teal-100 text-teal-800' },
      { name: 'Islamic Names', desc: 'Name meanings', icon: 'namesFinder', href: '/names-finder', color: 'bg-amber-100 text-amber-800' },
      { name: 'Mizan — Life Blueprint', desc: 'Discover your purpose', icon: 'sparkle', href: '/mizan', color: 'bg-yellow-100 text-yellow-800' },
    ],
  },
];
