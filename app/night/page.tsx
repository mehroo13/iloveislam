"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Surahs ───────────────────────────────────────────────────────────────────
const SURAHS = [
  {
    id: "kahf",
    number: 18,
    name: "Surah Al-Kahf",
    arabic: "سورة الكهف",
    meaning: "The Cave",
    ayahs: 110,
    description: "Protection from Dajjal — recite on Fridays",
    color: "#1a2e2a",
    accent: "#34d399",
    moon: "🕌",
    url: "/audio/018 Kahf.mp3",
    fallbackUrl: "/audio/018 Kahf.mp3",
  },
  {
    id: "yasin",
    number: 36,
    name: "Surah Ya-Sin",
    arabic: "سورة يس",
    meaning: "Ya Sin",
    ayahs: 83,
    description: "The heart of the Quran",
    color: "#1e1a3a",
    accent: "#a78bfa",
    moon: "💫",
    url: "/audio/036 Yasin.mp3",
    fallbackUrl: "/audio/036 Yasin.mp3",
  },
  {
    id: "najam",
    number: 53,
    name: "Surah An-Najm",
    arabic: "سورة النجم",
    meaning: "The Star",
    ayahs: 62,
    description: "Revelation of divine truth and guidance",
    color: "#1a1e2e",
    accent: "#93c5fd",
    moon: "⭐",
    url: "/audio/053 Najam.mp3",
    fallbackUrl: "/audio/053 Najam.mp3",
  },
  {
    id: "rahman",
    number: 55,
    name: "Surah Ar-Rahman",
    arabic: "سورة الرحمن",
    meaning: "The Most Merciful",
    ayahs: 78,
    description: "Reminder of Allah's endless blessings",
    color: "#1a2a3a",
    accent: "#60a5fa",
    moon: "✨",
    url: "/audio/055 Rehman.mp3",
    fallbackUrl: "/audio/055 Rehman.mp3",
  },
  {
    id: "waqia",
    number: 56,
    name: "Surah Al-Waqi'ah",
    arabic: "سورة الواقعة",
    meaning: "The Inevitable Event",
    ayahs: 96,
    description: "Protection from poverty — recite every night",
    color: "#2a1a1a",
    accent: "#f87171",
    moon: "🔥",
    url: "/audio/056 Waqia.mp3",
    fallbackUrl: "/audio/056 Waqia.mp3",
  },
  {
    id: "mulk",
    number: 67,
    name: "Surah Al-Mulk",
    arabic: "سورة الملك",
    meaning: "The Sovereignty",
    ayahs: 30,
    description: "Protection from the punishment of the grave",
    color: "#1a3a2e",
    accent: "#4ade80",
    moon: "🌙",
    url: "/audio/067 Mulk.mp3",
    fallbackUrl: "/audio/067 Mulk.mp3",
  },
  {
    id: "duha",
    number: 93,
    name: "Surah Ad-Duha",
    arabic: "سورة الضحى",
    meaning: "The Morning Brightness",
    ayahs: 11,
    description: "Allah has not forsaken you — peace before sleep",
    color: "#2a1a0e",
    accent: "#fb923c",
    moon: "🌟",
    url: "/audio/093 Duha.mp3",
    fallbackUrl: "/audio/093 Duha.mp3",
  },
];

const REPEAT_OPTIONS = [1, 2, 3, 5, 7, 10];

type PlayMode = "single" | "combo";
type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "done";

interface QueueItem {
  surahId: string;
  totalRepeats: number;
}

