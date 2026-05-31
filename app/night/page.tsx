"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

// ─── Reciters ─────────────────────────────────────────────────────────────────
const RECITERS = [
  { id: "sudais", name: "Sheikh Al-Sudais", arabic: "الشيخ السديس", prefix: "", useFullName: true },
  { id: "mishary", name: "Mishary Rashid Alafasy", arabic: "مشاري راشد العفاسي", prefix: "mishary/", useFullName: false },
  { id: "maher", name: "Maher Al-Muaiqly", arabic: "ماهر المعيقلي", prefix: "maher/", useFullName: false },
  { id: "hani", name: "Hani Ar-Rifai", arabic: "هاني الرفاعي", prefix: "hani/", useFullName: false },
];

// ─── Surahs ───────────────────────────────────────────────────────────────────
const SURAHS = [
  {
    id: "kahf", number: 18, name: "Surah Al-Kahf", arabic: "سورة الكهف",
    meaning: "The Cave", ayahs: 110,
    description: "Protection from Dajjal — recite on Fridays",
    color: "#1a2e2a", accent: "#34d399", moon: "🕌",
    file: "018 Kahf.mp3",
  },
  {
    id: "yasin", number: 36, name: "Surah Ya-Sin", arabic: "سورة يس",
    meaning: "Ya Sin", ayahs: 83,
    description: "The heart of the Quran",
    color: "#1e1a3a", accent: "#a78bfa", moon: "💫",
    file: "036 Yasin.mp3",
  },
  {
    id: "najam", number: 53, name: "Surah An-Najm", arabic: "سورة النجم",
    meaning: "The Star", ayahs: 62,
    description: "Revelation of divine truth and guidance",
    color: "#1a1e2e", accent: "#93c5fd", moon: "⭐",
    file: "053 Najam.mp3",
  },
  {
    id: "rahman", number: 55, name: "Surah Ar-Rahman", arabic: "سورة الرحمن",
    meaning: "The Most Merciful", ayahs: 78,
    description: "Reminder of Allah's endless blessings",
    color: "#1a2a3a", accent: "#60a5fa", moon: "✨",
    file: "055 Rehman.mp3",
  },
  {
    id: "waqia", number: 56, name: "Surah Al-Waqi'ah", arabic: "سورة الواقعة",
    meaning: "The Inevitable Event", ayahs: 96,
    description: "Protection from poverty — recite every night",
    color: "#2a1a1a", accent: "#f87171", moon: "🔥",
    file: "056 Waqia.mp3",
  },
  {
    id: "mulk", number: 67, name: "Surah Al-Mulk", arabic: "سورة الملك",
    meaning: "The Sovereignty", ayahs: 30,
    description: "Protection from the punishment of the grave",
    color: "#1a3a2e", accent: "#4ade80", moon: "🌙",
    file: "067 Mulk.mp3",
  },
  {
    id: "duha", number: 93, name: "Surah Ad-Duha", arabic: "سورة الضحى",
    meaning: "The Morning Brightness", ayahs: 11,
    description: "Allah has not forsaken you — peace before sleep",
    color: "#2a1a0e", accent: "#fb923c", moon: "🌟",
    file: "093 Duha.mp3",
  },
];

const REPEAT_OPTIONS = [1, 2, 3, 5, 7, 10];
const SLEEP_TIMER_OPTIONS = [0, 15, 30, 45, 60, 90, 120];
const SPEED_OPTIONS = [0.75, 0.85, 1, 1.15, 1.25];

type PlayMode = "single" | "combo";
type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "done";

interface QueueItem {
  surahId: string;
  totalRepeats: number;
}

interface SavedPlaylist {
  name: string;
  items: { surahId: string; repeats: number }[];
}

// ─── Local storage helpers ────────────────────────────────────────────────────
const LS_KEY = "night-recitation-state";
const LS_PLAYLISTS = "night-recitation-playlists";
const LS_STATS = "night-recitation-stats";

