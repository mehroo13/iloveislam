import type { Metadata } from "next";
import HalalScanner from "./components/HalalScanner";

export const metadata: Metadata = {
  title: "HalalScan — Free Halal Food Scanner | I Love Islam",
  description:
    "Scan any product barcode, QR code, or upload a photo to instantly find out if it's Halal, Haram, or Mashbooh. Free Islamic food scanner with ingredient-by-ingredient analysis.",
  keywords: [
    "halal scanner",
    "halal food checker",
    "haram ingredients",
    "halal barcode scanner",
    "is it halal",
    "mashbooh",
    "E numbers halal",
    "halal product checker",
    "Islamic food guide",
  ],
  openGraph: {
    title: "HalalScan — Free Halal Food Scanner",
    description:
      "Scan barcodes, QR codes, or upload product photos to instantly check if a product is Halal, Haram, or Mashbooh.",
    url: "https://www.iloveislam.life/halal-scanner",
    siteName: "I Love Islam",
    type: "website",
  },
};

export default function HalalScannerPage() {
  return (
    <>
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
      </section>
    </>
  );
}