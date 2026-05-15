import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Fetch gold & silver spot prices (USD per troy ounce)
    const metalsRes = await fetch('https://api.metals.live/v1/spot/gold,silver');
    if (!metalsRes.ok) throw new Error('Metals API failed');
    
    // The metals API returns an array like [{"gold":1950.45},{"silver":24.63}]
    const metalsArray = await metalsRes.json();
    if (!Array.isArray(metalsArray) || metalsArray.length < 2) {
      throw new Error('Unexpected metals response format');
    }
    const goldPerTroyOunce = metalsArray[0]?.gold;
    const silverPerTroyOunce = metalsArray[1]?.silver;
    if (typeof goldPerTroyOunce !== 'number' || typeof silverPerTroyOunce !== 'number') {
      throw new Error('Missing gold or silver price in response');
    }

    // 2. Fetch exchange rates (USD base)
    const forexRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!forexRes.ok) throw new Error('Forex API failed');
    const forexData = await forexRes.json();
    const rates = forexData?.rates || { USD: 1 };

    // Return the raw prices (frontend converts to per‑gram)
    return NextResponse.json({
      gold: goldPerTroyOunce,
      silver: silverPerTroyOunce,
      rates,
    });
  } catch (error) {
    console.error('Live prices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live prices' },
      { status: 500 }
    );
  }
}