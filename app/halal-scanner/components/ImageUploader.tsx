'use client';

import { useRef, useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';

interface ImageUploaderProps {
  onIngredients: (ingredients: string[], imageUrl: string) => void;
  onLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export default function ImageUploader({ onIngredients, onLoading, isLoading }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Manual entry state
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');

  // Preprocessing
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return reject('Canvas error');

        let { width, height } = img;
        const maxWidth = 900;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.filter = 'grayscale(100%) contrast(160%) brightness(115%)';
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i];
          const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
          data[i] = data[i + 1] = data[i + 2] = contrast;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject('Image load failed');
      img.src = URL.createObjectURL(file);
    });
  };

  const parseIngredientsFromText = (rawText: string): string[] => {
    if (!rawText?.trim()) return [];

    let text = rawText.toLowerCase();

    // Fixed regex - compatible with older TypeScript targets
    const match = text.match(/ingredients?[:\s]*([\s\S]+?)(?=nutrition|allergen|contains|storage|directions|net weight|\n\n|$)/i);
    
    if (match?.[1]) {
      text = match[1];
    }

    const items = text
      .split(/[,;•\n]+/)
      .map(s => s.trim()
        .replace(/^\d+%?\s*/, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/[^\w\s&-]/g, ' ')
        .trim()
      )
      .filter(s => s.length > 2 && s.length < 60)
      .filter(s => !/^[0-9\s%]+$/.test(s))
      .filter(s => !/(nutrition|allergy|contains|distributed|net weight|serving|calories|protein|fat)/i.test(s));

    return [...new Set(items)].slice(0, 35);
  };

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a photo of the ingredients list.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Image too large (max 12MB). Try a smaller photo.');
      return;
    }

    setError(null);
    setProgress(5);
    onLoading(true);

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setShowManualInput(false);

    try {
      const processedUrl = await preprocessImage(file);
      setProgress(20);

      const worker: any = await (Tesseract.createWorker as any)({
        logger: (m: any) => {
          if (m.status === 'loading language') {
            setProgress(30);
          }
          if (m.status === 'recognizing text') {
            setProgress(Math.min(95, 30 + Math.round(m.progress * 65)));
          }
        },
      });

      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      await worker.setParameters({
        tessedit_ocr_engine_mode: '1',
        preserve_interword_spaces: '1',
      });

      const { data: { text } } = await worker.recognize(processedUrl);
      await worker.terminate();
      setProgress(100);

      const ingredients = parseIngredientsFromText(text);

      if (ingredients.length === 0) {
        throw new Error('No ingredients found');
      }

      onIngredients(ingredients, previewUrl);
    } catch (err) {
      console.error(err);
      setError('Could not read ingredients clearly. Try another photo or enter ingredients manually.');
      onLoading(false);
      setProgress(0);
    }
  }, [onIngredients, onLoading]);

  const handleManualSubmit = () => {
    if (!manualText.trim()) {
      setError('Please enter some ingredients');
      return;
    }

    const ingredients = parseIngredientsFromText(manualText);
    
    if (ingredients.length === 0) {
      setError('No valid ingredients found. Please check your input.');
      return;
    }

    onIngredients(ingredients, 'manual-entry');
    setShowManualInput(false);
    setManualText('');
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) processImage(file);
    }
  };

  return (
    <div className="w-full" onPaste={handlePaste}>
      {!showManualInput && (
        <div
          onClick={() => !isLoading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          className={`relative w-full rounded-3xl border-2 border-dashed cursor-pointer transition-all
            ${dragOver ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400'}
            ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />

          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full max-h-80 object-contain rounded-3xl" />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent animate-spin mb-4" />
                  <p className="text-white font-medium">Reading ingredients...</p>
                  <p className="text-emerald-300 text-sm mt-1">{progress}%</p>
                </div>
              )}
              {!isLoading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    setError(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white w-9 h-9 rounded-full flex items-center justify-center text-xl"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="text-6xl mb-6">📸</div>
              <p className="text-xl font-semibold mb-2">Scan Product Label</p>
              <p className="text-emerald-600 dark:text-emerald-400 mb-6">Clear photo of ingredients list</p>
              
              <button
                onClick={(e) => { e.stopPropagation(); setShowManualInput(true); }}
                className="mt-4 px-5 py-2.5 text-sm font-medium border border-emerald-300 dark:border-emerald-700 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition-colors"
              >
                ✍️ Enter Ingredients Manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Input */}
      {showManualInput && (
        <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-700 rounded-3xl p-6">
          <h3 className="font-semibold text-lg mb-4">Enter Ingredients Manually</h3>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Paste or type ingredients here...&#10;Example: Water, Sugar, Palm Oil, Salt, Natural Flavours..."
            className="w-full h-48 p-4 border border-gray-300 dark:border-zinc-700 rounded-2xl resize-y focus:outline-none focus:border-emerald-500 font-mono text-sm"
          />
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleManualSubmit}
              disabled={!manualText.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white py-3 rounded-2xl font-medium transition-colors"
            >
              Process Ingredients
            </button>
            <button
              onClick={() => {
                setShowManualInput(false);
                setManualText('');
                setError(null);
              }}
              className="px-6 border border-gray-300 dark:border-zinc-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      <div className="mt-5 text-xs text-amber-600 dark:text-amber-500">
        <p className="font-semibold mb-1">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Good lighting and no glare for best OCR results</li>
          <li>Keep the label straight and close to the camera</li>
          <li>Use manual entry when the text is blurry, curved, or cut off</li>
        </ul>
      </div>
    </div>
  );
}