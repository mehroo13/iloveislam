"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Midnight: string;
}

interface AlarmConfig {
  type: "fajr_before" | "tahajjud" | "custom";
  minutesBefore: number;
  customTime: string;
  sound: string;
  enabled: boolean;
}

interface NightPlayerConfig {
  playlist: string[];
  repeatEach: number;
  voice: string;
  autoOff: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  arabic?: string;
  checked: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ALARM_SOUNDS: Record<string, { label: string; url: string }> = {
  adhan_makkah: {
    label: "Adhan – Makkah",
    url: "https://download.tvquran.com/download/selections/315/5e3f1377ce3df.mp3",
  },
  adhan_madinah: {
    label: "Adhan – Madinah",
    url: "https://islamicfinder.org/prayer-times/audio/madinah-adhan.mp3",
  },
  mishary_fatiha: {
    label: "Surah Al-Fatiha – Mishary",
    url: "https://download.tvquran.com/download/selections/113/5e3f2027ce5df.mp3",
  },
  sudais_fajr: {
    label: "Fajr Adhan – Sudais",
    url: "https://download.tvquran.com/download/selections/315/5e3f1377ce3df.mp3",
  },
};

const NIGHT_SURAHS: Record<string, { label: string; arabic: string; url: string }> = {
  mulk: {
    label: "Surah Al-Mulk",
    arabic: "سورة الملك",
    url: "https://download.tvquran.com/download/selections/67/5f1234567890a.mp3",
  },
  rahman: {
    label: "Surah Ar-Rahman",
    arabic: "سورة الرحمن",
    url: "https://download.tvquran.com/download/selections/55/5f1234567890b.mp3",
  },
  duha: {
    label: "Surah Ad-Duha",
    arabic: "سورة الضحى",
    url: "https://download.tvquran.com/download/selections/93/5f1234567890c.mp3",
  },
};

// Best Mishary Rashid hosted sources
const MISHARY_URLS: Record<string, string> = {
  mulk: "https://server8.mp3quran.net/mishary/067.mp3",
  rahman: "https://server8.mp3quran.net/mishary/055.mp3",
  duha: "https://server8.mp3quran.net/mishary/093.mp3",
};

const SLEEP_CHECKLIST: ChecklistItem[] = [
  { id: "wudu", text: "Perform Wudu (ablution)", arabic: "الوضوء", checked: false },
  { id: "miswak", text: "Use Miswak before sleeping", arabic: "السواك", checked: false },
  { id: "right_side", text: "Sleep on your right side", arabic: "النوم على الجانب الأيمن", checked: false },
  { id: "ayatul_kursi", text: "Recite Ayatul Kursi", arabic: "آية الكرسي", checked: false },
  { id: "three_quls", text: "Recite the Three Quls (3x each)", arabic: "المعوذات ثلاث مرات", checked: false },
  { id: "tasbih_33", text: "Say SubhanAllah 33x, Alhamdulillah 33x, Allahu Akbar 34x", arabic: "التسبيح قبل النوم", checked: false },
  { id: "sleep_dua", text: "Recite sleeping dua", arabic: "دعاء النوم", checked: false },
  { id: "no_harm", text: "Forgive everyone before sleeping", arabic: "العفو قبل النوم", checked: false },
];

const WAKE_CHECKLIST: ChecklistItem[] = [
  { id: "wake_dua", text: "Recite waking-up dua", arabic: "دعاء الاستيقاظ", checked: false },
  { id: "alhamdulillah", text: "Say Alhamdulillah for being alive", arabic: "الحمد لله الذي أحيانا", checked: false },
  { id: "wudu_w", text: "Make Wudu immediately", arabic: "تجديد الوضوء", checked: false },
  { id: "fajr_sunnah", text: "Pray 2 Rak'ahs Sunnah of Fajr", arabic: "ركعتا الفجر", checked: false },
  { id: "fajr_fard", text: "Pray Fajr Salah on time", arabic: "صلاة الفجر", checked: false },
  { id: "morning_adhkar", text: "Read morning adhkar", arabic: "أذكار الصباح", checked: false },
  { id: "quran_morning", text: "Read some Quran in the morning", arabic: "تلاوة القرآن الكريم", checked: false },
];

const MORNING_DUAS = [
  {
    title: "Waking Up Dua",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    translation: "All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.",
    reference: "Sahih al-Bukhari 6312",
  },
  {
    title: "Morning Protection Dua",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namootu wa ilaykan-nushoor",
    translation: "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.",
    reference: "Abu Dawud 5068",
  },
  {
    title: "Sayyid al-Istighfar",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ",
    transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana abduka...",
    translation: "O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant...",
    reference: "Sahih al-Bukhari 6306",
  },
];

const SLEEP_DUAS = [
  {
    title: "Sleeping Dua",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amootu wa ahya",
    translation: "In Your name, O Allah, I die and I live.",
    reference: "Sahih al-Bukhari 6324",
  },
  {
    title: "Dua Before Sleep",
    arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
    transliteration: "Allahumma qini adhabaka yawma tab'athu ibadaka",
    translation: "O Allah, protect me from Your punishment on the Day You resurrect Your servants.",
    reference: "Abu Dawud 5045",
  },
  {
    title: "Dua for Good Sleep",
    arabic: "اللَّهُمَّ بِاسْمِكَ أَحْيَا وَأَمُوتُ",
    transliteration: "Allahumma bismika ahya wa amootu",
    translation: "O Allah, with Your name I live and I die.",
    reference: "Sahih al-Bukhari 6325",
  },
];

const MORNING_DHIKR = [
  { arabic: "سُبْحَانَ اللَّهِ", transliteration: "SubhanAllah", translation: "Glory be to Allah", count: 33 },
  { arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdulillah", translation: "All praise be to Allah", count: 33 },
  { arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allahu Akbar", translation: "Allah is the Greatest", count: 34 },
  { arabic: "لَا إِلَهَ إِلَّا اللَّهُ", transliteration: "La ilaha illallah", translation: "There is no god but Allah", count: 10 },
  { arabic: "أَسْتَغْفِرُ اللَّهَ", transliteration: "Astaghfirullah", translation: "I seek forgiveness from Allah", count: 100 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeStrToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(mins: number): string {
  const h = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
  const m = ((mins % 1440) + 1440) % 1440 % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDisplayTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
}

function calcTahajjud(isha: string, fajr: string): string {
  let ishaM = timeStrToMinutes(isha);
  let fajrM = timeStrToMinutes(fajr);
  if (fajrM < ishaM) fajrM += 1440;
  const nightDuration = fajrM - ishaM;
  const lastThirdStart = ishaM + Math.floor((2 * nightDuration) / 3);
  return minutesToTimeStr(lastThirdStart);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IslamicAlarmPage() {
  const [activeTab, setActiveTab] = useState<"alarm" | "night" | "duas" | "checklist">("alarm");

  // Prayer times
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [locationName, setLocationName] = useState("Detecting location…");
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [hijriDate, setHijriDate] = useState("");

  // Alarm
  const [alarm, setAlarm] = useState<AlarmConfig>({
    type: "fajr_before",
    minutesBefore: 15,
    customTime: "05:00",
    sound: "adhan_makkah",
    enabled: false,
  });
  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmFiring, setAlarmFiring] = useState(false);
  const [showAlhamdulillah, setShowAlhamdulillah] = useState(false);
  const [alarmTimeDisplay, setAlarmTimeDisplay] = useState("");
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Night player
  const [nightConfig, setNightConfig] = useState<NightPlayerConfig>({
    playlist: ["mulk"],
    repeatEach: 1,
    voice: "mishary",
    autoOff: true,
  });
  const [nightPlaying, setNightPlaying] = useState(false);
  const [currentSurahIndex, setCurrentSurahIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const nightAudioRef = useRef<HTMLAudioElement | null>(null);

  // Dhikr counter
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});

  // Checklists
  const [sleepList, setSleepList] = useState<ChecklistItem[]>(SLEEP_CHECKLIST);
  const [wakeList, setWakeList] = useState<ChecklistItem[]>(WAKE_CHECKLIST);

  // Current time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load from localStorage
  useEffect(() => {
    const savedAlarm = localStorage.getItem("islamicAlarm");
    if (savedAlarm) setAlarm(JSON.parse(savedAlarm));
    const savedNight = localStorage.getItem("islamicNight");
    if (savedNight) setNightConfig(JSON.parse(savedNight));
  }, []);

  // Save alarm
  useEffect(() => {
    localStorage.setItem("islamicAlarm", JSON.stringify(alarm));
  }, [alarm]);

  // Save night config
  useEffect(() => {
    localStorage.setItem("islamicNight", JSON.stringify(nightConfig));
  }, [nightConfig]);

  // Fetch prayer times
  useEffect(() => {
    const fetchPrayers = async (lat: number, lon: number, city?: string) => {
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
          const t = data.data.timings;
          setPrayerTimes({
            Fajr: t.Fajr,
            Sunrise: t.Sunrise,
            Dhuhr: t.Dhuhr,
            Asr: t.Asr,
            Maghrib: t.Maghrib,
            Isha: t.Isha,
            Midnight: t.Midnight,
          });
          const hijri = data.data.date.hijri;
          setHijriDate(`${hijri.day} ${hijri.month.en} ${hijri.year} AH`);
          setLocationName(city || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingPrayers(false);
      }
    };

    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geoData = await geoRes.json();
          const city =
            geoData.address.city ||
            geoData.address.town ||
            geoData.address.village ||
            geoData.address.county ||
            "";
          const country = geoData.address.country || "";
          await fetchPrayers(latitude, longitude, city ? `${city}, ${country}` : country);
        } catch {
          await fetchPrayers(latitude, longitude);
        }
      },
      async () => {
        // IP-based fallback
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          const ipData = await ipRes.json();
          await fetchPrayers(ipData.latitude, ipData.longitude, `${ipData.city}, ${ipData.country_name}`);
        } catch {
          setLoadingPrayers(false);
          setLocationName("Location unavailable");
        }
      }
    );
  }, []);

