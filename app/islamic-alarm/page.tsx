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
// Using the most reliable URLs found during testing
const SOUNDS = [
  { id: "adhan_makkah", label: "Adhan – Makkah", url: "https://praytimes.org/audio/sunni/Adhan-Makkah.mp3" },
  { id: "adhan_madinah", label: "Adhan – Madinah", url: "https://praytimes.org/audio/sunni/Adhan-Madinah.mp3" },
  { id: "adhan_egypt", label: "Adhan – Egypt", url: "https://praytimes.org/audio/sunni/Adhan-Egypt.mp3" },
  { id: "adhan_alaqsa", label: "Adhan – Al-Aqsa", url: "https://praytimes.org/audio/sunni/Adhan-Alaqsa.mp3" },
];

const SURAHS = [
  { id: "mulk", name: "Surah Al-Mulk", arabic: "سورة الملك", url: "https://archive.org/download/MisharyRashidAlafasyQuranmp3.info/067.mp3" },
  { id: "rahman", name: "Surah Ar-Rahman", arabic: "سورة الرحمن", url: "https://archive.org/download/MisharyRashidAlafasyQuranmp3.info/055.mp3" },
  { id: "sajdah", name: "Surah As-Sajdah", arabic: "سورة السجدة", url: "https://archive.org/download/MisharyRashidAlafasyQuranmp3.info/032.mp3" },
  { id: "waqiah", name: "Surah Al-Waqi'ah", arabic: "سورة الواقعة", url: "https://archive.org/download/MisharyRashidAlafasyQuranmp3.info/056.mp3" },
  { id: "kahf", name: "Surah Al-Kahf", arabic: "سورة الكهف", url: "https://archive.org/download/MisharyRashidAlafasyQuranmp3.info/018.mp3" },
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
  const fireAlarm = useCallback((alarm: Alarm) => {
    stopPreview();
    stopPlayer();
    setFiringAlarm(alarm);
    setAlarmFiring(true);
    const sound = SOUNDS.find((s) => s.id === alarm.sound) || SOUNDS[0];
    
    const audio = new Audio();
    audio.src = sound.url;
    audio.loop = true;
    audio.crossOrigin = "anonymous";
    
    audio.play().catch(() => {
      // Fallback for browser blocking
      const resume = () => { audio.play(); window.removeEventListener("click", resume); };
      window.addEventListener("click", resume);
    });
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
      alert("Prayer times not loaded yet.");
      return;
    }
    const min = getAlarmMin();
    const label = alarmLabel.trim() || (alarmType === "fajr" ? "Fajr" : alarmType === "tahajjud" ? "Tahajjud" : "Alarm");
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
  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = "";
      previewAudioRef.current = null;
    }
  };

  const previewSound = (id: string, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    stopPreview();
    const s = SOUNDS.find((x) => x.id === id);
    if (!s) return;
    
    const audio = new Audio();
    audio.src = s.url;
    audio.crossOrigin = "anonymous";
    audio.play().catch(() => {});
    previewAudioRef.current = audio;
    setTimeout(stopPreview, 10000);
  };

  // ─── Night player ─────────────────────────────────────────────────────────────
  const playNightIdx = useCallback((idx: number, rep: number, surahs: string[], repeat: number) => {
    if (!nightStateRef.current.playing) return;
    
    const surahId = surahs[idx];
    if (!surahId) { setNightPlaying(false); return; }
    
    const surah = SURAHS.find((s) => s.id === surahId);
    if (!surah) { setNightPlaying(false); return; }
    
    if (nightAudioRef.current) {
      nightAudioRef.current.pause();
      nightAudioRef.current.src = "";
    }
    
    const audio = new Audio();
    audio.src = surah.url;
    audio.crossOrigin = "anonymous";
    nightAudioRef.current = audio;
    
    setNpTitle(surah.name);
    nightStateRef.current = { idx, rep, playing: true };
    
    audio.onended = () => {
      if (!nightStateRef.current.playing) return;
      const nextRep = rep + 1;
      if (nextRep < repeat) {
        playNightIdx(idx, nextRep, surahs, repeat);
      } else {
        const nextIdx = idx + 1;
        if (nextIdx < surahs.length) {
          playNightIdx(nextIdx, 0, surahs, repeat);
        } else {
          setNightPlaying(false);
          nightStateRef.current.playing = false;
        }
      }
    };
    
    audio.play().catch(() => {
      setNightPlaying(false);
      nightStateRef.current.playing = false;
    });
  }, []);

  const startPlayer = () => {
    if (!selectedSurahs.length) return;
    stopPreview();
    setNightPlaying(true);
    nightStateRef.current.playing = true;
    playNightIdx(0, 0, selectedSurahs, repeatCount);
  };

  const stopPlayer = () => {
    nightStateRef.current.playing = false;
    setNightPlaying(false);
    if (nightAudioRef.current) {
      nightAudioRef.current.pause();
      nightAudioRef.current.src = "";
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
  const nowH = now.getHours(), nowM = now.getMinutes();
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
            <div style={S.card}>
              <div style={S.cardTitle}>My Alarms</div>
              {alarms.length === 0 ? (
                <div style={{ color: "#555d70", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No alarms set.</div>
              ) : (
                alarms.map((a) => (
                  <div key={a.id} style={S.alarmItem}>
                    <div>
                      <div style={S.alarmTimeBig}>{fmt12(a.time24)}</div>
                      <div style={{ fontSize: 13, color: "#9096a8" }}>{a.label}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ToggleSwitch checked={a.enabled} onChange={() => toggleAlarm(a.id)} />
                      <button onClick={() => deleteAlarm(a.id)} style={S.iconBtn}>🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Add Alarm</div>
              <div style={S.row}>
                {(["custom", "fajr", "tahajjud"] as const).map((t) => (
                  <button key={t} onClick={() => setAlarmType(t)}
                    style={{ ...S.typeBtn, ...(alarmType === t ? S.typeBtnActive : {}) }}>
                    {t === "custom" ? "🕐 Custom" : t === "fajr" ? "🌅 Fajr" : "🌙 Tahajjud"}
                  </button>
                ))}
              </div>

              {alarmType === "custom" && (
                <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="number" value={pickH} onChange={e => setPickH(Number(e.target.value))} style={S.numInput} min="1" max="12" />
                  <span>:</span>
                  <input type="number" value={pickM} onChange={e => setPickM(Number(e.target.value))} style={S.numInput} min="0" max="59" />
                  <select value={pickAmpm} onChange={e => setPickAmpm(e.target.value as any)} style={S.numInput}>
                    <option>AM</option><option>PM</option>
                  </select>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div style={S.fieldLabel}>Sound</div>
                {SOUNDS.map((s) => (
                  <div key={s.id} onClick={() => setSelectedSound(s.id)}
                    style={{ ...S.soundOpt, ...(selectedSound === s.id ? S.soundOptActive : {}) }}>
                    <span>🔊 {s.label}</span>
                    <button onClick={(e) => previewSound(s.id, e)} style={S.previewBtn}>▶</button>
                  </div>
                ))}
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
              <div style={S.cardTitle}>Night Player</div>
              {nightPlaying && (
                <div style={S.playerBar}>
                  <div style={S.playerDot} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "#fff" }}>{npTitle}</div>
                    <div style={{ fontSize: 11, color: "#34c77b" }}>Playing…</div>
                  </div>
                  <button onClick={stopPlayer} style={S.stopBtn}>■ Stop</button>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SURAHS.map((s) => (
                  <div key={s.id} onClick={() => toggleSurah(s.id)}
                    style={{ ...S.surahItem, ...(selectedSurahs.includes(s.id) ? S.surahItemSel : {}) }}>
                    <div>
                      <div style={{ fontSize: 14, color: "#fff" }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "#555d70" }}>{s.arabic}</div>
                    </div>
                    <span>{selectedSurahs.includes(s.id) ? "✓" : "+"}</span>
                  </div>
                ))}
              </div>
              <button onClick={startPlayer} style={S.btnGreen}>▶ Start Player</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* DUAS TAB */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "duas" && (
          <div style={S.panel}>
            <div style={S.card}>
              <div style={S.cardTitle}>🌅 Morning Duas</div>
              {MORNING_DUAS.map((d, i) => (
                <div key={i} style={S.duaCard}>
                  <div style={S.duaTitle}>{d.title}</div>
                  <div style={S.duaArabic}>{d.arabic}</div>
                  <div style={S.duaEnglish}>{d.english}</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}>📿 Dhikr</div>
              {DHIKR.map((d, i) => (
                <div key={i} style={S.dhikrItem}>
                  <div style={{ flex: 1 }}>
                    <div style={S.dhikrArabic}>{d.arabic}</div>
                    <div style={{ fontSize: 12, color: "#9096a8" }}>{d.name}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20, color: "#34c77b" }}>{dhikrCounts[i] || 0}</span>
                    <button onClick={() => incDhikr(i)} style={S.dhikrTap}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* LIST TAB */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "list" && (
          <div style={S.panel}>
            <div style={S.card}>
              <div style={S.cardTitle}>🌙 Sleep Sunnah</div>
              {SLEEP_LIST.map((item) => (
                <button key={item.id} onClick={() => toggleCheck("sleep", item.id)}
                  style={{ ...S.checkItem, ...(sleepChecked.includes(item.id) ? S.checkItemDone : {}) }}>
                  <span>{sleepChecked.includes(item.id) ? "✅" : "⬜"}</span>
                  <div style={{ flex: 1 }}>{item.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { background: #111318; color: #f0f0f0; font-family: 'Inter', sans-serif; }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-10px); } }
        @keyframes pdot { from { opacity: 1; } to { opacity: 0.3; } }
      `}</style>
    </>
  );
}

// ─── Toggle Switch Component ───────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 12, background: checked ? "#34c77b" : "#22262f",
      position: "relative", cursor: "pointer", transition: "0.3s"
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: checked ? 23 : 3, transition: "0.3s"
      }} />
    </div>
  );
}

// ─── Styles object ─────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  app: { maxWidth: 420, margin: "0 auto", paddingBottom: 80 },
  overlay: { position: "fixed", inset: 0, zIndex: 9999, background: "#0a1a0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  alhamOverlay: { position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  dismissBtn: { padding: "16px 40px", borderRadius: 30, background: "#34c77b", border: "none", fontWeight: 700, cursor: "pointer" },
  header: { textAlign: "center", padding: "40px 20px" },
  clockTime: { fontSize: 60, fontWeight: 300 },
  clockAmpm: { fontSize: 20, color: "#9096a8", marginLeft: 8 },
  clockDate: { color: "#9096a8", marginTop: 8 },
  hijri: { fontSize: 12, color: "#555d70", marginTop: 4 },
  locRow: { padding: "0 20px", fontSize: 12, color: "#555d70" },
  prayerBar: { background: "#1a1d24", padding: "12px", overflowX: "auto", margin: "20px 0" },
  prayerBarInner: { display: "flex", gap: 10 },
  prayerPill: { padding: "8px 12px", background: "#22262f", borderRadius: 8, minWidth: 80, textAlign: "center" },
  prayerPillNext: { borderColor: "#f0c060", border: "1px solid #f0c060" },
  prayerName: { fontSize: 10, color: "#555d70", display: "block" },
  prayerTime: { fontSize: 12, color: "#f0c060", fontWeight: 600 },
  tabbar: { display: "flex", background: "#1a1d24", position: "sticky", top: 0, zIndex: 10 },
  tab: { flex: 1, padding: "15px", background: "none", border: "none", color: "#555d70", fontSize: 12, cursor: "pointer" },
  tabActive: { color: "#f0c060", borderBottom: "2px solid #f0c060" },
  panel: { padding: 20, display: "flex", flexDirection: "column", gap: 20 },
  card: { background: "#1e2230", borderRadius: 15, padding: 20 },
  cardTitle: { fontSize: 12, color: "#9096a8", textTransform: "uppercase", marginBottom: 15 },
  alarmItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", borderBottom: "1px solid #2a2f3d" },
  alarmTimeBig: { fontSize: 30, fontWeight: 300 },
  row: { display: "flex", gap: 8 },
  typeBtn: { flex: 1, padding: "10px", borderRadius: 10, background: "#22262f", border: "1px solid #2a2f3d", color: "#9096a8", cursor: "pointer" },
  typeBtnActive: { borderColor: "#f0c060", color: "#f0c060" },
  numInput: { background: "#1a1d24", border: "1px solid #2a2f3d", color: "#fff", padding: 8, borderRadius: 5, width: 60 },
  soundOpt: { display: "flex", justifyContent: "space-between", padding: 12, background: "#22262f", borderRadius: 10, marginBottom: 5, cursor: "pointer" },
  soundOptActive: { border: "1px solid #34c77b" },
  previewBtn: { background: "none", border: "none", color: "#555d70", cursor: "pointer" },
  btnPrimary: { width: "100%", padding: 15, background: "#f0c060", border: "none", borderRadius: 10, fontWeight: 700, marginTop: 15, cursor: "pointer" },
  btnGreen: { width: "100%", padding: 15, background: "#34c77b", border: "none", borderRadius: 10, fontWeight: 700, marginTop: 15, cursor: "pointer" },
  iconBtn: { background: "none", border: "none", cursor: "pointer" },
  playerBar: { background: "#22262f", border: "1px solid #34c77b", borderRadius: 10, padding: 15, display: "flex", alignItems: "center", gap: 15, marginBottom: 15 },
  playerDot: { width: 8, height: 8, borderRadius: "50%", background: "#34c77b", animation: "pdot 0.8s infinite alternate" },
  stopBtn: { padding: "5px 10px", background: "rgba(255,0,0,0.1)", border: "1px solid red", color: "red", borderRadius: 5, cursor: "pointer" },
  surahItem: { display: "flex", justifyContent: "space-between", padding: 15, background: "#22262f", borderRadius: 10, cursor: "pointer" },
  surahItemSel: { border: "1px solid #f0c060" },
  duaCard: { padding: 15, background: "#22262f", borderRadius: 10, marginBottom: 10 },
  duaTitle: { color: "#f0c060", fontSize: 12, marginBottom: 10 },
  duaArabic: { fontSize: 18, textAlign: "right", direction: "rtl", marginBottom: 10 },
  duaEnglish: { fontSize: 13, color: "#9096a8" },
  dhikrItem: { display: "flex", alignItems: "center", padding: 15, background: "#22262f", borderRadius: 10, marginBottom: 5 },
  dhikrArabic: { fontSize: 16, color: "#f0c060", direction: "rtl" },
  dhikrTap: { width: 40, height: 40, borderRadius: "50%", background: "#34c77b", border: "none", color: "#000", fontWeight: 700, cursor: "pointer" },
  checkItem: { display: "flex", gap: 15, padding: 15, background: "#22262f", borderRadius: 10, width: "100%", border: "none", color: "#fff", textAlign: "left", marginBottom: 5, cursor: "pointer" },
  checkItemDone: { opacity: 0.5 }
};
