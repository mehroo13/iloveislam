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
  repeatLeft: number;
  _currentRepeat?: number;
}

export default function NightPage() {
  // ── Mode
  const [mode, setMode] = useState<PlayMode>("single");

  // ── Note banner
  const [noteOpen, setNoteOpen] = useState(false);

  // ── Single mode
  const [selectedSurah, setSelectedSurah] = useState(SURAHS[5]);
  const [singleRepeats, setSingleRepeats] = useState(1);

  // ── Combo mode — which surahs are selected & their order
  const [comboSelected, setComboSelected] = useState<Set<string>>(
    new Set(["mulk", "waqia"])
  );
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
  const progressBarRef = useRef<HTMLDivElement>(null);

  // ── Stars background (memo-stable)
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

  // ── Drag state (combo reorder)
  const dragId = useRef<string | null>(null);
  const dragOverId = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getSurah = (id: string) => SURAHS.find((s) => s.id === id)!;

  const buildQueue = useCallback((): QueueItem[] => {
    if (mode === "single") {
      return [{ surahId: selectedSurah.id, repeatLeft: singleRepeats }];
    }
    return comboOrder
      .filter((id) => comboSelected.has(id))
      .map((id) => ({ surahId: id, repeatLeft: comboRepeats[id] ?? 1 }));
  }, [mode, selectedSurah, singleRepeats, comboOrder, comboRepeats, comboSelected]);

  const activeSurahDisplay =
    queue.length > 0 && status !== "idle" && status !== "done"
      ? getSurah(queue[currentIdx]?.surahId ?? queue[0].surahId)
      : mode === "single"
      ? selectedSurah
      : comboSelected.size > 0
      ? getSurah(comboOrder.find((id) => comboSelected.has(id)) ?? SURAHS[5].id)
      : SURAHS[5];

  // ─── Audio engine ─────────────────────────────────────────────────────────────
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
    if (q.length === 0) return;
    q.forEach((item) => { item._currentRepeat = 1; });
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

  // ── Seek (scrub) on progress bar click/touch
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const bar = progressBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  }, [duration]);

  // ── Skip ±10s
  const skip = useCallback((seconds: number) => {
    if (!audioRef.current || duration === 0) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  }, [duration]);

  // ─── Audio event listeners ────────────────────────────────────────────────────
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
          const repeatsForItem = prevQueue[prevIdx].repeatLeft;
          const nextRepeat = (item._currentRepeat ?? 1) + 1;
          if (nextRepeat <= repeatsForItem) {
            item._currentRepeat = nextRepeat;
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
          setTotalRepeats(nextItem.repeatLeft);
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

  // ─── Combo drag reorder ───────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverId.current = id;
  };
  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!dragId.current || dragId.current === id) return;
    setComboOrder((prev) => {
      const from = prev.indexOf(dragId.current!);
      const to = prev.indexOf(id);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragId.current!);
      return next;
    });
    dragId.current = null;
    setDraggingId(null);
  };
  const handleDragEnd = () => {
    dragId.current = null;
    setDraggingId(null);
  };

  // ── Toggle surah in combo selection
  const toggleComboSurah = (id: string) => {
    setComboSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (status !== "idle") stopPlayback();
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
        .surah-card { transition: all 0.25s ease; cursor: pointer; }
        .surah-card:hover { transform: translateY(-2px); }
        .btn-glow:hover { filter: brightness(1.15); transform: scale(1.03); }
        .repeat-pill { transition: all 0.18s ease; cursor: pointer; }
        .repeat-pill:hover { transform: scale(1.08); }
        .skip-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .progress-bar-track { cursor: pointer; }
        .progress-bar-track:hover .progress-thumb { opacity: 1 !important; }
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
          <p
            style={{
              color: "#7a9ab8",
              fontSize: "0.85rem",
              marginTop: "0.4rem",
              letterSpacing: "0.04em",
              fontStyle: "italic",
            }}
          >
            Sheikh Abdul Rahman Al-Sudais · Imam of the Grand Mosque, Makkah
          </p>

          {/* ── Collapsible purpose note ───────────────────────────── */}
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
                <strong style={{ color: "#7abaca", display: "block", marginBottom: "0.35rem" }}>
                  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                </strong>
                A bedtime companion for listening to Quranic recitations before sleep.
                Play a single surah on repeat, or build a custom combo playlist — then
                let the audio stop automatically so your device can rest too.
                Each surah carries its own blessing and purpose, noted in the description.
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
              onClick={() => { setMode(m); stopPlayback(); }}
              style={{
                flex: 1,
                padding: "0.55rem 1rem",
                borderRadius: 50,
                border: "none",
                background: mode === m ? "rgba(100,180,140,0.2)" : "transparent",
                color: mode === m ? "#7ee8a2" : "#5a7a8a",
                fontFamily: "sans-serif",
                fontSize: "0.83rem",
                fontWeight: mode === m ? 600 : 400,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow: mode === m ? "0 0 12px rgba(100,200,140,0.15)" : "none",
              }}
            >
              {m === "single" ? "🎵 Single" : "🎶 Combo"}
            </button>
          ))}
        </div>

        {/* ══ Single Mode ══════════════════════════════════════════════════ */}
        {mode === "single" && (
          <>
            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {SURAHS.map((s) => (
                <div
                  key={s.id}
                  className="surah-card"
                  onClick={() => { setSelectedSurah(s); if (status !== "idle") stopPlayback(); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    padding: "0.85rem 1.1rem",
                    borderRadius: 14,
                    background:
                      selectedSurah.id === s.id
                        ? `linear-gradient(135deg, ${s.color}cc, ${s.color}88)`
                        : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${selectedSurah.id === s.id ? s.accent + "55" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: selectedSurah.id === s.id ? `0 4px 20px ${s.accent}1a` : "none",
                  }}
                >
                  <div style={{ fontSize: "1.4rem", flexShrink: 0 }}>{s.moon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: selectedSurah.id === s.id ? s.accent : "#c4d4e0" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#5a7a90", fontFamily: "sans-serif", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.description} · {s.ayahs} ayahs
                    </div>
                  </div>
                  <div style={{ fontFamily: "sans-serif", fontSize: "1.1rem", color: "#2a4a5a", direction: "rtl", flexShrink: 0 }}>
                    {s.arabic}
                  </div>
                  {selectedSurah.id === s.id && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.accent, boxShadow: `0 0 8px ${s.accent}`, flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>

            {/* Repeat selector */}
            <div style={{ marginBottom: "1.75rem" }}>
              <p style={{ fontSize: "0.72rem", color: "#4a6a7a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem", fontFamily: "sans-serif" }}>
                Repeat times
              </p>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                {REPEAT_OPTIONS.map((r) => (
                  <button
                    key={r}
                    className="repeat-pill"
                    onClick={() => setSingleRepeats(r)}
                    style={{
                      padding: "0.4rem 0.9rem",
                      borderRadius: 50,
                      border: `1.5px solid ${singleRepeats === r ? selectedSurah.accent + "88" : "rgba(255,255,255,0.1)"}`,
                      background: singleRepeats === r ? `${selectedSurah.accent}22` : "rgba(255,255,255,0.03)",
                      color: singleRepeats === r ? selectedSurah.accent : "#6a8a9a",
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
            <p style={{ fontSize: "0.72rem", color: "#4a6a7a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem", fontFamily: "sans-serif" }}>
              Tap to select · drag ⠿ to reorder · set repeats
            </p>
            <div style={{ display: "grid", gap: "0.65rem", marginBottom: "1.75rem" }}>
              {comboOrder.map((id, index) => {
                const s = getSurah(id);
                const isSelected = comboSelected.has(id);
                const isDragging = draggingId === id;
                return (
                  <div
                    key={id}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDrop={(e) => handleDrop(e, id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      borderRadius: 13,
                      background: isSelected
                        ? `linear-gradient(135deg, ${s.color}aa, ${s.color}55)`
                        : "rgba(255,255,255,0.025)",
                      border: `1.5px solid ${isSelected ? s.accent + "44" : "rgba(255,255,255,0.06)"}`,
                      opacity: isDragging ? 0.4 : 1,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Checkbox-style toggle */}
                    <div
                      onClick={() => toggleComboSurah(id)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: `2px solid ${isSelected ? s.accent : "rgba(255,255,255,0.15)"}`,
                        background: isSelected ? `${s.accent}33` : "transparent",
                        flexShrink: 0,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        color: s.accent,
                        transition: "all 0.18s",
                      }}
                    >
                      {isSelected && "✓"}
                    </div>

                    {/* Order badge (only visible if selected) */}
                    {isSelected && (
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: `${s.accent}1a`, border: `1px solid ${s.accent}44`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", color: s.accent, fontFamily: "sans-serif",
                        fontWeight: 700, flexShrink: 0,
                      }}>
                        {Array.from(comboSelected).indexOf(id) >= 0
                          ? comboOrder.filter(i => comboSelected.has(i)).indexOf(id) + 1
                          : ""}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }} onClick={() => toggleComboSurah(id)}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: isSelected ? s.accent : "#6a8090", cursor: "pointer" }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#3a5a6a", fontFamily: "sans-serif" }}>
                        {s.meaning} · {s.ayahs} ayahs
                      </div>
                    </div>

                    {/* Inline repeats (only when selected) */}
                    {isSelected && (
                      <div style={{ display: "flex", gap: "0.28rem" }}>
                        {[1, 2, 3].map((r) => (
                          <button
                            key={r}
                            onClick={() => setComboRepeats((prev) => ({ ...prev, [id]: r }))}
                            style={{
                              width: 28, height: 28, borderRadius: "50%",
                              border: `1.5px solid ${comboRepeats[id] === r ? s.accent : "rgba(255,255,255,0.1)"}`,
                              background: comboRepeats[id] === r ? `${s.accent}28` : "rgba(255,255,255,0.03)",
                              color: comboRepeats[id] === r ? s.accent : "#5a7a8a",
                              fontSize: "0.68rem", fontFamily: "sans-serif",
                              fontWeight: comboRepeats[id] === r ? 700 : 400,
                              cursor: "pointer",
                            }}
                          >
                            ×{r}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Drag handle */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, id)}
                      onDragEnd={handleDragEnd}
                      style={{
                        color: isSelected ? "#4a6a7a" : "#2a3a4a",
                        fontSize: "1.1rem",
                        cursor: "grab",
                        padding: "0 0.2rem",
                        userSelect: "none",
                        flexShrink: 0,
                        touchAction: "none",
                      }}
                    >
                      ⠿
                    </div>
                  </div>
                );
              })}
            </div>
            {comboSelected.size === 0 && (
              <p style={{ color: "#f87171", fontSize: "0.78rem", fontFamily: "sans-serif", textAlign: "center", marginBottom: "1rem" }}>
                Select at least one surah to play
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
              <p style={{ color: "#3a5a6a", fontFamily: "sans-serif", fontSize: "0.82rem", margin: 0 }}>
                Choose your surah and press play
              </p>
            )}
            {status === "loading" && (
              <p style={{ color: "#5a8a9a", fontFamily: "sans-serif", fontSize: "0.82rem", margin: 0 }}>
                Loading recitation...
              </p>
            )}
            {(status === "playing" || status === "paused") && (
              <>
                <div style={{ fontSize: "1rem", fontWeight: 600, color: accent, marginBottom: 3 }}>
                  {activeSurahDisplay.arabic}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6a8a9a", fontFamily: "sans-serif" }}>
                  {activeSurahDisplay.name}
                  {" · "}
                  <span style={{ color: accent }}>
                    Repeat {currentRepeat}/{totalRepeats}
                  </span>
                  {mode === "combo" && queue.length > 1 && (
                    <span style={{ color: "#4a6a7a" }}>
                      {" · "}{currentIdx + 1}/{queue.length}
                    </span>
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

          {/* ── Progress bar (seekable) ────────────────────────────── */}
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
              {/* Thumb dot */}
              <div
                className="progress-thumb"
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
                  opacity: status === "playing" || status === "paused" ? 1 : 0,
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

          {/* ── Buttons ───────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", alignItems: "center" }}>
            {/* Stop */}
            <button
              onClick={stopPlayback}
              disabled={status === "idle"}
              style={{
                width: 42, height: 42, borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: status === "idle" ? "#2a4a5a" : "#8aaabb",
                fontSize: "1rem", cursor: status === "idle" ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              ■
            </button>

            {/* Skip back 10s */}
            <button
              className="skip-btn"
              onClick={() => skip(-10)}
              disabled={status === "idle" || status === "done"}
              title="Back 10s"
              style={{
                width: 38, height: 38, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                color: status === "idle" || status === "done" ? "#2a4050" : "#6a9aaa",
                fontSize: "0.8rem", fontFamily: "sans-serif",
                cursor: status === "idle" || status === "done" ? "not-allowed" : "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 0, transition: "all 0.18s", lineHeight: 1,
              }}
            >
              <span style={{ fontSize: "1rem" }}>⟨</span>
              <span style={{ fontSize: "0.55rem" }}>10s</span>
            </button>

            {/* Play / Pause */}
            <button
              className="btn-glow"
              onClick={status === "idle" || status === "done" ? startPlayback : togglePause}
              style={{
                width: 68, height: 68, borderRadius: "50%",
                border: `2px solid ${accent}55`,
                background: `radial-gradient(circle, ${activeSurahDisplay.color}dd, ${activeSurahDisplay.color}88)`,
                color: accent, fontSize: "1.5rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 24px ${accent}2a`,
                transition: "all 0.25s ease", position: "relative",
              }}
            >
              {status === "loading" ? (
                <span style={{ fontSize: "0.9rem", animation: "twinkle 0.8s infinite" }}>…</span>
              ) : status === "playing" ? "⏸" : "▶"}
              {status === "playing" && (
                <span style={{
                  position: "absolute", inset: -4, borderRadius: "50%",
                  border: `2px solid ${accent}44`,
                  animation: "pulse-ring 2s ease-out infinite",
                }} />
              )}
            </button>

            {/* Skip forward 10s */}
            <button
              className="skip-btn"
              onClick={() => skip(10)}
              disabled={status === "idle" || status === "done"}
              title="Forward 10s"
              style={{
                width: 38, height: 38, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                color: status === "idle" || status === "done" ? "#2a4050" : "#6a9aaa",
                fontSize: "0.8rem", fontFamily: "sans-serif",
                cursor: status === "idle" || status === "done" ? "not-allowed" : "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 0, transition: "all 0.18s", lineHeight: 1,
              }}
            >
              <span style={{ fontSize: "1rem" }}>⟩</span>
              <span style={{ fontSize: "0.55rem" }}>10s</span>
            </button>

            {/* Restart */}
            <button
              onClick={startPlayback}
              title="Restart"
              style={{
                width: 42, height: 42, borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#8aaabb", fontSize: "1.05rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              ↺
            </button>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center", color: "#253545",
          fontSize: "0.68rem", fontFamily: "sans-serif",
          marginTop: "1.5rem", letterSpacing: "0.05em",
        }}>
          Audio stops automatically after chosen repeats · Auto-sleep friendly
        </p>
      </div>
    </main>
  );
}