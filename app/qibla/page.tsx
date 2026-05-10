'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Accurate Qibla calculation using the correct spherical formula
function calculateQibla(latitude: number, longitude: number): number {
  // Convert to radians
  const lat1 = latitude * Math.PI / 180;
  const lon1 = longitude * Math.PI / 180;
  const lat2 = KAABA_LAT * Math.PI / 180;
  const lon2 = KAABA_LNG * Math.PI / 180;
  
  // Difference in longitude
  const deltaLon = lon2 - lon1;
  
  // Calculate the qibla angle
  const x = Math.sin(deltaLon);
  const y = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLon);
  
  let qibla = Math.atan2(x, y) * 180 / Math.PI;
  
  // Normalize to 0-360 degrees
  qibla = (qibla + 360) % 360;
  
  return Math.round(qibla * 100) / 100;
}

// Calculate distance using Haversine formula
function calculateDistance(lat: number, lng: number): number {
  const R = 6371;
  const dLat = (KAABA_LAT - lat) * Math.PI / 180;
  const dLon = (KAABA_LNG - lng) * Math.PI / 180;
  const lat1 = lat * Math.PI / 180;
  const lat2 = KAABA_LAT * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c);
}

// Get cardinal direction with proper name
function getCardinalDirection(degrees: number): string {
  if (degrees >= 348.75 || degrees < 11.25) return 'N';
  if (degrees >= 11.25 && degrees < 33.75) return 'NNE';
  if (degrees >= 33.75 && degrees < 56.25) return 'NE';
  if (degrees >= 56.25 && degrees < 78.75) return 'ENE';
  if (degrees >= 78.75 && degrees < 101.25) return 'E';
  if (degrees >= 101.25 && degrees < 123.75) return 'ESE';
  if (degrees >= 123.75 && degrees < 146.25) return 'SE';
  if (degrees >= 146.25 && degrees < 168.75) return 'SSE';
  if (degrees >= 168.75 && degrees < 191.25) return 'S';
  if (degrees >= 191.25 && degrees < 213.75) return 'SSW';
  if (degrees >= 213.75 && degrees < 236.25) return 'SW';
  if (degrees >= 236.25 && degrees < 258.75) return 'WSW';
  if (degrees >= 258.75 && degrees < 281.25) return 'W';
  if (degrees >= 281.25 && degrees < 303.75) return 'WNW';
  if (degrees >= 303.75 && degrees < 326.25) return 'NW';
  return 'NNW';
}

// Get direction emoji for visual reference
function getDirectionEmoji(degrees: number): string {
  if (degrees >= 337.5 || degrees < 22.5) return '⬆️';
  if (degrees >= 22.5 && degrees < 67.5) return '↗️';
  if (degrees >= 67.5 && degrees < 112.5) return '➡️';
  if (degrees >= 112.5 && degrees < 157.5) return '↘️';
  if (degrees >= 157.5 && degrees < 202.5) return '⬇️';
  if (degrees >= 202.5 && degrees < 247.5) return '↙️';
  if (degrees >= 247.5 && degrees < 292.5) return '⬅️';
  return '↖️';
}

interface LocationInfo {
  lat: number;
  lng: number;
  name: string;
  country: string;
  flag: string;
}

