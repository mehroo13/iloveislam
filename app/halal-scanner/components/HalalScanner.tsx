"use client";

import { useState } from "react";
import BarcodeScanner from "./BarcodeScanner";
import ImageUploader from "./ImageUploader";
import ManualSearch from "./ManualSearch";
import ResultCard from "./ResultCard";
import IngredientBreakdown from "./IngredientBreakdown";
import ScanHistory from "./ScanHistory";
import ENumberChecker from "./ENumberChecker";
import { analyzeIngredients, type AnalysisResult } from "@/lib/analyzeIngredients";
import {
  checkHalalStatusWithApi,
  lookupProductByBarcode,
  type OpenFoodFactsProduct,
} from "@/lib/halalApis";

type ActiveTab = "barcode" | "image" | "manual" | "enumbers";

export default function HalalScanner() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("barcode");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [productData, setProductData] = useState<OpenFoodFactsProduct | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(true);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const processAnalysis = (
    productName: string,
    ingredientsSource: string | string[],
    product?: OpenFoodFactsProduct,
    imgUrl?: string
  ) => {
    const ingredientsList = Array.isArray(ingredientsSource)
      ? ingredientsSource.filter(Boolean)
      : ingredientsSource
          .split(/[,;]+/)
          .map((i) => i.trim())
          .filter(Boolean);

    const analysis = analyzeIngredients(ingredientsList);
    setAnalysisResult(analysis);
    if (product) setProductData(product);
    if (imgUrl) setImageUrl(imgUrl);
    setSaved(false);
    return analysis;
  };

  const handleBarcodeResult = async (barcode: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setProductData(null);
    setImageUrl(null);

    try {
      const lookupResult = await lookupProductByBarcode(barcode);
      if (!lookupResult.found || !lookupResult.product) {
        setError("Product not found in Open Food Facts database.");
        return false;
      }

      const product = lookupResult.product;
      const productName = product.product_name || product.product_name_en || "Unknown Product";
      const analysis = processAnalysis(productName, lookupResult.ingredients, product, product.image_front_url);
      setScannerActive(false);

      if (lookupResult.fallbackUsed) {
        setLookupNote('Product found using Open Food Facts fallback search.');
      } else if (analysis.verdict !== 'halal' || analysis.unknownIngredients.length > 0) {
        const apiResult = await checkHalalStatusWithApi(lookupResult.ingredients, productName);
        setLookupNote(apiResult.message);
      } else {
        setLookupNote(null);
      }

      return true;
    } catch (err) {
      setError("Failed to fetch product details.");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleImageIngredients = (ingredients: string[], imageUrl: string) => {
    setLookupNote(null);
    const ingredientsText = ingredients.join(", ");
    processAnalysis("Uploaded Product", ingredientsText, undefined, imageUrl);
  };

  const handleImageLoading = (isLoading: boolean) => setLoading(isLoading);

  const handleManualProduct = (product: OpenFoodFactsProduct, ingredients: string[]) => {
    const productName = product.product_name || "Unknown Product";
    const ingredientsText = ingredients.join(", ");
    processAnalysis(productName, ingredientsText, product, product.image_front_url);
  };

  const handleManualIngredients = (ingredients: string[]) => {
    setLookupNote(null);
    const ingredientsText = ingredients.join(", ");
    processAnalysis("Manual Entry", ingredientsText);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setProductData(null);
    setImageUrl(null);
    setError(null);
    setLookupNote(null);
    setScannerActive(true);
    setSaved(false);
  };

  const handleRetryScan = () => {
    setError(null);
    setLookupNote(null);
    if (!scannerActive) {
      setScannerActive(true);
    }
  };

  const handleSave = () => {
    if (!analysisResult) return;
    try {
      const history = JSON.parse(localStorage.getItem("halalScanHistory") || "[]");
      const newEntry = {
        productName: productData?.product_name || "Unknown",
        verdict: analysisResult.verdict,
        summary: analysisResult.summary,
        scannedAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...history].slice(0, 50);
      localStorage.setItem("halalScanHistory", JSON.stringify(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: "barcode", label: "Scan Barcode", icon: "📷" },
    { id: "image", label: "Upload Photo", icon: "🖼️" },
    { id: "manual", label: "Search / Paste", icon: "🔍" },
    { id: "enumbers", label: "E-Numbers", icon: "🔢" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2218] via-[#0d3326] to-[#0a2218] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 text-8xl font-arabic text-green-300 select-none">بسم</div>
          <div className="absolute top-2 right-8 text-6xl font-arabic text-green-300 select-none">الله</div>
        </div>
        <div className="relative z-10 text-center py-8 sm:py-10 px-4">
          <div className="inline-flex items-center gap-2 bg-green-800/30 border border-green-600/40 rounded-full px-4 py-1 text-green-300 text-sm mb-3 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            100% Free · No Login Required
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Halal<span className="text-green-400">Scan</span>
          </h1>
          <p className="text-green-200/70 text-base sm:text-lg max-w-xl mx-auto mb-4">
            Scan any product — know instantly if it&apos;s <span className="text-emerald-400 font-semibold">Halal</span>,{" "}
            <span className="text-red-400 font-semibold">Haram</span>, or{" "}
            <span className="text-amber-400 font-semibold">Mashbooh</span>
          </p>
          {/* Product categories supported */}
          <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
            {['🍔 Food', '💊 Medicine', '💄 Cosmetics', '🧴 Skincare', '🍼 Baby', '🥩 Meat'].map(cat => (
              <span key={cat} className="text-[10px] sm:text-xs bg-white/10 border border-white/15 rounded-full px-2.5 py-1 text-white/60">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-1.5 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                handleReset();
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

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          {activeTab === "barcode" && (
            <BarcodeScanner 
              onResult={handleBarcodeResult} 
              onError={(msg) => setError(msg)}
              isActive={scannerActive}
            />
          )}
          {activeTab === "image" && (
            <ImageUploader 
              onIngredients={handleImageIngredients}
              onLoading={handleImageLoading}
              isLoading={loading}
            />
          )}
          {activeTab === "manual" && (
            <ManualSearch 
              onProduct={handleManualProduct}
              onManualIngredients={handleManualIngredients}
              isLoading={loading}
            />
          )}
          {activeTab === "enumbers" && (
            <ENumberChecker />
          )}
        </div>

        {loading && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-green-600/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-green-400 rounded-full animate-spin"></div>
              </div>
              <p className="text-white font-semibold">Analysing Product…</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-red-300 font-semibold">Could Not Analyse</p>
                <p className="text-red-200/70 text-sm mt-1">{error}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRetryScan}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all"
              >
                ↻ Try Again
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all"
              >
                ✕ Reset
              </button>
            </div>
          </div>
        )}

        {lookupNote && !loading && (
          <div className="bg-yellow-900/15 border border-amber-500/20 rounded-2xl p-4 text-amber-100 text-sm">
            {lookupNote}
          </div>
        )}

        {analysisResult && !loading && (
          <ResultCard
            result={analysisResult}
            product={productData || undefined}
            imageUrl={imageUrl || undefined}
            onReset={handleReset}
            onSave={handleSave}
            saved={saved}
          />
        )}

        {analysisResult && analysisResult.ingredientResults.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <IngredientBreakdown results={analysisResult.ingredientResults} />
          </div>
        )}

        <ScanHistory />

        <p className="text-center text-green-200/30 text-xs px-4">
          HalalScan uses open food databases. Always verify with trusted scholars for important decisions.
        </p>
      </div>
    </div>
  );
}