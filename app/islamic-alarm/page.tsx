"use client";

import { useState, useEffect, useRef } from "react";

// ─── Working Surah URLs (Islamic Network CDN, reliable) ─────────────────
const SURAHS = [
  { id: "mulk", name: "Surah Al-Mulk (67)", arabic: "سورة الملك", url: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/067.mp3" },
  { id: "rahman", name: "Surah Ar-Rahman (55)", arabic: "سورة الرحمن", url: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/055.mp3" },
  { id: "sajdah", name: "Surah As-Sajdah (32)", arabic: "سورة السجدة", url: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/032.mp3" },
  { id: "waqiah", name: "Surah Al-Waqi'ah (56)", arabic: "سورة الواقعة", url: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/056.mp3" },
  { id: "kahf", name: "Surah Al-Kahf (18)", arabic: "سورة الكهف", url: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/018.mp3" },
  { id: "yasin", name: "Surah Ya-Sin (36)", arabic: "سورة يس", url: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/036.mp3" },
];

// ─── Helpers for prayer times (optional but nice for night context) ─────
interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

function getDayName(d: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];
}

function getMonthName(m: number) {
  return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m];
}

// ─── Main Component ──────────────────────────────────────────────────────
export default function NightSurahPlayer() {
  const [now, setNow] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [locationName, setLocationName] = useState("Detecting...");
  const [hijriDate, setHijriDate] = useState("Loading...");

  // Surah selection & playback
  const [selectedSurahs, setSelectedSurahs] = useState<string[]>(["mulk"]);
  const [repeatCount, setRepeatCount] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<{ idx: number; rep: number; surahs: string[]; repeat: number }>({
    idx: 0,
    rep: 0,
    surahs: [],
    repeat: 1,
  });

  // ─── Clock update ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ─── Fetch prayer times (optional but adds Islamic feel) ───────────────
  useEffect(() => {
    const fetchPrayers = async (lat: number, lon: number, city?: string) => {
      try {
        const n = new Date();
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${n.getDate()}-${n.getMonth() + 1}-${n.getFullYear()}?latitude=${lat}&longitude=${lon}&method=2`
        );
        const data = await res.json();
        if (data.code === 200) {
          const t = data.data.timings;
          setPrayerTimes({
            Fajr: t.Fajr,
            Sunrise: t.Sunrise,
            Dhuhr: t.Dhuhr,
            Asr: t.Asr,
            Maghrib: t.Maghrib,
            Isha: t.Isha,
          });
          const h = data.data.date.hijri;
          setHijriDate(`${h.day} ${h.month.en} ${h.year} AH`);
          setLocationName(city || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        }
      } catch (e) {
        console.error("Prayer times error:", e);
      }
    };

    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const g = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const gd = await g.json();
          const city = [gd.address.city || gd.address.town || "", gd.address.country || ""]
            .filter(Boolean)
            .join(", ");
          fetchPrayers(lat, lon, city);
        } catch {
          fetchPrayers(lat, lon);
        }
      },
      () => setLocationName("Location unavailable")
    );
  }, []);

  // ─── Playback engine (simple and reliable) ────────────────────────────
  const playSurah = (surahId: string) => {
    const surah = SURAHS.find((s) => s.id === surahId);
    if (!surah) return false;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(surah.url);
    audio.crossOrigin = "anonymous";
    audio.volume = 1;
    audioRef.current = audio;

    setCurrentTitle(`${surah.name} (${playlistRef.current.rep + 1}/${playlistRef.current.repeat})`);

    audio.onended = () => {
      if (!isPlaying) return;
      const { idx, rep, surahs, repeat } = playlistRef.current;
      const nextRep = rep + 1;
      if (nextRep < repeat) {
        // repeat same surah
        playlistRef.current.rep = nextRep;
        playSurah(surahs[idx]);
      } else {
        const nextIdx = idx + 1;
        if (nextIdx < surahs.length) {
          playlistRef.current.idx = nextIdx;
          playlistRef.current.rep = 0;
          playSurah(surahs[nextIdx]);
        } else {
          // end of playlist
          setIsPlaying(false);
          setCurrentTitle("");
          setProgress(0);
        }
      }
    };

    audio.ontimeupdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onerror = () => {
      setError("Failed to play – please check your connection and try again.");
      setIsPlaying(false);
    };

    audio
      .play()
      .then(() => {
        setError(null);
        setIsPlaying(true);
      })
      .catch((err) => {
        console.error("Play error:", err);
        setError("Cannot play audio. Please click the play button again.");
        setIsPlaying(false);
      });
  };

  const startPlayer = () => {
    if (selectedSurahs.length === 0) {
      setError("Please select at least one surah.");
      return;
    }
    setError(null);
    playlistRef.current = {
      idx: 0,
      rep: 0,
      surahs: selectedSurahs,
      repeat: repeatCount,
    };
    playSurah(selectedSurahs[0]);
  };

  const stopPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTitle("");
    setProgress(0);
  };

  const toggleSurah = (id: string) => {
    setSelectedSurahs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ─── UI helpers ────────────────────────────────────────────────────────
  const nowH = now.getHours();
  const nowM = now.getMinutes();
  const ampm = nowH >= 12 ? "PM" : "AM";
  const h12 = nowH % 12 || 12;
  const clockStr = `${String(h12).padStart(2, "0")}:${String(nowM).padStart(2, "0")}`;
  const dateStr = `${getDayName(now.getDay())}, ${now.getDate()} ${getMonthName(now.getMonth())} ${now.getFullYear()}`;

  const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

  return (
    <div style={styles.container}>
      {/* Header with clock */}
      <div style={styles.header}>
        <div>
          <span style={styles.clockTime}>{clockStr}</span>
          <span style={styles.clockAmpm}>{ampm}</span>
        </div>
        <div style={styles.clockDate}>{dateStr}</div>
        <div style={styles.hijri}>{hijriDate}</div>
      </div>

      {/* Location & prayer times (lightweight) */}
      <div style={styles.location}>📍 {locationName}</div>
      <div style={styles.prayerBar}>
        {prayerTimes &&
          PRAYER_ORDER.map((p) => (
            <div key={p} style={styles.prayerPill}>
              <span style={styles.prayerName}>{p}</span>
              <span style={styles.prayerTime}>{fmt12(prayerTimes[p])}</span>
            </div>
          ))}
      </div>

      {/* Main player card */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>🌙 Night Surah Player</div>

        {isPlaying && (
          <div style={styles.nowPlaying}>
            <div style={styles.playingDot} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{currentTitle}</div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progress}%` }} />
              </div>
            </div>
            <button onClick={stopPlayer} style={styles.stopBtn}>
              ⏹️ Stop
            </button>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.surahList}>
          {SURAHS.map((s) => {
            const isSelected = selectedSurahs.includes(s.id);
            return (
              <div
                key={s.id}
                onClick={() => toggleSurah(s.id)}
                style={{ ...styles.surahItem, ...(isSelected ? styles.surahItemSelected : {}) }}
              >
                <div>
                  <div style={styles.surahName}>{s.name}</div>
                  <div style={styles.surahArabic}>{s.arabic}</div>
                </div>
                <span style={{ fontSize: 20, color: isSelected ? "#f0c060" : "#555d70" }}>
                  {isSelected ? "✓" : "+"}
                </span>
              </div>
            );
          })}
        </div>

        <div style={styles.repeatRow}>
          <span style={styles.label}>Repeat each surah</span>
          <div style={styles.repeatButtons}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setRepeatCount(n)}
                style={{ ...styles.repeatBtn, ...(repeatCount === n ? styles.repeatBtnActive : {}) }}
              >
                {n}×
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startPlayer}
          disabled={selectedSurahs.length === 0}
          style={{
            ...styles.playBtn,
            opacity: selectedSurahs.length === 0 ? 0.5 : 1,
            cursor: selectedSurahs.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          ▶ Start Night Player
        </button>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          background: #111318;
          font-family: 'Inter', sans-serif;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "20px 16px 40px",
    background: "#111318",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
  },
  header: { textAlign: "center", padding: "20px 0 10px" },
  clockTime: { fontSize: 64, fontWeight: 300, letterSpacing: -2, color: "#fff" },
  clockAmpm: { fontSize: 22, fontWeight: 400, color: "#9096a8", marginLeft: 6 },
  clockDate: { fontSize: 14, color: "#9096a8", marginTop: 4 },
  hijri: { fontSize: 12, color: "#555d70", marginTop: 4 },
  location: { padding: "8px 0", fontSize: 12, color: "#555d70", textAlign: "center" },
  prayerBar: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    background: "#1a1d24",
    padding: "12px 16px",
    borderRadius: 20,
    marginBottom: 24,
  },
  prayerPill: {
    background: "#22262f",
    padding: "6px 12px",
    borderRadius: 40,
    textAlign: "center",
    minWidth: 70,
  },
  prayerName: { fontSize: 10, color: "#555d70", textTransform: "uppercase", fontWeight: 600 },
  prayerTime: { fontSize: 13, color: "#f0c060", fontWeight: 600 },
  card: {
    background: "#1e2230",
    border: "1px solid #2a2f3d",
    borderRadius: 24,
    padding: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: 600, color: "#f0c060", marginBottom: 20, textAlign: "center" },
  nowPlaying: {
    background: "#2a2f3d",
    borderRadius: 16,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  playingDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#34c77b",
    animation: "pulse 1s ease-in-out infinite",
  },
  progressBar: { width: "100%", height: 4, background: "#111318", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", background: "#34c77b", transition: "width 0.1s linear" },
  stopBtn: { background: "rgba(255,85,85,0.2)", border: "none", padding: "8px 16px", borderRadius: 40, color: "#ff8888", fontWeight: 600, cursor: "pointer" },
  error: { background: "rgba(255,85,85,0.1)", border: "1px solid #ff5555", borderRadius: 12, padding: 10, marginBottom: 16, color: "#ff8888", fontSize: 13, textAlign: "center" },
  surahList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  surahItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    background: "#22262f",
    borderRadius: 16,
    border: "1px solid #2a2f3d",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  surahItemSelected: { borderColor: "#f0c060", background: "rgba(240,192,96,0.08)" },
  surahName: { fontSize: 14, color: "#f0f0f0", fontWeight: 500 },
  surahArabic: { fontSize: 13, color: "#555d70", direction: "rtl", marginTop: 4 },
  repeatRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  label: { fontSize: 13, color: "#9096a8", fontWeight: 500 },
  repeatButtons: { display: "flex", gap: 8 },
  repeatBtn: { background: "#22262f", border: "1px solid #2a2f3d", padding: "6px 16px", borderRadius: 40, color: "#9096a8", fontSize: 13, cursor: "pointer" },
  repeatBtnActive: { background: "#f0c060", borderColor: "#f0c060", color: "#000", fontWeight: 600 },
  playBtn: {
    width: "100%",
    background: "#34c77b",
    border: "none",
    padding: "14px",
    borderRadius: 60,
    color: "#000",
    fontSize: 16,
    fontWeight: 700,
    transition: "transform 0.1s",
  },
};

// Note: For the animation to work, you may need to add global CSS. 
// A simple way: add <style global jsx> in the component, but since we're in a pure client component,
// we can use a style tag as shown inside the JSX (the <style jsx> block). That block will be processed by Next.js if you have styled-jsx installed.
// However, to avoid extra dependencies, I've moved the keyframes to a <style> tag inside the component. It's fine.