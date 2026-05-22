"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Surahs ───────────────────────────────────────────────────────────────────
const SURAHS = [
  {
    id: "kahf", number: 18, name: "Surah Al-Kahf", arabic: "سورة الكهف",
    meaning: "The Cave", ayahs: 110,
    description: "Protection from Dajjal — recite on Fridays",
    color: "#1a2e2a", accent: "#34d399", moon: "🕌",
    url: "/audio/018 Kahf.mp3", fallbackUrl: "/audio/018 Kahf.mp3",
  },
  {
    id: "yasin", number: 36, name: "Surah Ya-Sin", arabic: "سورة يس",
    meaning: "Ya Sin", ayahs: 83,
    description: "The heart of the Quran",
    color: "#1e1a3a", accent: "#a78bfa", moon: "💫",
    url: "/audio/036 Yasin.mp3", fallbackUrl: "/audio/036 Yasin.mp3",
  },
  {
    id: "najam", number: 53, name: "Surah An-Najm", arabic: "سورة النجم",
    meaning: "The Star", ayahs: 62,
    description: "Revelation of divine truth and guidance",
    color: "#1a1e2e", accent: "#93c5fd", moon: "⭐",
    url: "/audio/053 Najam.mp3", fallbackUrl: "/audio/053 Najam.mp3",
  },
  {
    id: "rahman", number: 55, name: "Surah Ar-Rahman", arabic: "سورة الرحمن",
    meaning: "The Most Merciful", ayahs: 78,
    description: "Reminder of Allah's endless blessings",
    color: "#1a2a3a", accent: "#60a5fa", moon: "✨",
    url: "/audio/055 Rehman.mp3", fallbackUrl: "/audio/055 Rehman.mp3",
  },
  {
    id: "waqia", number: 56, name: "Surah Al-Waqi'ah", arabic: "سورة الواقعة",
    meaning: "The Inevitable Event", ayahs: 96,
    description: "Protection from poverty — recite every night",
    color: "#2a1a1a", accent: "#f87171", moon: "🔥",
    url: "/audio/056 Waqia.mp3", fallbackUrl: "/audio/056 Waqia.mp3",
  },
  {
    id: "mulk", number: 67, name: "Surah Al-Mulk", arabic: "سورة الملك",
    meaning: "The Sovereignty", ayahs: 30,
    description: "Protection from the punishment of the grave",
    color: "#1a3a2e", accent: "#4ade80", moon: "🌙",
    url: "/audio/067 Mulk.mp3", fallbackUrl: "/audio/067 Mulk.mp3",
  },
  {
    id: "duha", number: 93, name: "Surah Ad-Duha", arabic: "سورة الضحى",
    meaning: "The Morning Brightness", ayahs: 11,
    description: "Allah has not forsaken you — peace before sleep",
    color: "#2a1a0e", accent: "#fb923c", moon: "🌟",
    url: "/audio/093 Duha.mp3", fallbackUrl: "/audio/093 Duha.mp3",
  },
];

const REPEAT_OPTIONS = [1, 2, 3, 5, 7, 10];
const SLEEP_TIMER_OPTIONS = [0, 15, 30, 60, 90]; // 0 = off

type PlayMode = "single" | "combo";
type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "done";

interface QueueItem {
  surahId: string;
  totalRepeats: number;
}

