export const ALL_FEATURED_TOOLS = [
  { href: '/mizan', badge: '✨ Featured', title: 'Mizan — Islamic Life Blueprint', desc: 'Discover your purpose', icon: '✦', gradient: 'linear-gradient(135deg, #1a0a00, #3d1f00)', accent: '#c8a96e' },
  { href: '/halal-scanner', badge: '🆕 New Tool', title: 'HalalScan — Halal Food Scanner', desc: 'Scan barcodes & photos to check Halal', icon: '📷', gradient: 'linear-gradient(135deg, #071a0d, #0a3d1a)', accent: '#4ade80' },
  { href: '/zakat', badge: '💰 Finance', title: 'Zakat Calculator', desc: 'Calculate your annual Zakat', icon: '💰', gradient: 'linear-gradient(135deg, #0a1f0a, #0d3d1a)', accent: '#4ade80' },
];

export const TOOLS_DATA = () => [
  {
    category: 'Most Used', emoji: '⭐',
    items: [
      { name: 'Zakat Calculator', desc: 'Calculate your annual zakat', icon: '💰', href: '/zakat', color: 'bg-emerald-100 text-emerald-700' },
      { name: 'Prayer Times', desc: 'Daily salah times', icon: '🕐', href: '/prayer-times', color: 'bg-blue-100 text-blue-700' },
      { name: 'HalalScan', desc: 'Check if food is Halal', icon: '📷', href: '/halal-scanner', color: 'bg-lime-100 text-lime-700' },
    ],
  },
  {
    category: 'Daily Practice', emoji: '🤲',
    items: [
      { name: 'Dua Generator', desc: 'Prayers for every moment', icon: '🤲', href: '/dua', color: 'bg-amber-100 text-amber-700' },
      { name: '99 Names of Allah', desc: 'Asma ul Husna', icon: '⭐', href: '/names', color: 'bg-rose-100 text-rose-700' },
    ],
  },
];
