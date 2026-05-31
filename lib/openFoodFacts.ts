// lib/openFoodFacts.ts
// Open Food Facts API — free, no API key required, 3M+ products worldwide

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  product_name_en?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  allergens?: string;
  labels?: string;
  image_url?: string;
  image_front_url?: string;
  countries?: string;
  quantity?: string;
  nutriscore_grade?: string;
  nova_group?: number;
}

export interface ProductLookupResult {
  found: boolean;
  product?: OpenFoodFactsProduct;
  ingredients: string[];
  error?: string;
  fallbackUsed?: boolean;
}

const BASE_URL = 'https://world.openfoodfacts.org';

/**
 * Look up a product by barcode (EAN-13, EAN-8, UPC-A, QR code with barcode)
 */
export async function lookupByBarcode(barcode: string): Promise<ProductLookupResult> {
  try {
    const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');

    const headers: Record<string, string> = {};
    // Browsers disallow setting the User-Agent header; only set it on the server.
    if (typeof window === 'undefined') {
      headers['User-Agent'] = 'HalalScan/1.0 (iloveislam.life)';
    }

    const res = await fetch(`${BASE_URL}/api/v0/product/${cleanBarcode}.json`, { headers });

    if (!res.ok) {
      return { found: false, ingredients: [], error: `HTTP ${res.status}` };
    }

    const data = await res.json();

    if (data.status === 0 || !data.product) {
      // Product not found — do NOT fallback search (it returns wrong products)
      return { found: false, ingredients: [], error: 'Product not found in database' };
    }

    const product: OpenFoodFactsProduct = data.product;
    const ingredients = parseIngredients(
      product.ingredients_text_en || product.ingredients_text || ''
    );

    return { found: true, product, ingredients };
  } catch (err) {
    return {
      found: false,
      ingredients: [],
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Search for a product by name
 */
export async function searchByName(query: string): Promise<ProductLookupResult[]> {
  try {
    const encoded = encodeURIComponent(query);
    const headers: Record<string, string> = {};
    if (typeof window === 'undefined') {
      headers['User-Agent'] = 'HalalScan/1.0 (iloveislam.life)';
    }

    const res = await fetch(`${BASE_URL}/cgi/search.pl?search_terms=${encoded}&search_simple=1&action=process&json=1&page_size=5`, { headers });

    if (!res.ok) return [];

    const data = await res.json();
    const products: ProductLookupResult[] = (data.products || []).map(
      (p: OpenFoodFactsProduct) => ({
        found: true,
        product: p,
        ingredients: parseIngredients(p.ingredients_text_en || p.ingredients_text || ''),
      })
    );

    return products;
  } catch {
    return [];
  }
}

/**
 * Parse raw ingredients string into clean array of individual ingredients
 */
export function parseIngredients(raw: string): string[] {
  if (!raw || raw.trim() === '') return [];

  return raw
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove percentages like (20%)
    .replace(/\(\d+(\.\d+)?%\)/g, '')
    // Remove brackets content that are just quantities
    .replace(/\[\d+[gml%]+\]/gi, '')
    // Split on comma, semicolon, slash, or bullet
    .split(/[,;\/•]+/)
    // Clean each item
    .map((s) =>
      s
        .trim()
        .toLowerCase()
        // Remove leading underscores (allergen markers like _milk_)
        .replace(/^_+|_+$/g, '')
        // Remove all parentheses groups and extra whitespace
        .replace(/\([^)]*\)/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    )
    // Filter out very short or empty strings
    .filter((s) => s.length > 1)
    // Remove duplicates
    .filter((s, i, arr) => arr.indexOf(s) === i);
}

/**
 * Extract barcode from a QR code value (some QR codes encode barcodes)
 */
export function extractBarcodeFromQR(qrValue: string): string | null {
  // Pure number barcode
  if (/^\d{8,14}$/.test(qrValue.trim())) {
    return qrValue.trim();
  }

  // URL containing barcode e.g. https://world.openfoodfacts.org/product/1234567890123
  const urlMatch = qrValue.match(/\/product\/(\d{8,14})/);
  if (urlMatch) return urlMatch[1];

  // GS1 QR or DataMatrix prefixed with 01
  const gs1Match = qrValue.match(/^01(\d{14})/);
  if (gs1Match) return gs1Match[1].replace(/^0+/, '');

  return null;
}