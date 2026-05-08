'use client';
import { useState } from 'react';
import Link from 'next/link';

const NAMES = [
  { number: 1, arabic: 'الله', transliteration: 'Allah', meaning: 'The Greatest Name', benefit: 'The name of the Divine Essence' },
  { number: 2, arabic: 'الرَّحْمَنُ', transliteration: 'Ar-Rahman', meaning: 'The Most Gracious', benefit: 'The One who has plenty of mercy for the believers and the blasphemers in this world' },
  { number: 3, arabic: 'الرَّحِيمُ', transliteration: 'Ar-Rahim', meaning: 'The Most Merciful', benefit: 'The One who has plenty of mercy for the believers' },
  { number: 4, arabic: 'الْمَلِكُ', transliteration: 'Al-Malik', meaning: 'The King', benefit: 'The One with the complete Dominion' },
  { number: 5, arabic: 'الْقُدُّوسُ', transliteration: 'Al-Quddus', meaning: 'The Most Holy', benefit: 'The One who is pure from any imperfection' },
  { number: 6, arabic: 'السَّلَامُ', transliteration: 'As-Salam', meaning: 'The Source of Peace', benefit: 'The One who is free from every imperfection' },
  { number: 7, arabic: 'الْمُؤْمِنُ', transliteration: 'Al-Mumin', meaning: 'The Guardian of Faith', benefit: 'The One who witnessed for Himself that no one is God but Him' },
  { number: 8, arabic: 'الْمُهَيْمِنُ', transliteration: 'Al-Muhaymin', meaning: 'The Protector', benefit: 'The One who witnesses the saying and deeds of His creatures' },
  { number: 9, arabic: 'الْعَزِيزُ', transliteration: 'Al-Aziz', meaning: 'The Mighty', benefit: 'The Strong, The Defeater who is not defeated' },
  { number: 10, arabic: 'الْجَبَّارُ', transliteration: 'Al-Jabbar', meaning: 'The Compeller', benefit: 'The One that nothing happens in His Dominion except that which He willed' },
  { number: 11, arabic: 'الْمُتَكَبِّرُ', transliteration: 'Al-Mutakabbir', meaning: 'The Majestic', benefit: 'The One who is clear from the attributes of the creatures' },
  { number: 12, arabic: 'الْخَالِقُ', transliteration: 'Al-Khaliq', meaning: 'The Creator', benefit: 'The One who brings everything from non-existence to existence' },
  { number: 13, arabic: 'الْبَارِئُ', transliteration: 'Al-Bari', meaning: 'The Evolver', benefit: 'The Creator who has the Power to turn the entities' },
  { number: 14, arabic: 'الْمُصَوِّرُ', transliteration: 'Al-Musawwir', meaning: 'The Fashioner', benefit: 'The One who forms His creatures in different pictures' },
  { number: 15, arabic: 'الْغَفَّارُ', transliteration: 'Al-Ghaffar', meaning: 'The Repeatedly Forgiving', benefit: 'The One who forgives the sins of His slaves time and time again' },
  { number: 16, arabic: 'الْقَهَّارُ', transliteration: 'Al-Qahhar', meaning: 'The Subduer', benefit: 'The Dominant, The One who has the perfect Power' },
  { number: 17, arabic: 'الْوَهَّابُ', transliteration: 'Al-Wahhab', meaning: 'The Bestower', benefit: 'The One who is Generous in giving plenty without any return' },
  { number: 18, arabic: 'الرَّزَّاقُ', transliteration: 'Ar-Razzaq', meaning: 'The Provider', benefit: 'The One who provides everything that is needed' },
  { number: 19, arabic: 'الْفَتَّاحُ', transliteration: 'Al-Fattah', meaning: 'The Opener', benefit: 'The One who opens for His slaves the closed worldly and religious matters' },
  { number: 20, arabic: 'اَلْعَلِيمُ', transliteration: 'Al-Alim', meaning: 'The All-Knowing', benefit: 'The Knowledgeable; The One nothing is absent from His knowledge' },
  { number: 21, arabic: 'الْقَابِضُ', transliteration: 'Al-Qabid', meaning: 'The Withholder', benefit: 'The One who constricts the sustenance by His wisdom' },
  { number: 22, arabic: 'الْبَاسِطُ', transliteration: 'Al-Basit', meaning: 'The Extender', benefit: 'The One who expands and widens' },
  { number: 23, arabic: 'الْخَافِضُ', transliteration: 'Al-Khafid', meaning: 'The Abaser', benefit: 'The One who lowers whoever He willed by His Dominion' },
  { number: 24, arabic: 'الرَّافِعُ', transliteration: 'Ar-Rafi', meaning: 'The Exalter', benefit: 'The One who raises whoever He willed by His Dominion' },
  { number: 25, arabic: 'الْمُعِزُّ', transliteration: 'Al-Muizz', meaning: 'The Honourer', benefit: 'He gives esteem to whoever He willed' },
  { number: 26, arabic: 'الْمُذِلُّ', transliteration: 'Al-Mudhill', meaning: 'The Dishonourer', benefit: 'The One who humiliates whoever He willed' },
  { number: 27, arabic: 'السَّمِيعُ', transliteration: 'As-Sami', meaning: 'The All-Hearing', benefit: 'The One who Hears all things that are heard' },
  { number: 28, arabic: 'الْبَصِيرُ', transliteration: 'Al-Basir', meaning: 'The All-Seeing', benefit: 'The One who Sees all things that are seen' },
  { number: 29, arabic: 'الْحَكَمُ', transliteration: 'Al-Hakam', meaning: 'The Judge', benefit: 'He is the Ruler and His judgment is His Word' },
  { number: 30, arabic: 'الْعَدْلُ', transliteration: 'Al-Adl', meaning: 'The Just', benefit: 'The One who is entitled to do what He does' },
  { number: 31, arabic: 'اللَّطِيفُ', transliteration: 'Al-Latif', meaning: 'The Subtle One', benefit: 'The One who is kind to His slaves and endows upon them' },
  { number: 32, arabic: 'الْخَبِيرُ', transliteration: 'Al-Khabir', meaning: 'The All-Aware', benefit: 'The One who knows the truth of things' },
  { number: 33, arabic: 'الْحَلِيمُ', transliteration: 'Al-Halim', meaning: 'The Forbearing', benefit: 'The One who delays the punishment for those who deserve it' },
  { number: 34, arabic: 'الْعَظِيمُ', transliteration: 'Al-Azim', meaning: 'The Magnificent', benefit: 'The One deserving the attributes of Exaltment, Glory, Extolement' },
  { number: 35, arabic: 'الْغَفُورُ', transliteration: 'Al-Ghafur', meaning: 'The Forgiving', benefit: 'The One who forgives a lot' },
  { number: 36, arabic: 'الشَّكُورُ', transliteration: 'Ash-Shakur', meaning: 'The Appreciative', benefit: 'The One who gives a lot of reward for a little obedience' },
  { number: 37, arabic: 'الْعَلِيُّ', transliteration: 'Al-Ali', meaning: 'The Most High', benefit: 'The One who is clear from the attributes of the creatures' },
  { number: 38, arabic: 'الْكَبِيرُ', transliteration: 'Al-Kabir', meaning: 'The Most Great', benefit: 'The One who is greater than everything in status' },
  { number: 39, arabic: 'الْحَفِيظُ', transliteration: 'Al-Hafiz', meaning: 'The Preserver', benefit: 'The One who protects whatever and whoever He willed' },
  { number: 40, arabic: 'الْمُقِيتُ', transliteration: 'Al-Muqit', meaning: 'The Maintainer', benefit: 'The One who has the Power to feed His creatures' },
  { number: 41, arabic: 'الْحسِيبُ', transliteration: 'Al-Hasib', meaning: 'The Reckoner', benefit: 'The One who gives the satisfaction' },
  { number: 42, arabic: 'الْجَلِيلُ', transliteration: 'Al-Jalil', meaning: 'The Majestic', benefit: 'The One who is attributed with greatness of Power' },
  { number: 43, arabic: 'الْكَرِيمُ', transliteration: 'Al-Karim', meaning: 'The Generous', benefit: 'The One who is clear from abjectness' },
  { number: 44, arabic: 'الرَّقِيبُ', transliteration: 'Ar-Raqib', meaning: 'The Watchful', benefit: 'The One that nothing is absent from Him' },
  { number: 45, arabic: 'الْمُجِيبُ', transliteration: 'Al-Mujib', meaning: 'The Responsive', benefit: 'The One who answers the one in need if he asks Him' },
  { number: 46, arabic: 'الْوَاسِعُ', transliteration: 'Al-Wasi', meaning: 'The All-Encompassing', benefit: 'The Ample, The Knowledgeable' },
  { number: 47, arabic: 'الْحَكِيمُ', transliteration: 'Al-Hakim', meaning: 'The All-Wise', benefit: 'The One who is correct in His doings' },
  { number: 48, arabic: 'الْوَدُودُ', transliteration: 'Al-Wadud', meaning: 'The Loving', benefit: 'The One who loves His believing slaves' },
  { number: 49, arabic: 'الْمَجِيدُ', transliteration: 'Al-Majid', meaning: 'The Most Glorious', benefit: 'The One who is with perfect Power, High Status' },
  { number: 50, arabic: 'الْبَاعِثُ', transliteration: 'Al-Baith', meaning: 'The Resurrector', benefit: 'The One who resurrects His slaves after death' },
  { number: 51, arabic: 'الشَّهِيدُ', transliteration: 'Ash-Shahid', meaning: 'The Witness', benefit: 'The One who nothing is absent from Him' },
  { number: 52, arabic: 'الْحَقُّ', transliteration: 'Al-Haqq', meaning: 'The Truth', benefit: 'The One who truly exists' },
  { number: 53, arabic: 'الْوَكِيلُ', transliteration: 'Al-Wakil', meaning: 'The Trustee', benefit: 'The One who gives the satisfaction and is relied upon' },
  { number: 54, arabic: 'الْقَوِيُّ', transliteration: 'Al-Qawiyy', meaning: 'The Most Strong', benefit: 'The One with the complete Power' },
  { number: 55, arabic: 'الْمَتِينُ', transliteration: 'Al-Matin', meaning: 'The Firm', benefit: 'The One with extreme Power which is un-interrupted' },
  { number: 56, arabic: 'الْوَلِيُّ', transliteration: 'Al-Waliyy', meaning: 'The Protecting Friend', benefit: 'The Supporter' },
  { number: 57, arabic: 'الْحَمِيدُ', transliteration: 'Al-Hamid', meaning: 'The Praiseworthy', benefit: 'The praised One who deserves to be praised' },
  { number: 58, arabic: 'الْمُحْصِي', transliteration: 'Al-Muhsi', meaning: 'The Counter', benefit: 'The One who the count of things are known to him' },
  { number: 59, arabic: 'الْمُبْدِئُ', transliteration: 'Al-Mubdi', meaning: 'The Originator', benefit: 'The One who started the human being' },
  { number: 60, arabic: 'الْمُعِيدُ', transliteration: 'Al-Muid', meaning: 'The Restorer', benefit: 'The One who brings back the creatures after death' },
  { number: 61, arabic: 'الْمُحْيِي', transliteration: 'Al-Muhyi', meaning: 'The Giver of Life', benefit: 'The One who took out a living human from semen' },
  { number: 62, arabic: 'اَلْمُمِيتُ', transliteration: 'Al-Mumit', meaning: 'The Creator of Death', benefit: 'The One who renders the living dead' },
  { number: 63, arabic: 'الْحَيُّ', transliteration: 'Al-Hayy', meaning: 'The Ever Living', benefit: 'The One attributed with a life that befits His Majesty' },
  { number: 64, arabic: 'الْقَيُّومُ', transliteration: 'Al-Qayyum', meaning: 'The Self-Existing', benefit: 'The One who remains and does not end' },
  { number: 65, arabic: 'الْوَاجِدُ', transliteration: 'Al-Wajid', meaning: 'The Finder', benefit: 'The Rich who is never poor' },
  { number: 66, arabic: 'الْمَاجِدُ', transliteration: 'Al-Majid', meaning: 'The Noble', benefit: 'The One who is Majid' },
  { number: 67, arabic: 'الْواحِدُ', transliteration: 'Al-Wahid', meaning: 'The Unique', benefit: 'The One without a partner' },
  { number: 68, arabic: 'اَلاَحَدُ', transliteration: 'Al-Ahad', meaning: 'The One', benefit: 'The One without a partner' },
  { number: 69, arabic: 'الصَّمَدُ', transliteration: 'As-Samad', meaning: 'The Eternal', benefit: 'The Master who is relied upon in matters' },
  { number: 70, arabic: 'الْقَادِرُ', transliteration: 'Al-Qadir', meaning: 'The All-Powerful', benefit: 'The One attributed with Power' },
  { number: 71, arabic: 'الْمُقْتَدِرُ', transliteration: 'Al-Muqtadir', meaning: 'The Prevailing', benefit: 'The One with the perfect Power' },
  { number: 72, arabic: 'الْمُقَدِّمُ', transliteration: 'Al-Muqaddim', meaning: 'The Expediter', benefit: 'The One who puts things in their right places' },
  { number: 73, arabic: 'الْمُؤَخِّرُ', transliteration: 'Al-Muakhkhir', meaning: 'The Delayer', benefit: 'The One who puts things in their right places' },
  { number: 74, arabic: 'الأوَّلُ', transliteration: 'Al-Awwal', meaning: 'The First', benefit: 'The One whose Existence is without a beginning' },
  { number: 75, arabic: 'الآخِرُ', transliteration: 'Al-Akhir', meaning: 'The Last', benefit: 'The One whose Existence is without an end' },
  { number: 76, arabic: 'الظَّاهِرُ', transliteration: 'Az-Zahir', meaning: 'The Manifest', benefit: 'The One above Whom nothing exists' },
  { number: 77, arabic: 'الْبَاطِنُ', transliteration: 'Al-Batin', meaning: 'The Hidden', benefit: 'The One below Whom nothing exists' },
  { number: 78, arabic: 'الْوَالِي', transliteration: 'Al-Wali', meaning: 'The Governor', benefit: 'The One who owns things and manages them' },
  { number: 79, arabic: 'الْمُتَعَالِي', transliteration: 'Al-Mutaali', meaning: 'The Most Exalted', benefit: 'The One who is clear from the attributes of the creation' },
  { number: 80, arabic: 'الْبَرُّ', transliteration: 'Al-Barr', meaning: 'The Source of Goodness', benefit: 'The One who is kind to His creatures' },
  { number: 81, arabic: 'التَّوَّابُ', transliteration: 'At-Tawwab', meaning: 'The Ever-Returning', benefit: 'The One who grants repentance to whoever He willed' },
  { number: 82, arabic: 'الْمُنْتَقِمُ', transliteration: 'Al-Muntaqim', meaning: 'The Avenger', benefit: 'The One who victoriously prevails over His enemies' },
  { number: 83, arabic: 'العَفُوُّ', transliteration: 'Al-Afuww', meaning: 'The Pardoner', benefit: 'The One with wide forgiveness' },
  { number: 84, arabic: 'الرَّؤُوفُ', transliteration: 'Ar-Rauf', meaning: 'The Compassionate', benefit: 'The One with extreme Mercy' },
  { number: 85, arabic: 'مَالِكُ الْمُلْكِ', transliteration: 'Malik-ul-Mulk', meaning: 'Owner of All Sovereignty', benefit: 'The One who controls the Dominion' },
  { number: 86, arabic: 'ذُوالْجَلاَلِ وَالإكْرَامِ', transliteration: 'Dhul-Jalali-wal-Ikram', meaning: 'Lord of Majesty and Generosity', benefit: 'The One who deserves to be Exalted' },
  { number: 87, arabic: 'الْمُقْسِطُ', transliteration: 'Al-Muqsit', meaning: 'The Equitable', benefit: 'The One who is Just in His judgment' },
  { number: 88, arabic: 'الْجَامِعُ', transliteration: 'Al-Jami', meaning: 'The Gatherer', benefit: 'The One who gathers the creatures on a day there is no doubt about' },
  { number: 89, arabic: 'الْغَنِيُّ', transliteration: 'Al-Ghani', meaning: 'The Self-Sufficient', benefit: 'The One who does not need the creation' },
  { number: 90, arabic: 'الْمُغْنِي', transliteration: 'Al-Mughni', meaning: 'The Enricher', benefit: 'The One who satisfies the necessities of the creatures' },
  { number: 91, arabic: 'اَلْمَانِعُ', transliteration: 'Al-Mani', meaning: 'The Withholder', benefit: 'The Supporter who protects and gives victory to His pious believers' },
  { number: 92, arabic: 'الضَّارَّ', transliteration: 'Ad-Darr', meaning: 'The Distresser', benefit: 'The One who makes harm reach to whoever He willed' },
  { number: 93, arabic: 'النَّافِعُ', transliteration: 'An-Nafi', meaning: 'The Propitious', benefit: 'The One who gives benefits to whoever He willed' },
  { number: 94, arabic: 'النُّورُ', transliteration: 'An-Nur', meaning: 'The Light', benefit: 'The One who guides the believers to the right path' },
  { number: 95, arabic: 'الْهَادِي', transliteration: 'Al-Hadi', meaning: 'The Guide', benefit: 'The One who made His believers succeed in knowing the truth' },
  { number: 96, arabic: 'الْبَدِيعُ', transliteration: 'Al-Badi', meaning: 'The Incomparable', benefit: 'The One who created the creation and formed it without any preceding example' },
  { number: 97, arabic: 'اَلْبَاقِي', transliteration: 'Al-Baqi', meaning: 'The Ever-Enduring', benefit: 'The One for whom the state of non-existence is impossible' },
  { number: 98, arabic: 'الْوَارِثُ', transliteration: 'Al-Warith', meaning: 'The Inheritor', benefit: 'The One whose Existence remains' },
  { number: 99, arabic: 'الرَّشِيدُ', transliteration: 'Ar-Rashid', meaning: 'The Guide to the Right Path', benefit: 'The One who guides' },
];

