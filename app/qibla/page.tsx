'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// Kaaba coordinates (Makkah, Saudi Arabia)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Accurate Qibla calculation using the correct spherical trigonometry formula
function calculateQiblaDirection(lat: number, lng: number): number {
  // Convert to radians
  const lat1 = lat * Math.PI / 180;
  const lon1 = lng * Math.PI / 180;
  const lat2 = KAABA_LAT * Math.PI / 180;
  const lon2 = KAABA_LNG * Math.PI / 180;
  
  // Difference in longitude
  const dLon = lon2 - lon1;
  
  // Calculate the qibla angle using the correct formula:
  // qibla = atan2(sin(dLon), cos(lat1)*tan(lat2) - sin(lat1)*cos(dLon))
  const x = Math.sin(dLon);
  const y = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(dLon);
  
  let qibla = Math.atan2(x, y) * 180 / Math.PI;
  
  // Normalize to 0-360 degrees
  qibla = (qibla + 360) % 360;
  
  return Math.round(qibla * 10) / 10;
}

// Alternative calculation using the haversine formula for verification
function calculateQiblaAlternative(lat: number, lng: number): number {
  const lat1 = lat * Math.PI / 180;
  const lon1 = lng * Math.PI / 180;
  const lat2 = KAABA_LAT * Math.PI / 180;
  const lon2 = KAABA_LNG * Math.PI / 180;
  
  const dLon = lon2 - lon1;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return Math.round(bearing * 10) / 10;
}

// Calculate distance to Kaaba using Haversine formula
function calculateDistance(lat: number, lng: number): number {
  const R = 6371; // Earth's radius in km
  const lat1 = lat * Math.PI / 180;
  const lat2 = KAABA_LAT * Math.PI / 180;
  const dLat = (KAABA_LAT - lat) * Math.PI / 180;
  const dLng = (KAABA_LNG - lng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c);
}

