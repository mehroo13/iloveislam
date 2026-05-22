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

  // Preprocess image for better OCR (contrast + grayscale)
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      img.onload = () => {
        // Resize for faster OCR while keeping readability
        const maxWidth = 1200;
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Get image data for enhancement
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Enhance contrast + convert to grayscale with sharpening
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
          const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128)); // strong contrast

          data[i] = data[i + 1] = data[i + 2] = contrast;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
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
      setError('Image too large. Max 12MB recommended.');
      return;
    }

    setError(null);
    setProgress(0);
    onLoading(true);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);

    try {
      const processedImageUrl = await preprocessImage(file);

      const result = await Tesseract.recognize(processedImageUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
          console.log(m);
        },
        // Optimized settings for product labels
        tessedit_pageseg_mode: '6',        // Assume uniform block of text
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;()/-% ',
        preserve_interword_spaces: '1',
      });

      console.log('Raw OCR:', result.data.text);

      const ingredients = parseIngredients(result.data.text);

      onIngredients(ingredients, imageUrl);
    } catch (err) {
      console.error(err);
      setError('Failed to read text. Try a clearer, well-lit photo.');
      onLoading(false);
    }
  }, [onIngredients, onLoading]);

  // Improved parsing logic
  const parseIngredients = (text: string): string[] => {
    if (!text || text.trim().length < 10) {
      return ['Could not extract ingredients. Please try again or enter manually.'];
    }

    const lowerText = text.toLowerCase();
    let ingredientsPart = '';

    // Multiple strategies to find ingredients
    const patterns = [
      /ingredients[:\s]*(.+?)(?=\n\n|\n[A-Z][A-Z]|nutrition|allergen|contains|storage|directions)/is,
      /ingr[ée]dients?[:\s]*(.+?)(?=\n\n|\n[A-Z]{3,})/is,
      /contains[:\s]*(.+?)(?=\n\n|\n[A-Z])/is,
    ];

    for (const pattern of patterns) {
      const match = lowerText.match(pattern);
      if (match && match[1]) {
        ingredientsPart = match[1];
        break;
      }
    }

    // Fallback: whole text
    if (!ingredientsPart) ingredientsPart = text;

    let ingredients = ingredientsPart
      .split(/[,;•\n]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 2);

    // Clean noise
    const noise = [
      'nutrition', 'facts', 'information', 'distributed', 'manufactured',
      'storage', 'keep', 'refrigerate', 'allergen', 'warning', 'net weight',
      'serving size', 'calories', 'protein', 'carbohydrate', 'fat', 'sodium'
    ];

    ingredients = ingredients
      .filter((item) => {
        const lower = item.toLowerCase();
        return !noise.some((n) => lower.includes(n)) && 
               !/^\d/.test(lower) && // remove lines starting with numbers
               item.length > 3;
      })
      .map((item) => item.replace(/^\W+|\W+$/g, '')); // clean edges

    // Remove duplicates
    ingredients = [...new Set(ingredients)];

    return ingredients.length > 0 
      ? ingredients 
      : ['No ingredients detected. Please try a clearer photo or manual entry.'];
  };

  // Drag & Drop, Paste, Click handlers (same as before)
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
          relative w-full rounded-3xl border-2 border-dashed cursor-pointer transition-all
          ${dragOver ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 
            'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400'}
          ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
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
              alt="Preview"
              className="w-full max-h-80 object-contain rounded-3xl"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white font-medium">Analyzing label...</p>
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
            <p className="text-emerald-600 dark:text-emerald-400 mb-6">
              Take a clear photo of the ingredients list
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 text-xs text-amber-600 dark:text-amber-500 space-y-1">
        <p className="font-semibold">💡 Tips for best results:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Use good lighting and avoid glare</li>
          <li>Keep the ingredients list straight and in focus</li>
          <li>Fill most of the frame with the label</li>
        </ul>
      </div>
    </div>
  );
}