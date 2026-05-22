import {
  lookupByBarcode as lookupOpenFoodFactsByBarcode,
  searchByName as searchOpenFoodFactsByName,
  type OpenFoodFactsProduct,
  type ProductLookupResult,
} from './openFoodFacts';

export { OpenFoodFactsProduct, ProductLookupResult };

export interface HalalApiVerificationResult {
  available: boolean;
  verified: boolean | null;
  source: 'rapidapi' | 'local' | 'none';
  message: string;
  details?: unknown;
}

export async function lookupProductByBarcode(barcode: string): Promise<ProductLookupResult> {
  return lookupOpenFoodFactsByBarcode(barcode);
}

export async function searchProductByName(query: string): Promise<ProductLookupResult[]> {
  return searchOpenFoodFactsByName(query);
}

export async function checkHalalStatusWithApi(
  ingredients: string[],
  productName?: string,
): Promise<HalalApiVerificationResult> {
  try {
    const res = await fetch('/api/halal-checker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, productName }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        available: false,
        verified: null,
        source: 'none',
        message: data?.message || `Halal API error (${res.status})`,
        details: data,
      };
    }

    return {
      available: data?.available === true,
      verified: typeof data?.verified === 'boolean' ? data.verified : null,
      source: data?.source === 'local' ? 'local' : 'rapidapi',
      message: data?.message || 'Halal API verification completed',
      details: data,
    };
  } catch (err) {
    return {
      available: false,
      verified: null,
      source: 'none',
      message: err instanceof Error ? err.message : 'Network error while calling Halal API',
    };
  }
}

export async function lookupAustralianHalalDirectory(barcode: string) {
  return {
    found: false,
    source: 'australia' as const,
    message:
      'Australian halal directory lookup is not configured. Add a licensed local product feed or partnership dataset to enable this feature.',
  };
}
