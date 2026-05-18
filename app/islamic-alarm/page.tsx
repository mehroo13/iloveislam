"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface Alarm {
  id: number;
  time24: string;
  label: string;
  sound: string;
  enabled: boolean;
  type: string;
}

interface DhikrItem {
  arabic: string;
  name: string;
  meaning: string;
  target: number;
}

interface CheckItem {
  id: string;
  text: string;
  arabic: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const SOUNDS = [
  { id: "adhan_makkah", label: "Adhan – Makkah", url: "https://ia803007.us.archive.org/17/items/AdhaanMakkahFajr/AdhaanMakkahFajr.mp3" },
  { id: "adhan_madinah", label: "Adhan – Madinah", url: "https://ia903407.us.archive.org/16/items/Madinah_Adhan/Madinah_Adhan.mp3" },
  { id: "mishary_fatiha", label: "Fatiha – Mishary", url: "https://server8.mp3quran.net/mishary/001.mp3" },
  { id: "sudais_quran", label: "Quran – Sudais", url: "https://server11.mp3quran.net/abdulbaset/001.mp3" },
];

const SURAHS = [
  { id: "mulk", name: "Surah Al-Mulk", arabic: "سورة الملك", url: "https://server8.mp3quran.net/mishary/067.mp3" },
  { id: "rahman", name: "Surah Ar-Rahman", arabic: "سورة الرحمن", url: "https://server8.mp3quran.net/mishary/055.mp3" },
  { id: "sajdah", name: "Surah As-Sajdah", arabic: "سورة السجدة", url: "https://server8.mp3quran.net/mishary/032.mp3" },
  { id: "waqiah", name: "Surah Al-Waqi'ah", arabic: "سورة الواقعة", url: "https://server8.mp3quran.net/mishary/056.mp3" },
  { id: "kahf", name: "Surah Al-Kahf", arabic: "سورة الكهف", url: "https://server8.mp3quran.net/mishary/018.mp3" },
];

const MORNING_DUAS = [
  {
    title: "Waking Up",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    roman: "Alhamdulillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    english: "All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.",
    ref: "Bukhari 6312",
  },
  {
    title: "Morning Protection",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    roman: "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namootu, wa ilaykan-nushoor",
    english: "O Allah, by You we enter the morning and evening, by You we live and die, and to You is the resurrection.",
    ref: "Abu Dawud 5068",
  },
];

const SLEEP_DUAS = [
  {
    title: "Before Sleeping",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    roman: "Bismika Allahumma amootu wa ahya",
    english: "In Your name, O Allah, I die and I live.",
    ref: "Bukhari 6324",
  },
  {
    title: "Protection Dua",
    arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
    roman: "Allahumma qini adhabaka yawma tab'athu ibadaka",
    english: "O Allah, protect me from Your punishment on the Day You resurrect Your servants.",
    ref: "Abu Dawud 5045",
  },
];

const DHIKR: DhikrItem[] = [
  { arabic: "سُبْحَانَ اللَّهِ", name: "SubhanAllah", meaning: "Glory be to Allah", target: 33 },
  { arabic: "الْحَمْدُ لِلَّهِ", name: "Alhamdulillah", meaning: "All praise be to Allah", target: 33 },
  { arabic: "اللَّهُ أَكْبَرُ", name: "Allahu Akbar", meaning: "Allah is the Greatest", target: 34 },
  { arabic: "لَا إِلَهَ إِلَّا اللَّهُ", name: "La ilaha illallah", meaning: "There is no god but Allah", target: 10 },
  { arabic: "أَسْتَغْفِرُ اللَّهَ", name: "Astaghfirullah", meaning: "I seek forgiveness from Allah", target: 100 },
];

const SLEEP_LIST: CheckItem[] = [
  { id: "wudu", text: "Perform Wudu", arabic: "الوضوء" },
  { id: "right_side", text: "Sleep on your right side", arabic: "النوم على الجانب الأيمن" },
  { id: "ayatul_kursi", text: "Recite Ayatul Kursi", arabic: "آية الكرسي" },
  { id: "three_quls", text: "Recite the Three Quls (3× each)", arabic: "المعوذات" },
  { id: "tasbih", text: "SubhanAllah 33x · Alhamdulillah 33x · Allahu Akbar 34x", arabic: "التسبيح" },
  { id: "sleep_dua", text: "Recite sleeping dua", arabic: "دعاء النوم" },
  { id: "forgive", text: "Forgive everyone before sleeping", arabic: "العفو" },
];

const WAKE_LIST: CheckItem[] = [
  { id: "wake_dua", text: "Recite waking-up dua", arabic: "دعاء الاستيقاظ" },
  { id: "alhamdulillah", text: "Say Alhamdulillah for being alive", arabic: "الحمد لله" },
  { id: "wudu_w", text: "Make Wudu", arabic: "الوضوء" },
  { id: "fajr_sunnah", text: "Pray 2 Rak'ahs Sunnah of Fajr", arabic: "ركعتا الفجر" },
  { id: "fajr_fard", text: "Pray Fajr Salah on time", arabic: "صلاة الفجر" },
  { id: "morning_adhkar", text: "Read morning adhkar", arabic: "أذكار الصباح" },
  { id: "quran", text: "Read some Quran", arabic: "تلاوة القرآن" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fromMin(m: number): string {
  const norm = ((m % 1440) + 1440) % 1440;
  return String(Math.floor(norm / 60)).padStart(2, "0") + ":" + String(norm % 60).padStart(2, "0");
}

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

function calcTahajjud(isha: string, fajr: string): string {
  let i = toMin(isha);
  let f = toMin(fajr);
  if (f < i) f += 1440;
  return fromMin(i + Math.floor((2 * (f - i)) / 3));
}

function getDayName(d: number) {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d];
}
function getMonthName(m: number) {
  return ["January","February","March","April","May","June","July","August","September","October","November","December"][m];
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function IslamicAlarmPage() {
  const [activeTab, setActiveTab] = useState<"alarm" | "night" | "duas" | "list">("alarm");

  // Clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Prayer times
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [locationName, setLocationName] = useState("Detecting location…");
  const [hijriDate, setHijriDate] = useState("Loading…");

  // Alarms
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [alarmFiring, setAlarmFiring] = useState(false);
  const [firingAlarm, setFiringAlarm] = useState<Alarm | null>(null);
  const [showAlham, setShowAlham] = useState(false);
  const firingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Alarm form
  const [alarmType, setAlarmType] = useState<"custom" | "fajr" | "tahajjud">("custom");
  const [pickH, setPickH] = useState(5);
  const [pickM, setPickM] = useState(0);
  const [pickAmpm, setPickAmpm] = useState<"AM" | "PM">("AM");
  const [mbf, setMbf] = useState(0);
  const [selectedSound, setSelectedSound] = useState("adhan_makkah");
  const [alarmLabel, setAlarmLabel] = useState("");

  // Night player
  const [selectedSurahs, setSelectedSurahs] = useState<string[]>(["mulk"]);
  const [repeatCount, setRepeatCount] = useState(1);
  const [nightPlaying, setNightPlaying] = useState(false);
  const [npTitle, setNpTitle] = useState("");
  const nightAudioRef = useRef<HTMLAudioElement | null>(null);
  const nightStateRef = useRef({ idx: 0, rep: 0, playing: false });

  // Dhikr
  const [dhikrCounts, setDhikrCounts] = useState<Record<number, number>>({});

  // Checklists
  const [sleepChecked, setSleepChecked] = useState<string[]>([]);
  const [wakeChecked, setWakeChecked] = useState<string[]>([]);

  // Preview audio
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Load from localStorage ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const a = localStorage.getItem("ialarms"); if (a) setAlarms(JSON.parse(a));
      const d = localStorage.getItem("idhikr"); if (d) setDhikrCounts(JSON.parse(d));
      const sl = localStorage.getItem("isleep"); if (sl) setSleepChecked(JSON.parse(sl));
      const wl = localStorage.getItem("iwake"); if (wl) setWakeChecked(JSON.parse(wl));
    } catch {}
  }, []);

