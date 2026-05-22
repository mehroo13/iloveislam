'use client';

// app/halal-scanner/components/ImageUploader.tsx
// Upload a photo of a product label — uses Tesseract.js (free, local OCR) to extract ingredients

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

  const processImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPG, PNG, WEBP, etc.)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Image too large. Please use an image under 10MB.');
        return;
      }

      setError(null);
      onLoading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      try {
        // Use Tesseract.js to extract text from image (runs locally, free)
        const {
          data: { text },
        } = await Tesseract.recognize(file, 'eng', {
          logger: (m) => console.log(m), // optional, shows progress
        });

        console.log('Extracted text:', text);

        // Parse extracted text to find ingredients
        let ingredients: string[] = [];
        const lowerText = text.toLowerCase();

        // Look for "ingredients:" marker
        const ingredientsMatch = lowerText.match(/ingredients?:?\s*([^.]+(?:[.][^.]+)*)/i);
        if (ingredientsMatch) {
          const ingredientsPart = ingredientsMatch[1];
          ingredients = ingredientsPart
            .split(/[,;]+/)
            .map((i) => i.trim())
            .filter((i) => i.length > 1 && !i.includes('contains') && !i.includes('allergy'));
        }

        // Fallback: split entire text by common separators
        if (ingredients.length === 0) {
          ingredients = text
            .split(/[\n,;]+/)
            .map((i) => i.trim().toLowerCase())
            .filter((i) => i.length > 1 && !i.includes('ingredients') && !i.includes('nutrition'));
        }

        // Remove common noise words
        const noiseWords = ['product', 'information', 'distributed', 'by', 'keep', 'store', 'refrigerate', 'allergy', 'contains', 'may contain', 'net wt', 'net weight', 'serving', 'calories'];
        ingredients = ingredients.filter(
          (i) => !noiseWords.some((noise) => i.includes(noise)) && i.length > 1
        );

        // If still empty, provide a fallback message
        if (ingredients.length === 0) {
          ingredients = ['No ingredients could be extracted. Please check the image clarity or enter ingredients manually.'];
        }

        const imageUrl = URL.createObjectURL(file);
        onIngredients(ingredients, imageUrl);
      } catch (err: any) {
        console.error(err);
        setError('Failed to extract text from image. Please try a clearer photo or enter ingredients manually.');
        onLoading(false);
      }
    },
    [onIngredients, onLoading]
  );

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
      {/* Drop zone */}
      <div
        onClick={() => !isLoading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        className={`
          relative w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
          ${dragOver
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
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
          /* Preview state */
          <div className="relative">
            <img
              src={preview}
              alt="Product label preview"
              className="w-full max-h-64 object-contain rounded-2xl"
            />
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl">
                <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-white text-sm font-semibold">Reading ingredients from image...</p>
              </div>
            )}
            {!isLoading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          /* Upload prompt */
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="text-5xl mb-4">📸</div>
            <p className="text-emerald-800 dark:text-emerald-200 font-semibold text-lg mb-1">
              Take a photo or upload an image
            </p>
            <p className="text-emerald-600/70 dark:text-emerald-400/70 text-sm mb-4">
              Point at the ingredients list on the packaging
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                📱 Camera
              </span>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                🖼️ Gallery
              </span>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                📋 Paste (Ctrl+V)
              </span>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                🖱️ Drag & Drop
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl">
        <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold mb-1">📌 Tips for best results:</p>
        <ul className="text-amber-600 dark:text-amber-500 text-xs space-y-0.5 list-disc list-inside">
          <li>Make sure the ingredients text is clearly visible and in focus</li>
          <li>Avoid shadows or glare on the label</li>
          <li>Include the full ingredients list in the photo</li>
        </ul>
      </div>
    </div>
  );
}