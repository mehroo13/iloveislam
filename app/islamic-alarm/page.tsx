"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface AlarmConfig {
  type: "fajr_before" | "custom";
  minutesBefore: number;
  customTime: string; // stored as "HH:MM" 24h format
  enabled: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const ADHAN_URL = "https://download.tvquran.com/download/selections/315/5e3f1377ce3df.mp3";
const SURAHS = [
  { id: "mulk", name: "Al-Mulk", arabic: "الملك", url: "https://server8.mp3quran.net/mishary/067.mp3" },
  { id: "rahman", name: "Ar-Rahman", arabic: "الرحمن", url: "https://server8.mp3quran.net/mishary/055.mp3" },
  { id: "duha", name: "Ad-Duha", arabic: "الضحى", url: "https://server8.mp3quran.net/mishary/093.mp3" },
];

// Helper: convert "HH:MM" to minutes since midnight
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Helper: minutes to "HH:MM" (24h)
function minutesToTime(mins: number): string {
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Format 24h string to 12h display
function format12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Convert 12h input (e.g., "05:30 PM") to 24h "17:30"
function twelveToTwentyfour(time12: string): string {
  const [time, mod] = time12.split(" ");
  let [hour, minute] = time.split(":").map(Number);
  if (mod === "PM" && hour !== 12) hour += 12;
  if (mod === "AM" && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

// Calculate last third of night (Tahajjud start)
function getTahajjudTime(isha: string, fajr: string): string {
  let ishaM = timeToMinutes(isha);
  let fajrM = timeToMinutes(fajr);
  if (fajrM < ishaM) fajrM += 1440;
  const nightDur = fajrM - ishaM;
  const lastThirdStart = ishaM + Math.floor((2 * nightDur) / 3);
  return minutesToTime(lastThirdStart % 1440);
}

export default function IslamicAlarmPage() {
  const [activeTab, setActiveTab] = useState<"alarm" | "night" | "duas">("alarm");

  // Prayer times state
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [locationName, setLocationName] = useState("Detecting...");
  const [loading, setLoading] = useState(true);

  // Alarm state
  const [alarm, setAlarm] = useState<AlarmConfig>({
    type: "fajr_before",
    minutesBefore: 15,
    customTime: "05:00", // 5 AM
    enabled: false,
  });
  const [alarmFiring, setAlarmFiring] = useState(false);
  const [showAlhamdulillah, setShowAlhamdulillah] = useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Night player state
  const [selectedSurahIds, setSelectedSurahIds] = useState<string[]>(["mulk"]);
  const [repeatCount, setRepeatCount] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSurahIndex, setCurrentSurahIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const nightAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clock display
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load saved alarm settings
  useEffect(() => {
    const saved = localStorage.getItem("islamicAlarm");
    if (saved) setAlarm(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("islamicAlarm", JSON.stringify(alarm));
  }, [alarm]);

  // Fetch prayer times using Aladhan API
  useEffect(() => {
    const fetchPrayers = async (lat: number, lon: number, cityName?: string) => {
      try {
        const today = new Date();
        const d = today.getDate();
        const m = today.getMonth() + 1;
        const y = today.getFullYear();
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=${lat}&longitude=${lon}&method=2`
        );
        const data = await res.json();
        if (data.code === 200) {
          const timings = data.data.timings;
          setPrayerTimes({
            Fajr: timings.Fajr,
            Dhuhr: timings.Dhuhr,
            Asr: timings.Asr,
            Maghrib: timings.Maghrib,
            Isha: timings.Isha,
          });
          setLocationName(cityName || `${lat.toFixed(1)}, ${lon.toFixed(1)}`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geo = await geoRes.json();
          const city = geo.address?.city || geo.address?.town || "";
          const country = geo.address?.country || "";
          fetchPrayers(latitude, longitude, city ? `${city}, ${country}` : country);
        } catch {
          fetchPrayers(latitude, longitude);
        }
      },
      () => {
        // Fallback to a default city (e.g., Makkah)
        fetchPrayers(21.4225, 39.8262, "Makkah, Saudi Arabia");
      }
    );
  }, []);

  // Compute actual alarm time string (24h)
  const getAlarmTime = useCallback((): string | null => {
    if (!prayerTimes) return null;
    if (alarm.type === "custom") return alarm.customTime;
    if (alarm.type === "fajr_before") {
      const fajrMins = timeToMinutes(prayerTimes.Fajr);
      return minutesToTime(fajrMins - alarm.minutesBefore);
    }
    return null;
  }, [prayerTimes, alarm]);

  // Alarm trigger checker
  useEffect(() => {
    if (!alarm.enabled || !prayerTimes) return;
    const targetTime = getAlarmTime();
    if (!targetTime) return;

    const check = () => {
      const now = new Date();
      const nowStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      if (nowStr === targetTime && !alarmFiring) {
        triggerAlarm();
      }
    };
    const interval = setInterval(check, 10000); // check every 10 seconds
    check();
    return () => clearInterval(interval);
  }, [alarm.enabled, prayerTimes, getAlarmTime, alarmFiring]);

  const triggerAlarm = () => {
    setAlarmFiring(true);
    if (alarmAudioRef.current) {
      alarmAudioRef.current.loop = true;
      alarmAudioRef.current.play().catch(e => console.warn("Audio play blocked:", e));
    }
    // Request wake lock to keep screen on
    if ("wakeLock" in navigator) {
      (navigator as any).wakeLock?.request("screen").catch(console.warn);
    }
  };

  const dismissAlarm = () => {
    setAlarmFiring(false);
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
    setShowAlhamdulillah(true);
    setTimeout(() => setShowAlhamdulillah(false), 3000);
  };

  // Night player logic
  const startNightPlayer = () => {
    if (selectedSurahIds.length === 0) return;
    setIsPlaying(true);
    setCurrentSurahIndex(0);
    setCurrentRepeat(0);
    playCurrentSurah();
  };

  const playCurrentSurah = () => {
    const surahId = selectedSurahIds[currentSurahIndex];
    const surah = SURAHS.find(s => s.id === surahId);
    if (!surah) {
      stopNightPlayer();
      return;
    }
    if (nightAudioRef.current) {
      nightAudioRef.current.src = surah.url;
      nightAudioRef.current.play().catch(e => console.warn("Night player play blocked:", e));
      nightAudioRef.current.onended = () => {
        // Handle repeat and next surah
        if (currentRepeat + 1 < repeatCount) {
          setCurrentRepeat(prev => prev + 1);
          playCurrentSurah(); // replay same surah
        } else {
          // move to next surah
          if (currentSurahIndex + 1 < selectedSurahIds.length) {
            setCurrentSurahIndex(prev => prev + 1);
            setCurrentRepeat(0);
            playCurrentSurah();
          } else {
            stopNightPlayer();
          }
        }
      };
    }
  };

  const stopNightPlayer = () => {
    setIsPlaying(false);
    if (nightAudioRef.current) {
      nightAudioRef.current.pause();
      nightAudioRef.current.currentTime = 0;
      nightAudioRef.current.onended = null;
    }
  };

  const toggleSurah = (id: string) => {
    setSelectedSurahIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Helper for custom time picker (AM/PM)
  const customTime12 = alarm.customTime ? format12h(alarm.customTime) : "05:00 AM";
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const twentyFour = twelveToTwentyfour(e.target.value);
    setAlarm(prev => ({ ...prev, customTime: twentyFour }));
  };

  const clockHours = currentTime.getHours();
  const clockMins = currentTime.getMinutes();
  const clockSecs = currentTime.getSeconds();
  const clockStr = `${(clockHours % 12 || 12).toString().padStart(2, "0")}:${clockMins.toString().padStart(2, "0")}:${clockSecs.toString().padStart(2, "0")} ${clockHours >= 12 ? "PM" : "AM"}`;

  return (
    <div className="app">
      {/* Audio elements */}
      <audio ref={alarmAudioRef} src={ADHAN_URL} preload="auto" />
      <audio ref={nightAudioRef} preload="auto" />

      {/* Alarm firing overlay */}
      {alarmFiring && (
        <div className="overlay alarm-overlay">
          <div className="overlay-content">
            <div className="alarm-icon">⏰</div>
            <div className="alarm-title">Wake up for Fajr!</div>
            <div className="alarm-time">{prayerTimes && format12h(getAlarmTime()!)}</div>
            <button className="dismiss-btn" onClick={dismissAlarm}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Alhamdulillah toast */}
      {showAlhamdulillah && (
        <div className="toast alhamdulillah-toast">
          <div className="toast-arabic">الحمد لله</div>
          <div className="toast-text">Alhamdulillah</div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="logo">🕌 Islamic Companion</div>
        <div className="clock">{clockStr}</div>
      </header>

      {/* Location & prayer times */}
      <div className="prayer-bar">
        <div className="location">📍 {locationName}</div>
        {loading ? (
          <div className="loading">Loading prayer times...</div>
        ) : prayerTimes ? (
          <div className="prayer-row">
            <span>Fajr {format12h(prayerTimes.Fajr)}</span>
            <span>Dhuhr {format12h(prayerTimes.Dhuhr)}</span>
            <span>Asr {format12h(prayerTimes.Asr)}</span>
            <span>Maghrib {format12h(prayerTimes.Maghrib)}</span>
            <span>Isha {format12h(prayerTimes.Isha)}</span>
          </div>
        ) : (
          <div>Unable to load</div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={activeTab === "alarm" ? "active" : ""} onClick={() => setActiveTab("alarm")}>⏰ Alarm</button>
        <button className={activeTab === "night" ? "active" : ""} onClick={() => setActiveTab("night")}>🌙 Night Player</button>
        <button className={activeTab === "duas" ? "active" : ""} onClick={() => setActiveTab("duas")}>🤲 Duas & Dhikr</button>
      </div>

      <main className="content">
        {/* ALARM TAB */}
        {activeTab === "alarm" && (
          <div className="card">
            <h2>Set Your Wake-up Alarm</h2>
            <div className="alarm-type">
              <label>
                <input
                  type="radio"
                  checked={alarm.type === "fajr_before"}
                  onChange={() => setAlarm(a => ({ ...a, type: "fajr_before" }))}
                />
                Before Fajr
              </label>
              <label>
                <input
                  type="radio"
                  checked={alarm.type === "custom"}
                  onChange={() => setAlarm(a => ({ ...a, type: "custom" }))}
                />
                Custom Time
              </label>
            </div>

            {alarm.type === "fajr_before" && (
              <div className="option">
                <label>Minutes before Fajr:</label>
                <select
                  value={alarm.minutesBefore}
                  onChange={e => setAlarm(a => ({ ...a, minutesBefore: Number(e.target.value) }))}
                >
                  <option value={0}>At Fajr time</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            )}

            {alarm.type === "custom" && (
              <div className="option">
                <label>Select time:</label>
                <input
                  type="time"
                  step="60"
                  value={alarm.customTime.slice(0,5)}
                  onChange={e => setAlarm(a => ({ ...a, customTime: e.target.value }))}
                />
                <small className="hint">(24-hour format)</small>
              </div>
            )}

            {prayerTimes && alarm.type === "fajr_before" && (
              <div className="preview">
                <span>🔔 Alarm will ring at</span>
                <strong>{format12h(getAlarmTime()!)}</strong>
              </div>
            )}

            <div className="toggle-row">
              <span>Enable Alarm</span>
              <button
                className={`toggle ${alarm.enabled ? "on" : "off"}`}
                onClick={() => setAlarm(a => ({ ...a, enabled: !a.enabled }))}
              >
                {alarm.enabled ? "ON" : "OFF"}
              </button>
            </div>

            {alarm.enabled && (
              <div className="note">✅ Alarm active – works even when screen is locked.</div>
            )}
          </div>
        )}

        {/* NIGHT PLAYER TAB */}
        {activeTab === "night" && (
          <div className="card">
            <h2>Night Quran Player</h2>
            <p className="sub">Select Surahs to play before sleep</p>
            <div className="surah-list">
              {SURAHS.map(s => (
                <button
                  key={s.id}
                  className={`surah-btn ${selectedSurahIds.includes(s.id) ? "selected" : ""}`}
                  onClick={() => toggleSurah(s.id)}
                >
                  {s.name} <span className="arabic">{s.arabic}</span>
                </button>
              ))}
            </div>
            <div className="option">
              <label>Repeat each Surah:</label>
              <select value={repeatCount} onChange={e => setRepeatCount(Number(e.target.value))}>
                {[1,2,3,5].map(n => <option key={n}>{n} times</option>)}
              </select>
            </div>
            {isPlaying && (
              <div className="now-playing">
                <span>🎵 Now playing:</span>
                <strong>
                  {SURAHS.find(s => s.id === selectedSurahIds[currentSurahIndex])?.name}
                </strong>
                <span>({currentRepeat+1}/{repeatCount})</span>
              </div>
            )}
            <div className="player-buttons">
              {!isPlaying ? (
                <button className="play-btn" onClick={startNightPlayer} disabled={selectedSurahIds.length === 0}>
                  ▶ Start Playing
                </button>
              ) : (
                <button className="stop-btn" onClick={stopNightPlayer}>⏹ Stop</button>
              )}
            </div>
          </div>
        )}

        {/* DUAS & DHIKR TAB (simplified) */}
        {activeTab === "duas" && (
          <div className="card">
            <h2>Morning & Evening Reminders</h2>
            <div className="dua">
              <div className="dua-arabic">الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا</div>
              <div className="dua-trans">Alhamdulillah alladhi ahyana ba'da ma amatana</div>
              <div className="dua-meaning">All praise is for Allah who gave us life after death.</div>
            </div>
            <div className="dua">
              <div className="dua-arabic">اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا</div>
              <div className="dua-trans">Allahumma bismika amootu wa ahya</div>
              <div className="dua-meaning">O Allah, with Your name I die and live.</div>
            </div>
            <div className="dhikr-counter">
              <h3>Simple Dhikr Counter</h3>
              <div className="counter-row">
                <span>سبحان الله</span>
                <button onClick={() => {}}>➕</button>
                <span>0</span>
              </div>
              <p className="hint">(Tap to count – you can expand this later)</p>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: #0a0c15;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          color: #eef2ff;
        }

        .app {
          max-width: 700px;
          margin: 0 auto;
          padding: 1rem;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 1rem 0 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 1rem;
        }
        .logo {
          font-size: 1.2rem;
          font-weight: 600;
          background: linear-gradient(135deg, #f5e56b, #c9a84c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .clock {
          font-family: monospace;
          font-size: 1.3rem;
          font-weight: 600;
          background: rgba(255,255,255,0.05);
          padding: 0.2rem 0.6rem;
          border-radius: 2rem;
        }

        /* Prayer bar */
        .prayer-bar {
          background: rgba(255,255,255,0.03);
          border-radius: 1rem;
          padding: 0.8rem 1rem;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .location {
          font-size: 0.8rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
        }
        .prayer-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          font-size: 0.8rem;
          font-weight: 500;
          justify-content: space-between;
        }
        .prayer-row span {
          background: rgba(201,168,76,0.1);
          padding: 0.2rem 0.6rem;
          border-radius: 1rem;
          color: #f5e56b;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 0.5rem;
        }
        .tabs button {
          background: none;
          border: none;
          padding: 0.5rem 1.2rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 2rem;
          transition: all 0.2s;
        }
        .tabs button.active {
          background: rgba(201,168,76,0.2);
          color: #f5e56b;
        }

        /* Cards */
        .card {
          background: rgba(255,255,255,0.03);
          border-radius: 1.5rem;
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(2px);
        }
        h2 {
          font-size: 1.3rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .sub {
          font-size: 0.8rem;
          color: #9ca3af;
          margin-bottom: 1rem;
        }
        .option {
          margin: 1rem 0;
        }
        label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 0.3rem;
          color: #d1d5db;
        }
        select, input[type="time"] {
          background: #1e1f2c;
          border: 1px solid #2d2f3e;
          padding: 0.5rem 1rem;
          border-radius: 0.8rem;
          color: #fff;
          font-size: 0.9rem;
          width: 100%;
          max-width: 200px;
        }
        .alarm-type {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .alarm-type label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: normal;
        }
        .preview {
          background: rgba(46,204,136,0.1);
          border-left: 3px solid #2ecc88;
          padding: 0.6rem 1rem;
          border-radius: 0.8rem;
          margin: 1rem 0;
          display: flex;
          justify-content: space-between;
        }
        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 1.2rem 0;
        }
        .toggle {
          background: #2d2f3e;
          border: none;
          padding: 0.4rem 1rem;
          border-radius: 2rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        .toggle.on {
          background: #2ecc88;
          color: #000;
        }
        .note {
          font-size: 0.75rem;
          background: rgba(46,204,136,0.15);
          padding: 0.4rem;
          border-radius: 0.5rem;
          text-align: center;
        }

        /* Surah buttons */
        .surah-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-bottom: 1rem;
        }
        .surah-btn {
          background: #1e1f2c;
          border: 1px solid #2d2f3e;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #eef2ff;
        }
        .surah-btn .arabic {
          font-size: 0.8rem;
          margin-left: 0.3rem;
          color: #c9a84c;
        }
        .surah-btn.selected {
          background: rgba(201,168,76,0.2);
          border-color: #c9a84c;
        }
        .now-playing {
          background: #1e1f2c;
          padding: 0.6rem;
          border-radius: 0.8rem;
          margin: 1rem 0;
          display: flex;
          gap: 0.6rem;
          align-items: baseline;
          flex-wrap: wrap;
        }
        .player-buttons {
          margin-top: 1rem;
        }
        .play-btn, .stop-btn {
          width: 100%;
          padding: 0.8rem;
          border-radius: 2rem;
          font-weight: bold;
          font-size: 1rem;
          border: none;
          cursor: pointer;
        }
        .play-btn {
          background: linear-gradient(135deg, #2ecc88, #27ae60);
          color: #fff;
        }
        .stop-btn {
          background: rgba(255,80,80,0.2);
          border: 1px solid #ff4d4d;
          color: #ff8080;
        }
        .play-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Duas */
        .dua {
          background: rgba(255,255,255,0.02);
          border-left: 3px solid #c9a84c;
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 0.8rem;
        }
        .dua-arabic {
          font-size: 1.3rem;
          font-family: 'Amiri', serif;
          direction: rtl;
          margin-bottom: 0.3rem;
        }
        .dua-trans {
          font-size: 0.8rem;
          color: #9ca3af;
          font-style: italic;
        }
        .dua-meaning {
          font-size: 0.8rem;
          margin-top: 0.3rem;
        }
        .dhikr-counter {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .counter-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .hint {
          font-size: 0.7rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        /* Overlays */
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(8px);
        }
        .overlay-content {
          text-align: center;
          background: #0f111a;
          padding: 2rem;
          border-radius: 2rem;
          border: 1px solid #c9a84c;
        }
        .alarm-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        .alarm-title {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .alarm-time {
          font-size: 2.5rem;
          font-weight: 800;
          color: #f5e56b;
          margin-bottom: 1.5rem;
        }
        .dismiss-btn {
          background: #2ecc88;
          border: none;
          padding: 0.8rem 2rem;
          border-radius: 3rem;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
        }
        .toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: #1e1f2c;
          border: 1px solid #c9a84c;
          border-radius: 2rem;
          padding: 0.6rem 1.2rem;
          display: flex;
          gap: 0.8rem;
          align-items: baseline;
          z-index: 1100;
          animation: fadeOut 3s forwards;
        }
        .toast-arabic {
          font-family: 'Amiri', serif;
          font-size: 1.1rem;
          color: #f5e56b;
        }
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(20px); visibility: hidden; }
        }
        @media (max-width: 500px) {
          .prayer-row { font-size: 0.7rem; gap: 0.3rem; }
          .clock { font-size: 1rem; }
          .app { padding: 0.8rem; }
        }
      `}</style>
    </div>
  );
}