const COLORS = [
  'bg-emerald-50 border-emerald-100 text-emerald-800',
  'bg-blue-50 border-blue-100 text-blue-800',
  'bg-purple-50 border-purple-100 text-purple-800',
  'bg-amber-50 border-amber-100 text-amber-800',
  'bg-rose-50 border-rose-100 text-rose-800',
  'bg-teal-50 border-teal-100 text-teal-800',
  'bg-indigo-50 border-indigo-100 text-indigo-800',
];

export default function NamesOfAllah() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('grid'); // grid or list

  const filtered = NAMES.filter(n =>
    n.transliteration.toLowerCase().includes(search.toLowerCase()) ||
    n.meaning.toLowerCase().includes(search.toLowerCase()) ||
    n.arabic.includes(search) ||
    n.number.toString().includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        {selected ? (
          <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white text-sm">← Back</button>
        ) : (
          <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        )}
        <h1 className="text-white font-medium">99 Names of Allah</h1>
      </header>

      {/* Detail view */}
      {selected && (
        <main className="max-w-lg mx-auto px-4 py-8">
          <div style={{ background: '#0a3d2e' }} className="rounded-2xl p-8 text-center mb-4">
            <p className="text-white/40 text-sm mb-2">Name #{selected.number}</p>
            <p className="font-arabic text-6xl mb-4" style={{ color: '#c8a96e' }}>{selected.arabic}</p>
            <p className="text-white text-2xl font-medium mb-1">{selected.transliteration}</p>
            <p className="text-white/60">{selected.meaning}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Meaning & Benefit</p>
            <p className="text-gray-700 leading-relaxed">{selected.benefit}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelected(NAMES[selected.number - 2] || null)}
              disabled={selected.number === 1}
              className="bg-white border border-gray-100 rounded-xl py-3 text-sm text-gray-600 hover:border-gray-300 disabled:opacity-30">
              ← Previous
            </button>
            <button
              onClick={() => setSelected(NAMES[selected.number] || null)}
              disabled={selected.number === 99}
              className="bg-white border border-gray-100 rounded-xl py-3 text-sm text-gray-600 hover:border-gray-300 disabled:opacity-30">
              Next →
            </button>
          </div>
        </main>
      )}

      {/* List view */}
      {!selected && (
        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* Banner */}
          <div style={{ background: '#0a3d2e' }} className="rounded-2xl p-5 mb-5 text-center">
            <p className="font-arabic text-2xl mb-1" style={{ color: '#c8a96e' }}>أَسْمَاءُ اللَّهِ الْحُسْنَى</p>
            <p className="text-white/70 text-sm">The 99 Beautiful Names of Allah</p>
            <p className="text-white/40 text-xs mt-1">Tap any name to learn more</p>
          </div>

          {/* Search & view toggle */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or meaning..."
                className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white" />
            </div>
            <button onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="bg-white border border-gray-200 rounded-xl px-4 text-sm text-gray-500 hover:bg-gray-50">
              {view === 'grid' ? '☰' : '⊞'}
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-3">{filtered.length} names</p>

          {/* Grid view */}
          {view === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((name, i) => (
                <button key={name.number} onClick={() => setSelected(name)}
                  className={`rounded-2xl border p-4 text-center hover:shadow-sm transition-all ${COLORS[i % COLORS.length]}`}>
                  <p className="text-xs opacity-50 mb-1">#{name.number}</p>
                  <p className="font-arabic text-3xl mb-2">{name.arabic}</p>
                  <p className="text-xs font-medium">{name.transliteration}</p>
                  <p className="text-xs opacity-60 mt-0.5 leading-snug">{name.meaning}</p>
                </button>
              ))}
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            <div className="space-y-2">
              {filtered.map((name, i) => (
                <button key={name.number} onClick={() => setSelected(name)}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-gray-300 transition-all text-left">
                  <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{name.number}</span>
                  <p className="font-arabic text-2xl text-gray-700 w-16 text-right flex-shrink-0">{name.arabic}</p>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{name.transliteration}</p>
                    <p className="text-xs text-gray-400">{name.meaning}</p>
                  </div>
                  <span className="text-gray-300 text-sm">›</span>
                </button>
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}