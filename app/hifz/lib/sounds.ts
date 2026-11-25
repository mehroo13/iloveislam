// app/hifz/lib/sounds.ts — feedback sounds + vibration for the Settings
// "Sounds & Haptics" screens (Mistake Feedback, Session Start & Stop,
// Dropped Connection, Testing Mode).
//
// No audio files exist in the app, so the effects are SYNTHESISED with
// the Web Audio API (oscillator envelopes) — every sound the pickers
// list really plays. The names are our own, not Tarteel's ("Bounce" /
// "Hasbuk" are not ours and do not exist here). Each feedback helper
// reads the matching settings and honours its on/off toggles, so a
// caller only decides WHEN the event happened.
//
// Web Audio needs a user gesture at least once before sound is audible;
// every call site (mic start/stop, mistake flag, test answer) follows a
// tap, so the context resumes. `playSoundEffect` returns false when no
// sound could be produced (no AudioContext, still suspended) instead of
// throwing — callers never crash on it.

import { loadSettings } from '../progress';

export type SoundEffectId = 'chime' | 'pop' | 'ding' | 'buzz';

export const SOUND_EFFECTS: { id: SoundEffectId; name: string; blurb: string }[] = [
  { id: 'chime', name: 'Chime', blurb: 'Two soft bell notes' },
  { id: 'pop', name: 'Pop', blurb: 'One short bright blip' },
  { id: 'ding', name: 'Ding', blurb: 'A single clear bell note' },
  { id: 'buzz', name: 'Buzz', blurb: 'A low double buzz' },
];

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  ac: AudioContext,
  freq: number,
  startAt: number,
  dur: number,
  type: OscillatorType,
  gain: number,
): void {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + startAt;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Play one of the app's own synthesised effects. False when no sound could be produced. */
export function playSoundEffect(id: SoundEffectId): boolean {
  const ac = audioContext();
  if (!ac) return false;
  try {
    if (id === 'chime') {
      tone(ac, 880, 0, 0.35, 'sine', 0.18);
      tone(ac, 1318, 0.12, 0.4, 'sine', 0.14);
    } else if (id === 'pop') {
      tone(ac, 740, 0, 0.09, 'triangle', 0.22);
    } else if (id === 'ding') {
      tone(ac, 1046, 0, 0.45, 'sine', 0.2);
    } else {
      tone(ac, 180, 0, 0.1, 'sawtooth', 0.12);
      tone(ac, 180, 0.15, 0.12, 'sawtooth', 0.12);
    }
    return true;
  } catch {
    return false;
  }
}

/** Vibrate the device (Android / supported browsers only — iOS Safari
 *  ignores navigator.vibrate; the toggle still saves, the call is a
 *  no-op there). Returns true when the platform accepted the pattern. */
export function vibrate(pattern: number | number[]): boolean {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      return navigator.vibrate(pattern);
    }
  } catch {
    /* unsupported — silent no-op */
  }
  return false;
}

/** Mistake detected: the picked effect + a short buzz, if enabled. */
export function playMistakeFeedback(): void {
  let s;
  try {
    s = loadSettings();
  } catch {
    return;
  }
  if (s.mistakeSound !== false) playSoundEffect(s.mistakeSoundEffect ?? 'chime');
  if (s.mistakeVibrate !== false) vibrate(60);
}

/** Session started / stopped: a bright blip + a short buzz, if enabled. */
export function playSessionFeedback(): void {
  let s;
  try {
    s = loadSettings();
  } catch {
    return;
  }
  if (s.sessionSound !== false) playSoundEffect('pop');
  if (s.sessionVibrate !== false) vibrate(40);
}

/** Connection dropped during recitation: a low buzz, if enabled. */
export function playDroppedFeedback(): void {
  let s;
  try {
    s = loadSettings();
  } catch {
    return;
  }
  if (s.droppedSound !== false) playSoundEffect('buzz');
  if (s.droppedVibrate !== false) vibrate([80, 60, 80]);
}

/** A test question completed: the picked effect + a short buzz, if enabled. */
export function playTestFeedback(): void {
  let s;
  try {
    s = loadSettings();
  } catch {
    return;
  }
  if (s.testSound !== false) playSoundEffect(s.testSoundEffect ?? 'chime');
  if (s.testVibrate !== false) vibrate(50);
}
