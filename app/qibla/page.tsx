'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Calculate Qibla direction using spherical law of cosines
function calculateQiblaDirection(lat: number, lng: number): number {
  const lat1 = lat * Math.PI / 180;
  const lon1 = lng * Math.PI / 180;
  const lat2 = KAABA_LAT * Math.PI / 180;
  const lon2 = KAABA_LNG * Math.PI / 180;
  
  const dLon = lon2 - lon1;
  
  // Calculate bearing
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return Math.round(bearing * 10) / 10;
}

// Calculate distance to Kaaba
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

// Get compass direction name
function getDirectionName(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

// Get Arabic direction name
function getArabicDirectionName(deg: number): string {
  const directions = ['شمال', 'شمال-شمال شرقی', 'شمال شرقی', 'شرق-شمال شرقی', 'شرق', 'شرق-جنوب شرقی', 'جنوب شرقی', 'جنوب-جنوب شرقی', 'جنوب', 'جنوب-جنوب غربی', 'جنوب غربی', 'غرب-جنوب غربی', 'غرب', 'غرب-شمال غربی', 'شمال غربی', 'شمال-شمال غربی'];
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
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchCity, setSearchCity] = useState('');
  
  // Compass related states
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [compassSupported, setCompassSupported] = useState(true);
  const [compassPermission, setCompassPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const arrowRef = useRef<HTMLDivElement>(null);
  const compassListenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
  
  // Adjusted Qibla for compass (accounting for device orientation)
  const adjustedQibla = qiblaDirection !== null && compassPermission === 'granted'
    ? (qiblaDirection - deviceHeading + 360) % 360
    : qiblaDirection;

  // Request compass permission (iOS 13+)
  const requestCompassPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
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
      // Android and other devices - no permission needed
      setCompassPermission('granted');
      startCompass();
    }
  };

  // Start compass listener
  const startCompass = useCallback(() => {
    if (compassListenerRef.current) {
      window.removeEventListener('deviceorientation', compassListenerRef.current);
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading = 0;
      
      // iOS provides webkitCompassHeading (absolute heading)
      if (event.webkitCompassHeading !== undefined) {
        heading = event.webkitCompassHeading;
      } 
      // Android uses alpha (relative to north)
      else if (event.alpha !== undefined) {
        heading = event.alpha;
      }
      
      setDeviceHeading(heading);
    };

    compassListenerRef.current = handleOrientation;
    window.addEventListener('deviceorientation', compassListenerRef.current);
    setCompassSupported(true);
  }, []);

  // Stop compass
  const stopCompass = useCallback(() => {
    if (compassListenerRef.current) {
      window.removeEventListener('deviceorientation', compassListenerRef.current);
      compassListenerRef.current = null;
    }
    setCompassPermission('prompt');
    setDeviceHeading(0);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCompass();
    };
  }, [stopCompass]);

  // Auto-start compass if already granted
  useEffect(() => {
    if (compassPermission === 'granted') {
      startCompass();
    }
  }, [compassPermission, startCompass]);

  // Update location and calculate Qibla
  const updateLocation = useCallback(async (lat: number, lng: number, name: string, country: string = '', flag: string = '') => {
    setLocation({ lat, lng, name, country, flag });
    const direction = calculateQiblaDirection(lat, lng);
    const dist = calculateDistance(lat, lng);
    setQiblaDirection(direction);
    setDistance(dist);
    setLoading(false);
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    setLoading(true);
    setError('');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get city name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await response.json();
          
          const city = data.address?.city || data.address?.town || data.address?.village || 'Your Location';
          const country = data.address?.country || '';
          const countryCode = data.address?.country_code?.toUpperCase() || '';
          
          // Get country flag emoji
          const flag = countryCode ? getFlagEmoji(countryCode) : '📍';
          
          await updateLocation(latitude, longitude, city, country, flag);
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          await updateLocation(latitude, longitude, 'Your Location', '', '📍');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === 1) {
          setError('Location access denied. Please enable location services.');
        } else if (error.code === 2) {
          setError('Location unavailable. Please try again.');
        } else {
          setError('Unable to get your location. Please search for a city instead.');
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
      
      // Get country info
      const countryResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
      );
      const countryData = await countryResponse.json();
      const country = countryData.address?.country || '';
      const countryCode = countryData.address?.country_code?.toUpperCase() || '';
      const flag = countryCode ? getFlagEmoji(countryCode) : '📍';
      
      await updateLocation(lat, lng, cityName, country, flag);
    } catch (err) {
      console.error('Search error:', err);
      setError('Error searching for city. Please try again.');
      setLoading(false);
    }
  };

  // Helper to get flag emoji from country code
  const getFlagEmoji = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Reset everything
  const resetLocation = () => {
    setLocation(null);
    setQiblaDirection(null);
    setDistance(null);
    setSearchCity('');
    setError('');
    stopCompass();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm px-6 py-4 flex items-center gap-4 border-b border-emerald-700/50 sticky top-0 z-10">
        <Link href="/" className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1">
          <span>←</span> Back
        </Link>
        <h1 className="text-white font-semibold text-lg flex-1 text-center">🕋 Qibla Finder</h1>
        <div className="w-12"></div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Not Set State */}
        {!qiblaDirection && (
          <div className="space-y-4 animate-fadeIn">
            {/* Info Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
              <div className="text-6xl mb-4">🕋</div>
              <h2 className="text-white text-xl font-semibold mb-2">Find Qibla Direction</h2>
              <p className="text-white/60 text-sm">Find the direction of the Holy Kaaba in Makkah from your location</p>
            </div>

            {/* My Location Button */}
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              <span>📍</span> Use My Current Location
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-emerald-900 text-white/60">OR</span>
              </div>
            </div>

            {/* City Search */}
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
                className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 Search City
              </button>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/60">Finding location...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Qibla Display State */}
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
                {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
              </p>
            </div>

            {/* Compass Circle */}
            <div className="relative w-80 h-80 mx-auto">
              {/* Compass Background */}
              <div className="absolute inset-0 rounded-full bg-emerald-800/30 border-4 border-white/20 shadow-2xl backdrop-blur-sm">
                {/* North Indicator */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                  <div className="text-red-400 font-bold text-sm">N</div>
                  <div className="w-px h-6 bg-red-400/50 mx-auto"></div>
                </div>
                
                {/* South Indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-px h-6 bg-white/30 mx-auto"></div>
                  <div className="text-white/40 font-bold text-sm">S</div>
                </div>
                
                {/* East Indicator */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="text-white/40 font-bold text-sm">E</div>
                  <div className="w-6 h-px bg-white/30 mx-auto"></div>
                </div>
                
                {/* West Indicator */}
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
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
                      className="absolute top-0 left-1/2 w-px"
                      style={{
                        height: isMajor ? '12px' : '6px',
                        background: isMajor ? 'white' : 'rgba(255,255,255,0.3)',
                        transform: `rotate(${rotation}deg) translateX(-50%)`,
                        transformOrigin: '0 160px',
                      }}
                    />
                  );
                })}
              </div>

              {/* Rotating Compass Rose (shows device orientation) */}
              {compassPermission === 'granted' && (
                <div
                  className="absolute inset-0 transition-transform duration-100 ease-linear"
                  style={{ transform: `rotate(${-deviceHeading}deg)` }}
                >
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                    <div className="text-white/60 text-xs">N</div>
                  </div>
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="text-white/30 text-xs">S</div>
                  </div>
                </div>
              )}

              {/* Qibla Arrow (rotates to show Qibla direction) */}
              <div
                ref={arrowRef}
                className="absolute inset-0 transition-all duration-500 ease-out"
                style={{ transform: `rotate(${adjustedQibla || qiblaDirection}deg)` }}
              >
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 flex flex-col items-center">
                  {/* Arrow */}
                  <div className="relative">
                    <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[50px] border-l-transparent border-r-transparent border-b-emerald-500" />
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-2xl filter drop-shadow-lg">
                      🕋
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white shadow-lg z-10"></div>
              </div>
            </div>

            {/* Qibla Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <p className="text-white/50 text-xs mb-1">Qibla Direction</p>
                <p className="text-white text-3xl font-bold">{qiblaDirection}°</p>
                <p className="text-emerald-300 text-sm mt-1">{getDirectionName(qiblaDirection)}</p>
                <p className="text-white/40 text-xs mt-1">{getArabicDirectionName(qiblaDirection)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <p className="text-white/50 text-xs mb-1">Distance to Kaaba</p>
                <p className="text-white text-3xl font-bold">{distance?.toLocaleString()}</p>
                <p className="text-white/60 text-sm mt-1">kilometers</p>
                <p className="text-white/40 text-xs mt-1">~{(distance! * 0.621371).toLocaleString()} miles</p>
              </div>
            </div>

            {/* Compass Status & Permission */}
            {compassPermission === 'prompt' && (
              <button
                onClick={requestCompassPermission}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-xl py-3 font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>🧭</span> Enable Compass for Real-time Direction
              </button>
            )}

            {compassPermission === 'granted' && (
              <div className="flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-emerald-300 text-sm font-medium">Compass Active</p>
                <p className="text-white/40 text-xs">• Point your phone towards Qibla</p>
              </div>
            )}

            {compassPermission === 'denied' && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-yellow-300 text-sm text-center">
                  Compass permission denied. Use the fixed direction above.
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/60 text-xs text-center leading-relaxed">
                {compassPermission === 'granted' 
                  ? '🔄 The arrow updates automatically as you rotate your device. Turn until the arrow points to the green marker (🕋).'
                  : '📍 The arrow shows the fixed Qibla direction from your location. If you have a compass, you can use the degree value.'}
              </p>
            </div>

            {/* Change Location Button */}
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