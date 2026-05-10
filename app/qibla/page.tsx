'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// ACCURATE Qibla calculation - Standard formula used by online Qibla tools
function calculateQibla(latitude: number, longitude: number): number {
  // Convert to radians
  const latUser = latitude * Math.PI / 180;
  const lonUser = longitude * Math.PI / 180;
  const latKaaba = KAABA_LAT * Math.PI / 180;
  const lonKaaba = KAABA_LNG * Math.PI / 180;
  
  // Difference in longitude
  const deltaLon = lonKaaba - lonUser;
  
  // Calculate the Qibla bearing using the standard formula
  // y = sin(deltaLon)
  // x = cos(latUser) * tan(latKaaba) - sin(latUser) * cos(deltaLon)
  // qibla = atan2(y, x)
  
  const y = Math.sin(deltaLon);
  const x = Math.cos(latUser) * Math.tan(latKaaba) - Math.sin(latUser) * Math.cos(deltaLon);
  
  let qibla = Math.atan2(y, x) * 180 / Math.PI;
  
  // Normalize to 0-360 degrees
  qibla = (qibla + 360) % 360;
  
  return Math.round(qibla * 10) / 10;
}

// Calculate distance using Haversine formula
function calculateDistance(lat: number, lng: number): number {
  const R = 6371; // Earth's radius in km
  const lat1 = lat * Math.PI / 180;
  const lat2 = KAABA_LAT * Math.PI / 180;
  const dLat = (KAABA_LAT - lat) * Math.PI / 180;
  const dLon = (KAABA_LNG - lng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c);
}

