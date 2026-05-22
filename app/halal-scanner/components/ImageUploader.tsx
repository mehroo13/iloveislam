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
  const [progress, setProgress] = useState<number>(0);

  // Image preprocessing for better OCR
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      img.onload = () => {
        let { width, height } = img;
        const maxWidth = 1200;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Grayscale + contrast enhancement
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
          const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.45 + 128));
          data[i] = data[i + 1] = data[i + 2] = contrast;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError('Image is too large (max 12MB)');
      return;
    }

    setError(null);
    setProgress(0);
    onLoading(true);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);

    try {
      const processedUrl = await preprocessImage(file);

      const result = await Tesseract.recognize(processedUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 95)); // leave 5% for final processing
          }
        },
        // These are the only options safely allowed in recognize()
        tessedit_ocr_engine_mode: 1,           // OEM_TESSERACT_ONLY
        preserve_interword_spaces: '1',
      } as any); // Temporary type assertion to bypass strict typing

      console.log('Raw OCR Output:', result.data.text);

      const ingredients = parseIngredients(result.data.text);

      onIngredients(ingredients, imageUrl);
    } catch (err) {
      console.error(err);
      setError('Failed to extract text. Please try a clearer photo.');
      onLoading(false);
    }
  }, [onIngredients, onLoading]);

  // Stronger ingredient parsing
  const parseIngredients = (text: string): string[] => {
    if (!text?.trim()) {
      return ['Could not detect any text. Try a clearer image.'];
    }

    const lower = text.toLowerCase();
    let ingredientsText = '';

    // Better pattern matching
    const matches = [
      lower.match(/ingredients[:\s]+(.+?)(?=nutrition|allergen|contains|storage|directions|\n\n|$)/is),
      lower.match(/ingr[ée]dients?[:\s]+(.+?)(?=\n\n|\n[A-Z]{4,})/is),
      lower.match(/contains[:\s]+(.+?)(?=\n\n|\n[A-Z])/is),
    ].filter(Boolean);

    if (matches[0] && matches[0][1]) {
      ingredientsText = matches[0][1];
    } else {
      ingredientsText = text;
    }

    let ingredients = ingredientsText
      .split(/[,;•\n]+/)
      .map(i => i.trim())
      .filter(i => i.length > 2);

    const noiseWords = [
      'nutrition', 'facts', 'information', 'distributed', 'manufactured',
      'storage', 'keep', 'refrigerate', 'allergen', 'warning', 'net weight',
      'serving', 'calories', 'protein', 'fat', 'carbs', 'sodium', 'energy'
    ];

    ingredients = ingredients
      .filter(item => {
        const lowerItem = item.toLowerCase();
        return !noiseWords.some(noise => lowerItem.includes(noise)) &&
               !/^\d+(\.\d+)?[gml]+/.test(lowerItem); // remove "500g", "250ml" etc.
      })
      .map(item => item.replace(/^\W+|\W+$/g, ''));

    // Remove duplicates and very short items
    ingredients = [...new Set(ingredients)].filter(i => i.length > 3);

    return ingredients.length > 3 
      ? ingredients 
      : ['No clear ingredients list found. Please try again or enter manually.'];
  };

  // Rest of your handlers (unchanged)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
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
                <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white font-medium">Scanning label...</p>
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
            <p className="text-xl font-semibold text-emerald-800 dark:text-emerald-100 mb-2">
              Scan Product Label
            </p>
            <p className="text-emerald-600 dark:text-emerald-400">Clear photo of ingredients list</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="mt-5 text-xs text-amber-600 dark:text-amber-500">
        <p className="font-semibold mb-1">💡 Best Results Tips:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Good lighting, no glare</li>
          <li>Ingredients list should be straight and fill most of the frame</li>
          <li>Avoid blurry or angled photos</li>
        </ul>
      </div>
    </div>
  );
}