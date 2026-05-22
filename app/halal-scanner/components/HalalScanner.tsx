"use client";

import { useState } from "react";
import BarcodeScanner from "./BarcodeScanner";
import ImageUploader from "./ImageUploader";
import ManualSearch from "./ManualSearch";
import ResultCard from "./ResultCard";
import IngredientBreakdown from "./IngredientBreakdown";
import ScanHistory from "./ScanHistory";
import { analyzeIngredients } from "@/lib/analyzeIngredients";
import { lookupByBarcode } from "@/lib/openFoodFacts";

export type ScanResult = {
  productName: string;
  verdict: "halal" | "haram" | "mashbooh" | "unknown";
  confidence: number;
  ingredients: {
    name: string;
    status: "halal" | "haram" | "mashbooh" | "unknown";
    reason?: string;
  }[];
  certifications?: string[];
  notes?: string;
  scannedAt: string;
};

type ActiveTab = "barcode" | "image" | "manual";

export default function HalalScanner() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("barcode");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const confidenceToNumber = (c: "high" | "medium" | "low"): number => {
    if (c === "high") return 95;
    if (c === "medium") return 70;
    return 40;
  };

  const handleBarcodeScan = async (barcode: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const product = await lookupByBarcode(barcode);
      if (!product || !product.found) {
        setError("Product not found in database. Try uploading a photo of the label.");
        return;
      }
      const productName = product.product?.product_name || "Unknown Product";
      const analysis = analyzeIngredients(product.ingredients, []);
      const scanResult: ScanResult = {
        productName,
        verdict: analysis.verdict ?? "unknown",
        confidence: confidenceToNumber(analysis.confidence),
        ingredients: analysis.ingredientResults.map((r) => ({
          name: r.original,
          status: r.status ?? "unknown",
          reason: r.matched?.reason,
        })),
        certifications: analysis.certifications ?? [],
        notes: analysis.summary,
        scannedAt: new Date().toISOString(),
      };
      setResult(scanResult);
      saveToHistory(scanResult);
    } catch (err) {
      setError("Failed to analyse product. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageScan = async (ingredientsText: string, productName?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const ingredientsList = ingredientsText.split(",").map((s) => s.trim()).filter(Boolean);
      const analysis = analyzeIngredients(ingredientsList, []);
      const scanResult: ScanResult = {
        productName: productName || "Scanned Product",
        verdict: analysis.verdict ?? "unknown",
        confidence: confidenceToNumber(analysis.confidence),
        ingredients: analysis.ingredientResults.map((r) => ({
          name: r.original,
          status: r.status ?? "unknown",
          reason: r.matched?.reason,
        })),
        notes: analysis.summary,
        scannedAt: new Date().toISOString(),
      };
      setResult(scanResult);
      saveToHistory(scanResult);
    } catch (err) {
      setError("Failed to analyse the image. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const ingredientsList = query.split(",").map((s) => s.trim()).filter(Boolean);
      const analysis = analyzeIngredients(ingredientsList, []);
      const scanResult: ScanResult = {
        productName: query,
        verdict: analysis.verdict ?? "unknown",
        confidence: confidenceToNumber(analysis.confidence),
        ingredients: analysis.ingredientResults.map((r) => ({
          name: r.original,
          status: r.status ?? "unknown",
          reason: r.matched?.reason,
        })),
        notes: analysis.summary,
        scannedAt: new Date().toISOString(),
      };
      setResult(scanResult);
      saveToHistory(scanResult);
    } catch (err) {
      setError("Search failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = (scanResult: ScanResult) => {
    try {
      const existing = JSON.parse(localStorage.getItem("halalScanHistory") || "[]");
      const updated = [scanResult, ...existing].slice(0, 50);
      localStorage.setItem("halalScanHistory", JSON.stringify(updated));
    } catch {
      // localStorage may not be available
    }
  };

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: "barcode", label: "Scan Barcode / QR", icon: "📷" },
    { id: "image", label: "Upload Photo", icon: "🖼️" },
    { id: "manual", label: "Search Manually", icon: "🔍" },
  ];

  const verdictBg = {
    halal: "bg-emerald-50 border-emerald-200",
    haram: "bg-red-50 border-red-200",
    mashbooh: "bg-amber-50 border-amber-200",
    unknown: "bg-slate-50 border-slate-200",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2218] via-[#0d3326] to-[#0a2218] text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 text-8xl font-arabic text-green-300 select-none">بسم</div>
          <div className="absolute top-2 right-8 text-6xl font-arabic text-green-300 select-none">الله</div>
        </div>
        <div className="relative z-10 text-center py-10 px-4">
          <div className="inline-flex items-center gap-2 bg-green-800/30 border border-green-600/40 rounded-full px-4 py-1 text-green-300 text-sm mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            100% Free · No Login Required
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Halal<span className="text-green-400">Scan</span>
          </h1>
          <p className="text-green-200/70 text-lg max-w-xl mx-auto">
            Scan any product — know instantly if it&apos;s <span className="text-emerald-400 font-semibold">Halal</span>,{" "}
            <span className="text-red-400 font-semibold">Haram</span>, or{" "}
            <span className="text-amber-400 font-semibold">Mashbooh</span>
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-6">
        {/* Tab Switcher */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-1.5 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setResult(null);
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-green-600 text-white shadow-lg shadow-green-900/40"
                  : "text-green-200/60 hover:text-green-200 hover:bg-white/5"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active Scanner Panel */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          {activeTab === "barcode" && (
            <BarcodeScanner onScan={handleBarcodeScan} loading={loading} />
          )}
          {activeTab === "image" && (
            <ImageUploader onScan={handleImageScan} loading={loading} />
          )}
          {activeTab === "manual" && (
            <ManualSearch onSearch={handleManualSearch} loading={loading} />
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-green-600/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-green-400 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-transparent border-t-green-600 rounded-full animate-spin animation-delay-150"></div>
              </div>
              <div>
                <p className="text-white font-semibold">Analysing Product…</p>
                <p className="text-green-200/50 text-sm mt-1">Checking halal database & AI analysis</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-red-300 font-semibold">Could Not Analyse</p>
              <p className="text-red-200/70 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-6 ${verdictBg[result.verdict]}`}>
              <ResultCard result={result} />
            </div>

            {result.ingredients.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <IngredientBreakdown ingredients={result.ingredients} />
              </div>
            )}

            <button
              onClick={() => {
                const text = `HalalScan Result for "${result.productName}": ${result.verdict.toUpperCase()} — checked on iloveislam.life/halal-scanner`;
                if (navigator.share) {
                  navigator.share({ title: "HalalScan Result", text });
                } else {
                  navigator.clipboard.writeText(text);
                  alert("Result copied to clipboard!");
                }
              }}
              className="w-full py-3 rounded-xl bg-green-700/30 border border-green-600/30 text-green-300 hover:bg-green-700/50 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              📤 Share Result
            </button>
          </div>
        )}

        {/* History Toggle */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-green-200/70 hover:text-green-200 hover:bg-white/10 transition-all text-sm font-medium flex items-center justify-center gap-2"
          >
            🕐 {showHistory ? "Hide" : "View"} Scan History
          </button>
          {showHistory && (
            <div className="mt-3">
              <ScanHistory />
            </div>
          )}
        </div>

        <p className="text-center text-green-200/30 text-xs px-4">
          HalalScan uses AI and open food databases for analysis. Always verify with a certified Islamic scholar or halal certification body for critical decisions. Results are for guidance only.
        </p>
      </div>
    </div>
  );
}