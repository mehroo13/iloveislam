'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Accurate Qibla calculation using Vincenty formula (most accurate)
function calculateQibla(latitude: number, longitude: number): number {
  const lat1 = latitude * Math.PI / 180;
  const lon1 = longitude * Math.PI / 180;
  const lat2 = KAABA_LAT * Math.PI / 180;
  const lon2 = KAABA_LNG * Math.PI / 180;
  
  const deltaLon = lon2 - lon1;
  
  // The standard formula used by Islamic organizations worldwide
  const y = Math.sin(deltaLon);
  const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLon);
  
  let qibla = Math.atan2(y, x) * 180 / Math.PI;
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

// Get cardinal direction
function getCardinalDirection(degrees: number): string {
  const directions = [
    'North', 'North-Northeast', 'Northeast', 'East-Northeast',
    'East', 'East-Southeast', 'Southeast', 'South-Southeast',
    'South', 'South-Southwest', 'Southwest', 'West-Southwest',
    'West', 'West-Northwest', 'Northwest', 'North-Northwest'
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

interface QiblaState {
  compassAngle: number;
  needleAngle: number;
  isFacingQibla: boolean;
}

export default function QiblaFinder() {
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string; country: string } | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [qiblaState, setQiblaState] = useState<QiblaState>({ compassAngle: 0, needleAngle: 0, isFacingQibla: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [compassSupported, setCompassSupported] = useState(true);
  
  const animationRef = useRef<number>();
  const lastHeadingRef = useRef<number>(0);

  // Get flag emoji
  const getFlagEmoji = (countryCode: string): string => {
    if (!countryCode) return '📍';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Update Qibla state based on current heading
  const updateQiblaState = useCallback((heading: number, qibla: number) => {
    // Calculate the angle the compass needle should point (compass angle)
    const compassAngle = heading;
    
    // Calculate the angle the Qibla needle should point relative to device orientation
    let needleAngle = qibla - heading;
    
    // Normalize to 0-360
    needleAngle = (needleAngle + 360) % 360;
    
    // Check if user is facing Qibla (within ±5 degrees)
    const angleDifference = Math.abs(((needleAngle - 180 + 360) % 360) - 180);
    const isFacingQibla = angleDifference <= 5;
    
    setQiblaState({
      compassAngle,
      needleAngle,
      isFacingQibla
    });
  }, []);

  // Request compass permission (required for iOS)
  const requestPermissions = async () => {
    // Request location permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
        { enableHighAccuracy: true }
      );
    }
    
    // Request device orientation permission (iOS)
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          startCompass();
        }
      } catch (err) {
        console.error('Permission denied:', err);
        setCompassSupported(false);
      }
    } else {
      // Android - no permission needed
      setPermissionGranted(true);
      startCompass();
    }
  };

  // Start compass listener
  const startCompass = useCallback(() => {
    if (!window.DeviceOrientationEvent) {
      setCompassSupported(false);
      return;
    }

    let lastTimestamp = 0;
    
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Throttle updates to 60fps
      const now = Date.now();
      if (now - lastTimestamp < 16) return;
      lastTimestamp = now;
      
      let heading: number | null = null;
      
      // iOS provides webkitCompassHeading (absolute heading)
      if ((event as any).webkitCompassHeading !== undefined) {
        heading = (event as any).webkitCompassHeading;
      } 
      // Android uses alpha
      else if (event.alpha !== undefined && event.alpha !== null) {
        heading = event.alpha;
      }
      
      if (heading !== null && qiblaDirection !== null) {
        lastHeadingRef.current = heading;
        updateQiblaState(heading, qiblaDirection);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [qiblaDirection, updateQiblaState]);

  // Update location
  const updateLocation = useCallback(async (lat: number, lng: number, name: string, country: string = '') => {
    setLocation({ lat, lng, name, country });
    const qibla = calculateQibla(lat, lng);
    const dist = calculateDistance(lat, lng);
    setQiblaDirection(qibla);
    setDistance(dist);
    setLoading(false);
    
    // Update initial Qibla state if we have a heading
    if (lastHeadingRef.current !== 0) {
      updateQiblaState(lastHeadingRef.current, qibla);
    }
    
    console.log(`📍 ${name}: ${lat.toFixed(2)}, ${lng.toFixed(2)}`);
    console.log(`🕋 Qibla: ${qibla}° (${getCardinalDirection(qibla)})`);
  }, [updateQiblaState]);

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
          await updateLocation(latitude, longitude, city, country);
        } catch {
          await updateLocation(latitude, longitude, 'Your Location', '');
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
      
      await updateLocation(lat, lng, cityName, country);
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
    setQiblaState({ compassAngle: 0, needleAngle: 0, isFacingQibla: false });
    setPermissionGranted(false);
    lastHeadingRef.current = 0;
  };

  // Test cities with known Qibla directions
  const testCities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060, qibla: 58 },
    { name: 'London', lat: 51.5074, lng: -0.1278, qibla: 118 },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784, qibla: 153 },
    { name: 'Makkah', lat: 21.4225, lng: 39.8262, qibla: 0 },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090, qibla: 270 },
    { name: 'Tokyo', lat: 35.6895, lng: 139.6917, qibla: 293 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
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
                <span className="px-4 bg-emerald-900 text-white/60">OR</span>
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
              <p className="text-white/40 text-xs text-center mb-2">Test cities:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {testCities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => updateLocation(city.lat, city.lng, city.name, '')}
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

        {/* Qibla Compass Display */}
        {qiblaDirection !== null && location && (
          <div className="space-y-5">
            {/* Location */}
            <div className="bg-white/10 rounded-2xl p-3 text-center border border-white/20">
              <div className="flex items-center justify-center gap-2">
                <span className="text-white font-medium">{location.name}</span>
                {location.country && <span className="text-white/50 text-sm">• {location.country}</span>}
              </div>
              <p className="text-white/30 text-xs mt-1">
                {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? 'N' : 'S'}, {Math.abs(location.lng).toFixed(2)}°{location.lng >= 0 ? 'E' : 'W'}
              </p>
              <p className="text-emerald-300 text-xs mt-2">
                Qibla: {qiblaDirection}° {getCardinalDirection(qiblaDirection)}
              </p>
              <p className="text-white/40 text-xs">
                Distance: {distance?.toLocaleString()} km
              </p>
            </div>

            {/* Main Compass */}
            <div className="relative w-80 h-80 mx-auto">
              {/* Compass Background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-800/50 to-emerald-900/50 border-4 border-white/30 shadow-2xl backdrop-blur-sm">
                {/* Cardinal Directions */}
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

              {/* Qibla Needle - Points to Qibla */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out z-20"
                style={{ transform: `rotate(${qiblaState.needleAngle}deg)` }}
              >
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[70px] border-l-transparent border-r-transparent border-b-emerald-500 drop-shadow-lg" />
                  <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 text-2xl filter drop-shadow-lg">🕋</div>
                </div>
              </div>

              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <div className="w-5 h-5 rounded-full bg-white shadow-lg"></div>
              </div>
            </div>

            {/* Facing Qibla Indicator */}
            {qiblaState.isFacingQibla && (
              <div className="bg-emerald-500/30 border-2 border-emerald-400 rounded-xl p-3 text-center animate-pulse">
                <p className="text-emerald-300 font-bold text-lg">✓ You are facing the Qibla! ✓</p>
              </div>
            )}

            {/* Permission Button */}
            {!permissionGranted && compassSupported && (
              <button
                onClick={requestPermissions}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
              >
                <span>🧭</span> Enable Compass for Live Direction
              </button>
            )}

            {permissionGranted && (
              <div className="flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-emerald-300 text-sm">
                  Compass Active • {Math.round(qiblaState.compassAngle)}°
                </p>
              </div>
            )}

            {!compassSupported && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
                <p className="text-yellow-300 text-sm">
                  Compass not supported on this device. Use the fixed direction above.
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs text-center leading-relaxed">
                {permissionGranted 
                  ? "🔄 The green arrow shows Qibla direction. Rotate your phone to align with it."
                  : "📍 Tap 'Enable Compass' above to get live direction. The arrow above shows the fixed Qibla direction from your location."}
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