  // ─── Save alarms ─────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("ialarms", JSON.stringify(alarms));
  }, [alarms]);

  // ─── Fetch prayer times ──────────────────────────────────────────────────────
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
          setPrayerTimes({ Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha });
          const h = data.data.date.hijri;
          setHijriDate(`${h.day} ${h.month.en} ${h.year} AH`);
          setLocationName(city || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        }
      } catch {}
    };

    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const g = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const gd = await g.json();
          const city = [gd.address.city || gd.address.town || gd.address.village || "", gd.address.country || ""].filter(Boolean).join(", ");
          fetchPrayers(lat, lon, city);
        } catch { fetchPrayers(lat, lon); }
      },
      async () => {
        try {
          const r = await fetch("https://ipapi.co/json/");
          const d = await r.json();
          fetchPrayers(d.latitude, d.longitude, `${d.city}, ${d.country_name}`);
        } catch { setLocationName("Location unavailable"); }
      }
    );
  }, []);

  // ─── Alarm checker (every 10s) ───────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      if (alarmFiring) return;
      const n = new Date();
      const nowStr = String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0");
      for (const a of alarms) {
        if (a.enabled && a.time24 === nowStr) {
          fireAlarm(a);
          break;
        }
      }
    };
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, [alarms, alarmFiring]);

  // ─── Fire alarm ──────────────────────────────────────────────────────────────
  // FIX #1: Proper audio error handling and playback with retry logic
  const fireAlarm = useCallback((alarm: Alarm) => {
    stopPreview();
    setFiringAlarm(alarm);
    setAlarmFiring(true);
    const sound = SOUNDS.find((s) => s.id === alarm.sound) || SOUNDS[0];
    
    // Create audio element with proper error handling
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 1;
    audio.crossOrigin = "anonymous";
    
    // Handle play promise
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("✓ Alarm playing:", sound.label);
        })
        .catch((err) => {
          console.error("✗ Alarm play error:", err);
          // Retry with different source or fallback
          audio.src = sound.url;
          audio.play().catch(() => console.error("Retry failed"));
        });
    }
    
    audio.src = sound.url;
    audio.onerror = () => {
      console.error("✗ Audio load error for:", sound.url);
    };
    
    firingAudioRef.current = audio;
  }, []);

  const dismissAlarm = () => {
    if (firingAudioRef.current) {
      firingAudioRef.current.pause();
      firingAudioRef.current.src = "";
      firingAudioRef.current = null;
    }
    setAlarmFiring(false);
    setFiringAlarm(null);
    setShowAlham(true);
    setTimeout(() => setShowAlham(false), 3500);
  };

  // ─── Alarm form helpers ──────────────────────────────────────────────────────
  const getAlarmMin = (): number => {
    if (alarmType === "custom") {
      const h = pickH % 12 + (pickAmpm === "PM" ? 12 : 0);
      return h * 60 + pickM;
    }
    if (alarmType === "fajr" && prayerTimes) return toMin(prayerTimes.Fajr) - mbf;
    if (alarmType === "tahajjud" && prayerTimes) return toMin(calcTahajjud(prayerTimes.Isha, prayerTimes.Fajr));
    return 0;
  };

  const addAlarm = () => {
    if ((alarmType === "fajr" || alarmType === "tahajjud") && !prayerTimes) {
      alert("Prayer times not loaded yet. Please use Custom time or wait.");
      return;
    }
    const min = getAlarmMin();
    const label =
      alarmLabel.trim() ||
      (alarmType === "fajr" ? (mbf > 0 ? `${mbf} min before Fajr` : "At Fajr") :
       alarmType === "tahajjud" ? "Tahajjud" : "Custom Alarm");
    const newAlarm: Alarm = { id: Date.now(), time24: fromMin(min), label, sound: selectedSound, enabled: true, type: alarmType };
    setAlarms((prev) => [...prev, newAlarm]);
    setAlarmLabel("");
  };

  const toggleAlarm = (id: number) => {
    setAlarms((prev) => prev.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id: number) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  // ─── Sound preview ───────────────────────────────────────────────────────────
  // FIX #2: Proper preview button click handling with event propagation fix
  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = "";
      previewAudioRef.current = null;
    }
  };

  const previewSound = (id: string, e?: React.MouseEvent) => {
    // FIX: Prevent parent click handler from firing
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    stopPreview();
    const s = SOUNDS.find((x) => x.id === id);
    if (!s) return;
    
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = 1;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("✓ Preview playing:", s.label);
        })
        .catch((err) => {
          console.error("✗ Preview play error:", err);
          audio.src = s.url;
          audio.play().catch(() => console.error("Preview retry failed"));
        });
    }
    
    audio.src = s.url;
    audio.onerror = () => {
      console.error("✗ Preview load error for:", s.url);
    };
    
    previewAudioRef.current = audio;
    setTimeout(stopPreview, 8000);
  };

  // ─── Night player ─────────────────────────────────────────────────────────────
  // FIX #3: Improved night player with better state management and error handling
  const playNightIdx = useCallback((idx: number, rep: number, surahs: string[], repeat: number) => {
    const surahId = surahs[idx];
    if (!surahId) { 
      setNightPlaying(false); 
      return; 
    }
    
    const surah = SURAHS.find((s) => s.id === surahId);
    if (!surah) { 
      setNightPlaying(false); 
      return; 
    }
    
    // Clean up previous audio
    if (nightAudioRef.current) { 
      nightAudioRef.current.pause(); 
      nightAudioRef.current.src = ""; 
    }
    
    // Create new audio element
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = 1;
    nightAudioRef.current = audio;
    
    // Update UI
    setNpTitle(surah.name);
    nightStateRef.current = { idx, rep, playing: true };
    
    // Set up end handler BEFORE setting src
    audio.onended = () => {
      if (!nightStateRef.current.playing) return;
      
      const nextRep = rep + 1;
      if (nextRep < repeat) { 
        // Play same surah again
        playNightIdx(idx, nextRep, surahs, repeat); 
      } else {
        // Move to next surah
        const nextIdx = idx + 1;
        if (nextIdx < surahs.length) { 
          playNightIdx(nextIdx, 0, surahs, repeat); 
        } else { 
          // Playlist finished
          setNightPlaying(false); 
        }
      }
    };
    
    audio.onerror = () => {
      console.error("✗ Surah load error:", surah.url);
      // Try next surah on error
      const nextIdx = idx + 1;
      if (nextIdx < surahs.length) {
        playNightIdx(nextIdx, 0, surahs, repeat);
      } else {
        setNightPlaying(false);
      }
    };
    
    // Set source and play
    audio.src = surah.url;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("✓ Night player playing:", surah.name);
        })
        .catch((err) => {
          console.error("✗ Night player error:", err);
          // Retry
          audio.play().catch(() => console.error("Night player retry failed"));
        });
    }
  }, []);

  const startPlayer = () => {
    if (!selectedSurahs.length) return;
    setNightPlaying(true);
    playNightIdx(0, 0, selectedSurahs, repeatCount);
  };

  const stopPlayer = () => {
    nightStateRef.current.playing = false;
    setNightPlaying(false);
    if (nightAudioRef.current) { 
      nightAudioRef.current.pause(); 
      nightAudioRef.current.src = ""; 
      nightAudioRef.current = null; 
    }
  };

  const toggleSurah = (id: string) => {
    setSelectedSurahs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // ─── Dhikr ───────────────────────────────────────────────────────────────────
  const incDhikr = (i: number) => {
    setDhikrCounts((prev) => {
      const next = { ...prev, [i]: (prev[i] || 0) + 1 };
      localStorage.setItem("idhikr", JSON.stringify(next));
      return next;
    });
  };
  const resetDhikr = (i: number) => {
    setDhikrCounts((prev) => {
      const next = { ...prev, [i]: 0 };
      localStorage.setItem("idhikr", JSON.stringify(next));
      return next;
    });
  };

  // ─── Checklists ──────────────────────────────────────────────────────────────
  const toggleCheck = (list: "sleep" | "wake", id: string) => {
    if (list === "sleep") {
      setSleepChecked((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        localStorage.setItem("isleep", JSON.stringify(next));
        return next;
      });
    } else {
      setWakeChecked((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        localStorage.setItem("iwake", JSON.stringify(next));
        return next;
      });
    }
  };
  const resetList = (list: "sleep" | "wake") => {
    if (list === "sleep") { setSleepChecked([]); localStorage.setItem("isleep", "[]"); }
    else { setWakeChecked([]); localStorage.setItem("iwake", "[]"); }
  };

  // ─── Clock display ────────────────────────────────────────────────────────────
  const nowH = now.getHours(), nowM = now.getMinutes(), nowS = now.getSeconds();
  const ampm = nowH >= 12 ? "PM" : "AM";
  const h12 = nowH % 12 || 12;
  const clockStr = `${String(h12).padStart(2, "0")}:${String(nowM).padStart(2, "0")}`;
  const dateStr = `${getDayName(now.getDay())}, ${now.getDate()} ${getMonthName(now.getMonth())} ${now.getFullYear()}`;

  // ─── Next prayer ─────────────────────────────────────────────────────────────
  const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
  const nowTotalMin = nowH * 60 + nowM;
  const nextPrayerIdx = prayerTimes
    ? PRAYER_ORDER.findIndex((p) => toMin(prayerTimes[p]) > nowTotalMin)
    : -1;

  // ─── Alarm preview time ───────────────────────────────────────────────────────
  const fajrPreviewTime = prayerTimes ? fmt12(fromMin(toMin(prayerTimes.Fajr) - mbf)) : null;
  const tahajjudTime = prayerTimes ? fmt12(calcTahajjud(prayerTimes.Isha, prayerTimes.Fajr)) : null;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Alarm firing overlay ──────────────────────────────────────────── */}
      {alarmFiring && (
        <div style={S.overlay}>
          <div style={{ fontSize: 80, animation: "bounce 0.6s ease-in-out infinite alternate" }}>☀️</div>
          <div style={{ fontSize: 16, color: "#9096a8", marginTop: 20, fontWeight: 500 }}>Time to Wake Up</div>
          <div style={{ fontSize: 24, color: "#fff", fontWeight: 700, marginTop: 4 }}>{firingAlarm?.label}</div>
          <div style={{ fontSize: 72, fontWeight: 300, color: "#34c77b", margin: "16px 0", letterSpacing: -2, lineHeight: 1 }}>
            {firingAlarm ? fmt12(firingAlarm.time24) : ""}
          </div>
          <button onClick={dismissAlarm} style={S.dismissBtn}>
            Dismiss — إغلاق
          </button>
        </div>
      )}

      {/* ── Alhamdulillah overlay ─────────────────────────────────────────── */}
      {showAlham && (
        <div style={S.alhamOverlay}>
          <div style={{ fontSize: 56, color: "#f0c060", marginBottom: 8 }}>الحمد لله</div>
          <div style={{ fontSize: 20, color: "#fff", fontWeight: 600 }}>Alhamdulillah</div>
          <div style={{ fontSize: 14, color: "#9096a8", marginTop: 6 }}>All praise is for Allah</div>
        </div>
      )}

      <div style={S.app}>

        {/* ── Header / Clock ────────────────────────────────────────────────── */}
        <div style={S.header}>
          <div>
            <span style={S.clockTime}>{clockStr}</span>
            <span style={S.clockAmpm}>{ampm}</span>
          </div>
          <div style={S.clockDate}>{dateStr}</div>
          <div style={S.hijri}>{hijriDate}</div>
        </div>

        {/* ── Location ─────────────────────────────────────────────────────── */}
        <div style={S.locRow}>📍 <span style={{ marginLeft: 6 }}>{locationName}</span></div>

        {/* ── Prayer bar ───────────────────────────────────────────────────── */}
        <div style={S.prayerBar}>
          <div style={S.prayerBarInner}>
            {PRAYER_ORDER.map((p, i) => (
              <div key={p} style={{ ...S.prayerPill, ...(i === nextPrayerIdx ? S.prayerPillNext : {}) }}>
                <span style={S.prayerName}>{p}</span>
                <span style={S.prayerTime}>{prayerTimes ? fmt12(prayerTimes[p]) : "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div style={S.tabbar}>
          {(["alarm", "night", "duas", "list"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}>
              {tab === "alarm" && "⏰ Alarm"}
              {tab === "night" && "🌙 Night"}
              {tab === "duas" && "🤲 Duas"}
              {tab === "list" && "✅ Lists"}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ALARM TAB */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "alarm" && (
          <div style={S.panel}>

            {/* Saved alarms */}
            <div style={S.card}>
              <div style={S.cardTitle}>My Alarms</div>
              {alarms.length === 0 ? (
                <div style={{ color: "#555d70", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  No alarms set yet.<br />Add one below.
                </div>
              ) : (
                alarms.map((a) => {
                  const [timeStr, ap] = fmt12(a.time24).split(" ");
                  return (
                    <div key={a.id} style={S.alarmItem}>
                      <div>
                        <div style={S.alarmTimeBig}>
                          {timeStr}<span style={{ fontSize: 16, color: "#9096a8", marginLeft: 4 }}>{ap}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#9096a8", marginTop: 2 }}>{a.label}</div>
                        <div style={{ fontSize: 11, color: "#555d70", marginTop: 2 }}>
                          {SOUNDS.find((s) => s.id === a.sound)?.label}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <ToggleSwitch checked={a.enabled} onChange={() => toggleAlarm(a.id)} />
                        <button onClick={() => deleteAlarm(a.id)} style={S.iconBtn}>🗑️</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add alarm */}
            <div style={S.card}>
              <div style={S.cardTitle}>Add Alarm</div>

              {/* Alarm type */}
              <div style={S.row}>
                {(["custom", "fajr", "tahajjud"] as const).map((t) => (
                  <button key={t} onClick={() => setAlarmType(t)}
                    style={{ ...S.typeBtn, ...(alarmType === t ? S.typeBtnActive : {}) }}>
                    {t === "custom" && "🕐 Custom"}
                    {t === "fajr" && "🌅 Before Fajr"}
                    {t === "tahajjud" && "🌙 Tahajjud"}
                  </button>
                ))}
              </div>

              {/* Custom time picker */}
              {alarmType === "custom" && (
                <div style={{ marginTop: 14 }}>
                  <div style={S.fieldLabel}>Time</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Hours */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <button style={S.udBtn} onClick={() => setPickH((h) => (h % 12) + 1)}>▲</button>
                      <div style={S.timeScroll}>{String(pickH).padStart(2, "0")}</div>
                      <button style={S.udBtn} onClick={() => setPickH((h) => ((h - 2 + 12) % 12) + 1)}>▼</button>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 300, color: "#9096a8" }}>:</div>
                    {/* Minutes */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <button style={S.udBtn} onClick={() => setPickM((m) => (m + 1) % 60)}>▲</button>
                      <div style={S.timeScroll}>{String(pickM).padStart(2, "0")}</div>
                      <button style={S.udBtn} onClick={() => setPickM((m) => (m - 1 + 60) % 60)}>▼</button>
                    </div>
                    {/* AM/PM */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 4 }}>
                      <button onClick={() => setPickAmpm("AM")}
                        style={{ ...S.ampmBtn, ...(pickAmpm === "AM" ? S.ampmBtnActive : {}) }}>AM</button>
                      <button onClick={() => setPickAmpm("PM")}
                        style={{ ...S.ampmBtn, ...(pickAmpm === "PM" ? S.ampmBtnActive : {}) }}>PM</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Before Fajr */}
              {alarmType === "fajr" && (
                <div style={{ marginTop: 14 }}>
                  <div style={S.fieldLabel}>Minutes before Fajr</div>
                  <div style={S.row}>
                    {[0, 10, 15, 20, 30].map((m) => (
                      <button key={m} onClick={() => setMbf(m)}
                        style={{ ...S.typeBtn, ...(mbf === m ? S.typeBtnActive : {}), flex: "none", padding: "8px 12px" }}>
                        {m === 0 ? "At Fajr" : `${m} min`}
                      </button>
                    ))}
                  </div>
                  {fajrPreviewTime && (
                    <div style={S.infoBoxGold}>
                      Alarm will ring at <strong>{fajrPreviewTime}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Tahajjud */}
              {alarmType === "tahajjud" && (
                <div style={{ marginTop: 14 }}>
                  <div style={S.infoBoxGold}>
                    🌙 Tahajjud (last third of night) begins at{" "}
                    <strong>{tahajjudTime || "Waiting for prayer times…"}</strong>
                  </div>
                </div>
              )}

              {/* Sound */}
              <div style={{ marginTop: 16 }}>
                <div style={S.fieldLabel}>Wake Sound</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SOUNDS.map((s) => (
                    <div key={s.id} onClick={() => setSelectedSound(s.id)}
                      style={{ ...S.soundOpt, ...(selectedSound === s.id ? S.soundOptActive : {}) }}>
                      <span>🔊 {s.label}</span>
                      {/* FIX #2: Make preview button properly clickable */}
                      <button
                        onClick={(e) => previewSound(s.id, e)}
                        style={S.previewBtn}>▶</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div style={{ marginTop: 14 }}>
                <div style={S.fieldLabel}>Label (optional)</div>
                <input
                  value={alarmLabel}
                  onChange={(e) => setAlarmLabel(e.target.value)}
                  placeholder="e.g. Fajr Alarm"
                  maxLength={30}
                  style={S.textInput}
                />
              </div>

              <button onClick={addAlarm} style={S.btnPrimary}>+ Set Alarm</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* NIGHT TAB */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "night" && (
          <div style={S.panel}>
            <div style={S.card}>
              <div style={S.cardTitle}>Night Sleep Player</div>
              <div style={{ fontSize: 13, color: "#555d70", marginBottom: 14 }}>
                Mishary Rashid — Plays as you fall asleep
              </div>

              {/* Now playing bar */}
              {nightPlaying && (
                <div style={S.playerBar}>
                  <div style={S.playerDot} />
                  <div style={{ flex: 1, fontSize: 13, color: "#9096a8" }}>
                    <strong style={{ color: "#f0f0f0", display: "block", fontSize: 14 }}>{npTitle}</strong>
                    Playing…
                  </div>
                  <button onClick={stopPlayer} style={S.stopBtn}>■ Stop</button>
                </div>
              )}

              {/* Surah list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SURAHS.map((s) => {
                  const sel = selectedSurahs.includes(s.id);
                  const pos = selectedSurahs.indexOf(s.id) + 1;
                  return (
                    <div key={s.id} onClick={() => toggleSurah(s.id)}
                      style={{ ...S.surahItem, ...(sel ? S.surahItemSel : {}) }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ ...S.surahNum, ...(sel ? S.surahNumSel : {}) }}>{sel ? pos : "·"}</div>
                        <div>
                          <div style={{ fontSize: 14, color: "#f0f0f0", fontWeight: 500 }}>{s.name}</div>
                          <div style={{ fontSize: 15, color: "#555d70", direction: "rtl" }}>{s.arabic}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 18, color: sel ? "#f0c060" : "#555d70" }}>{sel ? "✓" : "+"}</span>
                    </div>
                  );
                })}
              </div>

              {/* Repeat */}
              <div style={{ marginTop: 16 }}>
                <div style={S.fieldLabel}>Repeat each surah</div>
                <div style={S.row}>
                  {[1, 2, 3].map((n) => (
                    <button key={n} onClick={() => setRepeatCount(n)}
                      style={{ ...S.typeBtn, ...(repeatCount === n ? S.typeBtnActive : {}), flex: "none", padding: "8px 16px" }}>
                      {n}×
                    </button>
                  ))}
                </div>
              </div>

              <div style={S.infoBoxBlue}>
                🎙️ <strong>Mishary Rashid Alafasy</strong> — Auto-stops when playlist ends
              </div>

              <button onClick={startPlayer} disabled={selectedSurahs.length === 0}
                style={{ ...S.btnGreen, opacity: selectedSurahs.length === 0 ? 0.4 : 1, cursor: selectedSurahs.length === 0 ? "not-allowed" : "pointer" }}>
                ▶ Start Night Player
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* DUAS TAB */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "duas" && (
          <div style={S.panel}>

            {/* Morning Duas */}
            <div style={S.card}>
              <div style={S.cardTitle}>🌅 Morning Duas</div>
              {MORNING_DUAS.map((d, i) => (
                <div key={i} style={S.duaCard}>
                  <div style={S.duaTitle}>{d.title}</div>
                  <div style={S.duaArabic}>{d.arabic}</div>
                  <div style={S.duaRoman}>{d.roman}</div>
                  <div style={S.duaEnglish}>{d.english}</div>
                  <div style={S.duaRef}>{d.ref}</div>
                </div>
              ))}
            </div>

            {/* Sleep Duas */}
            <div style={S.card}>
              <div style={S.cardTitle}>🌙 Sleep Duas</div>
              {SLEEP_DUAS.map((d, i) => (
                <div key={i} style={S.duaCard}>
                  <div style={S.duaTitle}>{d.title}</div>
                  <div style={S.duaArabic}>{d.arabic}</div>
                  <div style={S.duaRoman}>{d.roman}</div>
                  <div style={S.duaEnglish}>{d.english}</div>
                  <div style={S.duaRef}>{d.ref}</div>
                </div>
              ))}
            </div>

            {/* Dhikr counter */}
            <div style={S.card}>
              <div style={S.cardTitle}>📿 Morning Dhikr</div>
              <div style={{ fontSize: 12, color: "#555d70", marginBottom: 12 }}>Tap + to count. Tap reset when done.</div>
              {DHIKR.map((d, i) => {
                const cnt = dhikrCounts[i] || 0;
                const done = cnt >= d.target;
                return (
                  <div key={i} style={{ ...S.dhikrItem, ...(done ? S.dhikrItemDone : {}) }}>
                    <div style={{ flex: 1 }}>
                      <div style={S.dhikrArabic}>{d.arabic}</div>
                      <div style={{ fontSize: 12, color: "#9096a8", fontStyle: "italic" }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: "#555d70", marginTop: 2 }}>
                        Target: {d.target}× | {Math.min(cnt, d.target)}/{d.target}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginLeft: 12 }}>
                      <div style={{ fontSize: 28, fontWeight: 300, color: "#34c77b", minWidth: 48, textAlign: "center" }}>{cnt}</div>
                      <button onClick={() => incDhikr(i)} style={S.dhikrTap}>{done ? "✓" : "+"}</button>
                      <button onClick={() => resetDhikr(i)} style={S.dhikrReset}>reset</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* LIST TAB */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "list" && (
          <div style={S.panel}>

            <div style={S.card}>
              <div style={S.cardTitle}>🌙 Before Sleeping — Sunnah</div>
              {SLEEP_LIST.map((item) => {
                const checked = sleepChecked.includes(item.id);
                return (
                  <button key={item.id} onClick={() => toggleCheck("sleep", item.id)}
                    style={{ ...S.checkItem, ...(checked ? S.checkItemDone : {}) }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{checked ? "✅" : "⬜"}</span>
                    <span>
                      <div style={{ fontSize: 14, color: checked ? "#555d70" : "#f0f0f0", fontWeight: 500, textDecoration: checked ? "line-through" : "none" }}>
                        {item.text}
                      </div>
                      <div style={{ fontSize: 12, color: "#555d70", direction: "rtl", marginTop: 3 }}>{item.arabic}</div>
                    </span>
                  </button>
                );
              })}
              <button onClick={() => resetList("sleep")} style={S.resetBtn}>Reset</button>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>🌅 After Waking Up — Sunnah</div>
              {WAKE_LIST.map((item) => {
                const checked = wakeChecked.includes(item.id);
                return (
                  <button key={item.id} onClick={() => toggleCheck("wake", item.id)}
                    style={{ ...S.checkItem, ...(checked ? S.checkItemDone : {}) }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{checked ? "✅" : "⬜"}</span>
                    <span>
                      <div style={{ fontSize: 14, color: checked ? "#555d70" : "#f0f0f0", fontWeight: 500, textDecoration: checked ? "line-through" : "none" }}>
                        {item.text}
                      </div>
                      <div style={{ fontSize: 12, color: "#555d70", direction: "rtl", marginTop: 3 }}>{item.arabic}</div>
                    </span>
                  </button>
                );
              })}
              <button onClick={() => resetList("wake")} style={S.resetBtn}>Reset</button>
            </div>
          </div>
        )}

      </div>

      {/* ── Global styles (keyframes) ─────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #111318; color: #f0f0f0; font-family: 'Inter', sans-serif; min-height: 100vh; }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-16px); } }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,199,123,0.5); }
          50% { box-shadow: 0 0 0 16px rgba(52,199,123,0); }
        }
        @keyframes pdot { from { opacity: 1; } to { opacity: 0.3; } }
        input, button { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { display: none; }
        scrollbar-width: none;
      `}</style>
    </>
  );
}

// ─── Toggle Switch Component ───────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        position: "relative", width: 50, height: 28, cursor: "pointer",
        background: checked ? "#34c77b" : "#22262f",
        borderRadius: 14, border: `1px solid ${checked ? "#34c77b" : "#2a2f3d"}`,
        transition: "background 0.3s, border-color 0.3s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: checked ? 23 : 3,
        width: 20, height: 20, background: "#fff", borderRadius: "50%",
        transition: "left 0.3s",
      }} />
    </div>
  );
}

// ─── Styles object ─────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  app: { maxWidth: 420, margin: "0 auto", paddingBottom: 80, background: "#111318", minHeight: "100vh" },

  // Overlays
  overlay: {
    position: "fixed", inset: 0, zIndex: 9999, background: "#0a1a0e",
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", textAlign: "center", padding: 40,
  },
  alhamOverlay: {
    position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.92)",
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", textAlign: "center",
  },
  dismissBtn: {
    padding: "18px 56px", border: "none", borderRadius: 50, background: "#34c77b",
    color: "#000", fontSize: 18, fontWeight: 700, cursor: "pointer", marginTop: 16,
    animation: "pulse 1.5s ease-in-out infinite",
  },

  // Header
  header: { textAlign: "center", padding: "36px 20px 20px" },
  clockTime: { fontSize: 64, fontWeight: 300, letterSpacing: -2, lineHeight: 1, color: "#fff" },
  clockAmpm: { fontSize: 22, fontWeight: 400, color: "#9096a8", marginLeft: 6 },
  clockDate: { fontSize: 14, color: "#9096a8", marginTop: 8, fontWeight: 400, display: "block" },
  hijri: { fontSize: 12, color: "#555d70", marginTop: 4, display: "block" },

  // Location
  locRow: { display: "flex", alignItems: "center", padding: "8px 16px", fontSize: 12, color: "#555d70" },

  // Prayer bar
  prayerBar: {
    background: "#1a1d24", borderTop: "1px solid #2a2f3d", borderBottom: "1px solid #2a2f3d",
    padding: "12px 16px", overflowX: "auto", whiteSpace: "nowrap",
  },
  prayerBarInner: { display: "inline-flex", gap: 8 },
  prayerPill: {
    display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3,
    padding: "8px 14px", background: "#22262f", borderRadius: 10,
    border: "1px solid #2a2f3d", minWidth: 72,
  },
  prayerPillNext: { borderColor: "#f0c060", background: "rgba(240,192,96,0.08)" },
  prayerName: { fontSize: 10, color: "#555d70", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 },
  prayerTime: { fontSize: 13, color: "#f0c060", fontWeight: 600 },

  // Tabbar
  tabbar: {
    display: "flex", background: "#1a1d24",
    borderBottom: "1px solid #2a2f3d", position: "sticky", top: 0, zIndex: 50,
  },
  tab: {
    flex: 1, padding: "14px 4px", background: "none", border: "none",
    borderBottom: "2px solid transparent", color: "#555d70", fontSize: 11,
    fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
    letterSpacing: "0.03em", textTransform: "uppercase",
  },
  tabActive: { color: "#f0c060", borderBottomColor: "#f0c060" },

  // Panel & card
  panel: { padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 },
  card: {
    background: "#1e2230", border: "1px solid #2a2f3d", borderRadius: 14,
    padding: 18,
  },
  cardTitle: {
    fontSize: 13, fontWeight: 600, color: "#9096a8",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14,
  },

  // Alarm
  alarmItem: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 0", borderBottom: "1px solid #2a2f3d",
  },
  alarmTimeBig: { fontSize: 36, fontWeight: 300, color: "#fff", letterSpacing: -1 },

  // Form
  row: { display: "flex", gap: 6, flexWrap: "wrap" },
  typeBtn: {
    flex: 1, minWidth: 80, padding: "8px 4px", borderRadius: 10,
    border: "1px solid #2a2f3d", background: "#22262f", color: "#9096a8",
    fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
  },
  typeBtnActive: { borderColor: "#f0c060", background: "rgba(240,192,96,0.12)", color: "#f0c060" },
  fieldLabel: {
    fontSize: 11, fontWeight: 600, color: "#555d70",
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "block",
  },
  timeScroll: {
    width: 64, textAlign: "center", padding: "10px 6px",
    background: "#1a1d24", border: "1px solid #2a2f3d", borderRadius: 10,
    color: "#fff", fontSize: 28, fontWeight: 300,
  },
  udBtn: {
    width: 64, padding: "6px 0", borderRadius: 8, border: "1px solid #2a2f3d",
    background: "#1a1d24", color: "#9096a8", fontSize: 16, cursor: "pointer",
  },
  ampmBtn: {
    padding: "6px 14px", borderRadius: 8, border: "1px solid #2a2f3d",
    background: "#1a1d24", color: "#9096a8", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  ampmBtnActive: { background: "#f0c060", borderColor: "#f0c060", color: "#000" },
  soundOpt: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2f3d",
    background: "#22262f", cursor: "pointer", fontSize: 13, color: "#f0f0f0",
  },
  soundOptActive: { borderColor: "#4da6ff", background: "rgba(77,166,255,0.1)", color: "#4da6ff" },
  previewBtn: {
    background: "none", border: "none", color: "#555d70", fontSize: 16,
    cursor: "pointer", padding: "2px 6px", transition: "color 0.2s",
  },
  textInput: {
    width: "100%", padding: "10px 12px", background: "#1a1d24",
    border: "1px solid #2a2f3d", borderRadius: 10, color: "#f0f0f0",
    fontSize: 14, outline: "none",
  },
  btnPrimary: {
    width: "100%", padding: 13, border: "none", borderRadius: 12,
    background: "#f0c060", color: "#000", fontSize: 15, fontWeight: 700,
    cursor: "pointer", marginTop: 14,
  },
  btnGreen: {
    width: "100%", padding: 14, border: "none", borderRadius: 12,
    background: "#34c77b", color: "#000", fontSize: 15, fontWeight: 700,
    cursor: "pointer", marginTop: 12,
  },
  iconBtn: {
    background: "none", border: "none", color: "#555d70",
    fontSize: 18, cursor: "pointer", padding: "4px 6px",
  },

  // Info boxes
  infoBoxGold: {
    marginTop: 10, padding: "12px 14px", borderRadius: 10,
    border: "1px solid rgba(240,192,96,0.3)", background: "rgba(240,192,96,0.08)",
    color: "#f0c060", fontSize: 13, lineHeight: 1.5,
  },
  infoBoxBlue: {
    marginTop: 10, padding: "12px 14px", borderRadius: 10,
    border: "1px solid rgba(77,166,255,0.3)", background: "rgba(77,166,255,0.08)",
    color: "#4da6ff", fontSize: 12, lineHeight: 1.5,
  },

  // Night player
  playerBar: {
    background: "#22262f", border: "1px solid #34c77b", borderRadius: 12,
    padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
  },
  playerDot: {
    width: 8, height: 8, borderRadius: "50%", background: "#34c77b",
    animation: "pdot 0.8s ease-in-out infinite alternate", flexShrink: 0,
  },
  stopBtn: {
    padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,85,85,0.4)",
    background: "rgba(255,85,85,0.1)", color: "#ff5555", fontSize: 12,
    fontWeight: 700, cursor: "pointer",
  },
  surahItem: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px", background: "#22262f", border: "1px solid #2a2f3d",
    borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
  },
  surahItemSel: { borderColor: "#f0c060", background: "rgba(240,192,96,0.08)" },
  surahNum: {
    width: 28, height: 28, borderRadius: "50%", background: "#1a1d24",
    border: "1px solid #2a2f3d", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 11, color: "#555d70", fontWeight: 600,
  },
  surahNumSel: { background: "#f0c060", borderColor: "#f0c060", color: "#000" },

  // Duas
  duaCard: {
    padding: 16, background: "#22262f", border: "1px solid #2a2f3d",
    borderLeft: "3px solid #f0c060", borderRadius: 12, marginBottom: 12,
  },
  duaTitle: {
    fontSize: 11, color: "#f0c060", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
  },
  duaArabic: {
    direction: "rtl", textAlign: "right", fontSize: 20, color: "#fff",
    lineHeight: 1.9, marginBottom: 8,
  },
  duaRoman: { fontSize: 12, color: "#4da6ff", fontStyle: "italic", marginBottom: 4, lineHeight: 1.5 },
  duaEnglish: { fontSize: 13, color: "#9096a8", lineHeight: 1.5, marginBottom: 6 },
  duaRef: { fontSize: 11, color: "#555d70" },

  // Dhikr
  dhikrItem: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: 14, background: "#22262f", border: "1px solid #2a2f3d",
    borderRadius: 12, marginBottom: 8, transition: "border-color 0.3s",
  },
  dhikrItemDone: { borderColor: "#34c77b" },
  dhikrArabic: { fontSize: 18, color: "#f0c060", direction: "rtl", marginBottom: 2 },
  dhikrTap: {
    width: 44, height: 44, borderRadius: "50%",
    background: "rgba(52,199,123,0.15)", border: "1px solid rgba(52,199,123,0.3)",
    color: "#34c77b", fontSize: 22, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  dhikrReset: {
    background: "none", border: "none", color: "#555d70",
    fontSize: 10, cursor: "pointer", textDecoration: "underline",
  },

  // Checklists
  checkItem: {
    display: "flex", alignItems: "flex-start", gap: 12, padding: 14,
    background: "#22262f", border: "1px solid #2a2f3d", borderRadius: 12,
    marginBottom: 8, cursor: "pointer", textAlign: "left",
    width: "100%", transition: "all 0.2s",
  },
  checkItemDone: { borderColor: "rgba(52,199,123,0.4)", background: "rgba(52,199,123,0.05)" },
  resetBtn: {
    background: "none", border: "1px solid #2a2f3d", borderRadius: 8,
    padding: "8px 14px", color: "#555d70", fontSize: 12, fontWeight: 600,
    cursor: "pointer", marginTop: 4,
  },
};
