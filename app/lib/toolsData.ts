export const ALL_FEATURED_TOOLS = [
  { href: '/mizan', badge: '✨ Featured', title: 'Mizan — Islamic Life Blueprint', desc: 'Discover your purpose', icon: '✦', gradient: 'linear-gradient(135deg, #1a0a00, #3d1f00)', accent: '#c8a96e' },
  { href: '/halal-scanner', badge: '🆕 New Tool', title: 'HalalScan — Halal Food Scanner', desc: 'Scan barcodes & photos to check Halal', icon: '📷', gradient: 'linear-gradient(135deg, #071a0d, #0a3d1a)', accent: '#4ade80' },
  { href: '/zakat', badge: '💰 Finance', title: 'Zakat Calculator', desc: 'Calculate your annual Zakat', icon: '💰', gradient: 'linear-gradient(135deg, #0a1f0a, #0d3d1a)', accent: '#4ade80' },
  { href: '/quran', badge: '📖 Quran', title: 'Quran Reader', desc: 'Read and listen with full translation', icon: '📖', gradient: 'linear-gradient(135deg, #0f1a0a, #1a3d10)', accent: '#86efac' },
  { href: '/dhikr', badge: '📿 Worship', title: 'Dhikr Counter', desc: 'Your digital tasbih for daily remembrance', icon: '📿', gradient: 'linear-gradient(135deg, #1a0a1a, #2d1040)', accent: '#c084fc' },
  { href: '/hijri', badge: '🌙 Calendar', title: 'Hijri Calendar', desc: 'Convert Islamic and Gregorian dates', icon: '🌙', gradient: 'linear-gradient(135deg, #0a0f1a, #101a3d)', accent: '#7dd3fc' },
];

export const TOOLS_DATA = () => [
  {
    category: 'Most Used', emoji: '⭐',
    items: [
      { name: 'Zakat Calculator', desc: 'Calculate your annual zakat', icon: '💰', href: '/zakat', color: 'bg-emerald-100 text-emerald-700' },
      { name: 'Prayer Times', desc: 'Daily salah times', icon: '🕐', href: '/prayer-times', color: 'bg-blue-100 text-blue-700' },
      { name: 'Qibla Finder', desc: 'Find Mecca direction', icon: '🧭', href: '/qibla', color: 'bg-amber-100 text-amber-700' },
      { name: 'Hijri Calendar', desc: 'Islamic date converter', icon: '🌙', href: '/hijri', color: 'bg-purple-100 text-purple-700' },
      { name: 'Quran Reader', desc: 'Read with translation', icon: '📖', href: '/quran', color: 'bg-green-100 text-green-700' },
      { name: 'Dhikr Counter', desc: 'Digital tasbih', icon: '📿', href: '/dhikr', color: 'bg-teal-100 text-teal-700' },
    ],
  },
  {
    category: 'Daily Practice', emoji: '🤲',
    items: [
      { name: 'Dua Generator', desc: 'Prayers for every moment', icon: '🤲', href: '/dua', color: 'bg-amber-100 text-amber-700' },
      { name: '99 Names of Allah', desc: 'Asma ul Husna', icon: '⭐', href: '/names', color: 'bg-rose-100 text-rose-700' },
      { name: 'Ramadan Planner', desc: 'Suhoor & iftar tracker', icon: '🌙', href: '/ramadan', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Hadith Search', desc: 'Search hadith books', icon: '🔍', href: '/hadith', color: 'bg-cyan-100 text-cyan-700' },
      { name: 'Night Recitation', desc: 'Sleep with Quran recitation', icon: '🌙', href: '/night', color: 'bg-blue-100 text-blue-700' },
    ],
  },
  {
    category: 'Finance & Giving', emoji: '💝',
    items: [
      { name: 'Sadaqah Tracker', desc: 'Log your charity', icon: '❤️', href: '/sadaqah', color: 'bg-pink-100 text-pink-700' },
      { name: 'Islamic Will', desc: 'Draft your Wasiyyah', icon: '📜', href: '/will', color: 'bg-stone-100 text-stone-700' },
      { name: 'Inheritance Calc', desc: 'Islamic shares', icon: '⚖️', href: '/inheritance', color: 'bg-orange-100 text-orange-700' },
      { name: 'Halal Finance', desc: 'Riba-free check', icon: '✅', href: '/halal-finance', color: 'bg-lime-100 text-lime-700' },
    ],
  },
  {
    category: 'Travel & Knowledge', emoji: '📚',
    items: [
      { name: 'Halal Travel', desc: 'Plan your journey', icon: '🌍', href: '/travel', color: 'bg-blue-100 text-blue-700' },
      { name: 'Hajj Checklist', desc: 'Pilgrimage guide', icon: '🕋', href: '/hajj', color: 'bg-stone-100 text-stone-700' },
      { name: 'Mosque Finder', desc: 'Nearest masjid', icon: '🕌', href: '/mosque', color: 'bg-emerald-100 text-emerald-700' },
      { name: 'Islamic Names', desc: 'Name meanings', icon: '✏️', href: '/names-finder', color: 'bg-violet-100 text-violet-700' },
    ],
  },
];
