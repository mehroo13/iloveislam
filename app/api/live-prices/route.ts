import { NextResponse } from 'next/server';

// Fallback prices (USD per troy ounce) – approximate, updated manually if needed
const FALLBACK_GOLD = 1950;
const FALLBACK_SILVER = 24.5;

async function fetchMetals() {
  // Primary source: api.metals.live
  try {
    const res = await fetch('https://api.metals.live/v1/spot/gold,silver');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    // The API returns an array like: [{"gold": 1950.45}, {"silver": 24.63}]
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Unexpected array structure');
    }
    const gold = data[0]?.gold;
    const silver = data[1]?.silver;
    if (typeof gold !== 'number' || typeof silver !== 'number') {
      throw new Error('Gold or silver price missing');
    }
    return { gold, silver };
  } catch (err) {
    console.error('Primary metals API failed:', err);
    // Try secondary source: api.gold-api.com
    try {
      const [goldRes, silverRes] = await Promise.all([
        fetch('https://api.gold-api.com/price/XAU'),
        fetch('https://api.gold-api.com/price/XAG'),
      ]);
      if (!goldRes.ok || !silverRes.ok) throw new Error('Secondary API failed');
      const goldData = await goldRes.json();
      const silverData = await silverRes.json();
      const gold = goldData?.price;
      const silver = silverData?.price;
      if (typeof gold !== 'number' || typeof silver !== 'number') {
        throw new Error('Invalid secondary price data');
      }
      // gold-api returns price per troy ounce already
      return { gold, silver };
    } catch (secondaryErr) {
      console.error('Secondary metals API also failed:', secondaryErr);
      throw new Error('All metal price sources failed');
    }
  }
}

export async function GET() {
  try {
    // 1. Get gold & silver prices (in USD per troy ounce)
    const { gold: goldPerTroyOunce, silver: silverPerTroyOunce } = await fetchMetals();
    if (!goldPerTroyOunce || !silverPerTroyOunce) {
      throw new Error('Could not obtain metal prices');
    }

    // 2. Get exchange rates (USD base)
    let rates: Record<string, number> = { USD: 1 };
    try {
      const forexRes = await fetch('https://open.er-api.com/v6/latest/USD');
      if (forexRes.ok) {
        const forexData = await forexRes.json();
        if (forexData?.rates) {
          rates = forexData.rates;
        }
      } else {
        console.warn('Forex API returned status', forexRes.status);
      }
    } catch (forexErr) {
      console.warn('Forex API failed, using fallback rates (USD only)', forexErr);
      // Fallback: at least USD = 1
    }

    return NextResponse.json({
      gold: goldPerTroyOunce,
      silver: silverPerTroyOunce,
      rates,
    });
  } catch (error) {
    console.error('Live prices route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live prices' },
      { status: 500 }
    );
  }
}