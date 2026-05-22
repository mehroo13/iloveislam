'use client';

// app/halal-scanner/components/ImageUploader.tsx
// Optimized OCR with preprocessing: fast, automatic, no user editing

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

  // Preprocess image for better OCR (grayscale + threshold)
  const preprocessImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context failed');
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert to grayscale and apply adaptive threshold
        for (let i = 0; i < data.length; i += 4) {
          const brightness = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
          const threshold = 140;
          const value = brightness > threshold ? 255 : 0;
          data[i] = value;     // R
          data[i+1] = value;   // G
          data[i+2] = value;   // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject('Canvas to blob failed');
        }, 'image/png');
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const processImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image too large (max 10MB)');
        return;
      }

      setError(null);
      onLoading(true);
      setProgress(0);
      setPreview(URL.createObjectURL(file));

      try {
        // 1. Preprocess for better OCR
        const processedBlob = await preprocessImage(file);
        
        // 2. Run Tesseract with FAST model
        const worker = await Tesseract.createWorker();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        
        // Use fast, single-block mode for speed
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,;() -',
        });
        
        // Progress callback
        worker.setLogger((m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        });
        
        const { data: { text } } = await worker.recognize(processedBlob);
        await worker.terminate();
        
        // 3. Parse ingredients from extracted text
        let ingredients = parseIngredientsFromText(text);
        
        if (ingredients.length === 0) {
          throw new Error('No ingredients found');
        }
        
        const imageUrl = preview || URL.createObjectURL(file);
        onIngredients(ingredients, imageUrl);
      } catch (err) {
        console.error(err);
        setError('Could not extract ingredients. Please ensure the photo is clear and well-lit, or try manual entry.');
        onLoading(false);
      }
    },
    [onIngredients, onLoading, preview]
  );

  // Intelligent ingredient parsing
  const parseIngredientsFromText = (rawText: string): string[] => {
    let text = rawText.toLowerCase();
    
    // Find "ingredients:" section
    let startIdx = text.search(/ingredients?[:;]/i);
    if (startIdx !== -1) {
      text = text.substring(startIdx + 12);
    }
    
    // Stop at common boundaries
    const endMarkers = ['nutrition', 'allergy', 'contains', 'may contain', 'distributed by', 'net wt', 'serving'];
    for (const marker of endMarkers) {
      const endIdx = text.search(marker);
      if (endIdx !== -1) {
        text = text.substring(0, endIdx);
        break;
      }
    }
    
    // Split by commas, semicolons, or newlines
    let candidates = text.split(/[,;\n]+/);
    
    // Clean each candidate
    const cleaned = candidates
      .map(s => s.trim()
        .replace(/^\d+%?\s*/, '')  // remove leading percentages
        .replace(/\([^)]*\)/g, '')  // remove parentheses content
        .replace(/[^\w\s-]/g, '')   // remove stray punctuation
        .trim()
      )
      .filter(s => s.length > 1 && s.length < 50) // reasonable length
      .filter(s => !/^[0-9]+$/.test(s)) // not just numbers
      .filter(s => !/(^|\s)(ingredients|contains|allergy|nutrition|serving|distributed|net\s?wt)/i.test(s));
    
    // Remove near duplicates (case insensitive)
    const unique = [];
    for (const item of cleaned) {
      if (!unique.some(u => u.toLowerCase() === item.toLowerCase())) {
        unique.push(item);
      }
    }
    
    return unique.slice(0, 30); // limit to 30 ingredients
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
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) processImage(file);
    }
  };

  return (
    <div className="w-full" onPaste={handlePaste}>
      <div
        onClick={() => !isLoading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        className={`
          relative w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
          ${dragOver
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 hover:bg-emerald-50/50'
          }
          ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
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
            <img
              src={preview}
              alt="Product label"
              className="w-full max-h-64 object-contain rounded-2xl"
            />
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl">
                <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-white text-sm font-semibold">Reading ingredients...</p>
                <p className="text-white/70 text-xs mt-1">{progress}%</p>
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
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="text-5xl mb-4">📸</div>
            <p className="text-emerald-800 dark:text-emerald-200 font-semibold text-lg mb-1">
              Take a photo of the ingredients list
            </p>
            <p className="text-emerald-600/70 dark:text-emerald-400/70 text-sm mb-4">
              Snap, wait 3–5 seconds, get halal verdict
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">📱 Camera</span>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">🖼️ Gallery</span>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">📋 Paste</span>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">🖱️ Drag</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-600 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 rounded-xl">
        <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold">💡 For best results:</p>
        <ul className="text-amber-600 dark:text-amber-500 text-xs list-disc list-inside mt-1">
          <li>Hold camera steady and get close to the ingredients list</li>
          <li>Ensure good lighting and minimal glare</li>
          <li>Make sure the text is clearly readable</li>
        </ul>
      </div>
    </div>
  );
}