// Get cardinal direction
function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
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
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [compassPermission, setCompassPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [compassSupported, setCompassSupported] = useState<boolean>(true);

  // Get flag emoji
  const getFlagEmoji = (countryCode: string): string => {
    if (!countryCode) return '📍';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Update location and calculate Qibla
  const updateLocation = useCallback(async (lat: number, lng: number, name: string, country: string = '', flag: string = '') => {
    setLocation({ lat, lng, name, country, flag });
    
    const qibla = calculateQibla(lat, lng);
    const dist = calculateDistance(lat, lng);
    
    console.log(`Location: ${name} (${lat}, ${lng})`);
    console.log(`Qibla Direction: ${qibla}° (${getCardinalDirection(qibla)})`);
    console.log(`Distance to Kaaba: ${dist} km`);
    
    setQiblaDirection(qibla);
    setDistance(dist);
    setLoading(false);
  }, []);

  // Request compass permission (iOS 13+)
  const requestCompassPermission = async () => {
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
        console.error('Permission error:', err);
        setCompassPermission('denied');
      }
    } else {
      // Android and other devices
      setCompassPermission('granted');
      startCompass();
    }
  };

  // Start compass listener
  const startCompass = useCallback(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading: number | null = null;
      
      // iOS provides webkitCompassHeading (absolute heading)
      if ((event as any).webkitCompassHeading !== undefined) {
        heading = (event as any).webkitCompassHeading;
        setCompassSupported(true);
      } 
      // Android uses alpha (relative to north)
      else if (event.alpha !== undefined && event.alpha !== null) {
        heading = event.alpha;
        setCompassSupported(true);
      }
      
      if (heading !== null) {
        setDeviceHeading(heading);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Auto-start compass for Android
  useEffect(() => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
      setCompassPermission('granted');
      startCompass();
    }
  }, [startCompass]);

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
          const flag = getFlagEmoji(countryCode);
          await updateLocation(latitude, longitude, city, country, flag);
        } catch (err) {
          await updateLocation(latitude, longitude, 'Your Location', '', '📍');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === 1) {
          setError('Location access denied. Please enable location services.');
        } else if (err.code === 2) {
          setError('Location unavailable. Please try again.');
        } else {
          setError('Unable to get your location. Please search for a city.');
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
        setError('City not found. Please try again.');
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
      const flag = getFlagEmoji(countryCode);
      
      await updateLocation(lat, lng, cityName, country, flag);
    } catch (err) {
      console.error('Search error:', err);
      setError('Error searching for city. Please try again.');
      setLoading(false);
    }
  };

  // Test with known cities for verification
  const testCity = (cityName: string, lat: number, lng: number) => {
    updateLocation(lat, lng, cityName, 'Test Location', '🧪');
  };

  const resetLocation = () => {
    setLocation(null);
    setQiblaDirection(null);
    setDistance(null);
    setSearchCity('');
    setError('');
  };

  // Adjusted Qibla for compass (accounts for device orientation)
  const adjustedQibla = qiblaDirection !== null && compassPermission === 'granted'
    ? (qiblaDirection - deviceHeading + 360) % 360
    : qiblaDirection;

  // Test cities with known Qibla directions
  const testCities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060, expected: '58° (NE)' },
    { name: 'London', lat: 51.5074, lng: -0.1278, expected: '118° (ESE)' },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784, expected: '153° (SSE)' },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090, expected: '270° (W)' },
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456, expected: '295° (WNW)' },
    { name: 'Tokyo', lat: 35.6895, lng: 139.6917, expected: '293° (WNW)' },
    { name: 'Cairo', lat: 30.0444, lng: 31.2357, expected: '135° (SE)' },
    { name: 'Moscow', lat: 55.7558, lng: 37.6173, expected: '193° (SSW)' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm px-4 sm:px-6 py-4 flex items-center gap-4 border-b border-emerald-700/50 sticky top-0 z-10">
        <Link href="/" className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1">
          <span>←</span> Back
        </Link>
        <h1 className="text-white font-semibold text-base sm:text-lg flex-1 text-center">🕋 Qibla Finder</h1>
        <div className="w-12"></div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Location Selection */}
        {!qiblaDirection && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
              <div className="text-6xl mb-4">🕋</div>
              <h2 className="text-white text-xl font-semibold mb-2">Find Qibla Direction</h2>
              <p className="text-white/60 text-sm">Use your location or search for any city</p>
            </div>

            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              <span>📍</span> Use My Current Location
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-emerald-900 text-white/60">OR SEARCH</span>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCityHandler()}
                placeholder="Enter city name (e.g., London, New York, Tokyo)"
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                onClick={searchCityHandler}
                disabled={loading || !searchCity.trim()}
                className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 font-semibold transition-all disabled:opacity-50"
              >
                🔍 Search City
              </button>
            </div>

            {/* Test Cities */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-white/50 text-xs text-center mb-3">Test with known cities:</p>
              <div className="grid grid-cols-2 gap-2">
                {testCities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => testCity(city.name, city.lat, city.lng)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-white/80 text-sm transition-all"
                  >
                    {city.name}
                    <span className="text-white/40 text-xs block">{city.expected}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/60">Finding location...</p>
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
          <div className="space-y-5 animate-fadeIn">
            {/* Location Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">{location.flag}</span>
                <span className="text-white font-medium">{location.name}</span>
                {location.country && <span className="text-white/60 text-sm">• {location.country}</span>}
              </div>
              <p className="text-white/40 text-xs">
                {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? 'N' : 'S'}, {Math.abs(location.lng).toFixed(2)}°{location.lng >= 0 ? 'E' : 'W'}
              </p>
            </div>

            {/* Compass Circle */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto">
              {/* Background Circle */}
              <div className="absolute inset-0 rounded-full bg-emerald-800/30 border-4 border-white/20 shadow-2xl backdrop-blur-sm">
                {/* North */}
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
                  <div className="text-red-400 font-bold text-sm">N</div>
                  <div className="w-px h-6 bg-red-400/50 mx-auto"></div>
                </div>
                {/* South */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-px h-6 bg-white/30 mx-auto"></div>
                  <div className="text-white/40 font-bold text-sm">S</div>
                </div>
                {/* East */}
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                  <div className="text-white/40 font-bold text-sm">E</div>
                  <div className="w-6 h-px bg-white/30 mx-auto"></div>
                </div>
                {/* West */}
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
                  <div className="text-white/40 font-bold text-sm">W</div>
                  <div className="w-6 h-px bg-white/30 mx-auto"></div>
                </div>

                {/* Degree marks */}
                {[...Array(36)].map((_, i) => {
                  const rotation = i * 10;
                  const isMajor = i % 3 === 0;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 left-1/2"
                      style={{
                        width: '1px',
                        height: isMajor ? '10px' : '5px',
                        background: isMajor ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                        transform: `rotate(${rotation}deg) translateX(-50%)`,
                        transformOrigin: '0 144px',
                      }}
                    />
                  );
                })}
              </div>

              {/* Rotating compass (device orientation) */}
              {compassPermission === 'granted' && deviceHeading !== 0 && (
                <div
                  className="absolute inset-0 transition-transform duration-100 ease-linear"
                  style={{ transform: `rotate(${-deviceHeading}deg)` }}
                >
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                    <div className="text-white/50 text-[10px]">N</div>
                  </div>
                </div>
              )}

              {/* Qibla Arrow */}
              <div
                className="absolute inset-0 transition-all duration-500 ease-out"
                style={{ transform: `rotate(${adjustedQibla}deg)` }}
              >
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[60px] border-l-transparent border-r-transparent border-b-emerald-500 drop-shadow-lg" />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-3xl filter drop-shadow-lg">🕋</div>
                </div>
              </div>

              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white shadow-lg z-10"></div>
              </div>
            </div>

            {/* Qibla Information */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <p className="text-white/50 text-xs mb-1">Qibla Direction</p>
                <p className="text-white text-3xl font-bold">{qiblaDirection}°</p>
                <p className="text-emerald-300 text-sm mt-1 font-semibold">{getCardinalDirection(qiblaDirection)}</p>
                <p className="text-white/40 text-xs mt-2">Clockwise from North</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <p className="text-white/50 text-xs mb-1">Distance to Kaaba</p>
                <p className="text-white text-3xl font-bold">{distance?.toLocaleString()}</p>
                <p className="text-white/60 text-sm mt-1">kilometers</p>
                <p className="text-white/40 text-xs mt-2">~{Math.round(distance! * 0.621371).toLocaleString()} miles</p>
              </div>
            </div>

            {/* Compass Status */}
            {compassPermission === 'prompt' && (
              <button
                onClick={requestCompassPermission}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-xl py-3 font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>🧭</span> Enable Compass for Real-time Direction
              </button>
            )}

            {compassPermission === 'granted' && deviceHeading !== 0 && (
              <div className="flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-emerald-300 text-sm font-medium">Compass Active • Rotate your device</p>
              </div>
            )}

            {compassPermission === 'granted' && deviceHeading === 0 && (
              <div className="flex items-center justify-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl py-2">
                <p className="text-yellow-300 text-sm">Waiting for compass data...</p>
              </div>
            )}

            {compassPermission === 'denied' && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-yellow-300 text-sm text-center">
                  Compass permission denied. Use the fixed direction above with any compass app.
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-white/60 text-xs">
                <span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-1"></span> North = 0°
                <span className="mx-2">•</span>
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-1"></span> 🕋 = Qibla ({getCardinalDirection(qiblaDirection)})
              </p>
              {compassPermission === 'granted' && (
                <p className="text-white/40 text-[10px] mt-2">
                  Turn your device until the green arrow points to 🕋
                </p>
              )}
            </div>

            {/* Change Location */}
            <button
              onClick={resetLocation}
              className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 font-semibold transition-all"
            >
              Change Location
            </button>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}