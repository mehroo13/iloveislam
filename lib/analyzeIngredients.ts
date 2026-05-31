// lib/analyzeIngredients.ts
// Core Halal Analysis Engine
// Combines local database lookup + AI analysis for maximum accuracy

import {
  analyseIngredientList,
  getOverallVerdict,
  type IngredientResult,
  type HalalStatus,
} from './halalDatabase';

export interface AnalysisResult {
  verdict: HalalStatus | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  ingredientResults: IngredientResult[];
  haramIngredients: IngredientResult[];
  mashboohIngredients: IngredientResult[];
  halalIngredients: IngredientResult[];
  unknownIngredients: IngredientResult[];
  summary: string;
  recommendation: string;
  certifications?: string[];
  analyzedAt: string;
}

/**
 * Analyse a list of ingredient strings and return full breakdown
 */
export function analyzeIngredients(
  ingredients: string[],
  certifications: string[] = []
): AnalysisResult {
  // Check halal certifications in labels
  const halalCerts = certifications.filter((c) =>
    /halal|zabiha|iswa|hfce|hfa|ifanca|hmc|muis|jakim|idcp/i.test(c)
  );

  // Run ingredient-by-ingredient analysis
  const ingredientResults = analyseIngredientList(ingredients);
  const { verdict, confidence } = getOverallVerdict(ingredientResults);

  // Split into categories
  const haramIngredients = ingredientResults.filter((r) => r.status === 'haram');
  const mashboohIngredients = ingredientResults.filter((r) => r.status === 'mashbooh');
  const halalIngredients = ingredientResults.filter((r) => r.status === 'halal');
  const unknownIngredients = ingredientResults.filter((r) => r.status === 'unknown');

  // If halal certified and no haram ingredients found — upgrade verdict
  let finalVerdict = verdict;
  let finalConfidence = confidence;

  if (halalCerts.length > 0 && verdict !== 'haram') {
    finalVerdict = 'halal';
    finalConfidence = 'high';
  }

  // Build summary
  const summary = buildSummary(
    finalVerdict,
    haramIngredients,
    mashboohIngredients,
    unknownIngredients,
    halalCerts
  );

  const recommendation = buildRecommendation(
    finalVerdict,
    haramIngredients,
    mashboohIngredients,
    unknownIngredients
  );

  return {
    verdict: finalVerdict,
    confidence: finalConfidence,
    ingredientResults,
    haramIngredients,
    mashboohIngredients,
    halalIngredients,
    unknownIngredients,
    summary,
    recommendation,
    certifications: halalCerts,
    analyzedAt: new Date().toISOString(),
  };
}

function buildSummary(
  verdict: HalalStatus | 'unknown',
  haram: IngredientResult[],
  mashbooh: IngredientResult[],
  unknown: IngredientResult[],
  certs: string[]
): string {
  if (verdict === 'haram') {
    const names = haram.map((r) => r.matched?.name || r.original).join(', ');
    return `This product contains haram ingredient(s): ${names}.`;
  }

  if (verdict === 'mashbooh') {
    const names = mashbooh.map((r) => r.matched?.name || r.original).join(', ');
    return `This product contains doubtful (mashbooh) ingredient(s): ${names}. These may be permissible or impermissible depending on their source. Verification is recommended.`;
  }

  if (verdict === 'halal' && certs.length > 0) {
    return `This product carries halal certification (${certs.join(', ')}) and no haram or mashbooh ingredients were detected.`;
  }

  if (verdict === 'halal') {
    if (unknown.length > 0) {
      return `No clearly haram or mashbooh ingredients were found. However, ${unknown.length} ingredient(s) could not be identified — consider verifying with the manufacturer.`;
    }
    return 'All identified ingredients appear to be halal.';
  }

  return 'No haram ingredients detected. Product appears to be halal based on available information.';
}

function buildRecommendation(
  verdict: HalalStatus | 'unknown',
  haram: IngredientResult[],
  mashbooh: IngredientResult[],
  unknown: IngredientResult[]
): string {
  if (verdict === 'haram') {
    return '❌ Do not consume. This product contains ingredients that are clearly prohibited in Islam.';
  }
  if (verdict === 'mashbooh') {
    return '⚠️ Exercise caution. Contact the manufacturer to clarify the source of the doubtful ingredient(s) before consuming.';
  }
  if (verdict === 'halal' && unknown.length === 0) {
    return '✅ This product appears safe to consume based on the ingredient analysis.';
  }
  if (verdict === 'halal' && unknown.length > 0) {
    return '✅ Likely permissible, but some ingredients could not be verified. If in doubt, contact the manufacturer or look for a halal-certified version.';
  }
  return '✅ No haram ingredients detected. Look for halal certification on the packaging for full assurance.';
}

/**
 * Parse AI vision response (from Claude API) to extract ingredients from image
 */
export function parseAIIngredientResponse(aiText: string): string[] {
  if (!aiText) return [];

  // Try to find an "Ingredients:" section
  const ingredientsSection = aiText.match(/ingredients?[:\s]+([^.]+(?:\.[^.]+)*)/i);
  if (ingredientsSection) {
    return ingredientsSection[1]
      .split(/[,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 1);
  }

  // Otherwise parse line by line
  return aiText
    .split('\n')
    .map((line) =>
      line
        .replace(/^[-•*]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .trim()
        .toLowerCase()
    )
    .filter((s) => s.length > 1 && !s.includes(':'));
}

/**
 * Normalize a product's label array to look for halal certs
 */
export function extractCertifications(labels: string): string[] {
  if (!labels) return [];
  return labels
    .split(',')
    .map((l) => l.trim())
    .filter((l) =>
      /halal|kosher|organic|vegan|vegetarian|zabiha/i.test(l)
    );
}