function saveState(data: object) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function savePlaylists(data: SavedPlaylist[]) {
  try { localStorage.setItem(LS_PLAYLISTS, JSON.stringify(data)); } catch {}
}
function loadPlaylists(): SavedPlaylist[] {
  try {
    const raw = localStorage.getItem(LS_PLAYLISTS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

interface Stats {
  totalMinutes: number;
  sessionsCount: number;
  currentStreak: number;
  lastSessionDate: string;
  longestStreak: number;
  favoriteSurah: string;
  surahCounts: Record<string, number>;
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(LS_STATS);
    return raw ? JSON.parse(raw) : {
      totalMinutes: 0, sessionsCount: 0, currentStreak: 0,
      lastSessionDate: "", longestStreak: 0, favoriteSurah: "",
      surahCounts: {},
    };
  } catch {
    return {
      totalMinutes: 0, sessionsCount: 0, currentStreak: 0,
      lastSessionDate: "", longestStreak: 0, favoriteSurah: "",
      surahCounts: {},
    };
  }
}
function saveStats(stats: Stats) {
  try { localStorage.setItem(LS_STATS, JSON.stringify(stats)); } catch {}
}

export default function NightPage() {
  // ── Mode & UI state
  const [mode, setMode] = useState<PlayMode>("single");
  const [noteOpen, setNoteOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [dimLevel, setDimLevel] = useState(0); // 0-90 percent dimming
  const [showDimmer, setShowDimmer] = useState(false);
  const [playlistNameInput, setPlaylistNameInput] = useState("");
  const [showSavePlaylist, setShowSavePlaylist] = useState(false);
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [stats, setStats] = useState<Stats>(loadStats());
  const [selectedReciter, setSelectedReciter] = useState("sudais");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedControl, setShowSpeedControl] = useState(false);

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
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState(0);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Animations
  const [repeatFlash, setRepeatFlash] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [surahTransition, setSurahTransition] = useState(false);

  // ── Wake lock
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [wakeLockOn, setWakeLockOn] = useState(false);

  // ── Volume
  const [volume, setVolume] = useState(1);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Session tracking
  const sessionStartRef = useRef<number>(0);

  // ── Refs for audio engine
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const playerCardRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const currentIdxRef = useRef(0);
  const currentRepeatRef = useRef(1);
  const statusRef = useRef<PlayerStatus>("idle");
  const isTransitioningRef = useRef(false);

  const updateStatus = useCallback((s: PlayerStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // ── Stars (stable)
  const stars = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5, opacity: Math.random() * 0.5 + 0.2,
      delay: Math.random() * 5,
    })), []
  );

  // ── Burst particles
  const burstParticles = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      angle: (i / 24) * 360,
      dist: 50 + Math.random() * 40,
      size: 3 + Math.random() * 5,
      color: ["#34d399","#a78bfa","#60a5fa","#fb923c","#f87171","#fbbf24","#4ade80","#93c5fd"][i % 8],
    })), []
  );

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const getSurah = useCallback((id: string) => SURAHS.find((s) => s.id === id) ?? SURAHS[5], []);
  const selectedSurah = getSurah(selectedSurahId);
  const activeQueue = queueRef.current;
  const activeSurahDisplay =
    activeQueue.length > 0 &&
    (status === "playing" || status === "paused" || status === "loading")
      ? getSurah(activeQueue[currentIdx]?.surahId ?? activeQueue[0].surahId)
      : selectedSurah;
  const accent = activeSurahDisplay.accent;

  const getAudioUrl = useCallback((surahId: string) => {
    const surah = getSurah(surahId);
    const reciter = RECITERS.find(r => r.id === selectedReciter) ?? RECITERS[0];
    if (reciter.useFullName) {
      // Original Al-Sudais files use full names like "018 Kahf.mp3"
      return `/audio/${surah.file}`;
    }
    // New reciters use number-only format like "018.mp3"
    const num = String(surah.number).padStart(3, "0");
    return `/audio/${reciter.prefix}${num}.mp3`;
  }, [getSurah, selectedReciter]);

  // ─── Restore state ────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = loadState();
    if (!saved) return;
    if (saved.mode) setMode(saved.mode);
    if (saved.selectedSurahId) setSelectedSurahId(saved.selectedSurahId);
    if (saved.singleRepeats) setSingleRepeats(saved.singleRepeats);
    if (saved.comboOrder) setComboOrder(saved.comboOrder);
    if (saved.comboRepeats) setComboRepeats(saved.comboRepeats);
    if (saved.selectedReciter) setSelectedReciter(saved.selectedReciter);
    if (saved.playbackSpeed) setPlaybackSpeed(saved.playbackSpeed);
    setSavedPlaylists(loadPlaylists());
    setStats(loadStats());
  }, []);

  // ─── Persist state ────────────────────────────────────────────────────────
  useEffect(() => {
    saveState({ mode, selectedSurahId, singleRepeats, comboOrder, comboRepeats, selectedReciter, playbackSpeed });
  }, [mode, selectedSurahId, singleRepeats, comboOrder, comboRepeats, selectedReciter, playbackSpeed]);

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
      wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      setWakeLockOn(true);
      wakeLockRef.current!.addEventListener("release", () => setWakeLockOn(false));
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

  // ─── Stats tracking ───────────────────────────────────────────────────────
  const updateStats = useCallback((surahId: string) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const elapsed = sessionStartRef.current > 0 ? (Date.now() - sessionStartRef.current) / 60000 : 0;

    setStats(prev => {
      const updated = { ...prev };
      updated.totalMinutes += elapsed;
      updated.sessionsCount += 1;
      updated.surahCounts = { ...updated.surahCounts };
      updated.surahCounts[surahId] = (updated.surahCounts[surahId] || 0) + 1;

      // Find favorite
      let maxCount = 0;
      Object.entries(updated.surahCounts).forEach(([id, count]) => {
        if (count > maxCount) { maxCount = count; updated.favoriteSurah = id; }
      });

      // Streak
      if (updated.lastSessionDate !== today) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        if (updated.lastSessionDate === yesterdayStr) {
          updated.currentStreak += 1;
        } else if (updated.lastSessionDate !== today) {
          updated.currentStreak = 1;
        }
        updated.lastSessionDate = today;
      }
      if (updated.currentStreak > updated.longestStreak) {
        updated.longestStreak = updated.currentStreak;
      }

      saveStats(updated);
      return updated;
    });
  }, []);

  // ─── Core audio loader ─────────────────────────────────────────────────────
  const loadAndPlayRef = useRef<(surahId: string) => void>(() => {});

  useEffect(() => {
    loadAndPlayRef.current = (surahId: string) => {
      const surah = getSurah(surahId);
      if (!audioRef.current) return;
      isTransitioningRef.current = false;
      updateStatus("loading");
      if (audioRef.current.volume < 1) { audioRef.current.volume = 1; setVolume(1); }

      const url = getAudioUrl(surahId);
      audioRef.current.src = url;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.load();

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: surah.name,
          artist: surah.arabic,
          album: "Night Recitation · القرآن الكريم",
        });
      }

      const playPromise = audioRef.current.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Retry once
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play().catch(() => updateStatus("idle"));
            }
          }, 500);
        });
      }
    };
  });

  // ─── Audio setup (once) ───────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.setAttribute("playsinline", "true");
    audioRef.current = audio;

    const onPlay = () => {
      updateStatus("playing");
      if (sessionStartRef.current === 0) sessionStartRef.current = Date.now();
    };
    const onPause = () => { if (!audio.ended && !isTransitioningRef.current) updateStatus("paused"); };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setProgress(audio.currentTime);

    const onEnded = () => {
      const q = queueRef.current;
      const idx = currentIdxRef.current;
      const item = q[idx];
      if (!item) { updateStatus("done"); triggerBurst(); recordSession(); return; }

      // Check if more repeats needed for current surah
      const nextRepeat = currentRepeatRef.current + 1;
      if (nextRepeat <= item.totalRepeats) {
        isTransitioningRef.current = true;
        currentRepeatRef.current = nextRepeat;
        setCurrentRepeat(nextRepeat);
        setRepeatFlash(true);
        setTimeout(() => setRepeatFlash(false), 600);
        // Small gap then replay same surah
        setTimeout(() => {
          if (statusRef.current !== "idle") {
            loadAndPlayRef.current(item.surahId);
          }
        }, 800);
        return;
      }

      // Move to next surah in queue
      const nextIdx = idx + 1;
      if (nextIdx >= q.length) {
        // All done
        updateStatus("done");
        setProgress(0);
        triggerBurst();
        recordSession();
        clearSleepTimer();
        releaseWakeLock();
        return;
      }

      // Transition to next surah
      isTransitioningRef.current = true;
      const nextItem = q[nextIdx];
      currentIdxRef.current = nextIdx;
      currentRepeatRef.current = 1;
      setCurrentIdx(nextIdx);
      setCurrentRepeat(1);
      setTotalRepeats(nextItem.totalRepeats);
      setProgress(0);
      setDuration(0);
      setSurahTransition(true);
      setTimeout(() => setSurahTransition(false), 600);

      // Load next surah after brief transition
      setTimeout(() => {
        if (statusRef.current !== "idle") {
          loadAndPlayRef.current(nextItem.surahId);
        }
      }, 1000);
    };

    const onError = () => {
      // If audio fails, try to continue to next in queue
      console.warn("Audio error, attempting to continue...");
      const q = queueRef.current;
      const idx = currentIdxRef.current;
      const nextIdx = idx + 1;
      if (nextIdx < q.length) {
        isTransitioningRef.current = true;
        const nextItem = q[nextIdx];
        currentIdxRef.current = nextIdx;
        currentRepeatRef.current = 1;
        setCurrentIdx(nextIdx);
        setCurrentRepeat(1);
        setTotalRepeats(nextItem.totalRepeats);
        setTimeout(() => loadAndPlayRef.current(nextItem.surahId), 1000);
      } else {
        updateStatus("idle");
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

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
      audio.removeEventListener("error", onError);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Record session for stats ─────────────────────────────────────────────
  const recordSession = useCallback(() => {
    const q = queueRef.current;
    if (q.length > 0) {
      updateStats(q[0].surahId);
    }
    sessionStartRef.current = 0;
  }, [updateStats]);

  // ─── Completion burst ──────────────────────────────────────────────────────
  const triggerBurst = () => {
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 2200);
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
    sessionStartRef.current = Date.now();
    haptic();
    if (sleepMinutes > 0) startSleepTimer(sleepMinutes);
    loadAndPlayRef.current(q[0].surahId);
  }, [mode, selectedSurahId, singleRepeats, comboOrder, comboRepeats, sleepMinutes, startSleepTimer]);

  const stopPlayback = useCallback(() => {
    isTransitioningRef.current = false;
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
    sessionStartRef.current = 0;
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

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (statusRef.current === "idle" || statusRef.current === "done") startPlayback();
          else togglePause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "KeyR":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); startPlayback(); }
          break;
        case "KeyS":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); stopPlayback(); }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startPlayback, stopPlayback, togglePause, skip]);

  // ─── Toggle wake lock when playing ────────────────────────────────────────
  useEffect(() => {
    if (status === "playing") requestWakeLock();
    else releaseWakeLock();
  }, [status, requestWakeLock, releaseWakeLock]);

  // ─── Playback speed sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // ─── Selection handlers ───────────────────────────────────────────────────
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

  // ─── Playlist management ──────────────────────────────────────────────────
  const saveCurrentPlaylist = () => {
    if (!playlistNameInput.trim() || comboOrder.length === 0) return;
    const newPlaylist: SavedPlaylist = {
      name: playlistNameInput.trim(),
      items: comboOrder.map(id => ({ surahId: id, repeats: comboRepeats[id] ?? 1 })),
    };
    const updated = [...savedPlaylists, newPlaylist];
    setSavedPlaylists(updated);
    savePlaylists(updated);
    setPlaylistNameInput("");
    setShowSavePlaylist(false);
  };

  const loadPlaylist = (playlist: SavedPlaylist) => {
    stopPlayback();
    setComboOrder(playlist.items.map(i => i.surahId));
    const newRepeats = { ...comboRepeats };
    playlist.items.forEach(i => { newRepeats[i.surahId] = i.repeats; });
    setComboRepeats(newRepeats);
  };

  const deletePlaylist = (index: number) => {
    const updated = savedPlaylists.filter((_, i) => i !== index);
    setSavedPlaylists(updated);
    savePlaylists(updated);
  };

  // ─── Share playlist ───────────────────────────────────────────────────────
  const sharePlaylist = () => {
    if (comboOrder.length === 0) return;
    const params = comboOrder.map(id => `${id}:${comboRepeats[id] ?? 1}`).join(",");
    const url = `${window.location.origin}/night?playlist=${params}`;
    navigator.clipboard?.writeText(url);
    alert("Playlist link copied to clipboard!");
  };

  // ─── Load shared playlist from URL ────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const playlist = params.get("playlist");
    if (playlist) {
      const items = playlist.split(",").map(item => {
        const [id, repeats] = item.split(":");
        return { id, repeats: parseInt(repeats) || 1 };
      }).filter(item => SURAHS.some(s => s.id === item.id));

      if (items.length > 0) {
        setMode("combo");
        setComboOrder(items.map(i => i.id));
        const newRepeats = { ...comboRepeats };
        items.forEach(i => { newRepeats[i.id] = i.repeats; });
        setComboRepeats(newRepeats);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const isActive = status === "playing" || status === "paused";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main
      role="application"
      aria-label="Night Recitation - Quran player for bedtime"
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at 30% 20%, ${activeSurahDisplay.color}dd 0%, #050d14 60%, #030810 100%)`,
        color: "#e2e8f0",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        position: "relative",
        overflow: "hidden",
        transition: "background 3s ease",
      }}>

      {/* Dimming overlay */}
      {dimLevel > 0 && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: `rgba(0,0,0,${dimLevel / 100})`,
          pointerEvents: "none",
        }} />
      )}

      {/* Stars */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
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
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(52,211,153,0.2);} 50%{box-shadow:0 0 40px rgba(52,211,153,0.4);} }
        @keyframes surah-enter { from{opacity:0;transform:scale(0.95) translateY(5px);} to{opacity:1;transform:scale(1) translateY(0);} }
        .surah-card { transition: all 0.25s ease; }
        .surah-card:hover { transform: translateX(4px); }
        .surah-card:active { transform: scale(0.98); }
        .btn-glow { transition: all 0.25s ease; }
        .btn-glow:hover { filter:brightness(1.15); transform:scale(1.05); }
        .btn-glow:active { transform:scale(0.95); }
        .repeat-pill { transition:all 0.18s ease; cursor:pointer; }
        .repeat-pill:hover { transform:scale(1.08); }
        .repeat-pill:active { transform:scale(0.95); }
        .skip-btn { transition:all 0.18s ease; }
        .skip-btn:hover { background:rgba(255,255,255,0.1)!important; transform:scale(1.05); }
        .skip-btn:active { transform:scale(0.92); }
        .progress-bar-track { cursor:pointer; }
        .icon-btn { transition:all 0.18s ease; }
        .icon-btn:hover { background:rgba(255,255,255,0.08)!important; filter:brightness(1.2); transform:scale(1.05); }
        .icon-btn:active { transform:scale(0.92); }
        .control-chip { transition:all 0.18s ease; cursor:pointer; }
        .control-chip:hover { transform:scale(1.05); filter:brightness(1.1); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#2d4a3e; border-radius:2px; }
      `}</style>

      {/* ── Sticky mini player ──────────────────────────────────────────────── */}
      {showSticky && isActive && (
        <div role="region" aria-label="Mini player" style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 150,
          background: "rgba(5,13,20,0.95)", backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${accent}33`,
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
          <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: accent, borderRadius: 4, transition: "width 0.4s linear" }} />
          </div>
          <button onClick={togglePause} aria-label={status === "playing" ? "Pause" : "Play"} style={{
            width: 36, height: 36, borderRadius: "50%",
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
        <div aria-hidden="true" style={{
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
                  position: "absolute", width: p.size, height: p.size,
                  borderRadius: "50%", background: p.color,
                  animation: `burst-particle 2s ease-out forwards`,
                  transform: `translate(${tx}px, ${ty}px)`,
                  opacity: 0, animationDelay: `${p.id * 0.03}s`,
                }} />
              );
            })}
          </div>
          <div style={{ position: "absolute", fontSize: "2.5rem", animation: "surah-enter 0.5s ease" }}>
            ✨
          </div>
        </div>
      )}

      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 700, margin: "0 auto",
        padding: "1.5rem 1.25rem 4rem",
      }}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <Link href="/" aria-label="Go back to home" style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            color: "#3a6a7a", fontFamily: "sans-serif", fontSize: "0.78rem",
            textDecoration: "none", letterSpacing: "0.04em",
            padding: "0.35rem 0.85rem", borderRadius: 50,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.03)",
            transition: "all 0.2s",
          }}>
            ← Back
          </Link>

          <div style={{ display: "flex", gap: "0.4rem" }}>
            {/* Dimmer toggle */}
            <button
              className="control-chip"
              onClick={() => setShowDimmer(!showDimmer)}
              aria-label="Toggle screen dimmer"
              style={{
                padding: "0.35rem 0.7rem", borderRadius: 50,
                border: "1px solid rgba(255,255,255,0.07)",
                background: dimLevel > 0 ? "rgba(251,146,60,0.15)" : "rgba(255,255,255,0.03)",
                color: dimLevel > 0 ? "#fb923c" : "#3a6a7a",
                fontFamily: "sans-serif", fontSize: "0.72rem",
              }}>
              🔅 {dimLevel > 0 ? `${dimLevel}%` : "Dim"}
            </button>

            {/* Stats toggle */}
            <button
              className="control-chip"
              onClick={() => setStatsOpen(!statsOpen)}
              aria-label="View listening statistics"
              style={{
                padding: "0.35rem 0.7rem", borderRadius: 50,
                border: "1px solid rgba(255,255,255,0.07)",
                background: statsOpen ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
                color: statsOpen ? "#34d399" : "#3a6a7a",
                fontFamily: "sans-serif", fontSize: "0.72rem",
              }}>
              📊 Stats
            </button>
          </div>
        </div>

        {/* ── Dimmer slider ────────────────────────────────────────────────── */}
        {showDimmer && (
          <div style={{
            marginBottom: "1rem", padding: "0.85rem 1rem", borderRadius: 14,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            animation: "slide-up 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#4a6a7a", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                🔅 Screen Dimmer
              </span>
              <span style={{ fontSize: "0.72rem", color: "#fb923c", fontFamily: "sans-serif" }}>{dimLevel}%</span>
            </div>
            <input
              type="range" min="0" max="90" value={dimLevel}
              onChange={(e) => setDimLevel(Number(e.target.value))}
              aria-label="Screen dimming level"
              style={{ width: "100%", accentColor: "#fb923c", cursor: "pointer" }}
            />
            <p style={{ fontSize: "0.65rem", color: "#2a4a5a", fontFamily: "sans-serif", marginTop: "0.4rem", marginBottom: 0 }}>
              Dims the screen for comfortable bedtime viewing
            </p>
          </div>
        )}

        {/* ── Stats panel ──────────────────────────────────────────────────── */}
        {statsOpen && (
          <div style={{
            marginBottom: "1.25rem", padding: "1rem", borderRadius: 16,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(52,211,153,0.15)",
            animation: "slide-up 0.25s ease",
          }}>
            <h3 style={{ fontSize: "0.85rem", color: "#34d399", fontFamily: "sans-serif", margin: "0 0 0.75rem", fontWeight: 600 }}>
              📊 Your Night Recitation Journey
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
              <div style={{ textAlign: "center", padding: "0.6rem", borderRadius: 12, background: "rgba(52,211,153,0.08)" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#34d399" }}>{stats.currentStreak}</div>
                <div style={{ fontSize: "0.62rem", color: "#4a7a6a", fontFamily: "sans-serif" }}>Night Streak 🔥</div>
              </div>
              <div style={{ textAlign: "center", padding: "0.6rem", borderRadius: 12, background: "rgba(167,139,250,0.08)" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#a78bfa" }}>{stats.sessionsCount}</div>
                <div style={{ fontSize: "0.62rem", color: "#6a5a8a", fontFamily: "sans-serif" }}>Sessions</div>
              </div>
              <div style={{ textAlign: "center", padding: "0.6rem", borderRadius: 12, background: "rgba(96,165,250,0.08)" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#60a5fa" }}>{Math.round(stats.totalMinutes)}</div>
                <div style={{ fontSize: "0.62rem", color: "#4a6a8a", fontFamily: "sans-serif" }}>Minutes</div>
              </div>
            </div>
            {stats.favoriteSurah && (
              <div style={{ marginTop: "0.6rem", fontSize: "0.72rem", color: "#5a8a7a", fontFamily: "sans-serif", textAlign: "center" }}>
                Favorite: {getSurah(stats.favoriteSurah).name} {getSurah(stats.favoriteSurah).moon} · Best streak: {stats.longestStreak} nights
              </div>
            )}
          </div>
        )}

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.4rem", animation: "float 4s ease-in-out infinite", display: "block" }} aria-hidden="true">
            🌙
          </div>
          <h1 style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 300,
            letterSpacing: "0.12em", color: "#c9d8e8", margin: 0, textTransform: "uppercase",
          }}>
            Night Recitation
          </h1>
          <p style={{ fontSize: "0.75rem", color: "#3a5a6a", fontFamily: "sans-serif", marginTop: "0.4rem", letterSpacing: "0.04em" }}>
            Let the Quran bring peace to your night
          </p>

          {/* Collapsible about */}
          <div style={{ marginTop: "0.75rem" }}>
            <button onClick={() => setNoteOpen((v) => !v)} aria-expanded={noteOpen} aria-label="About this app" style={{
              background: "none", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 50, padding: "0.3rem 0.9rem", color: "#4a7a8a",
              fontFamily: "sans-serif", fontSize: "0.72rem", letterSpacing: "0.06em",
              cursor: "pointer", transition: "all 0.2s",
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
            }}>
              <span>{noteOpen ? "▲" : "▼"}</span>
              <span>About & Shortcuts</span>
            </button>
            {noteOpen && (
              <div style={{
                marginTop: "0.6rem", padding: "0.85rem 1rem",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, textAlign: "left", fontFamily: "sans-serif",
                fontSize: "0.78rem", color: "#5a8a9a", lineHeight: 1.7,
                animation: "slide-up 0.2s ease",
              }}>
                <strong style={{ color: "#7abaca", display: "block", marginBottom: "0.35rem" }}>
                  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                </strong>
                <p style={{ margin: "0 0 0.5rem" }}>
                  A bedtime companion for Quranic recitations. Single or combo playlist mode,
                  sleep timer with auto fade-out, repeat counter, and lock-screen controls.
                </p>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                  <strong style={{ color: "#7abaca", fontSize: "0.7rem" }}>⌨️ Keyboard Shortcuts:</strong>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.2rem 0.8rem", marginTop: "0.3rem", fontSize: "0.7rem" }}>
                    <kbd style={{ background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.4rem", borderRadius: 4 }}>Space</kbd><span>Play / Pause</span>
                    <kbd style={{ background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.4rem", borderRadius: 4 }}>← →</kbd><span>Skip ±10s</span>
                    <kbd style={{ background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.4rem", borderRadius: 4 }}>R</kbd><span>Restart</span>
                    <kbd style={{ background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.4rem", borderRadius: 4 }}>S</kbd><span>Stop</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Mode Toggle ──────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 50,
          padding: 4, marginBottom: "1.75rem", border: "1px solid rgba(255,255,255,0.08)",
        }} role="tablist" aria-label="Playback mode">
          {(["single", "combo"] as PlayMode[]).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); stopPlayback(); }} style={{
              flex: 1, padding: "0.6rem 1rem", borderRadius: 50, border: "none",
              background: mode === m ? "rgba(100,180,140,0.2)" : "transparent",
              color: mode === m ? "#7ee8a2" : "#5a7a8a",
              fontFamily: "sans-serif", fontSize: "0.85rem",
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
            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }} role="radiogroup" aria-label="Select a surah">
              {SURAHS.map((s) => {
                const isSelected = selectedSurahId === s.id;
                return (
                  <div key={s.id} className="surah-card" role="radio" aria-checked={isSelected}
                    aria-label={`${s.name} - ${s.description}`}
                    tabIndex={0}
                    onClick={() => handleSelectSingle(s.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelectSingle(s.id); } }}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.85rem",
                      padding: "0.9rem 1.1rem", borderRadius: 16, cursor: "pointer",
                      background: isSelected ? `linear-gradient(135deg, ${s.color}cc, ${s.color}88)` : "rgba(255,255,255,0.03)",
                      border: `1.5px solid ${isSelected ? s.accent + "55" : "rgba(255,255,255,0.07)"}`,
                      boxShadow: isSelected ? `0 4px 24px ${s.accent}1a` : "none",
                      userSelect: "none",
                    }}>
                    <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>{s.moon}</div>
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
                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
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
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }} role="group" aria-label="Repeat count">
                {REPEAT_OPTIONS.map((r) => (
                  <button key={r} className="repeat-pill" aria-label={`Repeat ${r} times`} aria-pressed={singleRepeats === r} onClick={() => {
                    setSingleRepeats(r);
                    if (statusRef.current === "playing" || statusRef.current === "paused") stopPlayback();
                  }} style={{
                    padding: "0.45rem 1rem", borderRadius: 50,
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
              <span>Tap surahs to build your playlist. Tap again to remove.</span>
            </div>

            <div style={{ display: "grid", gap: "0.65rem", marginBottom: "1.5rem" }}>
              {SURAHS.map((s) => {
                const orderIndex = comboOrder.indexOf(s.id);
                const isSelected = orderIndex !== -1;
                const displayNum = orderIndex + 1;
                return (
                  <div key={s.id} className="surah-card"
                    role="checkbox" aria-checked={isSelected}
                    aria-label={`${s.name} - ${s.description}`}
                    tabIndex={0}
                    onClick={() => handleToggleCombo(s.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggleCombo(s.id); } }}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.8rem 1rem", borderRadius: 14, cursor: "pointer",
                      background: isSelected ? `linear-gradient(135deg, ${s.color}aa, ${s.color}55)` : "rgba(255,255,255,0.025)",
                      border: `1.5px solid ${isSelected ? s.accent + "55" : "rgba(255,255,255,0.06)"}`,
                      boxShadow: isSelected ? `0 2px 12px ${s.accent}15` : "none",
                      transition: "all 0.2s ease", userSelect: "none",
                    }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${isSelected ? s.accent : "rgba(255,255,255,0.12)"}`,
                      background: isSelected ? `${s.accent}25` : "rgba(255,255,255,0.03)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: isSelected ? "0.8rem" : "0.75rem",
                      color: isSelected ? s.accent : "#3a5a6a",
                      fontFamily: "sans-serif", fontWeight: 700, transition: "all 0.2s",
                    }}>
                      {isSelected ? displayNum : "＋"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.92rem", color: isSelected ? s.accent : "#6a8090" }}>
                        {s.moon} {s.name}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: isSelected ? "#5a8a7a" : "#3a5060", fontFamily: "sans-serif", marginTop: 1 }}>
                        {s.description} · {s.ayahs} ayahs
                      </div>
                    </div>
                    <div style={{ fontFamily: "sans-serif", fontSize: "0.95rem", color: isSelected ? "#4a7a6a" : "#2a3a4a", direction: "rtl", flexShrink: 0 }}>
                      {s.arabic}
                    </div>
                    {isSelected && (
                      <div style={{ display: "flex", gap: "0.28rem", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        {REPEAT_OPTIONS.slice(0, 4).map((r) => (
                          <button key={r} aria-label={`Repeat ${s.name} ${r} times`} onClick={() => setComboRepeats((prev) => ({ ...prev, [s.id]: r }))} style={{
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

            {/* Playlist summary */}
            {comboOrder.length > 0 ? (
              <div style={{
                padding: "0.85rem 1rem", borderRadius: 14, marginBottom: "1.25rem",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                fontFamily: "sans-serif",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <p style={{ fontSize: "0.68rem", color: "#3a5a6a", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                    Your playlist ({comboOrder.length} surah{comboOrder.length > 1 ? "s" : ""})
                  </p>
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    <button onClick={sharePlaylist} aria-label="Share playlist" style={{
                      background: "none", border: "1px solid rgba(100,180,140,0.25)", borderRadius: 50,
                      padding: "0.2rem 0.6rem", color: "#4ade80",
                      fontFamily: "sans-serif", fontSize: "0.65rem", cursor: "pointer",
                    }}>
                      🔗 Share
                    </button>
                    <button onClick={() => setShowSavePlaylist(!showSavePlaylist)} aria-label="Save playlist" style={{
                      background: "none", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 50,
                      padding: "0.2rem 0.6rem", color: "#a78bfa",
                      fontFamily: "sans-serif", fontSize: "0.65rem", cursor: "pointer",
                    }}>
                      💾 Save
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {comboOrder.map((id, i) => {
                    const s = getSurah(id);
                    return (
                      <div key={id} style={{
                        display: "flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.28rem 0.65rem", borderRadius: 50,
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

                {/* Save playlist input */}
                {showSavePlaylist && (
                  <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.4rem", animation: "slide-up 0.2s ease" }}>
                    <input
                      type="text" value={playlistNameInput}
                      onChange={(e) => setPlaylistNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveCurrentPlaylist(); }}
                      placeholder="Playlist name..."
                      aria-label="Playlist name"
                      style={{
                        flex: 1, padding: "0.4rem 0.7rem", borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                        color: "#c4d4e0", fontFamily: "sans-serif", fontSize: "0.75rem",
                        outline: "none",
                      }}
                    />
                    <button onClick={saveCurrentPlaylist} style={{
                      padding: "0.4rem 0.8rem", borderRadius: 8,
                      border: "none", background: "rgba(167,139,250,0.25)", color: "#a78bfa",
                      fontFamily: "sans-serif", fontSize: "0.72rem", cursor: "pointer",
                    }}>
                      Save
                    </button>
                  </div>
                )}

                <button onClick={() => { setComboOrder([]); stopPlayback(); }} style={{
                  marginTop: "0.6rem", background: "none",
                  border: "1px solid rgba(255,80,80,0.2)", borderRadius: 50,
                  padding: "0.25rem 0.75rem", color: "#f87171",
                  fontFamily: "sans-serif", fontSize: "0.68rem", cursor: "pointer",
                }}>
                  Clear all
                </button>
              </div>
            ) : (
              <p style={{ color: "#5a8a7a", fontSize: "0.78rem", fontFamily: "sans-serif", textAlign: "center", marginBottom: "1rem" }}>
                Tap any surah above to build your playlist
              </p>
            )}

            {/* Saved playlists */}
            {savedPlaylists.length > 0 && (
              <div style={{
                padding: "0.75rem 1rem", borderRadius: 14, marginBottom: "1.25rem",
                background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)",
                fontFamily: "sans-serif",
              }}>
                <p style={{ fontSize: "0.68rem", color: "#6a5a8a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                  💾 Saved Playlists
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {savedPlaylists.map((pl, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.4rem 0.7rem", borderRadius: 10,
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <button onClick={() => loadPlaylist(pl)} style={{
                        background: "none", border: "none", color: "#a78bfa",
                        fontSize: "0.75rem", cursor: "pointer", textAlign: "left", flex: 1,
                      }}>
                        {pl.name} <span style={{ color: "#4a5a6a" }}>({pl.items.length} surahs)</span>
                      </button>
                      <button onClick={() => deletePlaylist(i)} aria-label={`Delete playlist ${pl.name}`} style={{
                        background: "none", border: "none", color: "#f8717188",
                        fontSize: "0.7rem", cursor: "pointer", padding: "0.2rem 0.4rem",
                      }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ Sleep Timer ═══════════════════════════════════════════════════ */}
        <div style={{
          marginBottom: "1.25rem", padding: "0.9rem 1rem", borderRadius: 16,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#4a6a7a", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "sans-serif", margin: 0 }}>
              ⏾ Sleep Timer
            </p>
            {sleepSecondsLeft > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", animation: "slide-up 0.3s ease" }}>
                <span style={{ fontSize: "0.78rem", color: "#fb923c", fontFamily: "sans-serif", fontWeight: 600 }}>
                  {fmtTimer(sleepSecondsLeft)}
                </span>
                {sleepSecondsLeft <= 30 && (
                  <span style={{ fontSize: "0.65rem", color: "#fb923c66", fontFamily: "sans-serif" }}>fading…</span>
                )}
                <button onClick={() => { clearSleepTimer(); if (audioRef.current) { audioRef.current.volume = 1; setVolume(1); } }} aria-label="Cancel sleep timer" style={{
                  background: "none", border: "1px solid rgba(255,80,80,0.25)", borderRadius: 50,
                  padding: "0.15rem 0.5rem", color: "#f87171", fontFamily: "sans-serif",
                  fontSize: "0.65rem", cursor: "pointer",
                }}>
                  cancel
                </button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }} role="group" aria-label="Sleep timer options">
            {SLEEP_TIMER_OPTIONS.map((m) => (
              <button key={m} className="repeat-pill" aria-label={m === 0 ? "Sleep timer off" : `${m} minute sleep timer`} aria-pressed={sleepMinutes === m} onClick={() => {
                setSleepMinutes(m);
                if (m === 0) clearSleepTimer();
                else if (statusRef.current === "playing") startSleepTimer(m);
              }} style={{
                padding: "0.4rem 0.85rem", borderRadius: 50,
                border: `1.5px solid ${sleepMinutes === m ? "#fb923c88" : "rgba(255,255,255,0.1)"}`,
                background: sleepMinutes === m ? "rgba(251,146,60,0.15)" : "rgba(255,255,255,0.03)",
                color: sleepMinutes === m ? "#fb923c" : "#5a6a7a",
                fontFamily: "sans-serif", fontWeight: sleepMinutes === m ? 700 : 400,
                fontSize: "0.8rem", cursor: "pointer",
              }}>
                {m === 0 ? "Off" : `${m}m`}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.65rem", color: "#2a4a5a", fontFamily: "sans-serif", marginTop: "0.5rem", marginBottom: 0 }}>
            Audio fades out gently in the last 30 seconds before stopping
          </p>
        </div>

        {/* ══ Speed Control ════════════════════════════════════════════════ */}
        <div style={{
          marginBottom: "1.25rem", padding: "0.75rem 1rem", borderRadius: 16,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <button onClick={() => setShowSpeedControl(!showSpeedControl)} aria-expanded={showSpeedControl} style={{
            background: "none", border: "none", color: "#4a6a7a", cursor: "pointer",
            fontFamily: "sans-serif", fontSize: "0.72rem", textTransform: "uppercase",
            letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "0.5rem",
            width: "100%", padding: 0,
          }}>
            <span>🎚️ Playback Speed</span>
            <span style={{ color: "#60a5fa", fontWeight: 600 }}>{playbackSpeed}x</span>
            <span style={{ marginLeft: "auto", fontSize: "0.6rem" }}>{showSpeedControl ? "▲" : "▼"}</span>
          </button>
          {showSpeedControl && (
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem" }} role="group" aria-label="Playback speed">
              {SPEED_OPTIONS.map((s) => (
                <button key={s} className="repeat-pill" aria-label={`${s}x speed`} aria-pressed={playbackSpeed === s} onClick={() => setPlaybackSpeed(s)} style={{
                  padding: "0.4rem 0.85rem", borderRadius: 50,
                  border: `1.5px solid ${playbackSpeed === s ? "#60a5fa88" : "rgba(255,255,255,0.1)"}`,
                  background: playbackSpeed === s ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.03)",
                  color: playbackSpeed === s ? "#60a5fa" : "#5a6a7a",
                  fontFamily: "sans-serif", fontWeight: playbackSpeed === s ? 700 : 400,
                  fontSize: "0.8rem", cursor: "pointer",
                }}>
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ══ Player Controls ═══════════════════════════════════════════════ */}
        <div ref={playerCardRef} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22, padding: "1.5rem 1.25rem 1.5rem",
          animation: surahTransition ? "surah-enter 0.5s ease" : "none",
        }} role="region" aria-label="Audio player">

          {/* Now playing info */}
          <div style={{ textAlign: "center", marginBottom: "1.1rem", minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {status === "idle" && (
              <p style={{ color: "#3a5a6a", fontFamily: "sans-serif", fontSize: "0.82rem", margin: 0 }}>
                {mode === "combo" && comboOrder.length === 0
                  ? "Select surahs above to build your playlist"
                  : "Choose your surah and press play ▶"}
              </p>
            )}
            {status === "loading" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 16, height: 16, border: `2px solid ${accent}44`, borderTop: `2px solid ${accent}`, borderRadius: "50%", animation: "twinkle 0.8s linear infinite" }} />
                <p style={{ color: "#5a8a9a", fontFamily: "sans-serif", fontSize: "0.82rem", margin: 0 }}>
                  Loading recitation…
                </p>
              </div>
            )}
            {isActive && (
              <>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: accent, marginBottom: 4 }}>
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
                    <><span style={{ color: "#2a4050" }}>·</span><span style={{ color: "#4a6a7a" }}>Track {currentIdx + 1}/{queueRef.current.length}</span></>
                  )}
                  {sleepSecondsLeft > 0 && (
                    <><span style={{ color: "#2a4050" }}>·</span><span style={{ color: "#fb923c" }}>⏾ {fmtTimer(sleepSecondsLeft)}</span></>
                  )}
                </div>
              </>
            )}
            {status === "done" && (
              <div style={{ animation: "surah-enter 0.5s ease" }}>
                <p style={{ color: "#4a8a6a", fontFamily: "sans-serif", fontSize: "0.9rem", fontWeight: 500, margin: "0 0 0.3rem" }}>
                  ✓ Complete
                </p>
                <p style={{ color: "#3a6a5a", fontFamily: "sans-serif", fontSize: "0.75rem", fontStyle: "italic", margin: 0 }}>
                  Rest well, inshaaAllah 🌙
                </p>
              </div>
            )}
          </div>

          {/* Volume indicator (visible when fading) */}
          {volume < 1 && (
            <div style={{ marginBottom: "0.7rem", display: "flex", alignItems: "center", gap: "0.5rem", animation: "slide-up 0.2s ease" }}>
              <span style={{ fontSize: "0.65rem", color: "#fb923c", fontFamily: "sans-serif" }}>🔉 Fading</span>
              <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${volume * 100}%`, background: "#fb923c", borderRadius: 3, transition: "width 1s linear" }} />
              </div>
            </div>
          )}

          {/* Progress bar - larger touch target */}
          <div
            ref={progressBarRef}
            className="progress-bar-track"
            onClick={handleSeek}
            onTouchStart={handleSeek}
            role="slider"
            aria-label="Playback progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={`${fmt(progress)} of ${duration > 0 ? fmt(duration) : "unknown"}`}
            tabIndex={0}
            style={{
              height: 28, display: "flex", alignItems: "center",
              marginBottom: "0.3rem", position: "relative", cursor: "pointer",
            }}>
            <div style={{
              width: "100%", height: 6, background: "rgba(255,255,255,0.07)",
              borderRadius: 6, overflow: "visible", position: "relative",
            }}>
              <div style={{
                height: "100%", width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${accent}88, ${accent})`,
                borderRadius: 6, transition: "width 0.3s linear", position: "relative",
              }}>
                <div style={{
                  position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)",
                  width: 14, height: 14, borderRadius: "50%", background: accent,
                  boxShadow: `0 0 8px ${accent}88`,
                  opacity: isActive ? 1 : 0, transition: "opacity 0.2s",
                }} />
              </div>
            </div>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: "0.7rem", color: "#3a5a6a", fontFamily: "sans-serif", marginBottom: "1.1rem",
          }}>
            <span>{fmt(progress)}</span>
            <span>{duration > 0 ? fmt(duration) : "--:--"}</span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "0.65rem", justifyContent: "center", alignItems: "center" }}>
            {/* Stop */}
            <button className="icon-btn" onClick={stopPlayback} disabled={status === "idle"} aria-label="Stop" style={{
              width: 44, height: 44, borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: status === "idle" ? "#2a4a5a" : "#8aaabb",
              fontSize: "1rem", cursor: status === "idle" ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>■</button>

            {/* Skip -10s */}
            <button className="skip-btn icon-btn" onClick={() => skip(-10)} disabled={!isActive} aria-label="Skip back 10 seconds" style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
              color: !isActive ? "#2a4050" : "#6a9aaa",
              fontSize: "0.8rem", fontFamily: "sans-serif",
              cursor: !isActive ? "not-allowed" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 0, lineHeight: 1,
            }}>
              <span style={{ fontSize: "1rem" }}>⟨</span>
              <span style={{ fontSize: "0.55rem" }}>10s</span>
            </button>

            {/* Play / Pause */}
            <button
              className="btn-glow"
              onClick={() => status === "idle" || status === "done" ? startPlayback() : togglePause()}
              disabled={mode === "combo" && comboOrder.length === 0 && status === "idle"}
              aria-label={status === "playing" ? "Pause" : status === "loading" ? "Loading" : "Play"}
              style={{
                width: 72, height: 72, borderRadius: "50%",
                border: `2px solid ${accent}55`,
                background: `radial-gradient(circle, ${activeSurahDisplay.color}dd, ${activeSurahDisplay.color}88)`,
                color: accent, fontSize: "1.6rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 30px ${accent}2a`,
                transition: "all 0.25s ease", position: "relative",
                opacity: mode === "combo" && comboOrder.length === 0 && status === "idle" ? 0.4 : 1,
                animation: status === "playing" ? "glow-pulse 3s ease-in-out infinite" : "none",
              }}>
              {status === "loading"
                ? <span style={{ fontSize: "0.9rem", animation: "twinkle 0.8s infinite" }}>…</span>
                : status === "playing" ? "⏸" : "▶"}
              {status === "playing" && (
                <span aria-hidden="true" style={{
                  position: "absolute", inset: -5, borderRadius: "50%",
                  border: `2px solid ${accent}44`,
                  animation: "pulse-ring 2.5s ease-out infinite",
                }} />
              )}
            </button>

            {/* Skip +10s */}
            <button className="skip-btn icon-btn" onClick={() => skip(10)} disabled={!isActive} aria-label="Skip forward 10 seconds" style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
              color: !isActive ? "#2a4050" : "#6a9aaa",
              fontSize: "0.8rem", fontFamily: "sans-serif",
              cursor: !isActive ? "not-allowed" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 0, lineHeight: 1,
            }}>
              <span style={{ fontSize: "1rem" }}>⟩</span>
              <span style={{ fontSize: "0.55rem" }}>10s</span>
            </button>

            {/* Restart */}
            <button className="icon-btn" onClick={() => startPlayback()} aria-label="Restart from beginning" style={{
              width: 44, height: 44, borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
              color: "#8aaabb", fontSize: "1.1rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>↺</button>
          </div>

          {/* Wake lock indicator */}
          {wakeLockOn && (
            <div style={{ textAlign: "center", marginTop: "0.8rem" }}>
              <span style={{ fontSize: "0.62rem", color: "#2a5a4a", fontFamily: "sans-serif", letterSpacing: "0.04em" }}>
                ◉ Screen kept awake while playing
              </span>
            </div>
          )}
        </div>

        {/* ══ Queue visualization (combo mode while playing) ═══════════════ */}
        {mode === "combo" && isActive && queueRef.current.length > 1 && (
          <div style={{
            marginTop: "1.25rem", padding: "0.85rem 1rem", borderRadius: 16,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            fontFamily: "sans-serif",
          }}>
            <p style={{ fontSize: "0.68rem", color: "#3a5a6a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
              Now Playing Queue
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {queueRef.current.map((item, i) => {
                const s = getSurah(item.surahId);
                const isCurrent = i === currentIdx;
                const isPast = i < currentIdx;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.35rem 0.6rem", borderRadius: 8,
                    background: isCurrent ? `${s.accent}15` : "transparent",
                    border: isCurrent ? `1px solid ${s.accent}33` : "1px solid transparent",
                    opacity: isPast ? 0.4 : 1,
                    transition: "all 0.3s ease",
                  }}>
                    <span style={{ fontSize: "0.7rem", color: isCurrent ? s.accent : "#3a5a6a", fontWeight: 700, width: 16 }}>
                      {isPast ? "✓" : isCurrent ? "▶" : `${i + 1}`}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: isCurrent ? s.accent : "#5a7a8a", flex: 1 }}>
                      {s.moon} {s.name}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#3a5a6a" }}>×{item.totalRepeats}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Reciter selector ──────────────────────────────────────────────── */}
        <div style={{
          marginTop: "1.25rem", padding: "0.9rem 1rem", borderRadius: 16,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <p style={{ fontSize: "0.72rem", color: "#4a6a7a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem", fontFamily: "sans-serif" }}>
            🎙️ Reciter
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }} role="radiogroup" aria-label="Select reciter">
            {RECITERS.map((r) => (
              <button
                key={r.id}
                role="radio"
                aria-checked={selectedReciter === r.id}
                className="control-chip"
                onClick={() => { setSelectedReciter(r.id); if (isActive) stopPlayback(); }}
                style={{
                  padding: "0.6rem 0.75rem", borderRadius: 12, textAlign: "left",
                  border: `1.5px solid ${selectedReciter === r.id ? "#34d39966" : "rgba(255,255,255,0.08)"}`,
                  background: selectedReciter === r.id ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                }}>
                <div style={{ fontSize: "0.78rem", fontWeight: selectedReciter === r.id ? 600 : 400, color: selectedReciter === r.id ? "#34d399" : "#7a9aaa", fontFamily: "sans-serif" }}>
                  {r.name}
                </div>
                <div style={{ fontSize: "0.68rem", color: selectedReciter === r.id ? "#2a7a5a" : "#3a5a6a", marginTop: 2 }}>
                  {r.arabic}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <p style={{
            color: "#1a3040", fontSize: "0.65rem",
            fontFamily: "sans-serif", letterSpacing: "0.05em", marginBottom: "0.5rem",
          }}>
            Plays with screen off · Selections saved automatically · Lock screen controls enabled
          </p>
          <p style={{
            color: "#1a3040", fontSize: "0.6rem",
            fontFamily: "sans-serif", letterSpacing: "0.04em",
          }}>
            ⌨️ Space=Play/Pause · ←→=Skip · R=Restart · S=Stop
          </p>
        </div>
      </div>
    </main>
  );
}