export default function QiblaFinder() {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchCity, setSearchCity] = useState('');
  
  // Compass states
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [compassPermission, setCompassPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [isFacingQibla, setIsFacingQibla] = useState(false);
  const [alignmentAccuracy, setAlignmentAccuracy] = useState<number>(0);
  
  const animationRef = useRef<number | null>(null);
  const lastHeadingRef = useRef<number>(0);
  const compassListenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);

  // Calculate arrow rotation and facing status
  useEffect(() => {
    if (qiblaDirection !== null && compassEnabled) {
      // Calculate the difference between where user is pointing and Qibla
      let diff = Math.abs(qiblaDirection - compassHeading);
      diff = Math.min(diff, 360 - diff);
      
      // Calculate alignment accuracy (0 = perfect, 180 = opposite)
      setAlignmentAccuracy(diff);
      
      // Check if facing Qibla (within ±5 degrees)
      setIsFacingQibla(diff <= 5);
    }
  }, [qiblaDirection, compassHeading, compassEnabled]);

  // Get flag emoji
  const getFlagEmoji = (countryCode: string): string => {
    if (!countryCode) return '📍';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Update location
  const updateLocation = useCallback(async (lat: number, lng: number, name: string, country: string = '', countryCode: string = '') => {
    setLocation({ lat, lng, name, country, flag: getFlagEmoji(countryCode) });
    const qibla = calculateQibla(lat, lng);
    const dist = calculateDistance(lat, lng);
    setQiblaDirection(qibla);
    setDistance(dist);
    setLoading(false);
  }, []);

  // Start compass
  const startCompass = useCallback(() => {
    if (!window.DeviceOrientationEvent) {
      setCompassPermission('denied');
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading: number | null = null;
      
      // iOS
      if ((event as any).webkitCompassHeading !== undefined) {
        heading = (event as any).webkitCompassHeading;
      } 
      // Android
      else if (event.alpha !== undefined && event.alpha !== null) {
        heading = event.alpha;
      }
      
      if (heading !== null) {
        setCompassHeading(heading);
        setCompassEnabled(true);
        lastHeadingRef.current = heading;
      }
    };

    compassListenerRef.current = handleOrientation;
    window.addEventListener('deviceorientation', handleOrientation);
  }, []);

  // Stop compass
  const stopCompass = useCallback(() => {
    if (compassListenerRef.current) {
      window.removeEventListener('deviceorientation', compassListenerRef.current);
      compassListenerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Request compass permission (iOS)
  const enableCompass = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setCompassPermission('granted');
          startCompass();
        } else {
          setCompassPermission('denied');
        }
      } catch (err) {
        console.error(err);
        setCompassPermission('denied');
      }
    } else {
      // Android
      setCompassPermission('granted');
      startCompass();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopCompass();
    };
  }, [stopCompass]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    
    setLoading(true);
    setError('');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Your Location';
          const country = data.address?.country || '';
          const countryCode = data.address?.country_code || '';
          await updateLocation(latitude, longitude, city, country, countryCode);
        } catch {
          await updateLocation(latitude, longitude, 'Your Location', '', '');
        }
      },
      (err) => {
        if (err.code === 1) {
          setError('Location access denied. Please enable location services.');
        } else {
          setError('Unable to get location. Please search for a city.');
        }
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Search city
  const searchCityHandler = async () => {
    if (!searchCity.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchCity)}&format=json&limit=1&accept-language=en`
      );
      const data = await response.json();
      
      if (!data || data.length === 0) {
        setError('City not found');
        setLoading(false);
        return;
      }
      
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const cityName = data[0].display_name.split(',')[0];
      
      const countryResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
      );
      const countryData = await countryResponse.json();
      const country = countryData.address?.country || '';
      const countryCode = countryData.address?.country_code || '';
      
      await updateLocation(lat, lng, cityName, country, countryCode);
    } catch {
      setError('Error searching for city');
      setLoading(false);
    }
  };

  const resetLocation = () => {
    setLocation(null);
    setQiblaDirection(null);
    setDistance(null);
    setSearchCity('');
    setError('');
    setCompassEnabled(false);
    setCompassPermission('prompt');
    setIsFacingQibla(false);
    setAlignmentAccuracy(0);
    stopCompass();
  };

  // Calculate arrow rotation for compass
  const arrowRotation = qiblaDirection !== null && compassEnabled
    ? (qiblaDirection - compassHeading + 360) % 360
    : qiblaDirection || 0;

  // Test cities with known Qibla directions
  const testCities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060, expected: '58° NE' },
    { name: 'London', lat: 51.5074, lng: -0.1278, expected: '118° ESE' },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784, expected: '153° SSE' },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, expected: '295° WNW' },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090, expected: '270° W' },
    { name: 'Tokyo', lat: 35.6895, lng: 139.6917, expected: '293° WNW' },
    { name: 'Makkah', lat: 21.4225, lng: 39.8262, expected: '0° N' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm px-4 py-4 flex items-center gap-4 border-b border-emerald-700/50 sticky top-0 z-10">
        <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
          <span>←</span> Back
        </Link>
        <h1 className="text-white font-semibold text-lg flex-1 text-center">🕋 Qibla Compass</h1>
        <div className="w-12"></div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Location Selection */}
        {!qiblaDirection && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/20">
              <div className="text-6xl mb-4">🧭</div>
              <h2 className="text-white text-xl font-semibold mb-2">Qibla Compass</h2>
              <p className="text-white/60 text-sm">Find the direction of the Holy Kaaba</p>
            </div>

            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-lg"
            >
              📍 Use My Location
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-emerald-900 text-white/60">OR SEARCH</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCityHandler()}
                placeholder="Enter city name..."
                className="flex-1 bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-white/40 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={searchCityHandler}
                disabled={loading || !searchCity.trim()}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 font-semibold"
              >
                Go
              </button>
            </div>

            {/* Test Cities */}
            <div className="pt-2">
              <p className="text-white/40 text-xs text-center mb-2">Quick Test:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {testCities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => updateLocation(city.lat, city.lng, city.name, '', '')}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-white/70 text-xs"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/60">Loading...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Qibla Display */}
        {qiblaDirection !== null && location && (
          <div className="space-y-5">
            {/* Location Header */}
            <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">{location.flag || '📍'}</span>
                <span className="text-white font-semibold text-lg">{location.name}</span>
                {location.country && <span className="text-white/50 text-sm">• {location.country}</span>}
              </div>
              <p className="text-white/40 text-xs">
                {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? 'N' : 'S'}, {Math.abs(location.lng).toFixed(2)}°{location.lng >= 0 ? 'E' : 'W'}
              </p>
            </div>

            {/* Main Compass - With Center Bubble/Level Indicator */}
            <div className="relative w-80 h-80 mx-auto">
              {/* Compass Outer Ring */}
              <div className="absolute inset-0 rounded-full bg-emerald-800/40 border-4 border-white/30 shadow-2xl backdrop-blur-sm">
                {/* N S E W Labels */}
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="text-red-400 font-bold text-sm">N</div>
                  <div className="w-px h-8 bg-red-400/50 mx-auto"></div>
                </div>
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="w-px h-8 bg-white/30 mx-auto"></div>
                  <div className="text-white/40 font-bold text-sm">S</div>
                </div>
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="text-white/40 font-bold text-sm">E</div>
                  <div className="w-8 h-px bg-white/30 mx-auto"></div>
                </div>
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="text-white/40 font-bold text-sm">W</div>
                  <div className="w-8 h-px bg-white/30 mx-auto"></div>
                </div>

                {/* Degree Marks */}
                {[...Array(36)].map((_, i) => {
                  const rotation = i * 10;
                  const isMajor = i % 3 === 0;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 left-1/2"
                      style={{
                        width: '1px',
                        height: isMajor ? '12px' : '6px',
                        background: isMajor ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                        transform: `rotate(${rotation}deg) translateX(-50%)`,
                        transformOrigin: '0 160px',
                      }}
                    />
                  );
                })}
              </div>

              {/* Qibla Needle */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out z-20"
                style={{ transform: `rotate(${arrowRotation}deg)` }}
              >
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[70px] border-l-transparent border-r-transparent border-b-emerald-500 drop-shadow-lg" />
                  <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 text-2xl filter drop-shadow-lg">🕋</div>
                </div>
              </div>

              {/* Center Bubble / Level Indicator - This is what you asked for! */}
              <div className="absolute inset-0 flex items-center justify-center z-30">
                {/* Outer ring that changes size based on alignment accuracy */}
                <div className={`rounded-full transition-all duration-300 flex items-center justify-center
                  ${isFacingQibla && compassEnabled 
                    ? 'bg-emerald-500/40 w-16 h-16 shadow-lg shadow-emerald-500/50' 
                    : 'bg-white/20 w-12 h-12'}`}
                >
                  {/* Center dot */}
                  <div className={`rounded-full transition-all duration-300
                    ${isFacingQibla && compassEnabled 
                      ? 'w-4 h-4 bg-emerald-300 animate-pulse' 
                      : 'w-3 h-3 bg-white'}`}
                  />
                </div>
                {/* Crosshair lines (+) */}
                <div className="absolute w-10 h-px bg-white/40"></div>
                <div className="absolute w-px h-10 bg-white/40"></div>
                {/* Diagonal lines for better alignment */}
                <div className="absolute w-8 h-px bg-white/20 transform rotate-45"></div>
                <div className="absolute w-8 h-px bg-white/20 transform -rotate-45"></div>
              </div>

              {/* Accuracy ring that appears when close to Qibla */}
              {compassEnabled && alignmentAccuracy <= 10 && !isFacingQibla && (
                <div className="absolute inset-0 rounded-full border-4 border-yellow-500/50 animate-pulse z-15"
                     style={{ transform: 'scale(0.85)' }} />
              )}
            </div>

            {/* Facing Qibla Banner */}
            {isFacingQibla && compassEnabled && (
              <div className="bg-emerald-500/40 border-2 border-emerald-400 rounded-xl p-3 text-center animate-pulse">
                <p className="text-emerald-300 font-bold text-lg">✓ You are facing the Qibla! ✓</p>
                <p className="text-emerald-200/70 text-xs mt-1">Perfect alignment!</p>
              </div>
            )}

            {/* Alignment Accuracy Meter (NEW) */}
            {compassEnabled && !isFacingQibla && (
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>← Far</span>
                  <span>Alignment</span>
                  <span>Perfect →</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, 100 - (alignmentAccuracy / 1.8))}%` }}
                  />
                </div>
                <p className="text-white/40 text-center text-xs mt-2">
                  {alignmentAccuracy <= 10 
                    ? "🎯 Getting close! Keep turning..." 
                    : alignmentAccuracy <= 30
                    ? "🔄 You're in the right area..."
                    : "📱 Turn your phone towards the arrow"}
                </p>
              </div>
            )}

            {/* Qibla Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white/50 text-xs mb-1">Qibla Direction</p>
                <p className="text-white text-2xl font-bold">{qiblaDirection}°</p>
                <p className="text-emerald-300 text-sm font-semibold">{getCardinalDirection(qiblaDirection)}</p>
                <p className="text-white/40 text-xs mt-1">{getDirectionEmoji(qiblaDirection)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white/50 text-xs mb-1">Distance to Kaaba</p>
                <p className="text-white text-2xl font-bold">{distance?.toLocaleString()}</p>
                <p className="text-white/60 text-sm">kilometers</p>
                <p className="text-white/40 text-xs mt-1">{Math.round(distance! * 0.621371).toLocaleString()} miles</p>
              </div>
            </div>

            {/* Compass Status */}
            {compassPermission === 'prompt' && (
              <button
                onClick={enableCompass}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
              >
                <span>🧭</span> Enable Live Compass
              </button>
            )}

            {compassPermission === 'granted' && compassEnabled && (
              <div className="flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-emerald-300 text-sm font-medium">
                  Compass Active • {Math.round(compassHeading)}° {getDirectionEmoji(compassHeading)}
                </p>
              </div>
            )}

            {compassPermission === 'granted' && !compassEnabled && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
                <p className="text-yellow-300 text-sm">
                  ⚡ Waiting for compass data. Move your phone in a figure-8 pattern to calibrate.
                </p>
              </div>
            )}

            {compassPermission === 'denied' && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
                <p className="text-yellow-300 text-sm">
                  🔒 Compass permission denied. Use the fixed direction above with any compass app.
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs text-center leading-relaxed">
                {compassEnabled 
                  ? "🎯 The green arrow shows Qibla direction. Rotate your phone until the arrow points to 🕋 and you see the green bubble center."
                  : "📐 Tap 'Enable Live Compass' above. The arrow shows the fixed Qibla direction from your location."}
              </p>
              <p className="text-white/40 text-[10px] text-center mt-2">
                For best accuracy: Hold phone flat, away from magnetic interference
              </p>
            </div>

            {/* Change Location */}
            <button
              onClick={resetLocation}
              className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 font-semibold"
            >
              Change Location
            </button>
          </div>
        )}
      </main>
    </div>
  );
}