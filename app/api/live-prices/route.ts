import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch gold & silver spot prices (USD per troy ounce)
    const metalsRes = await fetch('https://api.metals.live/v1/spot/gold,silver');
    if (!metalsRes.ok) throw new Error('Metals API failed');
    const metalsData = await metalsRes.json();

    // Fetch exchange rates (USD base)
    const forexRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!forexRes.ok) throw new Error('Forex API failed');
    const forexData = await forexRes.json();

    return NextResponse.json({
      gold: metalsData.gold,
      silver: metalsData.silver,
      rates: forexData.rates || { USD: 1 },
    });
  } catch (error) {
    console.error('Live prices fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live prices' },
      { status: 500 }
    );
  }
}