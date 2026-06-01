import Link from 'next/link';
import HalalScanner from "./components/HalalScanner";

export default function HalalScannerPage() {
  return (
    <>
      <nav aria-label="Breadcrumb" className="max-w-3xl mx-auto px-4 py-3 text-sm text-gray-600">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/" className="hover:underline">Tools</Link>
        <span className="mx-2">›</span>
        <span className="font-semibold text-gray-900">Halal Scanner</span>
      </nav>
      <div className="sr-only">
        <p>Halal Scanner checks whether food products are Halal, Haram, or Mashbooh by analyzing barcodes, QR codes, and ingredient lists. It highlights problematic additives and helps Muslim shoppers avoid doubtful food items.</p>
        <p>The tool is free, works without registration, and makes it faster to evaluate product labels using a trusted Halal ingredient database. It is designed for everyday groceries, medicines, cosmetics, and ingredients that may contain hidden Haram sources.</p>
      </div>
      <HalalScanner />
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">About HalalScan — Your Free Halal Food Checker</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            HalalScan is a free, instant food product scanner that helps Muslims determine whether a product is Halal (permissible), Haram (prohibited), or Mashbooh (doubtful) according to Islamic dietary guidelines. Simply scan a product barcode, QR code, or upload a photo of the ingredients list, and our tool will analyze each ingredient individually to give you a clear verdict with detailed explanations.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Eating Halal is a fundamental obligation for every Muslim. Allah commands in the Quran: &quot;O mankind, eat from whatever is on earth that is lawful and good&quot; (Quran 2:168) and &quot;O you who have believed, eat from the good things which We have provided for you and be grateful to Allah if it is Him that you worship&quot; (Quran 2:172). With thousands of processed food products containing complex ingredients, it can be challenging to determine what is truly Halal without expert knowledge.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our scanner identifies common problematic ingredients including gelatin (which may be pork-derived), alcohol-based flavourings, E-numbers with animal origins, carmine (E120), L-cysteine (E920), and many other additives that may be derived from non-Halal sources. Each flagged ingredient comes with an explanation of why it may be problematic and what alternatives exist.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">How to Use HalalScan</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Method 1 — Barcode Scanning:</strong> Point your device camera at the product barcode. The scanner will read the barcode and look up the product in food databases to retrieve its ingredient list for analysis.</p>
            <p><strong className="text-gray-800">Method 2 — Photo Upload:</strong> Take a photo of the product&apos;s ingredients list or upload an existing image. Our OCR (Optical Character Recognition) technology will extract the text and analyze each ingredient.</p>
            <p><strong className="text-gray-800">Method 3 — Manual Entry:</strong> Type or paste the ingredients list directly if you prefer. The tool will parse and check each ingredient against our comprehensive database.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Understanding Halal, Haram, and Mashbooh</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Halal (حلال):</strong> Permissible according to Islamic law. This includes all plant-based ingredients, properly slaughtered meat, fish, eggs, milk, and additives from permissible sources. A product is Halal when all its ingredients are confirmed permissible.</p>
            <p><strong className="text-gray-800">Haram (حرام):</strong> Prohibited in Islam. This includes pork and all its derivatives, alcohol, blood, meat from animals not slaughtered according to Islamic rites, and any ingredient derived from these sources. Even trace amounts of Haram ingredients make a product impermissible.</p>
            <p><strong className="text-gray-800">Mashbooh (مشبوه):</strong> Doubtful or questionable. These are ingredients that could be derived from either Halal or Haram sources, and the exact source is unclear. Examples include certain E-numbers, &quot;natural flavours,&quot; and emulsifiers. The Prophet (peace be upon him) advised: &quot;Leave that which makes you doubt for that which does not make you doubt&quot; (Tirmidhi).</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Important Notes</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• This tool provides guidance based on ingredient analysis — it is not a certification</li>
            <li>• Always look for official Halal certification logos on products when available</li>
            <li>• Some ingredients (like &quot;natural flavours&quot;) cannot be fully verified without contacting the manufacturer</li>
            <li>• When in doubt, the Islamic principle is to avoid the doubtful (Mashbooh) items</li>
            <li>• The tool works entirely in your browser — no images or data are sent to external servers</li>
            <li>• For specific dietary rulings, consult a qualified Islamic scholar familiar with food science</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Common Hidden Haram Ingredients</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Many processed foods contain ingredients derived from non-Halal sources that are not immediately obvious from their names. Here are the most common ones to watch for:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="font-bold text-red-700 mb-1">❌ Gelatin (E441)</p>
              <p className="text-red-600 text-xs">Usually from pork skin/bones. Look for &quot;halal gelatin&quot; or plant alternatives like agar (E406) or pectin (E440).</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="font-bold text-red-700 mb-1">❌ Carmine (E120)</p>
              <p className="text-red-600 text-xs">Red dye from crushed insects. Found in sweets, yoghurts, and cosmetics. Alternative: beetroot red (E162).</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="font-bold text-red-700 mb-1">❌ L-Cysteine (E920)</p>
              <p className="text-red-600 text-xs">Often from human hair or pig bristles. Used in bread. Synthetic versions exist but source must be verified.</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="font-bold text-amber-700 mb-1">⚠️ E471 (Mono/Diglycerides)</p>
              <p className="text-amber-600 text-xs">Can be from animal fat or vegetable oil. Very common in bread, cakes, and margarine. Always verify source.</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="font-bold text-amber-700 mb-1">⚠️ Whey / Rennet</p>
              <p className="text-amber-600 text-xs">Rennet in cheese can be from calf stomach (mashbooh) or microbial (halal). Check if vegetarian rennet is used.</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="font-bold text-amber-700 mb-1">⚠️ Natural Flavours</p>
              <p className="text-amber-600 text-xs">Can be from any source including animal. Impossible to verify without contacting manufacturer.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              { q: 'Is this tool a replacement for Halal certification?', a: 'No. HalalScan is an educational screening tool that helps you identify potentially problematic ingredients. For definitive rulings, always look for official Halal certification from recognized bodies (JAKIM, IFANCA, HMC, etc.) and consult qualified scholars.' },
              { q: 'How accurate is the barcode scanner?', a: 'The barcode scanner looks up products in the Open Food Facts database, which contains millions of products worldwide. If a product is in the database, we analyze its full ingredient list. Accuracy depends on the completeness of the database entry.' },
              { q: 'What does "Mashbooh" mean exactly?', a: 'Mashbooh means "doubtful" or "suspicious." It applies to ingredients that could be from either Halal or Haram sources, but the exact origin is unclear. The Prophet (ﷺ) advised avoiding doubtful matters: "Leave that which makes you doubt for that which does not make you doubt" (Tirmidhi).' },
              { q: 'Is E471 always Haram?', a: 'Not necessarily. E471 (mono and diglycerides of fatty acids) can be derived from vegetable oil (halal) or animal fat (potentially haram). Without knowing the specific source, it is classified as Mashbooh. Products with halal certification that contain E471 have verified it comes from plant sources.' },
              { q: 'Are all E-numbers bad?', a: 'No! Most E-numbers are perfectly halal. E-numbers are simply a European classification system for food additives. Many are plant-derived or synthetic (like E330 citric acid, E300 vitamin C). Only a small number are problematic — mainly those derived from animals or alcohol.' },
              { q: 'Can I use this for medicine and cosmetics?', a: 'Yes! Our database includes ingredients commonly found in medicines, supplements, cosmetics, and skincare products. The same principles apply — check for animal-derived ingredients like gelatin capsules, stearic acid, and carmine in lipsticks.' },
              { q: 'Is vanilla extract Haram?', a: 'Pure vanilla extract contains alcohol as a solvent (typically 35%). Scholars differ on this: some consider trace amounts in food permissible (as it evaporates during cooking), while others recommend avoiding it. Vanilla flavouring (without alcohol) or vanilla powder are safer alternatives.' },
              { q: 'What about enzymes in cheese?', a: 'Animal rennet (from calf stomach) is Mashbooh unless from a halal-slaughtered animal. Microbial rennet and vegetarian rennet are halal. Look for "suitable for vegetarians" on cheese labels as a quick indicator.' },
              { q: 'Does the tool work offline?', a: 'The manual ingredient entry and E-number checker work offline once the page is loaded. Barcode scanning and product search require an internet connection to look up product databases.' },
              { q: 'Is my data private?', a: 'Yes, completely. All analysis happens in your browser. No images, ingredients, or scan results are sent to our servers. Your scan history is stored only in your browser\'s local storage.' },
              { q: 'What madhab does this tool follow?', a: 'Our database reflects the majority scholarly position across all four Sunni madhabs (Hanafi, Maliki, Shafi\'i, Hanbali). Where there are differences of opinion (like on shellac E904 or vanilla extract), we note the different positions and classify the ingredient as Mashbooh.' },
            ].map((faq, i) => (
              <details key={i} className="group border border-gray-100 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-800 text-sm pr-4">{faq.q}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0">▾</span>
                </summary>
                <div className="px-4 pb-4 pt-0">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Related Tools for Muslim Daily Life</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <Link href="/prayer-times" className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-slate-900 hover:bg-slate-100">Prayer Times</Link>
            <Link href="/zakat" className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-slate-900 hover:bg-slate-100">Zakat Calculator</Link>
            <Link href="/dua" className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-slate-900 hover:bg-slate-100">Dua Guide</Link>
          </div>
        </div>
      </section>
    </>
  );
}