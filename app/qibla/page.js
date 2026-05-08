export const metadata = {
  title: 'Qibla Finder — Find Direction of Mecca | I Love Islam',
  description: 'Find the exact Qibla direction from anywhere in the world using your GPS. Free online Qibla compass. No sign-up needed.',
}

'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

function getQiblaDirection(lat, lng) {
  const meccaLat = 21.4225;
  const meccaLng = 39.8262;
  
  const lat1 = lat * (Math.PI / 180);
  const lon1 = lng * (Math.PI / 180);
  const lat2 = meccaLat * (Math.PI / 180);
  const lon2 = meccaLng * (Math.PI / 180);
  
  const dLon = lon2 - lon1;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

function getDistance(lat, lng) {
  const R = 6371;
  const meccaLat = 21.4225;
  const meccaLng = 39.8262;
  
  const lat1 = lat * (Math.PI / 180);
  const lat2 = meccaLat * (Math.PI / 180);
  const dLat = (meccaLat - lat) * (Math.PI / 180);
  const dLon = (meccaLng - lng) * (Math.PI / 180);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c);
}

function getDirection(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export default function QiblaFinder() {
  const [qibla, setQibla] = useState(null);
  const [distance, setDistance] = useState(null);
  const [cityName, setCityName] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [hasCompass, setHasCompass] = useState(false);
  const [adjustedQibla, setAdjustedQibla] = useState(null);
  const compassListenerRef = useRef(null);

  const requestCompassPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          startCompass();
        }
      } catch (err) {
        console.error('Permission denied');
      }
    } else {
      startCompass();
    }
  };

  const startCompass = () => {
    const handleDeviceOrientation = (event) => {
      let heading = 0;
      
      if (event.webkitCompassHeading !== undefined) {
        heading = event.webkitCompassHeading;
      } else if (event.alpha !== undefined) {
        heading = (event.alpha + 90) % 360;
      }
      
      setDeviceHeading(heading);
      setHasCompass(true);
    };

    if (compassListenerRef.current) {
      window.removeEventListener('deviceorientation', compassListenerRef.current);
    }

    compassListenerRef.current = handleDeviceOrientation;
    window.addEventListener('deviceorientation', handleDeviceOrientation);
  };

  const stopCompass = () => {
    if (compassListenerRef.current) {
      window.removeEventListener('deviceorientation', compassListenerRef.current);
      compassListenerRef.current = null;
    }
    setHasCompass(false);
    setDeviceHeading(0);
  };

  useEffect(() => {
    if (qibla !== null && hasCompass) {
      const adjusted = (qibla - deviceHeading + 360) % 360;
      setAdjustedQibla(adjusted);
    }
  }, [qibla, deviceHeading, hasCompass]);

  useEffect(() => {
    return () => {
      stopCompass();
    };
  }, []);

  const processLocation = async (lat, lng, name) => {
    const direction = getQiblaDirection(lat, lng);
    const dist = getDistance(lat, lng);
    
    setQibla(Math.round(direction * 10) / 10);
    setDistance(dist);
    setCityName(name);
    setLoading(false);
    
    if (hasCompass === false) {
      setTimeout(() => {
        requestCompassPermission();
      }, 500);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported');
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const geoData = await geo.json();
          const city = geoData.address?.city || geoData.address?.town || 'Your Location';
          processLocation(latitude, longitude, city);
        } catch {
          processLocation(latitude, longitude, 'Your Location');
        }
      },
      () => { setError('Location denied'); setLoading(false); }
    );
  };

  const searchCity = async () => {
    if (!manualCity.trim()) return;
    setLoading(true);
    setError('');
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCity)}&format=json&limit=1`);
      const data = await geo.json();
      if (!data.length) { setError('City not found'); setLoading(false); return; }
      processLocation(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name.split(',')[0]);
    } catch {
      setError('Error finding city'); setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900">
      <header className="px-6 py-4 flex items-center gap-4 border-b border-emerald-700">
        <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        <h1 className="text-white font-semibold">Qibla Finder</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {!qibla ? (
          <div className="space-y-4">
            <button onClick={useMyLocation} disabled={loading}
              className="w-full bg-white text-emerald-900 rounded-lg py-3 font-semibold hover:bg-gray-100 disabled:opacity-50">
              📍 Use My Location
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualCity}
                onChange={e => setManualCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchCity()}
                placeholder="Enter city..."
                className="flex-1 bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 placeholder-white/50"
              />
              <button onClick={searchCity} disabled={loading}
                className="bg-white text-emerald-900 rounded-lg px-4 font-semibold hover:bg-gray-100 disabled:opacity-50">
                Search
              </button>
            </div>

            {error && <p className="text-red-300 text-sm text-center">{error}</p>}
            {loading && <p className="text-white/60 text-sm text-center">Finding location...</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Compass Display */}
            <div className="relative w-72 h-72 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-white/20 bg-emerald-800/50 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                {/* Cardinal Directions */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    transition: hasCompass ? 'transform 0.1s linear' : 'none',
                    transform: hasCompass ? `rotate(${-deviceHeading}deg)` : 'rotate(0deg)',
                  }}
                >
                  <span className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white font-bold">N</span>
                  <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 font-bold">S</span>
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 font-bold">E</span>
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 font-bold">W</span>
                </div>

                {/* Qibla Arrow */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `rotate(${hasCompass ? adjustedQibla : qibla}deg)`,
                    transition: hasCompass ? 'transform 0.1s linear' : 'transform 1s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div style={{ marginTop: '20px' }}>
                      <div style={{
                        width: 0,
                        height: 0,
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderBottom: '120px solid #10b981',
                      }} />
                    </div>
                    <div style={{ fontSize: '32px', marginTop: '-8px' }}>🕋</div>
                  </div>
                </div>

                {/* Center Dot */}
                <div className="w-5 h-5 rounded-full bg-white border-2 border-emerald-900 z-10" />
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                <p className="text-white/60 text-xs mb-1">Bearing</p>
                <p className="text-white text-2xl font-bold">{qibla}°</p>
                <p className="text-white/60 text-xs mt-1">{getDirection(qibla)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                <p className="text-white/60 text-xs mb-1">Distance</p>
                <p className="text-white text-2xl font-bold">{distance}</p>
                <p className="text-white/60 text-xs mt-1">km</p>
              </div>
            </div>

            {/* Location */}
            <div className="text-center text-white/70 text-sm">
              📍 {cityName}
            </div>

            {/* Compass Status */}
            {!hasCompass && (
              <button onClick={requestCompassPermission}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg py-2 text-sm transition-colors">
                📱 Enable Compass
              </button>
            )}

            {hasCompass && (
              <div className="text-center text-green-300 text-xs font-semibold">
                ✓ Compass Active
              </div>
            )}

            {/* Change Location */}
            <button onClick={() => { setQibla(null); setManualCity(''); stopCompass(); }}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg py-2 text-sm transition-colors">
              Change Location
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
