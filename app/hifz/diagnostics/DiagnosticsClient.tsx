'use client';

/**
 * app/hifz/diagnostics/DiagnosticsClient.tsx — internal microphone
 * diagnostics for the recitation coach (route /hifz/diagnostics).
 *
 * WHY THIS EXISTS (2026-11-22 "no voice" bug): the coach's old "We didn't
 * hear anything" message conflated two different failures — the mic
 * capturing nothing, and the tracker following no word. This page tests
 * them SEPARATELY, with real measurements and no fake data:
 *
 *  1. MICROPHONE CAPTURE (getUserMedia + Web Audio, no recognition):
 *     permission, input devices, stream state, live dBFS level from an
 *     AnalyserNode, a live waveform from getFloatTimeDomainData, and the
 *     coach's adaptive VAD (app/hifz/lib/vad.ts) saying whether speech
 *     is present in the audio. The AudioContext is created synchronously
 *     in the tap, before any await — creating it after an await left it
 *     suspended on iOS Safari (Stage 3 fix).
 *  2. SPEECH RECOGNITION (the real Tilawa on-device engine, same adapter
 *     and same tap-time mic preparation as the coach): model load, live
 *     tracker state, and the per-word result of reciting Al-Fatihah 1:1.
 *
 * RULE: if audio is received but recognition cannot understand it, this
 * page NEVER says "No voice detected" — it says "Voice detected, but
 * Arabic recognition is unavailable" (or "...could not follow the words").
 * Everything is free, on-device, no accounts. All tests are
 * user-initiated (no mic prompt on load); everything is stopped on
 * unmount. Quran text for the engine test is fetched at runtime from the
 * same /api/quran proxy the coach uses — no verse text is pasted in here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { API } from '../../quran/lib';
import {
  AUDIBLE_DBFS,
  engineSupport,
  loadEngine,
  type EngineLoadProgress,
  type PreparedMicCapture,
  type RecitationEngine,
  type RecitationSession,
  type SessionResult,
} from '../lib/tilawa';
import { AdaptiveVad } from '../lib/vad';
import { useT } from '../lib/i18n';

/* ------------------------------------------------------------------ */
/*  VAD — the coach's display VAD (app/hifz/lib/vad.ts), shared here  */
/*  so the diagnostics verdict matches what the coach itself shows.   */
/*  NOTE: Tilawa's own energy VAD is OFF in the coach (DEFAULTS.vad =  */
/*  false) — every frame reaches the model, so quiet speech is never   */
/*  dropped before recognition. This VAD is display-only: it says      */
/*  whether speech is present in the audio, it never gates anything.  */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PermissionState = 'not-requested' | 'granted' | 'denied' | 'prompt' | 'unknown';
type EngineState = 'idle' | 'loading' | 'ready' | 'failed' | 'unsupported' | 'listening';

interface Capabilities {
  secureContext: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  hasAudioContext: boolean;
  hasEnumerateDevices: boolean;
}

function readCapabilities(): Capabilities {
  if (typeof window === 'undefined') {
    return {
      secureContext: false,
      hasMediaDevices: false,
      hasGetUserMedia: false,
      hasAudioContext: false,
      hasEnumerateDevices: false,
    };
  }
  const md = navigator.mediaDevices;
  return {
    secureContext: window.isSecureContext,
    hasMediaDevices: !!md,
    hasGetUserMedia: !!md?.getUserMedia,
    hasAudioContext: typeof window.AudioContext !== 'undefined' ||
      typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !== 'undefined',
    hasEnumerateDevices: typeof md?.enumerateDevices === 'function',
  };
}

function audioContextCtor(): typeof AudioContext | null {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Same constraints Tilawa listens with: raw mic, no processing. */
const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
};

function dbfs(rms: number): number {
  return 10 * Math.log10(rms * rms + 1e-12);
}

function fmtDb(db: number | null): string {
  return db === null ? '—' : `${db.toFixed(1)} dBFS`;
}

