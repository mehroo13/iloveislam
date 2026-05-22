import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_URL = process.env.RAPIDAPI_URL;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const LOCAL_HALAL_SERVICE_URL = process.env.LOCAL_HALAL_SERVICE_URL;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ingredients, productName } = body as {
    ingredients?: string[];
    productName?: string;
  };

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json(
      {
        available: false,
        message: 'No ingredients were supplied for Halal API verification.',
      },
      { status: 400 }
    );
  }

  if (!RAPIDAPI_URL && !LOCAL_HALAL_SERVICE_URL) {
    return NextResponse.json(
      {
        available: false,
        message:
          'No halal verification service is configured. Set LOCAL_HALAL_SERVICE_URL for a local self-hosted service, or RAPIDAPI_URL/RAPIDAPI_KEY for RapidAPI.',
      },
      { status: 200 }
    );
  }

  try {
    const targetUrl = LOCAL_HALAL_SERVICE_URL || RAPIDAPI_URL!;
    const targetHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!LOCAL_HALAL_SERVICE_URL && RAPIDAPI_KEY) {
      targetHeaders['X-RapidAPI-Key'] = RAPIDAPI_KEY;
    }
    if (!LOCAL_HALAL_SERVICE_URL && RAPIDAPI_HOST) {
      targetHeaders['X-RapidAPI-Host'] = RAPIDAPI_HOST;
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: targetHeaders,
      body: JSON.stringify({ ingredients, productName }),
    });

    const data = await res.json();

    return NextResponse.json(
      {
        available: true,
        verified: data?.verdict === 'halal' || data?.status === 'halal' || false,
        message: data?.message || 'Halal API responded successfully.',
        details: data,
        source: LOCAL_HALAL_SERVICE_URL ? 'local' : 'rapidapi',
      },
      { status: res.ok ? 200 : 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        available: false,
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while calling the Halal API.',
      },
      { status: 502 }
    );
  }
}
