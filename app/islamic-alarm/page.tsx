"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Plus, Play, Pause, Volume2, RotateCcw, Check } from "lucide-react";

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

// ─── Audio Sources ─────────────────────────────────────────────────────────────
const ADHAN_SOUNDS = [
  { id: "adhan_makkah", label: "Adhan – Makkah", url: "https://cdn.islamic.network/quran/recitations/v3/recitations.json" },
  { id: "adhan_madinah", label: "Adhan – Madinah", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "adhan_egypt", label: "Adhan – Egypt", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "adhan_alaqsa", label: "Adhan – Al-Aqsa", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

const SURAHS = [
  { id: "mulk", name: "Surah Al-Mulk", arabic: "سورة الملك", url: "https://download.quranic.audio/quran/ar-alafasy/067.mp3" },
  { id: "rahman", name: "Surah Ar-Rahman", arabic: "سورة الرحمن", url: "https://download.quranic.audio/quran/ar-alafasy/055.mp3" },
  { id: "sajdah", name: "Surah As-Sajdah", arabic: "سورة السجدة", url: "https://download.quranic.audio/quran/ar-alafasy/032.mp3" },
  { id: "waqiah", name: "Surah Al-Waqi'ah", arabic: "سورة الواقعة", url: "https://download.quranic.audio/quran/ar-alafasy/056.mp3" },
  { id: "kahf", name: "Surah Al-Kahf", arabic: "سورة الكهف", url: "https://download.quranic.audio/quran/ar-alafasy/018.mp3" },
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

  // ─── Load from localStorage ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const a = localStorage.getItem("ialarms");
      if (a) setAlarms(JSON.parse(a));
      const d = localStorage.getItem("idhikr");
      if (d) setDhikrCounts(JSON.parse(d));
      const sl = localStorage.getItem("isleep");
      if (sl) setSleepChecked(JSON.parse(sl));
      const wl = localStorage.getItem("iwake");
      if (wl) setWakeChecked(JSON.parse(wl));
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
          const city = [gd.address.city || gd.address.town || gd.address.village || "", gd.address.country || ""]
            .filter(Boolean)
            .join(", ");
          fetchPrayers(lat, lon, city);
        } catch {
          fetchPrayers(lat, lon);
        }
      },
      async () => {
        try {
          const r = await fetch("https://ipapi.co/json/");
          const d = await r.json();
          fetchPrayers(d.latitude, d.longitude, `${d.city}, ${d.country_name}`);
        } catch {
          setLocationName("Location unavailable");
        }
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
    setFiringAlarm(alarm);
    setAlarmFiring(true);
    const sound = ADHAN_SOUNDS.find((s) => s.id === alarm.sound) || ADHAN_SOUNDS[0];

    const audio = new Audio();
    audio.loop = true;
    audio.volume = 1;
    audio.crossOrigin = "anonymous";

    const playAudio = () => {
      audio.src = sound.url;
      audio
        .play()
        .then(() => {
          firingAudioRef.current = audio;
        })
        .catch((err) => {
          console.error("Alarm play error:", err);
          toast.error("Could not play alarm sound. Please check audio settings.");
        });
    };

    playAudio();
    const resumeOnClick = () => {
      if (!firingAudioRef.current) {
        playAudio();
      }
      window.removeEventListener("click", resumeOnClick);
    };
    window.addEventListener("click", resumeOnClick);
  }, []);

  const dismissAlarm = () => {
    if (firingAudioRef.current) {
      firingAudioRef.current.pause();
      firingAudioRef.current.src = "";
      firingAudioRef.current = null;
    }
    setAlarmFiring(false);
    setFiringAlarm(null);
    toast.success("Alarm dismissed. Have a blessed day!");
  };

  // ─── Alarm form helpers ──────────────────────────────────────────────────────
  const getAlarmMin = (): number => {
    if (alarmType === "custom") {
      const h = (pickH % 12) + (pickAmpm === "PM" ? 12 : 0);
      return h * 60 + pickM;
    }
    if (alarmType === "fajr" && prayerTimes) return toMin(prayerTimes.Fajr) - mbf;
    if (alarmType === "tahajjud" && prayerTimes) return toMin(calcTahajjud(prayerTimes.Isha, prayerTimes.Fajr));
    return 0;
  };

  const addAlarm = () => {
    if ((alarmType === "fajr" || alarmType === "tahajjud") && !prayerTimes) {
      toast.error("Prayer times not loaded yet. Please use Custom time or wait.");
      return;
    }
    const min = getAlarmMin();
    const label =
      alarmLabel ||
      (alarmType === "custom"
        ? `${fmt12(fromMin(min))}`
        : alarmType === "fajr"
          ? `Fajr (${fmt12(fromMin(min))})`
          : `Tahajjud (${fmt12(fromMin(min))})`);

    const newAlarm: Alarm = {
      id: Date.now(),
      time24: fromMin(min),
      label,
      sound: selectedSound,
      enabled: true,
      type: alarmType,
    };

    setAlarms([...alarms, newAlarm]);
    setAlarmLabel("");
    toast.success(`Alarm set for ${label}`);
  };

  const deleteAlarm = (id: number) => {
    setAlarms(alarms.filter((a) => a.id !== id));
    toast.success("Alarm deleted");
  };

  const toggleAlarm = (id: number) => {
    setAlarms(alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  // ─── Night player ────────────────────────────────────────────────────────────
  const playNightSurahs = () => {
    if (selectedSurahs.length === 0) {
      toast.error("Please select at least one Surah");
      return;
    }

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = 0.8;

    nightStateRef.current = { idx: 0, rep: 0, playing: true };
    setNightPlaying(true);

    const playNext = () => {
      const idx = nightStateRef.current.idx;
      const rep = nightStateRef.current.rep;

      if (rep >= repeatCount) {
        setNightPlaying(false);
        nightStateRef.current.playing = false;
        toast.success("Night Surahs completed");
        return;
      }

      if (idx >= selectedSurahs.length) {
        nightStateRef.current.idx = 0;
        nightStateRef.current.rep += 1;
        playNext();
        return;
      }

      const surahId = selectedSurahs[idx];
      const surah = SURAHS.find((s) => s.id === surahId);
      if (!surah) return;

      setNpTitle(`${surah.name} (${rep + 1}/${repeatCount})`);
      audio.src = surah.url;

      audio.onended = () => {
        nightStateRef.current.idx += 1;
        playNext();
      };

      audio.onerror = () => {
        console.error("Error loading Surah audio");
        toast.error(`Could not load ${surah.name}`);
        nightStateRef.current.idx += 1;
        playNext();
      };

      audio
        .play()
        .catch((err) => {
          console.error("Surah play error:", err);
          toast.error("Could not play Surah. Please check audio settings.");
        });
    };

    nightAudioRef.current = audio;
    playNext();
  };

  const pauseNightSurahs = () => {
    if (nightAudioRef.current) {
      nightAudioRef.current.pause();
    }
    setNightPlaying(false);
    nightStateRef.current.playing = false;
  };

  const stopNightSurahs = () => {
    if (nightAudioRef.current) {
      nightAudioRef.current.pause();
      nightAudioRef.current.src = "";
    }
    setNightPlaying(false);
    setNpTitle("");
    nightStateRef.current = { idx: 0, rep: 0, playing: false };
  };

  // ─── Dhikr helpers ───────────────────────────────────────────────────────────
  const incrementDhikr = (idx: number) => {
    const current = dhikrCounts[idx] || 0;
    const target = DHIKR[idx].target;
    if (current < target) {
      const updated = { ...dhikrCounts, [idx]: current + 1 };
      setDhikrCounts(updated);
      localStorage.setItem("idhikr", JSON.stringify(updated));
    }
  };

  const resetDhikr = (idx: number) => {
    const updated = { ...dhikrCounts, [idx]: 0 };
    setDhikrCounts(updated);
    localStorage.setItem("idhikr", JSON.stringify(updated));
  };

  // ─── Checklist helpers ───────────────────────────────────────────────────────
  const toggleSleepCheck = (id: string) => {
    const updated = sleepChecked.includes(id) ? sleepChecked.filter((x) => x !== id) : [...sleepChecked, id];
    setSleepChecked(updated);
    localStorage.setItem("isleep", JSON.stringify(updated));
  };

  const toggleWakeCheck = (id: string) => {
    const updated = wakeChecked.includes(id) ? wakeChecked.filter((x) => x !== id) : [...wakeChecked, id];
    setWakeChecked(updated);
    localStorage.setItem("iwake", JSON.stringify(updated));
  };

  const resetSleepList = () => {
    setSleepChecked([]);
    localStorage.setItem("isleep", JSON.stringify([]));
  };

  const resetWakeList = () => {
    setWakeChecked([]);
    localStorage.setItem("iwake", JSON.stringify([]));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  const currentTime = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Alarm Modal */}
      <Dialog open={alarmFiring} onOpenChange={() => {}}>
        <DialogContent className="max-w-md border-0 bg-gradient-to-b from-amber-900 to-slate-900 text-center">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-amber-200">ALARM!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <p className="text-2xl font-semibold text-white">{firingAlarm?.label}</p>
            <p className="text-lg text-amber-100">{currentTime}</p>
            <Button onClick={dismissAlarm} size="lg" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
              Dismiss Alarm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Container */}
      <div className="container mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Islamic Alarm Pro</h1>
          <p className="text-amber-200 text-lg font-semibold">{currentTime}</p>
          <p className="text-slate-400 text-sm mt-2">{hijriDate}</p>
          <p className="text-slate-400 text-sm">{locationName}</p>
        </div>

        {/* Prayer Times */}
        {prayerTimes && (
          <Card className="mb-6 bg-slate-800 border-slate-700 p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-400">Fajr</p>
                <p className="text-sm font-semibold text-amber-200">{fmt12(prayerTimes.Fajr)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Dhuhr</p>
                <p className="text-sm font-semibold text-amber-200">{fmt12(prayerTimes.Dhuhr)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Asr</p>
                <p className="text-sm font-semibold text-amber-200">{fmt12(prayerTimes.Asr)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Maghrib</p>
                <p className="text-sm font-semibold text-amber-200">{fmt12(prayerTimes.Maghrib)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Isha</p>
                <p className="text-sm font-semibold text-amber-200">{fmt12(prayerTimes.Isha)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Sunrise</p>
                <p className="text-sm font-semibold text-amber-200">{fmt12(prayerTimes.Sunrise)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="alarm" className="text-xs">
              Alarms
            </TabsTrigger>
            <TabsTrigger value="night" className="text-xs">
              Night
            </TabsTrigger>
            <TabsTrigger value="duas" className="text-xs">
              Duas
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs">
              Lists
            </TabsTrigger>
          </TabsList>

          {/* Alarms Tab */}
          <TabsContent value="alarm" className="space-y-4 mt-4">
            <Card className="bg-slate-800 border-slate-700 p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Type</label>
                  <Select value={alarmType} onValueChange={(v) => setAlarmType(v as any)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="custom">Custom Time</SelectItem>
                      <SelectItem value="fajr">Fajr Prayer</SelectItem>
                      <SelectItem value="tahajjud">Tahajjud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {alarmType === "custom" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Hour</label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={pickH}
                        onChange={(e) => setPickH(Number(e.target.value))}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Min</label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={pickM}
                        onChange={(e) => setPickM(Number(e.target.value))}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">AM/PM</label>
                      <Select value={pickAmpm} onValueChange={(v) => setPickAmpm(v as any)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {alarmType === "fajr" && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Minutes before Fajr</label>
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      value={mbf}
                      onChange={(e) => setMbf(Number(e.target.value))}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Sound</label>
                  <Select value={selectedSound} onValueChange={setSelectedSound}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {ADHAN_SOUNDS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Label (optional)</label>
                  <Input
                    placeholder="e.g., Fajr Alarm"
                    value={alarmLabel}
                    onChange={(e) => setAlarmLabel(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <Button onClick={addAlarm} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Alarm
                </Button>
              </div>
            </Card>

            {/* Alarms List */}
            <div className="space-y-2">
              {alarms.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No alarms set</p>
              ) : (
                alarms.map((a) => (
                  <Card key={a.id} className="bg-slate-800 border-slate-700 p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{a.label}</p>
                      <p className="text-xs text-slate-400">{ADHAN_SOUNDS.find((s) => s.id === a.sound)?.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={a.enabled} onCheckedChange={() => toggleAlarm(a.id)} />
                      <Button size="sm" variant="ghost" onClick={() => deleteAlarm(a.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Night Surahs Tab */}
          <TabsContent value="night" className="space-y-4 mt-4">
            <Card className="bg-slate-800 border-slate-700 p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-2">Select Surahs</label>
                <div className="space-y-2">
                  {SURAHS.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={s.id}
                        checked={selectedSurahs.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSurahs([...selectedSurahs, s.id]);
                          } else {
                            setSelectedSurahs(selectedSurahs.filter((x) => x !== s.id));
                          }
                        }}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                      />
                      <label htmlFor={s.id} className="text-sm text-white cursor-pointer flex-1">
                        {s.name} <span className="text-slate-400">{s.arabic}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Repeat</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(Number(e.target.value))}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              {npTitle && (
                <div className="bg-slate-700 p-3 rounded text-center">
                  <p className="text-amber-200 font-semibold">{npTitle}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!nightPlaying ? (
                  <Button onClick={playNightSurahs} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold">
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Button>
                ) : (
                  <Button onClick={pauseNightSurahs} className="flex-1 bg-orange-500 hover:bg-orange-600 text-black font-bold">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={stopNightSurahs} variant="outline" className="flex-1 border-slate-600">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Duas Tab */}
          <TabsContent value="duas" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-bold text-amber-200 mb-3">Morning Duas</h3>
                {MORNING_DUAS.map((d, i) => (
                  <Card key={i} className="bg-slate-800 border-slate-700 p-4 mb-3">
                    <p className="text-xs text-amber-300 font-bold mb-2">{d.title}</p>
                    <p className="text-lg text-amber-100 font-semibold mb-2 text-right" dir="rtl">
                      {d.arabic}
                    </p>
                    <p className="text-sm text-blue-300 italic mb-2">{d.roman}</p>
                    <p className="text-sm text-slate-300 mb-1">{d.english}</p>
                    <p className="text-xs text-slate-500">{d.ref}</p>
                  </Card>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-bold text-amber-200 mb-3">Sleep Duas</h3>
                {SLEEP_DUAS.map((d, i) => (
                  <Card key={i} className="bg-slate-800 border-slate-700 p-4 mb-3">
                    <p className="text-xs text-amber-300 font-bold mb-2">{d.title}</p>
                    <p className="text-lg text-amber-100 font-semibold mb-2 text-right" dir="rtl">
                      {d.arabic}
                    </p>
                    <p className="text-sm text-blue-300 italic mb-2">{d.roman}</p>
                    <p className="text-sm text-slate-300 mb-1">{d.english}</p>
                    <p className="text-xs text-slate-500">{d.ref}</p>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Lists Tab */}
          <TabsContent value="list" className="space-y-4 mt-4">
            <div className="space-y-6">
              {/* Sleep Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-amber-200">Sleep Checklist</h3>
                  <Button size="sm" variant="outline" onClick={resetSleepList} className="text-xs">
                    Reset
                  </Button>
                </div>
                <div className="space-y-2">
                  {SLEEP_LIST.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleSleepCheck(item.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        sleepChecked.includes(item.id)
                          ? "bg-green-900 border border-green-600"
                          : "bg-slate-800 border border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {sleepChecked.includes(item.id) && <Check className="w-4 h-4 text-green-400" />}
                        <div>
                          <p className={`text-sm font-medium ${sleepChecked.includes(item.id) ? "text-green-200 line-through" : "text-white"}`}>
                            {item.text}
                          </p>
                          <p className="text-xs text-slate-400">{item.arabic}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wake Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-amber-200">Wake Checklist</h3>
                  <Button size="sm" variant="outline" onClick={resetWakeList} className="text-xs">
                    Reset
                  </Button>
                </div>
                <div className="space-y-2">
                  {WAKE_LIST.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleWakeCheck(item.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        wakeChecked.includes(item.id)
                          ? "bg-green-900 border border-green-600"
                          : "bg-slate-800 border border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {wakeChecked.includes(item.id) && <Check className="w-4 h-4 text-green-400" />}
                        <div>
                          <p className={`text-sm font-medium ${wakeChecked.includes(item.id) ? "text-green-200 line-through" : "text-white"}`}>
                            {item.text}
                          </p>
                          <p className="text-xs text-slate-400">{item.arabic}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dhikr Counter */}
              <div>
                <h3 className="text-lg font-bold text-amber-200 mb-3">Dhikr Counter</h3>
                <div className="space-y-2">
                  {DHIKR.map((d, i) => {
                    const count = dhikrCounts[i] || 0;
                    const progress = (count / d.target) * 100;
                    return (
                      <div
                        key={i}
                        onClick={() => incrementDhikr(i)}
                        className="p-3 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer hover:border-amber-500 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-amber-100">{d.name}</p>
                            <p className="text-xs text-slate-400">{d.arabic}</p>
                            <p className="text-xs text-slate-500">{d.meaning}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-amber-200">{count}</p>
                            <p className="text-xs text-slate-400">/{d.target}</p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        {count >= d.target && <p className="text-xs text-green-400 mt-1">✓ Completed!</p>}
                        {count > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              resetDhikr(i);
                            }}
                            className="text-xs mt-2"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