export default function NightPage() {
  // ── Mode
  const [mode, setMode] = useState<PlayMode>("single");

  // ── Note banner
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

  // ── Refs for audio engine (avoids stale closures in event listeners)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const currentIdxRef = useRef(0);
  const currentRepeatRef = useRef(1);
  const statusRef = useRef<PlayerStatus>("idle");

  // Keep statusRef in sync
  const updateStatus = (s: PlayerStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  // ── Stars background (stable ref)
  const stars = useRef(
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      delay: Math.random() * 4,
    }))
  ).current;

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const getSurah = (id: string) => SURAHS.find((s) => s.id === id) ?? SURAHS[5];
  const selectedSurah = getSurah(selectedSurahId);

  // Compute what's actively playing for the UI
  const activeQueue = queueRef.current;
  const activeSurahDisplay =
    activeQueue.length > 0 &&
    (status === "playing" || status === "paused" || status === "loading")
      ? getSurah(activeQueue[currentIdx]?.surahId ?? activeQueue[0].surahId)
      : selectedSurah;

  // ─── Core audio loader (uses refs — safe inside event listeners) ──────────────
  const loadAndPlayRef = useRef<(surahId: string) => void>(() => {});

  useEffect(() => {
    loadAndPlayRef.current = (surahId: string) => {
      const surah = getSurah(surahId);
      if (!audioRef.current) return;
      updateStatus("loading");
      audioRef.current.src = surah.url;
      audioRef.current.load();

      // Update MediaSession metadata for lock screen
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
  }); // runs every render so getSurah is always fresh — loadAndPlayRef.current is stable

  // ─── Audio setup (once) ───────────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    // Required for background/lock screen playback on iOS
    audio.setAttribute("playsinline", "true");
    audioRef.current = audio;

    const onPlay = () => updateStatus("playing");

    const onPause = () => {
      if (audio.ended) return; // ended fires before pause sometimes
      updateStatus("paused");
    };

    const onLoadedMetadata = () => setDuration(audio.duration);

    const onTimeUpdate = () => setProgress(audio.currentTime);

    const onEnded = () => {
      // Everything reads from refs — no stale closures
      const q = queueRef.current;
      const idx = currentIdxRef.current;
      const item = q[idx];
      if (!item) {
        updateStatus("done");
        return;
      }

      const nextRepeat = currentRepeatRef.current + 1;

      if (nextRepeat <= item.totalRepeats) {
        // Repeat the same surah
        currentRepeatRef.current = nextRepeat;
        setCurrentRepeat(nextRepeat);
        setTimeout(() => loadAndPlayRef.current(item.surahId), 400);
        return;
      }

      // Move to next surah in queue
      const nextIdx = idx + 1;
      if (nextIdx >= q.length) {
        updateStatus("done");
        setProgress(0);
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

    // MediaSession action handlers (lock screen controls)
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => {
        audio.play();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        audio.pause();
      });
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

  // ─── Build queue and start ────────────────────────────────────────────────────
  const startPlayback = useCallback(() => {
    let q: QueueItem[];
    if (mode === "single") {
      q = [{ surahId: selectedSurahId, totalRepeats: singleRepeats }];
    } else {
      if (comboOrder.length === 0) return;
      q = comboOrder.map((id) => ({ surahId: id, totalRepeats: comboRepeats[id] ?? 1 }));
    }

    // Reset all refs first
    queueRef.current = q;
    currentIdxRef.current = 0;
    currentRepeatRef.current = 1;

    setCurrentIdx(0);
    setCurrentRepeat(1);
    setTotalRepeats(q[0].totalRepeats);
    setProgress(0);
    setDuration(0);

    loadAndPlayRef.current(q[0].surahId);
  }, [mode, selectedSurahId, singleRepeats, comboOrder, comboRepeats]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    queueRef.current = [];
    currentIdxRef.current = 0;
    currentRepeatRef.current = 1;
    updateStatus("idle");
    setProgress(0);
    setDuration(0);
    setCurrentIdx(0);
    setCurrentRepeat(1);
  }, []);

  const togglePause = useCallback(() => {
    if (!audioRef.current) return;
    if (statusRef.current === "playing") {
      audioRef.current.pause();
    } else if (statusRef.current === "paused") {
      audioRef.current.play();
    }
  }, []);

  // Seek on progress bar
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!audioRef.current || duration === 0) return;
      const bar = progressBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      audioRef.current.currentTime = pct * duration;
      setProgress(pct * duration);
    },
    [duration]
  );

  // Skip ±10s
  const skip = useCallback(
    (seconds: number) => {
      if (!audioRef.current || duration === 0) return;
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + seconds)
      );
    },
    [duration]
  );

  // ─── Single mode: select surah ────────────────────────────────────────────────
  const handleSelectSingle = (id: string) => {
    stopPlayback();
    setSelectedSurahId(id);
  };

  // ─── Combo mode: tap to add/remove ───────────────────────────────────────────
  const handleToggleCombo = (id: string) => {
    stopPlayback();
    setComboOrder((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ─── Format time ──────────────────────────────────────────────────────────────
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const accent = activeSurahDisplay.accent;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <main
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at 30% 20%, #0d1f2d 0%, #050d14 60%, #030810 100%)`,
        color: "#e2e8f0",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Stars */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {stars.map((s) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: "white",
              opacity: s.opacity,
              animation: `twinkle ${2 + s.delay}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes twinkle {
          from { opacity: 0.1; transform: scale(0.8); }
          to   { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .surah-card   { transition: all 0.2s ease; }
        .btn-glow:hover { filter: brightness(1.15); transform: scale(1.03); }
        .repeat-pill  { transition: all 0.18s ease; cursor: pointer; }
        .repeat-pill:hover { transform: scale(1.08); }
        .skip-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .progress-bar-track { cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d4a3e; border-radius: 2px; }
      `}</style>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 680,
          margin: "0 auto",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "0.4rem",
              animation: "float 4s ease-in-out infinite",
              display: "block",
            }}
          >
            🌙
          </div>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 300,
              letterSpacing: "0.12em",
              color: "#c9d8e8",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            Night Recitation
          </h1>

          {/* Collapsible note */}
          <div style={{ marginTop: "0.75rem" }}>
            <button
              onClick={() => setNoteOpen((v) => !v)}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 50,
                padding: "0.3rem 0.9rem",
                color: "#4a7a8a",
                fontFamily: "sans-serif",
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>{noteOpen ? "▲" : "▼"}</span>
              <span>About this app</span>
            </button>
            {noteOpen && (
              <div
                style={{
                  marginTop: "0.6rem",
                  padding: "0.85rem 1rem",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  textAlign: "left",
                  fontFamily: "sans-serif",
                  fontSize: "0.78rem",
                  color: "#5a8a9a",
                  lineHeight: 1.6,
                }}
              >
                <strong
                  style={{
                    color: "#7abaca",
                    display: "block",
                    marginBottom: "0.35rem",
                  }}
                >
                  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                </strong>
                A bedtime companion for listening to Quranic recitations before
                sleep. Play a single surah on repeat, or build a custom combo
                playlist by tapping surahs in your preferred order — then let
                the audio stop automatically. Audio continues playing when the
                screen is off.
              </div>
            )}
          </div>
        </div>

        {/* ── Mode Toggle ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 50,
            padding: 4,
            marginBottom: "1.75rem",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {(["single", "combo"] as PlayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                stopPlayback();
              }}
              style={{
                flex: 1,
                padding: "0.55rem 1rem",
                borderRadius: 50,
                border: "none",
                background:
                  mode === m ? "rgba(100,180,140,0.2)" : "transparent",
                color: mode === m ? "#7ee8a2" : "#5a7a8a",
                fontFamily: "sans-serif",
                fontSize: "0.83rem",
                fontWeight: mode === m ? 600 : 400,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow:
                  mode === m ? "0 0 12px rgba(100,200,140,0.15)" : "none",
              }}
            >
              {m === "single" ? "🎵 Single" : "🎶 Combo"}
            </button>
          ))}
        </div>

        {/* ══ Single Mode ══════════════════════════════════════════════════ */}
        {mode === "single" && (
          <>
            <div
              style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}
            >
              {SURAHS.map((s) => {
                const isSelected = selectedSurahId === s.id;
                return (
                  <div
                    key={s.id}
                    className="surah-card"
                    onClick={() => handleSelectSingle(s.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      padding: "0.85rem 1.1rem",
                      borderRadius: 14,
                      cursor: "pointer",
                      background: isSelected
                        ? `linear-gradient(135deg, ${s.color}cc, ${s.color}88)`
                        : "rgba(255,255,255,0.03)",
                      border: `1.5px solid ${
                        isSelected
                          ? s.accent + "55"
                          : "rgba(255,255,255,0.07)"
                      }`,
                      boxShadow: isSelected
                        ? `0 4px 20px ${s.accent}1a`
                        : "none",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ fontSize: "1.4rem", flexShrink: 0 }}>
                      {s.moon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          color: isSelected ? s.accent : "#c4d4e0",
                        }}
                      >
                        {s.name}
                      </div>
                      {/* Description shown fully — no truncation */}
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "#5a7a90",
                          fontFamily: "sans-serif",
                          marginTop: 2,
                          lineHeight: 1.4,
                        }}
                      >
                        {s.description} · {s.ayahs} ayahs
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: "1.1rem",
                        color: "#2a4a5a",
                        direction: "rtl",
                        flexShrink: 0,
                      }}
                    >
                      {s.arabic}
                    </div>
                    {/* Selected indicator */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        flexShrink: 0,
                        border: `2px solid ${
                          isSelected ? s.accent : "rgba(255,255,255,0.15)"
                        }`,
                        background: isSelected
                          ? `${s.accent}33`
                          : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        color: s.accent,
                        transition: "all 0.18s",
                      }}
                    >
                      {isSelected && "✓"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Repeat selector */}
            <div style={{ marginBottom: "1.75rem" }}>
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "#4a6a7a",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "0.6rem",
                  fontFamily: "sans-serif",
                }}
              >
                Repeat times
              </p>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                {REPEAT_OPTIONS.map((r) => (
                  <button
                    key={r}
                    className="repeat-pill"
                    onClick={() => {
                      setSingleRepeats(r);
                      // If already playing, stop so next play uses new repeat count
                      if (
                        statusRef.current === "playing" ||
                        statusRef.current === "paused"
                      ) {
                        stopPlayback();
                      }
                    }}
                    style={{
                      padding: "0.4rem 0.9rem",
                      borderRadius: 50,
                      border: `1.5px solid ${
                        singleRepeats === r
                          ? selectedSurah.accent + "88"
                          : "rgba(255,255,255,0.1)"
                      }`,
                      background:
                        singleRepeats === r
                          ? `${selectedSurah.accent}22`
                          : "rgba(255,255,255,0.03)",
                      color:
                        singleRepeats === r
                          ? selectedSurah.accent
                          : "#6a8a9a",
                      fontFamily: "sans-serif",
                      fontWeight: singleRepeats === r ? 700 : 400,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
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
            {/* Instruction banner */}
            <div
              style={{
                padding: "0.65rem 1rem",
                borderRadius: 12,
                marginBottom: "1rem",
                background: "rgba(100,180,140,0.07)",
                border: "1px solid rgba(100,180,140,0.15)",
                fontFamily: "sans-serif",
                fontSize: "0.76rem",
                color: "#5a9a7a",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "1rem" }}>👆</span>
              <span>
                Tap a surah to add it to your playlist in order. Tap again to
                remove. Numbers show playback order.
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gap: "0.65rem",
                marginBottom: "1.75rem",
              }}
            >
              {SURAHS.map((s) => {
                const orderIndex = comboOrder.indexOf(s.id);
                const isSelected = orderIndex !== -1;
                const displayNum = orderIndex + 1;

                return (
                  <div
                    key={s.id}
                    onClick={() => handleToggleCombo(s.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      borderRadius: 13,
                      cursor: "pointer",
                      background: isSelected
                        ? `linear-gradient(135deg, ${s.color}aa, ${s.color}55)`
                        : "rgba(255,255,255,0.025)",
                      border: `1.5px solid ${
                        isSelected
                          ? s.accent + "55"
                          : "rgba(255,255,255,0.06)"
                      }`,
                      boxShadow: isSelected
                        ? `0 2px 12px ${s.accent}15`
                        : "none",
                      transition: "all 0.2s ease",
                      userSelect: "none",
                    }}
                  >
                    {/* Order number badge */}
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        flexShrink: 0,
                        border: `2px solid ${
                          isSelected ? s.accent : "rgba(255,255,255,0.12)"
                        }`,
                        background: isSelected
                          ? `${s.accent}25`
                          : "rgba(255,255,255,0.03)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: isSelected ? "0.8rem" : "0.7rem",
                        color: isSelected ? s.accent : "#3a5a6a",
                        fontFamily: "sans-serif",
                        fontWeight: 700,
                        transition: "all 0.2s",
                      }}
                    >
                      {isSelected ? displayNum : "＋"}
                    </div>

                    {/* Surah info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.92rem",
                          color: isSelected ? s.accent : "#6a8090",
                        }}
                      >
                        {s.moon} {s.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: isSelected ? "#5a8a7a" : "#3a5060",
                          fontFamily: "sans-serif",
                          marginTop: 1,
                          lineHeight: 1.4,
                        }}
                      >
                        {s.description} · {s.ayahs} ayahs
                      </div>
                    </div>

                    {/* Arabic name */}
                    <div
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: "0.95rem",
                        color: isSelected ? "#4a7a6a" : "#2a3a4a",
                        direction: "rtl",
                        flexShrink: 0,
                      }}
                    >
                      {s.arabic}
                    </div>

                    {/* Inline repeat picker — only when selected */}
                    {isSelected && (
                      <div
                        style={{ display: "flex", gap: "0.28rem", flexShrink: 0 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {[1, 2, 3].map((r) => (
                          <button
                            key={r}
                            onClick={() =>
                              setComboRepeats((prev) => ({ ...prev, [s.id]: r }))
                            }
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              border: `1.5px solid ${
                                comboRepeats[s.id] === r
                                  ? s.accent
                                  : "rgba(255,255,255,0.1)"
                              }`,
                              background:
                                comboRepeats[s.id] === r
                                  ? `${s.accent}28`
                                  : "rgba(255,255,255,0.03)",
                              color:
                                comboRepeats[s.id] === r
                                  ? s.accent
                                  : "#5a7a8a",
                              fontSize: "0.68rem",
                              fontFamily: "sans-serif",
                              fontWeight: comboRepeats[s.id] === r ? 700 : 400,
                              cursor: "pointer",
                            }}
                          >
                            ×{r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Combo summary */}
            {comboOrder.length > 0 ? (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: 12,
                  marginBottom: "1.25rem",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  fontFamily: "sans-serif",
                }}
              >
                <p
                  style={{
                    fontSize: "0.68rem",
                    color: "#3a5a6a",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "0.5rem",
                  }}
                >
                  Your playlist ({comboOrder.length} surah
                  {comboOrder.length > 1 ? "s" : ""})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {comboOrder.map((id, i) => {
                    const s = getSurah(id);
                    return (
                      <div
                        key={id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "0.25rem 0.6rem",
                          borderRadius: 50,
                          background: `${s.accent}18`,
                          border: `1px solid ${s.accent}33`,
                          fontSize: "0.72rem",
                          color: s.accent,
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{i + 1}.</span>
                        <span>{s.name}</span>
                        <span style={{ color: "#3a5a6a" }}>
                          ×{comboRepeats[id] ?? 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    setComboOrder([]);
                    stopPlayback();
                  }}
                  style={{
                    marginTop: "0.6rem",
                    background: "none",
                    border: "1px solid rgba(255,80,80,0.2)",
                    borderRadius: 50,
                    padding: "0.2rem 0.7rem",
                    color: "#f87171",
                    fontFamily: "sans-serif",
                    fontSize: "0.68rem",
                    cursor: "pointer",
                  }}
                >
                  Clear all
                </button>
              </div>
            ) : (
              <p
                style={{
                  color: "#f87171",
                  fontSize: "0.78rem",
                  fontFamily: "sans-serif",
                  textAlign: "center",
                  marginBottom: "1rem",
                }}
              >
                Tap any surah above to build your playlist
              </p>
            )}
          </>
        )}

        {/* ══ Player Controls ═══════════════════════════════════════════════ */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "1.25rem 1.25rem 1.4rem",
          }}
        >
          {/* Now playing info */}
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            {status === "idle" && (
              <p
                style={{
                  color: "#3a5a6a",
                  fontFamily: "sans-serif",
                  fontSize: "0.82rem",
                  margin: 0,
                }}
              >
                {mode === "combo" && comboOrder.length === 0
                  ? "Select surahs above to build your playlist"
                  : "Choose your surah and press play"}
              </p>
            )}
            {status === "loading" && (
              <p
                style={{
                  color: "#5a8a9a",
                  fontFamily: "sans-serif",
                  fontSize: "0.82rem",
                  margin: 0,
                }}
              >
                Loading recitation...
              </p>
            )}
            {(status === "playing" || status === "paused") && (
              <>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: accent,
                    marginBottom: 3,
                  }}
                >
                  {activeSurahDisplay.arabic}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6a8a9a",
                    fontFamily: "sans-serif",
                  }}
                >
                  {activeSurahDisplay.name}
                  {" · "}
                  <span style={{ color: accent }}>
                    Repeat {currentRepeat}/{totalRepeats}
                  </span>
                  {mode === "combo" && queueRef.current.length > 1 && (
                    <span style={{ color: "#4a6a7a" }}>
                      {" "}
                      · {currentIdx + 1}/{queueRef.current.length}
                    </span>
                  )}
                </div>
              </>
            )}
            {status === "done" && (
              <p
                style={{
                  color: "#4a8a6a",
                  fontFamily: "sans-serif",
                  fontSize: "0.85rem",
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                ✓ Complete · Rest well, inshaaAllah 🌙
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div
            ref={progressBarRef}
            className="progress-bar-track"
            onClick={handleSeek}
            onTouchStart={handleSeek}
            style={{
              height: 6,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 6,
              overflow: "visible",
              marginBottom: "0.5rem",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${accent}88, ${accent})`,
                borderRadius: 6,
                transition: "width 0.4s linear",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: -5,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 6px ${accent}88`,
                  opacity:
                    status === "playing" || status === "paused" ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.68rem",
              color: "#3a5a6a",
              fontFamily: "sans-serif",
              marginBottom: "1rem",
            }}
          >
            <span>{fmt(progress)}</span>
            <span>{duration > 0 ? fmt(duration) : "--:--"}</span>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Stop */}
            <button
              onClick={stopPlayback}
              disabled={status === "idle"}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: status === "idle" ? "#2a4a5a" : "#8aaabb",
                fontSize: "1rem",
                cursor: status === "idle" ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              ■
            </button>

            {/* Skip -10s */}
            <button
              className="skip-btn"
              onClick={() => skip(-10)}
              disabled={status === "idle" || status === "done"}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                color:
                  status === "idle" || status === "done"
                    ? "#2a4050"
                    : "#6a9aaa",
                fontSize: "0.8rem",
                fontFamily: "sans-serif",
                cursor:
                  status === "idle" || status === "done"
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
                transition: "all 0.18s",
                lineHeight: 1,
              }}
            >
              <span style={{ fontSize: "1rem" }}>⟨</span>
              <span style={{ fontSize: "0.55rem" }}>10s</span>
            </button>

            {/* Play / Pause */}
            <button
              className="btn-glow"
              onClick={() =>
                status === "idle" || status === "done"
                  ? startPlayback()
                  : togglePause()
              }
              disabled={
                mode === "combo" &&
                comboOrder.length === 0 &&
                status === "idle"
              }
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                border: `2px solid ${accent}55`,
                background: `radial-gradient(circle, ${activeSurahDisplay.color}dd, ${activeSurahDisplay.color}88)`,
                color: accent,
                fontSize: "1.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 24px ${accent}2a`,
                transition: "all 0.25s ease",
                position: "relative",
                opacity:
                  mode === "combo" &&
                  comboOrder.length === 0 &&
                  status === "idle"
                    ? 0.4
                    : 1,
              }}
            >
              {status === "loading" ? (
                <span
                  style={{
                    fontSize: "0.9rem",
                    animation: "twinkle 0.8s infinite",
                  }}
                >
                  …
                </span>
              ) : status === "playing" ? (
                "⏸"
              ) : (
                "▶"
              )}
              {status === "playing" && (
                <span
                  style={{
                    position: "absolute",
                    inset: -4,
                    borderRadius: "50%",
                    border: `2px solid ${accent}44`,
                    animation: "pulse-ring 2s ease-out infinite",
                  }}
                />
              )}
            </button>

            {/* Skip +10s */}
            <button
              className="skip-btn"
              onClick={() => skip(10)}
              disabled={status === "idle" || status === "done"}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                color:
                  status === "idle" || status === "done"
                    ? "#2a4050"
                    : "#6a9aaa",
                fontSize: "0.8rem",
                fontFamily: "sans-serif",
                cursor:
                  status === "idle" || status === "done"
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
                transition: "all 0.18s",
                lineHeight: 1,
              }}
            >
              <span style={{ fontSize: "1rem" }}>⟩</span>
              <span style={{ fontSize: "0.55rem" }}>10s</span>
            </button>

            {/* Restart */}
            <button
              onClick={() => startPlayback()}
              // restart always calls with no overrides
              title="Restart"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#8aaabb",
                fontSize: "1.05rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              ↺
            </button>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            color: "#253545",
            fontSize: "0.68rem",
            fontFamily: "sans-serif",
            marginTop: "1.5rem",
            letterSpacing: "0.05em",
          }}
        >
          Audio stops automatically after chosen repeats · Plays with screen off
        </p>
      </div>
    </main>
  );
}