// ─── Local storage helpers ────────────────────────────────────────────────────
const LS_KEY = "night-recitation-state";
function saveState(data: object) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function NightPage() {
  // ── Mode
  const [mode, setMode] = useState<PlayMode>("single");
  const [noteOpen, setNoteOpen] = useState(false);

  // ── Single mode
  const [selectedSurahId, setSelectedSurahId] = useState<string>("mulk");
  const [singleRepeats, setSingleRepeats] = useState(1);

  // ── Combo mode
  const [comboOrder, setComboOrder] = useState<string[]>([]);
  const [comboRepeats, setComboRepeats] = useState<Record<string, number>>(
    Object.fromEntries(SURAHS.map((s) => [s.id, 1]))
  );

  // ── Player state
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [totalRepeats, setTotalRepeats] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSticky, setShowSticky] = useState(false);

  // ── Sleep timer
  const [sleepMinutes, setSleepMinutes] = useState(0); // 0 = off
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState(0);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Repeat flash animation
  const [repeatFlash, setRepeatFlash] = useState(false);

  // ── Completion burst
  const [showBurst, setShowBurst] = useState(false);

  // ── Wake lock
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [wakeLockOn, setWakeLockOn] = useState(false);

  // ── Volume (for fade-out)
  const [volume, setVolume] = useState(1);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Refs for audio engine
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const playerCardRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const currentIdxRef = useRef(0);
  const currentRepeatRef = useRef(1);
  const statusRef = useRef<PlayerStatus>("idle");

  const updateStatus = useCallback((s: PlayerStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // ── Stars (stable)
  const stars = useRef(
    Array.from({ length: 80 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.6 + 0.2,
      delay: Math.random() * 4,
    }))
  ).current;

  // ── Burst particles (stable)
  const burstParticles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      angle: (i / 18) * 360,
      dist: 40 + Math.random() * 30,
      size: 3 + Math.random() * 4,
      color: ["#34d399","#a78bfa","#60a5fa","#fb923c","#f87171","#fbbf24"][i % 6],
    }))
  ).current;

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const getSurah = (id: string) => SURAHS.find((s) => s.id === id) ?? SURAHS[5];
  const selectedSurah = getSurah(selectedSurahId);
  const activeQueue = queueRef.current;
  const activeSurahDisplay =
    activeQueue.length > 0 &&
    (status === "playing" || status === "paused" || status === "loading")
      ? getSurah(activeQueue[currentIdx]?.surahId ?? activeQueue[0].surahId)
      : selectedSurah;
  const accent = activeSurahDisplay.accent;

  // ─── Restore state from localStorage on mount ─────────────────────────────
  useEffect(() => {
    const saved = loadState();
    if (!saved) return;
    if (saved.mode) setMode(saved.mode);
    if (saved.selectedSurahId) setSelectedSurahId(saved.selectedSurahId);
    if (saved.singleRepeats) setSingleRepeats(saved.singleRepeats);
    if (saved.comboOrder) setComboOrder(saved.comboOrder);
    if (saved.comboRepeats) setComboRepeats(saved.comboRepeats);
  }, []);

  // ─── Persist state on changes ─────────────────────────────────────────────
  useEffect(() => {
    saveState({ mode, selectedSurahId, singleRepeats, comboOrder, comboRepeats });
  }, [mode, selectedSurahId, singleRepeats, comboOrder, comboRepeats]);

  // ─── Sticky player on scroll ──────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const card = playerCardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      setShowSticky(rect.top < -60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Wake lock ────────────────────────────────────────────────────────────
  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
      setWakeLockOn(true);
      wakeLockRef.current.addEventListener("release", () => setWakeLockOn(false));
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setWakeLockOn(false);
    }
  }, []);

  // ─── Sleep timer logic ────────────────────────────────────────────────────
  const clearSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepSecondsLeft(0);
  }, []);

  const startSleepTimer = useCallback((minutes: number) => {
    clearSleepTimer();
    if (minutes === 0) return;
    let secs = minutes * 60;
    setSleepSecondsLeft(secs);
    sleepTimerRef.current = setInterval(() => {
      secs -= 1;
      setSleepSecondsLeft(secs);
      // Start fade at 30s remaining
      if (secs === 30 && audioRef.current) {
        let vol = audioRef.current.volume;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = setInterval(() => {
          vol = Math.max(0, vol - 0.033);
          if (audioRef.current) audioRef.current.volume = vol;
          setVolume(vol);
          if (vol <= 0 && fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
          }
        }, 1000);
      }
      if (secs <= 0) {
        clearSleepTimer();
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.volume = 1; }
        setVolume(1);
        updateStatus("done");
        if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
      }
    }, 1000);
  }, [clearSleepTimer, updateStatus]);

  const fmtTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Core audio loader ref ─────────────────────────────────────────────────
  const loadAndPlayRef = useRef<(surahId: string) => void>(() => {});

  useEffect(() => {
    loadAndPlayRef.current = (surahId: string) => {
      const surah = getSurah(surahId);
      if (!audioRef.current) return;
      updateStatus("loading");
      if (audioRef.current.volume < 1) { audioRef.current.volume = 1; setVolume(1); }
      audioRef.current.src = surah.url;
      audioRef.current.load();

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: surah.name,
          artist: surah.arabic,
          album: "Night Recitation · القرآن الكريم",
        });
      }

      audioRef.current.play().catch(() => {
        if (!audioRef.current) return;
        audioRef.current.src = surah.fallbackUrl;
        audioRef.current.load();
        audioRef.current.play().catch(() => updateStatus("idle"));
      });
    };
  });

  // ─── Audio setup (once) ───────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.setAttribute("playsinline", "true");
    audioRef.current = audio;

    const onPlay = () => updateStatus("playing");
    const onPause = () => { if (!audio.ended) updateStatus("paused"); };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setProgress(audio.currentTime);

    const onEnded = () => {
      const q = queueRef.current;
      const idx = currentIdxRef.current;
      const item = q[idx];
      if (!item) { updateStatus("done"); triggerBurst(); return; }

      const nextRepeat = currentRepeatRef.current + 1;
      if (nextRepeat <= item.totalRepeats) {
        currentRepeatRef.current = nextRepeat;
        setCurrentRepeat(nextRepeat);
        // Flash the repeat counter
        setRepeatFlash(true);
        setTimeout(() => setRepeatFlash(false), 600);
        setTimeout(() => loadAndPlayRef.current(item.surahId), 400);
        return;
      }

      const nextIdx = idx + 1;
      if (nextIdx >= q.length) {
        updateStatus("done");
        setProgress(0);
        triggerBurst();
        clearSleepTimer();
        releaseWakeLock();
        return;
      }

      const nextItem = q[nextIdx];
      currentIdxRef.current = nextIdx;
      currentRepeatRef.current = 1;
      setCurrentIdx(nextIdx);
      setCurrentRepeat(1);
      setTotalRepeats(nextItem.totalRepeats);
      setProgress(0);
      setTimeout(() => loadAndPlayRef.current(nextItem.surahId), 400);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
      });
    }

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Completion burst ──────────────────────────────────────────────────────
  const triggerBurst = () => {
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 1800);
  };

  // ─── Haptic ───────────────────────────────────────────────────────────────
  const haptic = () => {
    if ("vibrate" in navigator) navigator.vibrate(8);
  };

  // ─── Playback controls ────────────────────────────────────────────────────
  const startPlayback = useCallback(() => {
    let q: QueueItem[];
    if (mode === "single") {
      q = [{ surahId: selectedSurahId, totalRepeats: singleRepeats }];
    } else {
      if (comboOrder.length === 0) return;
      q = comboOrder.map((id) => ({ surahId: id, totalRepeats: comboRepeats[id] ?? 1 }));
    }
    queueRef.current = q;
    currentIdxRef.current = 0;
    currentRepeatRef.current = 1;
    setCurrentIdx(0);
    setCurrentRepeat(1);
    setTotalRepeats(q[0].totalRepeats);
    setProgress(0);
    setDuration(0);
    setShowBurst(false);
    haptic();
    if (sleepMinutes > 0) startSleepTimer(sleepMinutes);
    loadAndPlayRef.current(q[0].surahId);
  }, [mode, selectedSurahId, singleRepeats, comboOrder, comboRepeats, sleepMinutes, startSleepTimer]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current.volume = 1; }
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    clearSleepTimer();
    releaseWakeLock();
    queueRef.current = [];
    currentIdxRef.current = 0;
    currentRepeatRef.current = 1;
    updateStatus("idle");
    setProgress(0);
    setDuration(0);
    setCurrentIdx(0);
    setCurrentRepeat(1);
    setVolume(1);
    haptic();
  }, [clearSleepTimer, releaseWakeLock, updateStatus]);

  const togglePause = useCallback(() => {
    if (!audioRef.current) return;
    haptic();
    if (statusRef.current === "playing") {
      audioRef.current.pause();
    } else if (statusRef.current === "paused") {
      audioRef.current.play();
    }
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!audioRef.current || duration === 0) return;
      const bar = progressBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      audioRef.current.currentTime = pct * duration;
      setProgress(pct * duration);
    },
    [duration]
  );

  const skip = useCallback((seconds: number) => {
    if (!audioRef.current || duration === 0) return;
    haptic();
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  }, [duration]);

  // ─── Toggle wake lock when playing ────────────────────────────────────────
  useEffect(() => {
    if (status === "playing") {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [status, requestWakeLock, releaseWakeLock]);

  // ─── Single mode select ───────────────────────────────────────────────────
  const handleSelectSingle = (id: string) => {
    haptic();
    stopPlayback();
    setSelectedSurahId(id);
  };

  const handleToggleCombo = (id: string) => {
    haptic();
    stopPlayback();
    setComboOrder((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const isActive = status === "playing" || status === "paused";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at 30% 20%, #0d1f2d 0%, #050d14 60%, #030810 100%)`,
      color: "#e2e8f0",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Stars */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {stars.map((s) => (
          <div key={s.id} style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: "50%",
            background: "white", opacity: s.opacity,
            animation: `twinkle ${2 + s.delay}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes twinkle { from { opacity:0.1; transform:scale(0.8); } to { opacity:0.9; transform:scale(1.2); } }
        @keyframes float { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-8px);} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6;} 100%{transform:scale(1.5);opacity:0;} }
        @keyframes repeat-flash { 0%{transform:scale(1);} 40%{transform:scale(1.35);opacity:1;} 100%{transform:scale(1);opacity:1;} }
        @keyframes burst-particle { 0%{transform:translate(0,0) scale(1);opacity:1;} 100%{opacity:0;} }
        @keyframes fade-in-down { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes slide-up { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        .surah-card { transition: all 0.2s ease; }
        .btn-glow:hover { filter:brightness(1.15); transform:scale(1.03); }
        .repeat-pill { transition:all 0.18s ease; cursor:pointer; }
        .repeat-pill:hover { transform:scale(1.08); }
        .skip-btn:hover { background:rgba(255,255,255,0.1)!important; }
        .progress-bar-track { cursor:pointer; }
        .icon-btn:hover { background:rgba(255,255,255,0.08)!important; filter:brightness(1.2); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#2d4a3e; border-radius:2px; }
      `}</style>

      {/* ── Sticky mini player ──────────────────────────────────────────────── */}
      {showSticky && isActive && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(5,13,20,0.92)", backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${accent}22`,
          padding: "0.6rem 1.25rem",
          display: "flex", alignItems: "center", gap: "0.75rem",
          animation: "fade-in-down 0.25s ease",
        }}>
          <span style={{ fontSize: "1.1rem" }}>{activeSurahDisplay.moon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: accent, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {activeSurahDisplay.name}
            </div>
            <div style={{ fontSize: "0.65rem", color: "#3a6a7a", fontFamily: "sans-serif" }}>
              Repeat {currentRepeat}/{totalRepeats}
              {sleepSecondsLeft > 0 && <span style={{ marginLeft: "0.5rem", color: "#fb923c" }}>⏾ {fmtTimer(sleepSecondsLeft)}</span>}
            </div>
          </div>
          {/* Mini progress */}
          <div style={{ width: 60, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: accent, borderRadius: 3, transition: "width 0.4s linear" }} />
          </div>
          <button onClick={togglePause} style={{
            width: 34, height: 34, borderRadius: "50%",
            border: `1.5px solid ${accent}55`, background: `${accent}22`,
            color: accent, fontSize: "0.9rem", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {status === "playing" ? "⏸" : "▶"}
          </button>
        </div>
      )}

      {/* ── Completion burst overlay ──────────────────────────────────────── */}
      {showBurst && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ position: "relative", width: 1, height: 1 }}>
            {burstParticles.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const tx = Math.cos(rad) * p.dist;
              const ty = Math.sin(rad) * p.dist;
              return (
                <div key={p.id} style={{
                  position: "absolute",
                  width: p.size, height: p.size,
                  borderRadius: "50%",
                  background: p.color,
                  animation: `burst-particle 1.5s ease-out forwards`,
                  transform: `translate(${tx}px, ${ty}px)`,
                  opacity: 0,
                  animationDelay: `${p.id * 0.02}s`,
                }} />
              );
            })}
          </div>
        </div>
      )}

      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 680, margin: "0 auto",
        padding: "1.5rem 1.25rem 4rem",
      }}>

        {/* ── Back button ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "1.25rem" }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            color: "#3a6a7a", fontFamily: "sans-serif", fontSize: "0.78rem",
            textDecoration: "none", letterSpacing: "0.04em",
            padding: "0.35rem 0.85rem", borderRadius: 50,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.03)",
            transition: "all 0.2s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#7abaca"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#3a6a7a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
          >
            ← Back
          </Link>
        </div>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.4rem", animation: "float 4s ease-in-out infinite", display: "block" }}>
            🌙
          </div>
          <h1 style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 300,
            letterSpacing: "0.12em", color: "#c9d8e8", margin: 0, textTransform: "uppercase",
          }}>
            Night Recitation
          </h1>

          {/* Collapsible note */}
          <div style={{ marginTop: "0.75rem" }}>
            <button onClick={() => setNoteOpen((v) => !v)} style={{
              background: "none", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 50, padding: "0.3rem 0.9rem", color: "#4a7a8a",
              fontFamily: "sans-serif", fontSize: "0.72rem", letterSpacing: "0.06em",
              cursor: "pointer", transition: "all 0.2s",
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
            }}>
              <span>{noteOpen ? "▲" : "▼"}</span>
              <span>About this app</span>
            </button>
            {noteOpen && (
              <div style={{
                marginTop: "0.6rem", padding: "0.85rem 1rem",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, textAlign: "left", fontFamily: "sans-serif",
                fontSize: "0.78rem", color: "#5a8a9a", lineHeight: 1.6,
              }}>
                <strong style={{ color: "#7abaca", display: "block", marginBottom: "0.35rem" }}>
                  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                </strong>
                A bedtime companion for Quranic recitations. Single or combo playlist mode,
                sleep timer with auto fade-out, repeat counter, and lock-screen controls.
                Your selections are saved automatically.
              </div>
            )}
          </div>
        </div>

        {/* ── Mode Toggle ──────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 50,
          padding: 4, marginBottom: "1.75rem", border: "1px solid rgba(255,255,255,0.08)",
        }}>
          {(["single", "combo"] as PlayMode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); stopPlayback(); }} style={{
              flex: 1, padding: "0.55rem 1rem", borderRadius: 50, border: "none",
              background: mode === m ? "rgba(100,180,140,0.2)" : "transparent",
              color: mode === m ? "#7ee8a2" : "#5a7a8a",
              fontFamily: "sans-serif", fontSize: "0.83rem",
              fontWeight: mode === m ? 600 : 400, letterSpacing: "0.06em",
              textTransform: "uppercase", cursor: "pointer", transition: "all 0.25s ease",
              boxShadow: mode === m ? "0 0 12px rgba(100,200,140,0.15)" : "none",
            }}>
              {m === "single" ? "🎵 Single" : "🎶 Combo"}
            </button>
          ))}
        </div>

        {/* ══ Single Mode ══════════════════════════════════════════════════ */}
        {mode === "single" && (
          <>
            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {SURAHS.map((s) => {
                const isSelected = selectedSurahId === s.id;
                return (
                  <div key={s.id} className="surah-card" onClick={() => handleSelectSingle(s.id)} style={{
                    display: "flex", alignItems: "center", gap: "0.85rem",
                    padding: "0.85rem 1.1rem", borderRadius: 14, cursor: "pointer",
                    background: isSelected ? `linear-gradient(135deg, ${s.color}cc, ${s.color}88)` : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${isSelected ? s.accent + "55" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: isSelected ? `0 4px 20px ${s.accent}1a` : "none",
                    userSelect: "none",
                  }}>
                    <div style={{ fontSize: "1.4rem", flexShrink: 0 }}>{s.moon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem", color: isSelected ? s.accent : "#c4d4e0" }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#5a7a90", fontFamily: "sans-serif", marginTop: 2, lineHeight: 1.4 }}>
                        {s.description} · {s.ayahs} ayahs
                      </div>
                    </div>
                    <div style={{ fontFamily: "sans-serif", fontSize: "1.1rem", color: "#2a4a5a", direction: "rtl", flexShrink: 0 }}>
                      {s.arabic}
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${isSelected ? s.accent : "rgba(255,255,255,0.15)"}`,
                      background: isSelected ? `${s.accent}33` : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", color: s.accent, transition: "all 0.18s",
                    }}>
                      {isSelected && "✓"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Repeat selector */}
            <div style={{ marginBottom: "1.75rem" }}>
              <p style={{ fontSize: "0.72rem", color: "#4a6a7a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem", fontFamily: "sans-serif" }}>
                Repeat times
              </p>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                {REPEAT_OPTIONS.map((r) => (
                  <button key={r} className="repeat-pill" onClick={() => {
                    setSingleRepeats(r);
                    if (statusRef.current === "playing" || statusRef.current === "paused") stopPlayback();
                  }} style={{
                    padding: "0.4rem 0.9rem", borderRadius: 50,
                    border: `1.5px solid ${singleRepeats === r ? selectedSurah.accent + "88" : "rgba(255,255,255,0.1)"}`,
                    background: singleRepeats === r ? `${selectedSurah.accent}22` : "rgba(255,255,255,0.03)",
                    color: singleRepeats === r ? selectedSurah.accent : "#6a8a9a",
                    fontFamily: "sans-serif", fontWeight: singleRepeats === r ? 700 : 400,
                    fontSize: "0.85rem", cursor: "pointer",
                  }}>
                    ×{r}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ Combo Mode ═══════════════════════════════════════════════════ */}
        {mode === "combo" && (
          <>
            <div style={{
              padding: "0.65rem 1rem", borderRadius: 12, marginBottom: "1rem",
              background: "rgba(100,180,140,0.07)", border: "1px solid rgba(100,180,140,0.15)",
              fontFamily: "sans-serif", fontSize: "0.76rem", color: "#5a9a7a",
              display: "flex", alignItems: "center", gap: "0.5rem",
            }}>
              <span style={{ fontSize: "1rem" }}>👆</span>
              <span>Tap a surah to add to your playlist in order. Tap again to remove.</span>
            </div>

            <div style={{ display: "grid", gap: "0.65rem", marginBottom: "1.75rem" }}>
              {SURAHS.map((s) => {
                const orderIndex = comboOrder.indexOf(s.id);
                const isSelected = orderIndex !== -1;
                const displayNum = orderIndex + 1;
                return (
                  <div key={s.id} onClick={() => handleToggleCombo(s.id)} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem 1rem", borderRadius: 13, cursor: "pointer",
                    background: isSelected ? `linear-gradient(135deg, ${s.color}aa, ${s.color}55)` : "rgba(255,255,255,0.025)",
                    border: `1.5px solid ${isSelected ? s.accent + "55" : "rgba(255,255,255,0.06)"}`,
                    boxShadow: isSelected ? `0 2px 12px ${s.accent}15` : "none",
                    transition: "all 0.2s ease", userSelect: "none",
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${isSelected ? s.accent : "rgba(255,255,255,0.12)"}`,
                      background: isSelected ? `${s.accent}25` : "rgba(255,255,255,0.03)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: isSelected ? "0.8rem" : "0.7rem",
                      color: isSelected ? s.accent : "#3a5a6a",
                      fontFamily: "sans-serif", fontWeight: 700, transition: "all 0.2s",
                    }}>
                      {isSelected ? displayNum : "＋"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.92rem", color: isSelected ? s.accent : "#6a8090" }}>
                        {s.moon} {s.name}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: isSelected ? "#5a8a7a" : "#3a5060", fontFamily: "sans-serif", marginTop: 1, lineHeight: 1.4 }}>
                        {s.description} · {s.ayahs} ayahs
                      </div>
                    </div>
                    <div style={{ fontFamily: "sans-serif", fontSize: "0.95rem", color: isSelected ? "#4a7a6a" : "#2a3a4a", direction: "rtl", flexShrink: 0 }}>
                      {s.arabic}
                    </div>
                    {isSelected && (
                      <div style={{ display: "flex", gap: "0.28rem", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        {[1, 2, 3].map((r) => (
                          <button key={r} onClick={() => setComboRepeats((prev) => ({ ...prev, [s.id]: r }))} style={{
                            width: 28, height: 28, borderRadius: "50%",
                            border: `1.5px solid ${comboRepeats[s.id] === r ? s.accent : "rgba(255,255,255,0.1)"}`,
                            background: comboRepeats[s.id] === r ? `${s.accent}28` : "rgba(255,255,255,0.03)",
                            color: comboRepeats[s.id] === r ? s.accent : "#5a7a8a",
                            fontSize: "0.68rem", fontFamily: "sans-serif",
                            fontWeight: comboRepeats[s.id] === r ? 700 : 400, cursor: "pointer",
                          }}>
                            ×{r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {comboOrder.length > 0 ? (
              <div style={{
                padding: "0.75rem 1rem", borderRadius: 12, marginBottom: "1.25rem",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                fontFamily: "sans-serif",
              }}>
                <p style={{ fontSize: "0.68rem", color: "#3a5a6a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                  Your playlist ({comboOrder.length} surah{comboOrder.length > 1 ? "s" : ""})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {comboOrder.map((id, i) => {
                    const s = getSurah(id);
                    return (
                      <div key={id} style={{
                        display: "flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.25rem 0.6rem", borderRadius: 50,
                        background: `${s.accent}18`, border: `1px solid ${s.accent}33`,
                        fontSize: "0.72rem", color: s.accent,
                      }}>
                        <span style={{ fontWeight: 700 }}>{i + 1}.</span>
                        <span>{s.name}</span>
                        <span style={{ color: "#3a5a6a" }}>×{comboRepeats[id] ?? 1}</span>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => { setComboOrder([]); stopPlayback(); }} style={{
                  marginTop: "0.6rem", background: "none",
                  border: "1px solid rgba(255,80,80,0.2)", borderRadius: 50,
                  padding: "0.2rem 0.7rem", color: "#f87171",
                  fontFamily: "sans-serif", fontSize: "0.68rem", cursor: "pointer",
                }}>
                  Clear all
                </button>
              </div>
            ) : (
              <p style={{ color: "#f87171", fontSize: "0.78rem", fontFamily: "sans-serif", textAlign: "center", marginBottom: "1rem" }}>
                Tap any surah above to build your playlist
              </p>
            )}
          </>
        )}

        {/* ══ Sleep Timer ═══════════════════════════════════════════════════ */}
        <div style={{
          marginBottom: "1.5rem", padding: "0.9rem 1rem", borderRadius: 14,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#4a6a7a", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "sans-serif", margin: 0 }}>
              ⏾ Sleep Timer
            </p>
            {sleepSecondsLeft > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                animation: "slide-up 0.3s ease",
              }}>
                <span style={{ fontSize: "0.78rem", color: "#fb923c", fontFamily: "sans-serif", fontWeight: 600 }}>
                  {fmtTimer(sleepSecondsLeft)}
                </span>
                {sleepSecondsLeft <= 30 && (
                  <span style={{ fontSize: "0.65rem", color: "#fb923c66", fontFamily: "sans-serif" }}>fading…</span>
                )}
                <button onClick={() => { clearSleepTimer(); if (audioRef.current) { audioRef.current.volume = 1; setVolume(1); } }} style={{
                  background: "none", border: "1px solid rgba(255,80,80,0.25)", borderRadius: 50,
                  padding: "0.1rem 0.5rem", color: "#f87171", fontFamily: "sans-serif",
                  fontSize: "0.65rem", cursor: "pointer",
                }}>
                  cancel
                </button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {SLEEP_TIMER_OPTIONS.map((m) => (
              <button key={m} onClick={() => {
                setSleepMinutes(m);
                if (m === 0) clearSleepTimer();
                else if (statusRef.current === "playing") startSleepTimer(m);
              }} style={{
                padding: "0.38rem 0.85rem", borderRadius: 50,
                border: `1.5px solid ${sleepMinutes === m ? "#fb923c88" : "rgba(255,255,255,0.1)"}`,
                background: sleepMinutes === m ? "rgba(251,146,60,0.15)" : "rgba(255,255,255,0.03)",
                color: sleepMinutes === m ? "#fb923c" : "#5a6a7a",
                fontFamily: "sans-serif", fontWeight: sleepMinutes === m ? 700 : 400,
                fontSize: "0.8rem", cursor: "pointer", transition: "all 0.18s",
              }}>
                {m === 0 ? "Off" : `${m}m`}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.65rem", color: "#2a4a5a", fontFamily: "sans-serif", marginTop: "0.5rem", marginBottom: 0 }}>
            Audio fades out in the last 30s before stopping
          </p>
        </div>

        {/* ══ Player Controls ═══════════════════════════════════════════════ */}
        <div ref={playerCardRef} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "1.25rem 1.25rem 1.4rem",
        }}>
          {/* Now playing info */}
          <div style={{ textAlign: "center", marginBottom: "1rem", minHeight: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {status === "idle" && (
              <p style={{ color: "#3a5a6a", fontFamily: "sans-serif", fontSize: "0.82rem", margin: 0 }}>
                {mode === "combo" && comboOrder.length === 0
                  ? "Select surahs above to build your playlist"
                  : "Choose your surah and press play"}
              </p>
            )}
            {status === "loading" && (
              <p style={{ color: "#5a8a9a", fontFamily: "sans-serif", fontSize: "0.82rem", margin: 0 }}>
                Loading recitation…
              </p>
            )}
            {isActive && (
              <>
                <div style={{ fontSize: "1rem", fontWeight: 600, color: accent, marginBottom: 3 }}>
                  {activeSurahDisplay.arabic}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6a8a9a", fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <span>{activeSurahDisplay.name}</span>
                  <span style={{ color: "#2a4050" }}>·</span>
                  <span style={{
                    color: accent,
                    animation: repeatFlash ? "repeat-flash 0.6s ease" : "none",
                    display: "inline-block",
                  }}>
                    Repeat {currentRepeat}/{totalRepeats}
                  </span>
                  {mode === "combo" && queueRef.current.length > 1 && (
                    <><span style={{ color: "#2a4050" }}>·</span><span style={{ color: "#4a6a7a" }}>{currentIdx + 1}/{queueRef.current.length}</span></>
                  )}
                  {sleepSecondsLeft > 0 && (
                    <><span style={{ color: "#2a4050" }}>·</span><span style={{ color: "#fb923c" }}>⏾ {fmtTimer(sleepSecondsLeft)}</span></>
                  )}
                </div>
              </>
            )}
            {status === "done" && (
              <p style={{ color: "#4a8a6a", fontFamily: "sans-serif", fontSize: "0.85rem", fontStyle: "italic", margin: 0 }}>
                ✓ Complete · Rest well, inshaaAllah 🌙
              </p>
            )}
          </div>

          {/* Volume indicator (visible when fading) */}
          {volume < 1 && (
            <div style={{ marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.65rem", color: "#fb923c", fontFamily: "sans-serif" }}>🔉 Fading</span>
              <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${volume * 100}%`, background: "#fb923c", borderRadius: 3, transition: "width 1s linear" }} />
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div ref={progressBarRef} className="progress-bar-track" onClick={handleSeek} onTouchStart={handleSeek} style={{
            height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 6,
            overflow: "visible", marginBottom: "0.5rem", position: "relative",
          }}>
            <div style={{
              height: "100%", width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${accent}88, ${accent})`,
              borderRadius: 6, transition: "width 0.4s linear", position: "relative",
            }}>
              <div style={{
                position: "absolute", right: -5, top: "50%", transform: "translateY(-50%)",
                width: 12, height: 12, borderRadius: "50%", background: accent,
                boxShadow: `0 0 6px ${accent}88`,
                opacity: isActive ? 1 : 0, transition: "opacity 0.2s",
              }} />
            </div>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: "0.68rem", color: "#3a5a6a", fontFamily: "sans-serif", marginBottom: "1rem",
          }}>
            <span>{fmt(progress)}</span>
            <span>{duration > 0 ? fmt(duration) : "--:--"}</span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", alignItems: "center" }}>
            {/* Stop */}
            <button className="icon-btn" onClick={stopPlayback} disabled={status === "idle"} title="Stop" style={{
              width: 42, height: 42, borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: status === "idle" ? "#2a4a5a" : "#8aaabb",
              fontSize: "1rem", cursor: status === "idle" ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
            }}>■</button>

            {/* Skip -10s */}
            <button className="skip-btn icon-btn" onClick={() => skip(-10)} disabled={!isActive} title="-10s" style={{
              width: 38, height: 38, borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
              color: !isActive ? "#2a4050" : "#6a9aaa",
              fontSize: "0.8rem", fontFamily: "sans-serif",
              cursor: !isActive ? "not-allowed" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 0, transition: "all 0.18s", lineHeight: 1,
            }}>
              <span style={{ fontSize: "1rem" }}>⟨</span>
              <span style={{ fontSize: "0.55rem" }}>10s</span>
            </button>

            {/* Play / Pause */}
            <button className="btn-glow" onClick={() => status === "idle" || status === "done" ? startPlayback() : togglePause()}
              disabled={mode === "combo" && comboOrder.length === 0 && status === "idle"}
              style={{
                width: 68, height: 68, borderRadius: "50%",
                border: `2px solid ${accent}55`,
                background: `radial-gradient(circle, ${activeSurahDisplay.color}dd, ${activeSurahDisplay.color}88)`,
                color: accent, fontSize: "1.5rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 24px ${accent}2a`,
                transition: "all 0.25s ease", position: "relative",
                opacity: mode === "combo" && comboOrder.length === 0 && status === "idle" ? 0.4 : 1,
              }}>
              {status === "loading"
                ? <span style={{ fontSize: "0.9rem", animation: "twinkle 0.8s infinite" }}>…</span>
                : status === "playing" ? "⏸" : "▶"}
              {status === "playing" && (
                <span style={{
                  position: "absolute", inset: -4, borderRadius: "50%",
                  border: `2px solid ${accent}44`,
                  animation: "pulse-ring 2s ease-out infinite",
                }} />
              )}
            </button>

            {/* Skip +10s */}
            <button className="skip-btn icon-btn" onClick={() => skip(10)} disabled={!isActive} title="+10s" style={{
              width: 38, height: 38, borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
              color: !isActive ? "#2a4050" : "#6a9aaa",
              fontSize: "0.8rem", fontFamily: "sans-serif",
              cursor: !isActive ? "not-allowed" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 0, transition: "all 0.18s", lineHeight: 1,
            }}>
              <span style={{ fontSize: "1rem" }}>⟩</span>
              <span style={{ fontSize: "0.55rem" }}>10s</span>
            </button>

            {/* Restart */}
            <button className="icon-btn" onClick={() => startPlayback()} title="Restart" style={{
              width: 42, height: 42, borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
              color: "#8aaabb", fontSize: "1.05rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
            }}>↺</button>
          </div>

          {/* Wake lock indicator */}
          {wakeLockOn && (
            <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
              <span style={{ fontSize: "0.62rem", color: "#2a5a4a", fontFamily: "sans-serif", letterSpacing: "0.04em" }}>
                ◉ Screen kept awake while playing
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center", color: "#1a3040", fontSize: "0.65rem",
          fontFamily: "sans-serif", marginTop: "1.5rem", letterSpacing: "0.05em",
        }}>
          Plays with screen off · Selections saved automatically · Lock screen controls enabled
        </p>
      </div>
    </main>
  );
}