  // Calculate alarm time
  const getAlarmTime = useCallback((): string => {
    if (!prayerTimes) return alarm.customTime;
    if (alarm.type === "custom") return alarm.customTime;
    if (alarm.type === "tahajjud") return calcTahajjud(prayerTimes.Isha, prayerTimes.Fajr);
    if (alarm.type === "fajr_before") {
      const fajrMins = timeStrToMinutes(prayerTimes.Fajr);
      return minutesToTimeStr(fajrMins - alarm.minutesBefore);
    }
    return alarm.customTime;
  }, [prayerTimes, alarm]);

  // Watch for alarm trigger
  useEffect(() => {
    if (!alarm.enabled || !prayerTimes) return;
    const alarmTime = getAlarmTime();
    setAlarmTimeDisplay(alarmTime);

    const check = () => {
      const now = new Date();
      const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (nowStr === alarmTime && !alarmFiring) {
        triggerAlarm();
      }
    };

    const t = setInterval(check, 30000);
    check();
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarm.enabled, prayerTimes, alarm, alarmFiring]);

  const triggerAlarm = () => {
    setAlarmFiring(true);
    if (alarmAudioRef.current) {
      alarmAudioRef.current.loop = true;
      alarmAudioRef.current.play().catch(() => {});
    }
    // Request wake lock if available
    if ("wakeLock" in navigator) {
      (navigator as Navigator & { wakeLock: { request: (t: string) => Promise<unknown> } }).wakeLock
        .request("screen")
        .catch(() => {});
    }
  };

  const dismissAlarm = () => {
    setAlarmFiring(false);
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
    setShowAlhamdulillah(true);
    setTimeout(() => setShowAlhamdulillah(false), 4000);
  };

  // Night player logic
  const startNightPlayer = () => {
    if (nightConfig.playlist.length === 0) return;
    setNightPlaying(true);
    setCurrentSurahIndex(0);
    setCurrentRepeat(0);
    playNightSurah(0, 0);
  };