// Get compass direction name
function getDirectionName(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
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
  const [qiblaAltDirection, setQiblaAltDirection] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchCity, setSearchCity] = useState('');
  
  // Compass related states
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [compassSupported, setCompassSupported] = useState<boolean>(true);
  const [compassPermission, setCompassPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  // Adjusted Qibla for compass
  const adjustedQibla = qiblaDirection !== null && compassPermission === 'granted'
    ? (qiblaDirection - deviceHeading + 360) % 360
    : qiblaDirection;

  // Get flag emoji
  const getFlagEmoji = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Update location and calculate Qibla
  const updateLocation = useCallback(async (lat: number, lng: number, name: string, country: string = '', flag: string = '') => {
    setLocation({ lat, lng, name, country, flag });
    
    // Calculate using both formulas to verify accuracy
    const direction1 = calculateQiblaDirection(lat, lng);
    const direction2 = calculateQiblaAlternative(lat, lng);
    const dist = calculateDistance(lat, lng);
    
    // Use the average of both calculations for accuracy
    const finalDirection = Math.round((direction1 + direction2) / 2 * 10) / 10;
    
    setQiblaDirection(finalDirection);
    setQiblaAltDirection(direction1);
    setDistance(dist);
    setLoading(false);
  }, []);

  // Request compass permission
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

  // Start compass
  const startCompass = useCallback(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading: number | null = null;
      
      // iOS provides webkitCompassHeading
      if ((event as any).webkitCompassHeading !== undefined) {
        heading = (event as any).webkitCompassHeading;
      } 
      // Android uses alpha
      else if (event.alpha !== undefined && event.alpha !== null) {
        heading = event.alpha;
      }
      
      if (heading !== null) {
        setDeviceHeading(heading);
        setCompassSupported(true);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Auto-start compass on mount for Android
  useEffect(() => {
    // Check if it's Android (no permission needed)
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
      setCompassPermission('granted');
      startCompass();
    }
  }, [startCompass]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
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
          const countryCode = data.address?.country_code?.toUpperCase() || '';
          const flag = countryCode ? getFlagEmoji(countryCode) : '📍';
          
          await updateLocation(latitude, longitude, city, country, flag);
        } catch (err) {
          await updateLocation(latitude, longitude, 'Your Location', '', '📍');
        }
      },
      (error) => {
        setError('Unable to get location. Please enable location services.');
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
      const countryCode = countryData.address?.country_code?.toUpperCase() || '';
      const flag = countryCode ? getFlagEmoji(countryCode) : '📍';
      
      await updateLocation(lat, lng, cityName, country, flag);
    } catch (err) {
      setError('Error searching for city');
      setLoading(false);
    }
  };

  // Reset
  const resetLocation = () => {
    setLocation(null);
    setQiblaDirection(null);
    setDistance(null);
    setSearchCity('');
    setError('');
  };

  // For testing: Known reference points
  // - New York: ~58° (NE)
  // - London: ~118° (ESE)
  // - Istanbul: ~153° (SSE)
  // - Jakarta: ~295° (WNW)
  // - Tokyo: ~293° (WNW)

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
        {/* Location Input State */}
        {!qiblaDirection && (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
              <div className="text-6xl mb-4">🕋</div>
              <h2 className="text-white text-xl font-semibold mb-2">Find Qibla Direction</h2>
              <p className="text-white/60 text-sm">Find the direction of the Holy Kaaba from your location</p>
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
                <span className="px-4 bg-emerald-900 text-white/60">OR</span>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCityHandler()}
                placeholder="Enter city name (e.g., London, New York, Tokyo)"
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-white/40 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={searchCityHandler}
                disabled={loading || !searchCity.trim()}
                className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 font-semibold transition-all disabled:opacity-50"
              >
                🔍 Search City
              </button>
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
          <div className="space-y-5">
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
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full bg-emerald-800/30 border-4 border-white/20 shadow-2xl backdrop-blur-sm">
                {/* Cardinal Directions */}
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
                  <div className="text-red-400 font-bold text-sm">N</div>
                  <div className="w-px h-6 bg-red-400/50 mx-auto"></div>
                </div>
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-px h-6 bg-white/30 mx-auto"></div>
                  <div className="text-white/40 font-bold text-sm">S</div>
                </div>
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                  <div className="text-white/40 font-bold text-sm">E</div>
                  <div className="w-6 h-px bg-white/30 mx-auto"></div>
                </div>
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
                  <div className="text-white/40 font-bold text-sm">W</div>
                  <div className="w-6 h-px bg-white/30 mx-auto"></div>
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
                        height: isMajor ? '10px' : '5px',
                        background: isMajor ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                        transform: `rotate(${rotation}deg) translateX(-50%)`,
                        transformOrigin: '0 144px',
                      }}
                    />
                  );
                })}
              </div>

              {/* Rotating Compass Rose */}
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
                  <div className="relative cursor-pointer">
                    {/* Arrow */}
                    <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[60px] border-l-transparent border-r-transparent border-b-emerald-500 drop-shadow-lg" />
                    {/* Kaaba icon */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-3xl filter drop-shadow-lg">
                      🕋
                    </div>
                  </div>
                </div>
              </div>

              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white shadow-lg z-10"></div>
              </div>
            </div>

            {/* Direction Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <p className="text-white/50 text-xs mb-1">Qibla Direction</p>
                <p className="text-white text-3xl font-bold">{qiblaDirection}°</p>
                <p className="text-emerald-300 text-sm mt-1 font-semibold">{getDirectionName(qiblaDirection)}</p>
                <p className="text-white/40 text-xs mt-2">From North clockwise</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <p className="text-white/50 text-xs mb-1">Distance to Kaaba</p>
                <p className="text-white text-3xl font-bold">{distance?.toLocaleString()}</p>
                <p className="text-white/60 text-sm mt-1">kilometers</p>
                <p className="text-white/40 text-xs mt-2">~{Math.round(distance! * 0.621371).toLocaleString()} miles</p>
              </div>
            </div>

            {/* Reference Directions */}
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/50 text-xs text-center">
                <span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-1"></span> N = North (0°)
                <span className="mx-2">•</span>
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-1"></span> 🕋 = Qibla ({getDirectionName(qiblaDirection)})
              </p>
            </div>

            {/* Compass Button */}
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
                <p className="text-emerald-300 text-sm font-medium">Compass Active</p>
                <p className="text-white/40 text-xs">• Rotate your device</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/60 text-xs text-center leading-relaxed">
                {compassPermission === 'granted' && deviceHeading !== 0
                  ? '🔄 The compass shows your phone\'s orientation. Turn until the green arrow points to 🕋 (Kaaba).'
                  : '📍 The green arrow shows the Qibla direction. Use any compass app to find {getDirectionName(qiblaDirection)} direction.'}
              </p>
              <p className="text-white/40 text-[10px] text-center mt-2">
                For best accuracy: Keep phone flat and away from magnetic interference
              </p>
            </div>

            {/* Change Location */}
            <button
              onClick={resetLocation}
              className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 font-semibold transition-all"
            >
              Change Location
            </button>

            {/* Debug Info (hidden in production) */}
            {process.env.NODE_ENV === 'development' && qiblaAltDirection && (
              <div className="text-white/30 text-[10px] text-center">
                Alt calc: {qiblaAltDirection}°
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}