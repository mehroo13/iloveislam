"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Reciter & Audio Sources ──────────────────────────────────────────────────
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
  repeatLeft: number;
  _currentRepeat?: number;
}

export default function NightPage() {
  // ── Mode
  const [mode, setMode] = useState<PlayMode>("single");

  // ── Single mode
  const [selectedSurah, setSelectedSurah] = useState(SURAHS[5]); // default: Mulk
  const [singleRepeats, setSingleRepeats] = useState(1);

  // ── Combo mode
  const [comboOrder, setComboOrder] = useState<string[]>(
    SURAHS.map((s) => s.id)
  );
  const [comboRepeats, setComboRepeats] = useState<Record<string, number>>(
    Object.fromEntries(SURAHS.map((s) => [s.id, 1]))
  );

  // ── Player state
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [totalRepeats, setTotalRepeats] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Stars background
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.6 + 0.2,
    delay: Math.random() * 4,
  }));

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getSurah = (id: string) => SURAHS.find((s) => s.id === id)!;

  const buildQueue = useCallback((): QueueItem[] => {
    if (mode === "single") {
      return [{ surahId: selectedSurah.id, repeatLeft: singleRepeats }];
    }
    return comboOrder.map((id) => ({
      surahId: id,
      repeatLeft: comboRepeats[id] ?? 1,
    }));
  }, [mode, selectedSurah, singleRepeats, comboOrder, comboRepeats]);

  const currentSurah =
    queue.length > 0 ? getSurah(queue[currentIdx]?.surahId) : selectedSurah;

  // ─── Audio engine ────────────────────────────────────────────────────────────
  const loadAndPlay = useCallback((url: string, fallback: string) => {
    if (!audioRef.current) return;
    setStatus("loading");
    audioRef.current.src = url;
    audioRef.current.load();
    audioRef.current.play().catch(() => {
      if (audioRef.current) {
        audioRef.current.src = fallback;
        audioRef.current.load();
        audioRef.current.play().catch(() => setStatus("idle"));
      }
    });
  }, []);

  const startPlayback = useCallback(() => {
    const q = buildQueue();
    setQueue(q);
    setCurrentIdx(0);
    setCurrentRepeat(1);
    setTotalRepeats(q[0]?.repeatLeft ?? 1);
    setProgress(0);
    const surah = getSurah(q[0].surahId);
    loadAndPlay(surah.url, surah.fallbackUrl);
  }, [buildQueue, loadAndPlay]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStatus("idle");
    setProgress(0);
    setQueue([]);
    setCurrentIdx(0);
  }, []);

  const togglePause = useCallback(() => {
    if (!audioRef.current) return;
    if (status === "playing") {
      audioRef.current.pause();
      setStatus("paused");
    } else if (status === "paused") {
      audioRef.current.play();
      setStatus("playing");
    }
  }, [status]);

  // ─── Audio event handlers ────────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const onPlay = () => setStatus("playing");
    const onPause = () => {
      if (audioRef.current && !audioRef.current.ended) setStatus("paused");
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setProgress(audio.currentTime);

    const onEnded = () => {
      setQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue;

        setCurrentIdx((prevIdx) => {
          const item = prevQueue[prevIdx];
          if (!item) return prevIdx;

          const repeatsForItem =
            mode === "single"
              ? singleRepeats
              : comboRepeats[item.surahId] ?? 1;
          const nextRepeat = (prevQueue[prevIdx]._currentRepeat ?? 1) + 1;

          if (nextRepeat <= repeatsForItem) {
            prevQueue[prevIdx]._currentRepeat = nextRepeat;
            setCurrentRepeat(nextRepeat);
            const s = getSurah(item.surahId);
            setTimeout(() => loadAndPlay(s.url, s.fallbackUrl), 500);
            return prevIdx;
          }

          const nextIdx = prevIdx + 1;
          if (nextIdx >= prevQueue.length) {
            setStatus("done");
            return prevIdx;
          }
          const nextItem = prevQueue[nextIdx];
          nextItem._currentRepeat = 1;
          setCurrentRepeat(1);
          setTotalRepeats(
            mode === "single"
              ? singleRepeats
              : comboRepeats[nextItem.surahId] ?? 1
          );
          setProgress(0);
          const s = getSurah(nextItem.surahId);
          setTimeout(() => loadAndPlay(s.url, s.fallbackUrl), 500);
          return nextIdx;
        });

        return prevQueue;
      });
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

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

  // ─── Combo drag reorder ──────────────────────────────────────────────────────
  const dragSurah = useRef<string | null>(null);

  const handleDragStart = (id: string) => {
    dragSurah.current = id;
  };
  const handleDrop = (id: string) => {
    if (!dragSurah.current || dragSurah.current === id) return;
    setComboOrder((prev) => {
      const from = prev.indexOf(dragSurah.current!);
      const to = prev.indexOf(id);
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragSurah.current!);
      return next;
    });
    dragSurah.current = null;
  };

  // ─── Format time ─────────────────────────────────────────────────────────────
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  const activeSurahDisplay =
    queue.length > 0 && status !== "idle" && status !== "done"
      ? getSurah(queue[currentIdx]?.surahId ?? queue[0].surahId)
      : mode === "single"
      ? selectedSurah
      : getSurah(comboOrder[0]);

  // ─── Render ──────────────────────────────────────────────────────────────────
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
          to { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .surah-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .surah-card:hover {
          transform: translateY(-3px);
        }
        .btn-glow:hover {
          filter: brightness(1.15);
          transform: scale(1.02);
        }
        .repeat-pill {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .repeat-pill:hover {
          transform: scale(1.08);
        }
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
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "3.5rem",
              marginBottom: "0.5rem",
              animation: "float 4s ease-in-out infinite",
              display: "block",
            }}
          >
            🌙
          </div>
          <h1
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 300,
              letterSpacing: "0.12em",
              color: "#c9d8e8",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            Night Recitation
          </h1>
          <p
            style={{
              color: "#7a9ab8",
              fontSize: "0.9rem",
              marginTop: "0.5rem",
              letterSpacing: "0.05em",
              fontStyle: "italic",
            }}
          >
            Sheikh Abdul Rahman Al-Sudais · Imam of the Grand Mosque, Makkah
          </p>
          <p
            style={{
              color: "#4a6a82",
              fontSize: "0.78rem",
              marginTop: "0.3rem",
              fontFamily: "sans-serif",
            }}
          >
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>
        </div>

        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 50,
            padding: 4,
            marginBottom: "2rem",
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
                padding: "0.6rem 1rem",
                borderRadius: 50,
                border: "none",
                background:
                  mode === m ? "rgba(100,180,140,0.2)" : "transparent",
                color: mode === m ? "#7ee8a2" : "#5a7a8a",
                fontFamily: "sans-serif",
                fontSize: "0.85rem",
                fontWeight: mode === m ? 600 : 400,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow:
                  mode === m ? "0 0 12px rgba(100,200,140,0.15)" : "none",
              }}
            >
              {m === "single" ? "🎵 Single Surah" : "🎶 Combo Play"}
            </button>
          ))}
        </div>

        {/* ── Single Mode ─────────────────────────────────────────────── */}
        {mode === "single" && (
          <>
            <div
              style={{
                display: "grid",
                gap: "0.85rem",
                marginBottom: "1.75rem",
              }}
            >
              {SURAHS.map((s) => (
                <div
                  key={s.id}
                  className="surah-card"
                  onClick={() => {
                    setSelectedSurah(s);
                    if (status !== "idle") stopPlayback();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    borderRadius: 16,
                    background:
                      selectedSurah.id === s.id
                        ? `linear-gradient(135deg, ${s.color}cc, ${s.color}88)`
                        : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${
                      selectedSurah.id === s.id
                        ? s.accent + "55"
                        : "rgba(255,255,255,0.07)"
                    }`,
                    boxShadow:
                      selectedSurah.id === s.id
                        ? `0 4px 24px ${s.accent}22`
                        : "none",
                  }}
                >
                  <div style={{ fontSize: "1.6rem", flexShrink: 0 }}>
                    {s.moon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "1rem",
                        color:
                          selectedSurah.id === s.id ? s.accent : "#c4d4e0",
                      }}
                    >
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "#5a7a90",
                        fontFamily: "sans-serif",
                        marginTop: 2,
                      }}
                    >
                      {s.description} · {s.ayahs} ayahs
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: "1.3rem",
                      color: "#2a4a5a",
                      direction: "rtl",
                    }}
                  >
                    {s.arabic}
                  </div>
                  {selectedSurah.id === s.id && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: s.accent,
                        boxShadow: `0 0 8px ${s.accent}`,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Repeat selector */}
            <div style={{ marginBottom: "2rem" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#4a6a7a",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "0.75rem",
                  fontFamily: "sans-serif",
                }}
              >
                Repeat times
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {REPEAT_OPTIONS.map((r) => (
                  <button
                    key={r}
                    className="repeat-pill"
                    onClick={() => setSingleRepeats(r)}
                    style={{
                      padding: "0.45rem 1rem",
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
                      fontSize: "0.88rem",
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

        {/* ── Combo Mode ──────────────────────────────────────────────── */}
        {mode === "combo" && (
          <>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#4a6a7a",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0.75rem",
                fontFamily: "sans-serif",
              }}
            >
              Drag to reorder · set repeats per surah
            </p>
            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
              {comboOrder.map((id, index) => {
                const s = getSurah(id);
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => handleDragStart(id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.85rem 1.2rem",
                      borderRadius: 14,
                      background: `linear-gradient(135deg, ${s.color}99, ${s.color}44)`,
                      border: `1px solid ${s.accent}33`,
                      cursor: "grab",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: `${s.accent}22`,
                        border: `1.5px solid ${s.accent}55`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.72rem",
                        color: s.accent,
                        fontFamily: "sans-serif",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          color: s.accent,
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.73rem",
                          color: "#4a6a7a",
                          fontFamily: "sans-serif",
                        }}
                      >
                        {s.meaning}
                      </div>
                    </div>
                    {/* Repeat selector inline */}
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {[1, 2, 3].map((r) => (
                        <button
                          key={r}
                          onClick={() =>
                            setComboRepeats((prev) => ({ ...prev, [id]: r }))
                          }
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            border: `1.5px solid ${
                              comboRepeats[id] === r
                                ? s.accent
                                : "rgba(255,255,255,0.1)"
                            }`,
                            background:
                              comboRepeats[id] === r
                                ? `${s.accent}30`
                                : "rgba(255,255,255,0.03)",
                            color:
                              comboRepeats[id] === r ? s.accent : "#5a7a8a",
                            fontSize: "0.72rem",
                            fontFamily: "sans-serif",
                            fontWeight: comboRepeats[id] === r ? 700 : 400,
                            cursor: "pointer",
                          }}
                        >
                          ×{r}
                        </button>
                      ))}
                    </div>
                    <div
                      style={{
                        color: "#2a4a5a",
                        fontSize: "1.1rem",
                        cursor: "grab",
                      }}
                    >
                      ⠿
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Player Controls ──────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "1.5rem",
          }}
        >
          {/* Now playing info */}
          <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
            {status === "idle" && (
              <p
                style={{
                  color: "#3a5a6a",
                  fontFamily: "sans-serif",
                  fontSize: "0.85rem",
                }}
              >
                Choose your surah above and press play
              </p>
            )}
            {status === "loading" && (
              <p
                style={{
                  color: "#5a8a9a",
                  fontFamily: "sans-serif",
                  fontSize: "0.85rem",
                }}
              >
                Loading recitation...
              </p>
            )}
            {(status === "playing" || status === "paused") && (
              <>
                <div
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 600,
                    color: activeSurahDisplay.accent,
                    marginBottom: 4,
                  }}
                >
                  {activeSurahDisplay.arabic}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#6a8a9a",
                    fontFamily: "sans-serif",
                  }}
                >
                  {activeSurahDisplay.name} ·{" "}
                  <span style={{ color: activeSurahDisplay.accent }}>
                    Repeat {currentRepeat} of {totalRepeats}
                  </span>
                  {mode === "combo" && queue.length > 1 && (
                    <span style={{ color: "#4a6a7a" }}>
                      {" "}
                      · Surah {currentIdx + 1}/{queue.length}
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
                  fontSize: "0.88rem",
                  fontStyle: "italic",
                }}
              >
                ✓ Recitation complete · Rest well, inshaaAllah 🌙
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 3,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${activeSurahDisplay.accent}88, ${activeSurahDisplay.accent})`,
                borderRadius: 3,
                transition: "width 0.5s linear",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.7rem",
              color: "#3a5a6a",
              fontFamily: "sans-serif",
              marginBottom: "1.25rem",
            }}
          >
            <span>{fmt(progress)}</span>
            <span>{duration > 0 ? fmt(duration) : "--:--"}</span>
          </div>

          {/* Buttons */}
          <div
            style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}
          >
            {/* Stop */}
            <button
              onClick={stopPlayback}
              disabled={status === "idle"}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: status === "idle" ? "#2a4a5a" : "#8aaabb",
                fontSize: "1.1rem",
                cursor: status === "idle" ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              ■
            </button>

            {/* Play / Pause */}
            <button
              className="btn-glow"
              onClick={
                status === "idle" || status === "done"
                  ? startPlayback
                  : togglePause
              }
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: `2px solid ${activeSurahDisplay.accent}55`,
                background: `radial-gradient(circle, ${activeSurahDisplay.color}dd, ${activeSurahDisplay.color}88)`,
                color: activeSurahDisplay.accent,
                fontSize: "1.6rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 24px ${activeSurahDisplay.accent}33`,
                transition: "all 0.25s ease",
                position: "relative",
              }}
            >
              {status === "loading" ? (
                <span
                  style={{ fontSize: "1rem", animation: "twinkle 0.8s infinite" }}
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
                    border: `2px solid ${activeSurahDisplay.accent}44`,
                    animation: "pulse-ring 2s ease-out infinite",
                  }}
                />
              )}
            </button>

            {/* Restart */}
            <button
              onClick={startPlayback}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#8aaabb",
                fontSize: "1rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              title="Restart"
            >
              ↺
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            color: "#2a4050",
            fontSize: "0.72rem",
            fontFamily: "sans-serif",
            marginTop: "2rem",
            letterSpacing: "0.05em",
          }}
        >
          Audio will stop automatically after your chosen repeats · Auto-sleep
          friendly
        </p>
      </div>
    </main>
  );
}