  const playNightSurah = (surahIdx: number, repeatIdx: number) => {
    const surahKey = nightConfig.playlist[surahIdx];
    if (!surahKey) {
      stopNightPlayer();
      return;
    }
    const url = MISHARY_URLS[surahKey];
    if (nightAudioRef.current) {
      nightAudioRef.current.src = url;
      nightAudioRef.current.play().catch(() => {});
      nightAudioRef.current.onended = () => {
        const nextRepeat = repeatIdx + 1;
        if (nextRepeat < nightConfig.repeatEach) {
          setCurrentRepeat(nextRepeat);
          playNightSurah(surahIdx, nextRepeat);
        } else {
          const nextSurah = surahIdx + 1;
          if (nextSurah < nightConfig.playlist.length) {
            setCurrentSurahIndex(nextSurah);
            setCurrentRepeat(0);
            playNightSurah(nextSurah, 0);
          } else {
            if (nightConfig.autoOff) stopNightPlayer();
            else {
              setCurrentSurahIndex(0);
              setCurrentRepeat(0);
              playNightSurah(0, 0);
            }
          }
        }
      };
    }
  };

  const stopNightPlayer = () => {
    setNightPlaying(false);
    if (nightAudioRef.current) {
      nightAudioRef.current.pause();
      nightAudioRef.current.currentTime = 0;
      nightAudioRef.current.onended = null;
    }
  };

  const toggleSurahInPlaylist = (key: string) => {
    setNightConfig((prev) => ({
      ...prev,
      playlist: prev.playlist.includes(key)
        ? prev.playlist.filter((k) => k !== key)
        : [...prev.playlist, key],
    }));
  };