function Pill({ ok, warn, children }: { ok?: boolean; warn?: boolean; children: React.ReactNode }) {
  const cls = ok
    ? 'bg-[#E4FFF2] text-[#102E26] border-[#1FA36B]/40'
    : warn
      ? 'bg-[#FFFBF2] text-[#102E26] border-[#FFB800]'
      : 'bg-[#FDECEC] text-[#7A1F1F] border-[#DC2626]/40';
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DiagnosticsClient() {
  const t = useT();
  /* Capabilities are read AFTER mount: readCapabilities() returns
     different values on the server (no window) and the client, so
     rendering them during SSR produced a React hydration error (#418)
     on this page. Start with the SSR-safe all-false set, then fill in
     the real values once mounted — first paint matches the server. */
  const [caps, setCaps] = useState<Capabilities>({
    secureContext: false,
    hasMediaDevices: false,
    hasGetUserMedia: false,
    hasAudioContext: false,
    hasEnumerateDevices: false,
  });
  useEffect(() => {
    // Intentional post-mount sync: reading browser capabilities during
    // render would differ between server and client (hydration error
    // #418). The effect runs once after hydration, when it is safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaps(readCapabilities());
  }, []);

  /* ---- microphone capture test ---- */
  const [permission, setPermission] = useState<PermissionState>('not-requested');
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [deviceLabels, setDeviceLabels] = useState<string[]>([]);
  const [streamActive, setStreamActive] = useState(false);
  const [trackInfo, setTrackInfo] = useState<string>('—');
  const [ctxState, setCtxState] = useState<string>('—');
  const [sampleRate, setSampleRate] = useState<number | null>(null);
  const [levelDb, setLevelDb] = useState<number | null>(null);
  const [peakDb, setPeakDb] = useState<number>(-120);
  const [spreadDb, setSpreadDb] = useState<number>(0);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [vadSpeaking, setVadSpeaking] = useState(false);
  const [micRunning, setMicRunning] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [framesSeen, setFramesSeen] = useState(0);
  // Track liveness: a track that ends or mutes itself mid-test (iOS
  // route change, another app taking the mic, OS mute) is a capture
  // failure the level meter alone cannot show — a muted track still
  // delivers frames, all at digital silence.
  const [trackMuted, setTrackMuted] = useState(false);
  const [trackEnded, setTrackEnded] = useState(false);
  // True when the AudioContext is still suspended after resume() — on
  // iOS Safari this is the signature of a context created outside the
  // user gesture. The analyser then delivers nothing, whatever the mic
  // does, and the test must say so instead of reporting flat levels.
  const [ctxSuspended, setCtxSuspended] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vadRef = useRef<AdaptiveVad | null>(null);
  const statsRef = useRef({ min: Infinity, max: -Infinity, peak: -120, frames: 0, lastUiAt: 0 });

  /* ---- recognition engine test ---- */
  const [engineState, setEngineState] = useState<EngineState>('idle');
  const [engineProgress, setEngineProgress] = useState<EngineLoadProgress | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [engineInfo, setEngineInfo] = useState<string | null>(null);
  const [engineLive, setEngineLive] = useState<string | null>(null);
  const [engineResult, setEngineResult] = useState<SessionResult | null>(null);
  const engineRef = useRef<RecitationEngine | null>(null);
  const engineSessionRef = useRef<RecitationSession | null>(null);
  const engineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- stop everything (shared by Stop buttons + unmount) ---- */
  const stopMicTest = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current) {
      void ctxRef.current.close().catch(() => undefined);
      ctxRef.current = null;
    }
    setStreamActive(false);
    setMicRunning(false);
    setVadSpeaking(false);
    setTrackMuted(false);
    setTrackEnded(false);
    setCtxSuspended(false);
  }, []);

  const stopEngineTest = useCallback(async () => {
    if (engineTimerRef.current) {
      clearInterval(engineTimerRef.current);
      engineTimerRef.current = null;
    }
    const session = engineSessionRef.current;
    engineSessionRef.current = null;
    if (session) {
      try {
        const res = await session.stop();
        setEngineResult(res);
      } catch {
        /* session already ended — keep whatever result we have */
      }
    }
    setEngineState(engineRef.current ? 'ready' : 'idle');
    setEngineLive(null);
  }, []);

  useEffect(
    () => () => {
      stopMicTest();
      if (engineTimerRef.current) clearInterval(engineTimerRef.current);
      engineSessionRef.current?.dispose();
      engineSessionRef.current = null;
    },
    [stopMicTest],
  );

  /* While the mic test runs, refresh the input list when devices change
     (headset plugged in, Bluetooth mic connected, mic unplugged) so a
     route change mid-test is visible instead of silently killing the
     input. */
  useEffect(() => {
    if (!micRunning) return;
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    const onChange = async () => {
      try {
        const devices = await md.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === 'audioinput');
        setDeviceCount(inputs.length);
        setDeviceLabels(inputs.map((d, i) => d.label || `Microphone ${i + 1}`));
      } catch {
        /* keep the last list */
      }
    };
    md.addEventListener('devicechange', onChange);
    return () => md.removeEventListener('devicechange', onChange);
  }, [micRunning]);

  /* ---------------- microphone capture test ---------------- */

  const runMicTest = useCallback(async () => {
    if (micRunning) return;
    setMicError(null);
    setVoiceDetected(false);
    setVadSpeaking(false);
    setTrackMuted(false);
    setTrackEnded(false);
    setCtxSuspended(false);
    setLevelDb(null);
    setPeakDb(-120);
    setSpreadDb(0);
    setFramesSeen(0);
    statsRef.current = { min: Infinity, max: -Infinity, peak: -120, frames: 0, lastUiAt: 0 };
    vadRef.current = new AdaptiveVad();

    // 0. Create the AudioContext SYNCHRONOUSLY in this tap, BEFORE any
    // await. The old code awaited the Permissions API query first and
    // only then created the context — outside the user gesture — so on
    // iOS Safari the context could start (and stay) `suspended` and the
    // analyser delivered nothing: the test reported a flat mic on a
    // working phone. This is the same bug class the coach fix (commit
    // 27e0ca6) addressed; the diagnostics page still had it.
    const Ctor = audioContextCtor();
    if (!navigator.mediaDevices?.getUserMedia || !Ctor) {
      setMicError(t('diag.micNoApi'));
      return;
    }
    const ctx = new Ctor();
    void ctx.resume().catch(() => undefined);

    // 1. Permission state (best effort — the Permissions API is absent
    // in some browsers, and Safari reports 'prompt' until asked).
    try {
      const perms = navigator.permissions;
      if (perms?.query) {
        const status = await perms.query({ name: 'microphone' as PermissionName });
        setPermission(status.state as PermissionState);
      } else {
        setPermission('unknown');
      }
    } catch {
      setPermission('unknown');
    }

    // 2. Open the mic (same constraints as the coach).
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
    } catch (err) {
      // The context created above is no longer needed — close it so a
      // denied test does not leave a live AudioContext behind.
      void ctx.close().catch(() => undefined);
      const name = (err as { name?: string })?.name ?? '';
      setPermission(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unknown');
      setMicError(
        name === 'NotAllowedError'
          ? t('diag.micDenied')
          : name === 'NotFoundError'
            ? t('diag.micNotFound')
            : t('diag.micOpenFail').replace('{err}', name || 'unknown error'),
      );
      return;
    }
    setPermission('granted');
    const track = stream.getAudioTracks()[0];
    if (track) {
      const settings = track.getSettings();
      setTrackInfo(
        `readyState=${track.readyState} · muted=${track.muted ? 'yes' : 'no'} · enabled=${track.enabled ? 'yes' : 'no'}` +
          (settings.deviceId ? ` · device=${settings.deviceId.slice(0, 8)}…` : '') +
          (settings.sampleRate ? ` · ${settings.sampleRate} Hz` : ''),
      );
      // A track that mutes or ends itself mid-test (iOS route change,
      // another app taking the mic) kills capture without any error —
      // surface it instead of letting the meter go flat unexplained.
      setTrackMuted(track.muted);
      track.onmute = () => setTrackMuted(true);
      track.onunmute = () => setTrackMuted(false);
      track.onended = () => setTrackEnded(true);
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === 'audioinput');
      setDeviceCount(inputs.length);
      setDeviceLabels(inputs.map((d, i) => d.label || `Microphone ${i + 1}`));
    } catch {
      setDeviceCount(null);
    }

    // The context was created in the tap; if it is STILL suspended after
    // resume(), the browser refused to start it (gesture / interruption)
    // and the analyser will deliver nothing. Say so explicitly.
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => undefined);
    }
    setCtxState(ctx.state);
    setCtxSuspended(ctx.state === 'suspended');
    setSampleRate(ctx.sampleRate);
    streamRef.current = stream;
    ctxRef.current = ctx;
    setStreamActive(true);
    setMicRunning(true);

    // 3. Live level + waveform from a real AnalyserNode. Nothing here is
    // simulated: every number and every bar comes from the mic.
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    let lastAt = performance.now();
    const loop = () => {
      const now = performance.now();
      const dtMs = Math.max(1, now - lastAt);
      lastAt = now;
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      const db = dbfs(rms);
      const s = statsRef.current;
      s.frames++;
      if (db > s.peak) s.peak = db;
      if (db < s.min) s.min = db;
      if (db > s.max) s.max = db;
      const speaking = vadRef.current?.push(db, dtMs).speaking ?? false;
      if (speaking) setVoiceDetected(true);
      // Draw the real waveform.
      const canvas = canvasRef.current;
      const c2d = canvas?.getContext('2d');
      if (canvas && c2d) {
        const w = canvas.width;
        const h = canvas.height;
        c2d.clearRect(0, 0, w, h);
        c2d.strokeStyle = '#1FA36B';
        c2d.lineWidth = 1.5;
        c2d.beginPath();
        const step = Math.max(1, Math.floor(buf.length / w));
        for (let x = 0; x < w; x++) {
          const v = buf[x * step] ?? 0;
          const y = h / 2 - v * (h / 2) * 0.95;
          if (x === 0) c2d.moveTo(x, y);
          else c2d.lineTo(x, y);
        }
        c2d.stroke();
      }
      // Throttle React state (numbers ~7x/sec); the canvas stays live.
      if (now - s.lastUiAt > 150) {
        s.lastUiAt = now;
        setLevelDb(db);
        setPeakDb(s.peak);
        setSpreadDb(s.max === -Infinity ? 0 : s.max - s.min);
        setFramesSeen(s.frames);
        setVadSpeaking(speaking);
        setCtxState(ctx.state);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [micRunning]);

  /* ---------------- recognition engine test ---------------- */

  const loadEngineTest = useCallback(async () => {
    if (engineRef.current || engineState === 'loading') return;
    const support = engineSupport();
    if (!support.supported) {
      setEngineState('unsupported');
      setEngineError(
        support.reason === 'insecure-context'
          ? t('diag.engineInsecure')
          : support.reason === 'no-cache-api'
            ? t('diag.engineNoCache')
            : t('diag.engineNoWasm'),
      );
      return;
    }
    setEngineState('loading');
    setEngineError(null);
    setEngineProgress(null);
    try {
      const engine = await loadEngine({
        tier: 'lite',
        onProgress: (p) => setEngineProgress(p),
      });
      engineRef.current = engine;
      setEngineInfo(t('diag.modelInfo').replace('{model}', engine.modelId).replace('{tier}', engine.tier));
      setEngineState('ready');
    } catch {
      setEngineState('failed');
      setEngineError(t('diag.engineDownloadFail'));
    }
  }, [engineState]);

  const startEngineTest = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || engineSessionRef.current) return;
    setEngineError(null);
    setEngineResult(null);
    setEngineLive(null);
    // Prepare the mic FIRST, synchronously in this tap, exactly like
    // the coach. The old code fetched the verse text first and only
    // then prepared the mic — the fetch await left the user gesture,
    // so on iOS Safari the context could be created outside it and stay
    // suspended: the engine test failed on a phone where the coach
    // worked. The prepared capture stays live while the verse loads.
    let prepared: PreparedMicCapture | null = null;
    try {
      prepared = engine.prepareMicrophone();
    } catch (err) {
      const reason = (err as { reason?: string })?.reason;
      setEngineError(
        reason === 'denied'
          ? 'Microphone permission was denied for the engine test.'
          : 'No microphone is available on this device for the engine test.',
      );
      return;
    }
    // Fetch the verse text at runtime (same proxy as the coach) — no
    // Quran text is pasted into this file.
    let text = '';
    try {
      const res = await fetch(`${API}/verses/by_key/1:1?fields=text_indopak`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { verse?: { text_indopak?: string } } = await res.json();
      text = data.verse?.text_indopak ?? '';
      if (!text) throw new Error('empty verse text');
    } catch {
      // The prepared mic is no longer needed — release it so the test
      // does not leave a live AudioContext and mic stream behind.
      prepared.release();
      setEngineError('Could not load the test verse (Al-Fatihah 1:1) — check the connection and try again.');
      return;
    }
    const session = engine.startSession({
      surah: 1,
      fromAyah: 1,
      toAyah: 1,
      expected: [{ surah: 1, ayah: 1, text }],
      onTrackerState: (s) => setEngineLive((prev) => (prev?.startsWith('Tracker:') ? prev : `Tracker: ${s}`)),
    });
    engineSessionRef.current = session;
    try {
      await session.startMic(prepared);
    } catch (err) {
      engineSessionRef.current = null;
      session.dispose();
      const reason = (err as { reason?: string })?.reason;
      setEngineError(
        reason === 'denied'
          ? 'Microphone permission was denied for the engine test.'
          : 'The engine could not open the microphone on this device.',
      );
      return;
    }
    setEngineState('listening');
    setEngineLive(t('diag.engineListening'));
    engineTimerRef.current = setInterval(() => {
      const h = engineSessionRef.current?.getAudioHealth();
      if (!h) return;
      setEngineLive(
        t('diag.engineLive')
          .replace('{cb}', String(h.levelCallbacks))
          .replace('{db}', h.maxLevelDb.toFixed(0))
          .replace('{ev}', String(h.positionEvents))
          .replace('{locked}', h.everLocked ? t('diag.locked') : t('diag.notLockedYet'))
          .replace('{heard}', h.everAudible ? t('diag.voiceHeard') : t('diag.noVoiceYet')),
      );
    }, 500);
  }, []);

  /* ---------------- verdicts ---------------- */

  const micHeardSound = peakDb > AUDIBLE_DBFS;
  const audioProcessing: 'Working' | 'Failed' | 'Not tested yet' =
    framesSeen === 0 ? 'Not tested yet' : trackEnded ? 'Failed' : streamActive || peakDb > -110 ? 'Working' : 'Failed';
  const engineVerdict: string =
    engineState === 'ready' || engineState === 'listening'
      ? 'Available'
      : engineState === 'failed' || engineState === 'unsupported'
        ? 'Unsupported'
        : 'Not tested yet';

  return (
    <div className="space-y-6">
      {/* ---------- summary ---------- */}
      <section aria-label={t('diag.resultsSummary')} className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#102E26]">{t('diag.results')}</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-semibold">{t('diag.micPermission')}</dt>
            <dd>
              {permission === 'granted' ? <Pill ok>{t('diag.granted')}</Pill>
                : permission === 'denied' ? <Pill>{t('diag.denied')}</Pill>
                : permission === 'prompt' ? <Pill warn>{t('diag.prompt')}</Pill>
                : permission === 'unknown' ? <Pill warn>{t('diag.unknown')}</Pill>
                : <Pill warn>{t('diag.notRequested')}</Pill>}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-semibold">{t('diag.audioInput')}</dt>
            <dd>
              {deviceCount === null ? <Pill warn>{t('diag.notChecked')}</Pill>
                : deviceCount > 0 ? <Pill ok>Connected — {deviceCount} input{deviceCount === 1 ? '' : 's'}</Pill>
                : <Pill>{t('diag.notConnected')}</Pill>}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-semibold">{t('diag.audioStream')}</dt>
            <dd>{streamActive ? <Pill ok>{t('diag.active')}</Pill> : <Pill warn>{t('diag.inactive')}</Pill>}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-semibold">{t('diag.audioLevel')}</dt>
            <dd className="font-mono font-bold">{fmtDb(levelDb)}{levelDb !== null ? ` (${t('diag.peakLabel').replace('{db}', fmtDb(peakDb))})` : ''}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-semibold">{t('diag.voiceDetection')}</dt>
            <dd>{voiceDetected ? <Pill ok>{t('diag.detected')}</Pill> : <Pill warn>{t('diag.notDetected')}</Pill>}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-semibold">{t('diag.levelsChanging')}</dt>
            <dd>
              {framesSeen === 0 ? <Pill warn>{t('diag.notChecked')}</Pill>
                : spreadDb > 10 ? <Pill ok>{t('diag.levelsYes')}</Pill>
                : <Pill warn>{t('diag.levelsNo')}</Pill>}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-semibold">{t('diag.silentInput')}</dt>
            <dd>
              {framesSeen === 0 ? <Pill warn>{t('diag.notChecked')}</Pill>
                : framesSeen > 50 && peakDb <= -110 ? <Pill>{t('diag.silentYes')}</Pill>
                : <Pill ok>{t('diag.silentNo')}</Pill>}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-semibold">{t('diag.recognitionEngine')}</dt>
            <dd>
              {engineVerdict === 'Available' ? <Pill ok>{t('diag.available')}</Pill>
                : engineVerdict === 'Unsupported' ? <Pill>{t('diag.unsupported')}</Pill>
                : <Pill warn>{t('diag.notChecked')}</Pill>}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="font-semibold">{t('diag.audioProcessing')}</dt>
            <dd>
              {audioProcessing === 'Working' ? <Pill ok>{t('diag.working')}</Pill>
                : audioProcessing === 'Failed' ? <Pill>{t('diag.failed')}</Pill>
                : <Pill warn>{t('diag.notChecked')}</Pill>}
            </dd>
          </div>
        </dl>
        {micHeardSound && (engineState === 'failed' || engineState === 'unsupported') && (
          <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm font-semibold">
            {t('diag.voiceNoRecog')}
          </p>
        )}
        {ctxSuspended && (
          <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm font-semibold">
            {t('diag.ctxSuspended')}
          </p>
        )}
        {trackEnded && (
          <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm font-semibold">
            {t('diag.trackEnded')}
          </p>
        )}
        {trackMuted && !trackEnded && (
          <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm font-semibold">
            {t('diag.trackMuted')}
          </p>
        )}
        {micRunning && !voiceDetected && framesSeen > 100 && (
          <p className="mt-3 text-sm text-[#5b6b62]">
            {t('diag.micOpenNoVoice')}
          </p>
        )}
      </section>

      {/* ---------- browser capabilities ---------- */}
      <section aria-label={t('diag.capabilities')} className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#102E26]">{t('diag.capabilities')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">{t('diag.capabilitiesNote')}</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>{t('diag.secureContext')}: {caps.secureContext ? <Pill ok>{t('diag.yes')}</Pill> : <Pill>{t('diag.noMicBlocked')}</Pill>}</li>
          <li>{t('diag.micApi')}: {caps.hasGetUserMedia ? <Pill ok>{t('diag.yes')}</Pill> : <Pill>{t('diag.no')}</Pill>}</li>
          <li>{t('diag.audioContext')}: {caps.hasAudioContext ? <Pill ok>{t('diag.yes')}</Pill> : <Pill>{t('diag.no')}</Pill>}</li>
          <li>{t('diag.deviceList')}: {caps.hasEnumerateDevices ? <Pill ok>{t('diag.yes')}</Pill> : <Pill warn>{t('diag.no')}</Pill>}</li>
        </ul>
      </section>

      {/* ---------- microphone capture test ---------- */}
      <section aria-label={t('diag.micTest')} className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#102E26]">{t('diag.micTestTitle')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          {t('diag.micTestIntro')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!micRunning ? (
            <button
              type="button"
              onClick={() => void runMicTest()}
              className="rounded-full bg-[#102E26] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {t('diag.runMicTest')}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopMicTest}
              className="rounded-full bg-[#B42318] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]"
            >
              {t('diag.stopTest')}
            </button>
          )}
        </div>
        {micError && <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">{micError}</p>}
        <canvas
          ref={canvasRef}
          width={600}
          height={96}
          aria-label={t('diag.waveformAria')}
          className="mt-4 h-24 w-full rounded-lg bg-[#FFFBF2] border border-[#E5E7EB]"
        />
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{t('diag.levelLive')}</dt><dd className="font-mono font-bold">{fmtDb(levelDb)}</dd></div>
          <div className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{t('diag.peakLevel')}</dt><dd className="font-mono">{fmtDb(peakDb === -120 ? null : peakDb)}</dd></div>
          <div className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{t('diag.levelRange')}</dt><dd className="font-mono">{spreadDb > 0 ? `${spreadDb.toFixed(1)} dB — ${spreadDb > 10 ? t('diag.levelsChangingSpeech') : t('diag.levelsBarely')}` : '—'}</dd></div>
          <div className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{t('diag.vad')}</dt><dd>{vadSpeaking ? <Pill ok>{t('diag.speakingNow')}</Pill> : voiceDetected ? <Pill ok>{t('diag.heardSpeech')}</Pill> : <Pill warn>{t('diag.notDetected')}</Pill>}</dd></div>
          <div className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{t('diag.audioContext')}</dt><dd className="font-mono">{ctxState}{sampleRate ? ` · ${sampleRate} Hz` : ''}</dd></div>
          <div className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{t('diag.micTrack')}</dt><dd className="font-mono">{trackInfo}</dd></div>
          {(trackMuted || trackEnded) && (
            <div className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{t('diag.trackStatus')}</dt><dd>{trackEnded ? <Pill>{t('diag.endedMidTest')}</Pill> : <Pill warn>{t('diag.mutedItself')}</Pill>}</dd></div>
          )}
          {deviceLabels.length > 0 && (
            <div className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{t('diag.inputsFound')}</dt><dd>{deviceLabels.join(', ')}</dd></div>
          )}
          <div className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{t('diag.framesAnalysed')}</dt><dd className="font-mono">{framesSeen}</dd></div>
        </dl>
      </section>

      {/* ---------- recognition engine test ---------- */}
      <section aria-label={t('diag.engineTest')} className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#102E26]">{t('diag.engineTitle')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          {t('diag.engineIntro')}
        </p>
        {engineState === 'idle' && (
          <button
            type="button"
            onClick={() => void loadEngineTest()}
            className="mt-4 rounded-full bg-[#102E26] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
          >
            {t('diag.loadEngine')}
          </button>
        )}
        {engineState === 'loading' && engineProgress && (
          <p role="status" className="mt-4 text-sm font-semibold">
            {t('diag.loadingEngine')} {engineProgress.stage} {Math.round(engineProgress.fraction * 100)}%
            {engineProgress.fromCache ? ` ${t('diag.fromCache')}` : ''}
          </p>
        )}
        {engineError && <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">{engineError}</p>}
        {engineInfo && <p className="mt-3 text-sm text-[#5b6b62]">{engineInfo}</p>}
        {(engineState === 'ready' || engineState === 'listening') && (
          <div className="mt-4 flex flex-wrap gap-2">
            {engineState === 'ready' ? (
              <button
                type="button"
                onClick={() => void startEngineTest()}
                className="rounded-full bg-[#1FA36B] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102E26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
              >
                {t('diag.startEngineTest')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void stopEngineTest()}
                className="rounded-full bg-[#B42318] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]"
              >
                {t('diag.stopEngineTest')}
              </button>
            )}
          </div>
        )}
        {engineLive && <p role="status" className="mt-3 text-sm font-semibold">{engineLive}</p>}
        {engineResult && (
          <div className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">
            <p className="font-semibold">{t('diag.engineResult')}</p>
            <p className="mt-1">
              {t('diag.wordsFollowed').replace('{n}', String(engineResult.reachedCount))} · {t('diag.trackerEvents').replace('{n}', String(engineResult.audioHealth.positionEvents))} ·{' '}
              {engineResult.audioHealth.everLocked ? t('diag.trackerLocked') : t('diag.trackerNeverLocked')} ·{' '}
              {t('diag.micHeardAudio').replace('{v}', engineResult.micHeardAudio ? t('diag.yes') : t('diag.no'))} ·{' '}
              {t('diag.loudestLevel').replace('{db}', engineResult.audioHealth.maxLevelDb.toFixed(0))} ·{' '}
              {(engineResult.durationMs / 1000).toFixed(1)}s
            </p>
            {engineResult.noSpeech && engineResult.micHeardAudio ? (
              <p role="alert" className="mt-2 font-semibold">
                {t('diag.engineNoSpeechHeard')}
              </p>
            ) : engineResult.noSpeech ? (
              <p role="alert" className="mt-2 font-semibold">
                {t('diag.engineNoSound')}
              </p>
            ) : (
              <p className="mt-2 font-semibold">{t('diag.engineWorking')}</p>
            )}
          </div>
        )}
      </section>

      <p className="text-xs text-[#5b6b62]">
        {t('diag.footer')}
      </p>
    </div>
  );
}