  const incrementDhikr = (key: string) => {
    setDhikrCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const resetDhikr = (key: string) => {
    setDhikrCounts((prev) => ({ ...prev, [key]: 0 }));
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const nowH = currentTime.getHours();
  const nowM = currentTime.getMinutes();
  const nowS = currentTime.getSeconds();
  const isNightTime = nowH >= 20 || nowH < 6;

  const clockStr = `${String(nowH % 12 === 0 ? 12 : nowH % 12).padStart(2, "0")}:${String(nowM).padStart(2, "0")}:${String(nowS).padStart(2, "0")} ${nowH >= 12 ? "PM" : "AM"}`;

  const tahajjudTime =
    prayerTimes ? calcTahajjud(prayerTimes.Isha, prayerTimes.Fajr) : null;

  return (
    <div className="islamic-alarm-root">
      {/* Background geometric */}
      <div className="geo-bg" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`geo-shape geo-shape-${i % 5}`} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>

      {/* Alhamdulillah overlay */}
      {showAlhamdulillah && (
        <div className="alhamdulillah-overlay">
          <div className="alhamdulillah-inner">
            <div className="alhamdulillah-arabic">الحمد لله</div>
            <div className="alhamdulillah-english">Alhamdulillah</div>
            <div className="alhamdulillah-sub">All praise is for Allah</div>
          </div>
        </div>
      )}

      {/* Alarm firing overlay */}
      {alarmFiring && (
        <div className="alarm-firing-overlay">
          <div className="alarm-firing-inner">
            <div className="alarm-icon-pulse">☀️</div>
            <div className="alarm-firing-title">وقت الصلاة</div>
            <div className="alarm-firing-sub">Time to Wake Up</div>
            <div className="alarm-firing-time">{formatDisplayTime(getAlarmTime())}</div>
            <button className="dismiss-btn" onClick={dismissAlarm}>
              Dismiss — إغلاق
            </button>
          </div>
        </div>
      )}

      <audio ref={alarmAudioRef} src={ALARM_SOUNDS[alarm.sound]?.url} />
      <audio ref={nightAudioRef} />

      {/* Header */}
      <header className="ia-header">
        <div className="ia-logo">🕌</div>
        <div className="ia-header-text">
          <h1>Islamic Alarm</h1>
          <p className="ia-hijri">{hijriDate || "Loading date…"}</p>
        </div>
        <div className="ia-clock">{clockStr}</div>
      </header>

      {/* Location + prayer strip */}
      <div className="prayer-strip">
        <div className="location-row">
          <span className="loc-icon">📍</span>
          <span className="loc-name">{locationName}</span>
        </div>
        {loadingPrayers ? (
          <div className="prayer-loading">Fetching prayer times…</div>
        ) : prayerTimes ? (
          <div className="prayer-times-row">
            {(["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const).map((p) => (
              <div key={p} className="prayer-pill">
                <span className="prayer-name">{p}</span>
                <span className="prayer-time">{formatDisplayTime(prayerTimes[p])}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="prayer-loading">Could not load prayer times.</div>
        )}
      </div>

      {/* Tabs */}
      <div className="ia-tabs">
        {(["alarm", "night", "duas", "checklist"] as const).map((tab) => (
          <button
            key={tab}
            className={`ia-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "alarm" && "⏰ Alarm"}
            {tab === "night" && "🌙 Night Player"}
            {tab === "duas" && "🤲 Duas & Dhikr"}
            {tab === "checklist" && "✅ Sunnah Lists"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <main className="ia-content">

        {/* ── ALARM TAB ─────────────────────────────────── */}
        {activeTab === "alarm" && (
          <div className="tab-panel">
            <div className="section-card">
              <h2 className="section-title">⏰ Morning Alarm</h2>
              <p className="section-sub">Set your wake-up time based on Fajr, Tahajjud, or a custom time</p>

              {/* Type selector */}
              <div className="option-group">
                <label className="option-label">Alarm Type</label>
                <div className="radio-group">
                  {[
                    { value: "fajr_before", icon: "🌅", label: "Before Fajr" },
                    { value: "tahajjud", icon: "🌙", label: "Tahajjud Time" },
                    { value: "custom", icon: "🕐", label: "Custom Time" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`type-btn ${alarm.type === opt.value ? "selected" : ""}`}
                      onClick={() => setAlarm((a) => ({ ...a, type: opt.value as AlarmConfig["type"] }))}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Before Fajr options */}
              {alarm.type === "fajr_before" && (
                <div className="option-group">
                  <label className="option-label">Minutes Before Fajr</label>
                  <div className="minutes-grid">
                    {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                      <button
                        key={m}
                        className={`min-btn ${alarm.minutesBefore === m ? "selected" : ""}`}
                        onClick={() => setAlarm((a) => ({ ...a, minutesBefore: m }))}
                      >
                        {m === 0 ? "At Fajr" : `${m} min`}
                      </button>
                    ))}
                  </div>
                  {prayerTimes && (
                    <div className="alarm-preview">
                      <span className="alarm-preview-label">Your alarm will ring at</span>
                      <span className="alarm-preview-time">{formatDisplayTime(getAlarmTime())}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tahajjud */}
              {alarm.type === "tahajjud" && (
                <div className="option-group">
                  <div className="tahajjud-info">
                    <div className="tahajjud-icon">🌙</div>
                    <div>
                      <div className="tahajjud-title">Last Third of the Night</div>
                      <div className="tahajjud-desc">The best time to stand before Allah</div>
                      {tahajjudTime && prayerTimes && (
                        <div className="alarm-preview" style={{ marginTop: "0.5rem" }}>
                          <span className="alarm-preview-label">Tahajjud begins at</span>
                          <span className="alarm-preview-time">{formatDisplayTime(tahajjudTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom time */}
              {alarm.type === "custom" && (
                <div className="option-group">
                  <label className="option-label">Set Your Time</label>
                  <input
                    type="time"
                    className="time-input"
                    value={alarm.customTime}
                    onChange={(e) => setAlarm((a) => ({ ...a, customTime: e.target.value }))}
                  />
                </div>
              )}

              {/* Sound selector */}
              <div className="option-group">
                <label className="option-label">Wake Sound</label>
                <div className="sound-grid">
                  {Object.entries(ALARM_SOUNDS).map(([key, val]) => (
                    <button
                      key={key}
                      className={`sound-btn ${alarm.sound === key ? "selected" : ""}`}
                      onClick={() => setAlarm((a) => ({ ...a, sound: key }))}
                    >
                      🔊 {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enable toggle */}
              <div className="alarm-toggle-row">
                <div>
                  <div className="toggle-title">Enable Alarm</div>
                  {alarm.enabled && prayerTimes && (
                    <div className="toggle-sub">Rings at {formatDisplayTime(getAlarmTime())}</div>
                  )}
                </div>
                <button
                  className={`toggle-switch ${alarm.enabled ? "on" : ""}`}
                  onClick={() => setAlarm((a) => ({ ...a, enabled: !a.enabled }))}
                  aria-label="Toggle alarm"
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              {alarm.enabled && (
                <div className="alarm-active-banner">
                  <span>🟢</span>
                  <span>Alarm is active — works even when screen is locked</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── NIGHT PLAYER TAB ──────────────────────────── */}
        {activeTab === "night" && (
          <div className="tab-panel">
            <div className="section-card">
              <h2 className="section-title">🌙 Night Sleep Player</h2>
              <p className="section-sub">Let the Quran guide you gently into sleep</p>

              {/* Surah selection */}
              <div className="option-group">
                <label className="option-label">Choose Surahs (select one or more)</label>
                <div className="surah-grid">
                  {Object.entries(NIGHT_SURAHS).map(([key, val]) => (
                    <button
                      key={key}
                      className={`surah-card ${nightConfig.playlist.includes(key) ? "selected" : ""}`}
                      onClick={() => toggleSurahInPlaylist(key)}
                    >
                      <span className="surah-arabic">{val.arabic}</span>
                      <span className="surah-label">{val.label}</span>
                      {nightConfig.playlist.includes(key) && (
                        <span className="surah-order">#{nightConfig.playlist.indexOf(key) + 1}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repeat count */}
              <div className="option-group">
                <label className="option-label">Repeat Each Surah</label>
                <div className="minutes-grid">
                  {[1, 2, 3, 5, 7].map((n) => (
                    <button
                      key={n}
                      className={`min-btn ${nightConfig.repeatEach === n ? "selected" : ""}`}
                      onClick={() => setNightConfig((c) => ({ ...c, repeatEach: n }))}
                    >
                      {n}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto off */}
              <div className="alarm-toggle-row">
                <div>
                  <div className="toggle-title">Auto-Off After Playlist Ends</div>
                  <div className="toggle-sub">Player stops after all surahs are done</div>
                </div>
                <button
                  className={`toggle-switch ${nightConfig.autoOff ? "on" : ""}`}
                  onClick={() => setNightConfig((c) => ({ ...c, autoOff: !c.autoOff }))}
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              {/* Voice info */}
              <div className="voice-info">
                <div className="voice-badge">🎙️ Mishary Rashid Alafasy</div>
                <div className="voice-desc">The most soothing and beloved recitation for sleep</div>
              </div>

              {/* Now playing */}
              {nightPlaying && (
                <div className="now-playing-bar">
                  <div className="np-pulse" />
                  <div className="np-info">
                    <span>Now Playing: {NIGHT_SURAHS[nightConfig.playlist[currentSurahIndex]]?.label}</span>
                    <span className="np-repeat">Repeat {currentRepeat + 1}/{nightConfig.repeatEach}</span>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="player-controls">
                {!nightPlaying ? (
                  <button
                    className="play-btn"
                    onClick={startNightPlayer}
                    disabled={nightConfig.playlist.length === 0}
                  >
                    ▶ Start Night Player
                  </button>
                ) : (
                  <button className="stop-btn" onClick={stopNightPlayer}>
                    ⏹ Stop Player
                  </button>
                )}
              </div>

              {nightConfig.playlist.length > 1 && (
                <div className="playlist-preview">
                  <div className="playlist-title">Your Playlist Order:</div>
                  {nightConfig.playlist.map((key, idx) => (
                    <div key={key} className="playlist-item">
                      <span className="pl-num">{idx + 1}</span>
                      <span>{NIGHT_SURAHS[key]?.label}</span>
                      <span className="pl-repeat">×{nightConfig.repeatEach}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DUAS & DHIKR TAB ──────────────────────────── */}
        {activeTab === "duas" && (
          <div className="tab-panel">
            {/* Morning duas */}
            <div className="section-card">
              <h2 className="section-title">🌅 Morning Duas</h2>
              <div className="duas-list">
                {MORNING_DUAS.map((dua, i) => (
                  <div key={i} className="dua-card">
                    <div className="dua-title">{dua.title}</div>
                    <div className="dua-arabic">{dua.arabic}</div>
                    <div className="dua-transliteration">{dua.transliteration}</div>
                    <div className="dua-translation">{dua.translation}</div>
                    <div className="dua-reference">{dua.reference}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sleep duas */}
            <div className="section-card">
              <h2 className="section-title">🌙 Sleep Duas</h2>
              <div className="duas-list">
                {SLEEP_DUAS.map((dua, i) => (
                  <div key={i} className="dua-card">
                    <div className="dua-title">{dua.title}</div>
                    <div className="dua-arabic">{dua.arabic}</div>
                    <div className="dua-transliteration">{dua.transliteration}</div>
                    <div className="dua-translation">{dua.translation}</div>
                    <div className="dua-reference">{dua.reference}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dhikr counter */}
            <div className="section-card">
              <h2 className="section-title">📿 Morning Dhikr Counter</h2>
              <p className="section-sub">Tap to count. Long-press or tap reset to clear.</p>
              <div className="dhikr-list">
                {MORNING_DHIKR.map((d, i) => {
                  const count = dhikrCounts[d.transliteration] || 0;
                  const done = count >= d.count;
                  return (
                    <div key={i} className={`dhikr-item ${done ? "done" : ""}`}>
                      <div className="dhikr-left">
                        <div className="dhikr-arabic">{d.arabic}</div>
                        <div className="dhikr-trans">{d.transliteration}</div>
                        <div className="dhikr-meaning">{d.translation}</div>
                        <div className="dhikr-target">Target: {d.count}×</div>
                      </div>
                      <div className="dhikr-right">
                        <div className="dhikr-count">{count}</div>
                        <button className="dhikr-tap" onClick={() => incrementDhikr(d.transliteration)}>
                          {done ? "✅" : "＋"}
                        </button>
                        <button className="dhikr-reset" onClick={() => resetDhikr(d.transliteration)}>
                          ↺
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── CHECKLIST TAB ─────────────────────────────── */}
        {activeTab === "checklist" && (
          <div className="tab-panel">
            {/* Sleep checklist */}
            <div className="section-card">
              <h2 className="section-title">🌙 Sunnah Before Sleeping</h2>
              <p className="section-sub">Optional — check off as you do them</p>
              <div className="checklist">
                {sleepList.map((item) => (
                  <button
                    key={item.id}
                    className={`checklist-item ${item.checked ? "checked" : ""}`}
                    onClick={() =>
                      setSleepList((l) =>
                        l.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i))
                      )
                    }
                  >
                    <span className="check-box">{item.checked ? "✅" : "⬜"}</span>
                    <span className="check-content">
                      <span className="check-text">{item.text}</span>
                      {item.arabic && <span className="check-arabic">{item.arabic}</span>}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="reset-list-btn"
                onClick={() => setSleepList(SLEEP_CHECKLIST.map((i) => ({ ...i, checked: false })))}
              >
                Reset List
              </button>
            </div>

            {/* Wake checklist */}
            <div className="section-card">
              <h2 className="section-title">🌅 Sunnah After Waking Up</h2>
              <p className="section-sub">Optional — check off as you complete them</p>
              <div className="checklist">
                {wakeList.map((item) => (
                  <button
                    key={item.id}
                    className={`checklist-item ${item.checked ? "checked" : ""}`}
                    onClick={() =>
                      setWakeList((l) =>
                        l.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i))
                      )
                    }
                  >
                    <span className="check-box">{item.checked ? "✅" : "⬜"}</span>
                    <span className="check-content">
                      <span className="check-text">{item.text}</span>
                      {item.arabic && <span className="check-arabic">{item.arabic}</span>}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="reset-list-btn"
                onClick={() => setWakeList(WAKE_CHECKLIST.map((i) => ({ ...i, checked: false })))}
              >
                Reset List
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ─── Global Styles ─────────────────────────────────────────────────── */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lateef:wght@400;700&family=Nunito:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0f1e;
          --bg2: #0e1628;
          --card: rgba(255,255,255,0.04);
          --card-border: rgba(255,255,255,0.08);
          --gold: #c9a84c;
          --gold2: #e8c97a;
          --green: #2ecc88;
          --green2: #26a870;
          --teal: #1a8fa0;
          --text: #e8e8f0;
          --text2: #9898b8;
          --text3: #6868a0;
          --white: #ffffff;
          --radius: 16px;
          --shadow: 0 8px 40px rgba(0,0,0,0.4);
        }

        html, body { background: var(--bg); color: var(--text); font-family: 'Nunito', sans-serif; }

        .islamic-alarm-root {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 3rem;
        }

        /* Geometric background */
        .geo-bg {
          position: fixed; inset: 0; z-index: 0;
          pointer-events: none; overflow: hidden;
        }
        .geo-shape {
          position: absolute;
          border: 1px solid rgba(201,168,76,0.06);
          border-radius: 50%;
          animation: geoRotate 40s linear infinite;
        }
        .geo-shape-0 { width: 300px; height: 300px; top: 10%; left: 5%; animation-duration: 50s; }
        .geo-shape-1 { width: 200px; height: 200px; top: 60%; right: 5%; animation-duration: 35s; animation-direction: reverse; }
        .geo-shape-2 { width: 150px; height: 150px; top: 30%; right: 20%; animation-duration: 45s; }
        .geo-shape-3 { width: 100px; height: 100px; bottom: 20%; left: 15%; animation-duration: 30s; animation-direction: reverse; }
        .geo-shape-4 { width: 400px; height: 400px; bottom: 0; right: -100px; opacity: 0.5; animation-duration: 60s; }
        @keyframes geoRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Alhamdulillah overlay */
        .alhamdulillah-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: radial-gradient(ellipse at center, rgba(201,168,76,0.15) 0%, rgba(10,15,30,0.98) 70%);
          display: flex; align-items: center; justify-content: center;
          animation: fadeInOut 4s ease-in-out forwards;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; }
        }
        .alhamdulillah-inner { text-align: center; }
        .alhamdulillah-arabic {
          font-family: 'Lateef', serif;
          font-size: clamp(3rem, 12vw, 7rem);
          color: var(--gold2);
          text-shadow: 0 0 60px rgba(201,168,76,0.5);
          animation: arabicPulse 2s ease-in-out infinite;
        }
        @keyframes arabicPulse {
          0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); }
        }
        .alhamdulillah-english { font-size: 1.8rem; font-weight: 800; color: var(--white); margin-top: 0.5rem; }
        .alhamdulillah-sub { font-size: 1rem; color: var(--text2); margin-top: 0.25rem; }

        /* Alarm firing overlay */
        .alarm-firing-overlay {
          position: fixed; inset: 0; z-index: 900;
          background: linear-gradient(135deg, #0a1a0a 0%, #0f2a15 100%);
          display: flex; align-items: center; justify-content: center;
          animation: alarmPulse 1s ease-in-out infinite alternate;
        }
        @keyframes alarmPulse {
          from { background: linear-gradient(135deg, #0a1a0a 0%, #0f2a15 100%); }
          to { background: linear-gradient(135deg, #0f2a15 0%, #1a3a20 100%); }
        }
        .alarm-firing-inner { text-align: center; padding: 2rem; }
        .alarm-icon-pulse { font-size: 5rem; animation: iconBounce 0.5s ease-in-out infinite alternate; }
        @keyframes iconBounce { from { transform: translateY(0); } to { transform: translateY(-10px); } }
        .alarm-firing-title { font-family: 'Lateef', serif; font-size: 3rem; color: var(--gold2); margin-top: 1rem; }
        .alarm-firing-sub { font-size: 1.2rem; color: var(--text2); margin: 0.5rem 0; }
        .alarm-firing-time { font-size: 3.5rem; font-weight: 800; color: var(--green); margin: 1rem 0; }
        .dismiss-btn {
          background: var(--green); color: #fff; border: none;
          padding: 1rem 2.5rem; border-radius: 50px; font-size: 1.1rem;
          font-weight: 700; cursor: pointer; margin-top: 1rem;
          font-family: 'Nunito', sans-serif;
          box-shadow: 0 0 30px rgba(46,204,136,0.4);
          transition: transform 0.2s;
        }
        .dismiss-btn:hover { transform: scale(1.05); }

        /* Header */
        .ia-header {
          position: relative; z-index: 10;
          display: flex; align-items: center; gap: 1rem;
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid var(--card-border);
          background: linear-gradient(180deg, rgba(14,22,40,0.9) 0%, transparent 100%);
        }
        .ia-logo { font-size: 2.5rem; }
        .ia-header-text h1 {
          font-size: 1.6rem; font-weight: 800;
          background: linear-gradient(135deg, var(--gold), var(--gold2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .ia-hijri { font-size: 0.8rem; color: var(--text3); margin-top: 2px; }
        .ia-clock {
          margin-left: auto; font-size: 1.3rem; font-weight: 700;
          color: var(--gold); font-variant-numeric: tabular-nums;
          background: var(--card); border: 1px solid var(--card-border);
          padding: 0.4rem 0.9rem; border-radius: 10px;
        }

        /* Prayer strip */
        .prayer-strip {
          position: relative; z-index: 10;
          background: linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(26,143,160,0.05) 100%);
          border-bottom: 1px solid var(--card-border);
          padding: 0.8rem 1.5rem;
        }
        .location-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.6rem; }
        .loc-icon { font-size: 0.85rem; }
        .loc-name { font-size: 0.85rem; color: var(--text2); font-weight: 600; }
        .prayer-loading { font-size: 0.85rem; color: var(--text3); }
        .prayer-times-row {
          display: flex; gap: 0.5rem;
          overflow-x: auto; padding-bottom: 2px;
          scrollbar-width: none;
        }
        .prayer-times-row::-webkit-scrollbar { display: none; }
        .prayer-pill {
          display: flex; flex-direction: column; align-items: center;
          background: var(--card); border: 1px solid var(--card-border);
          padding: 0.4rem 0.8rem; border-radius: 10px;
          min-width: fit-content; gap: 2px;
        }
        .prayer-name { font-size: 0.65rem; color: var(--text3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .prayer-time { font-size: 0.8rem; color: var(--gold); font-weight: 700; }

        /* Tabs */
        .ia-tabs {
          position: relative; z-index: 10;
          display: flex; gap: 0; overflow-x: auto;
          background: var(--bg2); border-bottom: 1px solid var(--card-border);
          scrollbar-width: none;
        }
        .ia-tabs::-webkit-scrollbar { display: none; }
        .ia-tab {
          flex: 1; min-width: 100px; padding: 0.9rem 0.5rem;
          background: none; border: none; color: var(--text3);
          font-size: 0.8rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s; border-bottom: 3px solid transparent;
          font-family: 'Nunito', sans-serif; white-space: nowrap;
        }
        .ia-tab:hover { color: var(--text); }
        .ia-tab.active {
          color: var(--gold);
          border-bottom-color: var(--gold);
          background: rgba(201,168,76,0.05);
        }

        /* Content */
        .ia-content {
          position: relative; z-index: 10;
          max-width: 720px; margin: 0 auto;
          padding: 1.5rem 1rem;
        }
        .tab-panel { display: flex; flex-direction: column; gap: 1.5rem; }

        /* Cards */
        .section-card {
          background: var(--card); border: 1px solid var(--card-border);
          border-radius: var(--radius); padding: 1.5rem;
          box-shadow: var(--shadow);
        }
        .section-title {
          font-size: 1.1rem; font-weight: 800; color: var(--white);
          margin-bottom: 0.3rem;
        }
        .section-sub { font-size: 0.8rem; color: var(--text3); margin-bottom: 1.2rem; }

        /* Options */
        .option-group { margin-top: 1.2rem; }
        .option-label {
          display: block; font-size: 0.75rem; font-weight: 700;
          color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 0.6rem;
        }

        /* Radio group */
        .radio-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .type-btn {
          display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
          padding: 0.7rem 1.2rem; border-radius: 12px;
          border: 1px solid var(--card-border); background: var(--card);
          color: var(--text2); cursor: pointer; font-size: 0.8rem; font-weight: 600;
          transition: all 0.2s; font-family: 'Nunito', sans-serif;
        }
        .type-btn span:first-child { font-size: 1.3rem; }
        .type-btn.selected {
          border-color: var(--gold); color: var(--gold);
          background: rgba(201,168,76,0.1);
        }

        /* Minutes grid */
        .minutes-grid { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .min-btn {
          padding: 0.5rem 0.9rem; border-radius: 10px;
          border: 1px solid var(--card-border); background: var(--card);
          color: var(--text2); cursor: pointer; font-size: 0.8rem;
          font-weight: 700; transition: all 0.2s; font-family: 'Nunito', sans-serif;
        }
        .min-btn.selected {
          border-color: var(--green); color: var(--green);
          background: rgba(46,204,136,0.1);
        }

        /* Alarm preview */
        .alarm-preview {
          display: flex; align-items: center; gap: 0.6rem;
          margin-top: 1rem; padding: 0.8rem 1rem;
          background: rgba(46,204,136,0.08); border: 1px solid rgba(46,204,136,0.2);
          border-radius: 10px;
        }
        .alarm-preview-label { font-size: 0.8rem; color: var(--text2); }
        .alarm-preview-time { font-size: 1.2rem; font-weight: 800; color: var(--green); margin-left: auto; }

        /* Tahajjud info */
        .tahajjud-info {
          display: flex; gap: 1rem; align-items: flex-start;
          padding: 1rem; background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.15); border-radius: 12px;
        }
        .tahajjud-icon { font-size: 2rem; }
        .tahajjud-title { font-size: 1rem; font-weight: 700; color: var(--gold); }
        .tahajjud-desc { font-size: 0.8rem; color: var(--text3); margin-top: 0.2rem; }

        /* Time input */
        .time-input {
          background: var(--card); border: 1px solid var(--card-border);
          color: var(--text); padding: 0.8rem 1rem; border-radius: 12px;
          font-size: 1.5rem; font-weight: 700; font-family: 'Nunito', sans-serif;
          cursor: pointer;
        }

        /* Sound grid */
        .sound-grid { display: flex; flex-direction: column; gap: 0.4rem; }
        .sound-btn {
          padding: 0.7rem 1rem; border-radius: 10px;
          border: 1px solid var(--card-border); background: var(--card);
          color: var(--text2); cursor: pointer; font-size: 0.85rem;
          font-weight: 600; text-align: left; transition: all 0.2s;
          font-family: 'Nunito', sans-serif;
        }
        .sound-btn.selected {
          border-color: var(--teal); color: var(--white);
          background: rgba(26,143,160,0.15);
        }

        /* Toggle */
        .alarm-toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 1.2rem; padding: 1rem; border-radius: 12px;
          background: rgba(255,255,255,0.02); border: 1px solid var(--card-border);
        }
        .toggle-title { font-size: 0.9rem; font-weight: 700; color: var(--text); }
        .toggle-sub { font-size: 0.75rem; color: var(--text3); margin-top: 2px; }
        .toggle-switch {
          position: relative; width: 52px; height: 28px;
          background: rgba(255,255,255,0.1); border: none; border-radius: 14px;
          cursor: pointer; transition: background 0.3s;
        }
        .toggle-switch.on { background: var(--green); }
        .toggle-knob {
          position: absolute; top: 3px; left: 3px;
          width: 22px; height: 22px; background: white;
          border-radius: 50%; transition: transform 0.3s;
          display: block;
        }
        .toggle-switch.on .toggle-knob { transform: translateX(24px); }

        /* Alarm active banner */
        .alarm-active-banner {
          display: flex; align-items: center; gap: 0.6rem;
          margin-top: 0.8rem; padding: 0.7rem 1rem;
          background: rgba(46,204,136,0.08); border: 1px solid rgba(46,204,136,0.2);
          border-radius: 10px; font-size: 0.8rem; color: var(--green);
        }

        /* Surah grid */
        .surah-grid { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .surah-card {
          position: relative; flex: 1; min-width: 130px;
          display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
          padding: 1.2rem 1rem; border-radius: 14px;
          border: 1px solid var(--card-border); background: var(--card);
          color: var(--text2); cursor: pointer; transition: all 0.2s;
          font-family: 'Nunito', sans-serif;
        }
        .surah-card.selected {
          border-color: var(--gold); background: rgba(201,168,76,0.1);
          color: var(--gold);
        }
        .surah-arabic { font-family: 'Lateef', serif; font-size: 1.5rem; color: var(--gold2); }
        .surah-label { font-size: 0.78rem; font-weight: 700; }
        .surah-order {
          position: absolute; top: 6px; right: 8px;
          background: var(--gold); color: #000; font-size: 0.65rem;
          font-weight: 800; width: 18px; height: 18px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }

        /* Voice info */
        .voice-info {
          margin-top: 1rem; padding: 0.8rem 1rem;
          background: rgba(26,143,160,0.08); border: 1px solid rgba(26,143,160,0.2);
          border-radius: 10px;
        }
        .voice-badge { font-size: 0.85rem; font-weight: 700; color: var(--teal); }
        .voice-desc { font-size: 0.75rem; color: var(--text3); margin-top: 2px; }

        /* Now playing */
        .now-playing-bar {
          display: flex; align-items: center; gap: 0.8rem;
          margin-top: 1rem; padding: 0.8rem 1rem;
          background: rgba(46,204,136,0.08); border: 1px solid rgba(46,204,136,0.2);
          border-radius: 10px;
        }
        .np-pulse {
          width: 10px; height: 10px; background: var(--green);
          border-radius: 50%; animation: npPulse 1s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes npPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .np-info { display: flex; flex-direction: column; gap: 2px; }
        .np-info span { font-size: 0.85rem; color: var(--green); font-weight: 700; }
        .np-repeat { font-size: 0.75rem !important; color: var(--text3) !important; font-weight: 600 !important; }

        /* Player controls */
        .player-controls { margin-top: 1.2rem; }
        .play-btn, .stop-btn {
          width: 100%; padding: 1rem; border: none; border-radius: 14px;
          font-size: 1rem; font-weight: 800; cursor: pointer;
          font-family: 'Nunito', sans-serif; transition: all 0.2s;
        }
        .play-btn {
          background: linear-gradient(135deg, var(--green) 0%, var(--green2) 100%);
          color: #fff; box-shadow: 0 4px 20px rgba(46,204,136,0.3);
        }
        .play-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(46,204,136,0.4); }
        .play-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .stop-btn {
          background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.3);
          color: #ff8080;
        }

        /* Playlist preview */
        .playlist-preview { margin-top: 1rem; }
        .playlist-title { font-size: 0.75rem; color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem; }
        .playlist-item {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.5rem 0; border-bottom: 1px solid var(--card-border);
          font-size: 0.85rem; color: var(--text2);
        }
        .pl-num {
          width: 22px; height: 22px; background: rgba(201,168,76,0.15);
          color: var(--gold); border-radius: 50%; display: flex;
          align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800;
        }
        .pl-repeat { margin-left: auto; color: var(--text3); font-size: 0.75rem; }

        /* Duas */
        .duas-list { display: flex; flex-direction: column; gap: 1rem; }
        .dua-card {
          padding: 1.2rem; background: rgba(255,255,255,0.02);
          border: 1px solid var(--card-border); border-radius: 12px;
          border-left: 3px solid var(--gold);
        }
        .dua-title { font-size: 0.7rem; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.8rem; }
        .dua-arabic { font-family: 'Lateef', serif; font-size: 1.6rem; color: var(--white); direction: rtl; text-align: right; line-height: 1.8; margin-bottom: 0.6rem; }
        .dua-transliteration { font-size: 0.78rem; color: var(--teal); font-style: italic; margin-bottom: 0.3rem; }
        .dua-translation { font-size: 0.82rem; color: var(--text2); line-height: 1.5; margin-bottom: 0.5rem; }
        .dua-reference { font-size: 0.7rem; color: var(--text3); }

        /* Dhikr */
        .dhikr-list { display: flex; flex-direction: column; gap: 0.8rem; }
        .dhikr-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem; background: rgba(255,255,255,0.02);
          border: 1px solid var(--card-border); border-radius: 12px;
          transition: all 0.3s;
        }
        .dhikr-item.done { border-color: rgba(46,204,136,0.3); background: rgba(46,204,136,0.04); }
        .dhikr-left { flex: 1; }
        .dhikr-arabic { font-family: 'Lateef', serif; font-size: 1.4rem; color: var(--gold2); direction: rtl; }
        .dhikr-trans { font-size: 0.82rem; color: var(--teal); font-style: italic; margin: 2px 0; }
        .dhikr-meaning { font-size: 0.78rem; color: var(--text2); }
        .dhikr-target { font-size: 0.7rem; color: var(--text3); margin-top: 2px; }
        .dhikr-right { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; margin-left: 1rem; }
        .dhikr-count { font-size: 1.5rem; font-weight: 800; color: var(--green); min-width: 40px; text-align: center; }
        .dhikr-tap {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(46,204,136,0.15); border: 1px solid rgba(46,204,136,0.3);
          color: var(--green); font-size: 1.2rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; font-family: 'Nunito', sans-serif;
        }
        .dhikr-tap:active { transform: scale(0.9); background: rgba(46,204,136,0.3); }
        .dhikr-reset {
          background: none; border: none; color: var(--text3);
          font-size: 0.9rem; cursor: pointer; padding: 0.2rem 0.4rem;
          font-family: 'Nunito', sans-serif;
        }

        /* Checklist */
        .checklist { display: flex; flex-direction: column; gap: 0.5rem; }
        .checklist-item {
          display: flex; align-items: flex-start; gap: 0.8rem;
          padding: 0.9rem 1rem; border-radius: 12px;
          border: 1px solid var(--card-border); background: var(--card);
          cursor: pointer; text-align: left; transition: all 0.2s;
          font-family: 'Nunito', sans-serif; width: 100%;
        }
        .checklist-item.checked {
          border-color: rgba(46,204,136,0.3);
          background: rgba(46,204,136,0.05);
        }
        .check-box { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
        .check-content { display: flex; flex-direction: column; gap: 2px; }
        .check-text { font-size: 0.85rem; font-weight: 600; color: var(--text); }
        .check-arabic { font-family: 'Lateef', serif; font-size: 0.9rem; color: var(--text3); direction: rtl; }
        .checklist-item.checked .check-text { color: var(--text3); text-decoration: line-through; }

        .reset-list-btn {
          margin-top: 1rem; padding: 0.6rem 1.2rem; border-radius: 8px;
          border: 1px solid var(--card-border); background: none;
          color: var(--text3); font-size: 0.8rem; font-weight: 700;
          cursor: pointer; font-family: 'Nunito', sans-serif; transition: all 0.2s;
        }
        .reset-list-btn:hover { border-color: var(--text3); color: var(--text); }

        @media (max-width: 480px) {
          .ia-header { padding: 1rem; }
          .ia-clock { font-size: 1rem; padding: 0.3rem 0.7rem; }
          .ia-content { padding: 1rem 0.75rem; }
          .ia-tab { font-size: 0.72rem; padding: 0.75rem 0.3rem; }
          .surah-grid { flex-direction: column; }
          .surah-card { min-width: unset; }
        }
      `}</style>
    </div>
  );
}