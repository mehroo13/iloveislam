// app/hifz/components/SettingsScreens.tsx — the Settings sub-screens
// (Settings subtree, 2026-11-25). Each screen is a real, working
// screen, not a static mock: every toggle writes the shared settings
// document (`ili_hifz_settings_v1`) and the reader applies it at once.
//
// Shared pieces live here so every screen looks the same: a SubScreen
// shell (back button + title + scrolling content), a green switch
// row, a radio row with a green check, and a chevron row. Longer
// helper copy is written in our own words — same meaning as the
// reference, never its verbatim text. Short functional labels are
// fine. No Tarteel name, logo or artwork anywhere.
//
// Screens in this file: Recitation, Listening, Reciters, Hidden
// Verses, Marking, Language, Theme, Reminders, and the Sounds &
// Haptics screens (Mistake Feedback, Session Start & Stop, Dropped
// Connection, Testing Mode). Downloads (Translations, Tafsir) and
// the Mushaf Layout / Data Usage / Delete screens live in their
// own commits.

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  SUPPORTED_LOCALES,
  getStoredTheme,
  setUiLocale,
  setUiTheme,
} from '../lib/i18n';
import { applyReaderTheme, READER_THEME_EVENT, getReaderTheme, type StoredTheme } from '../lib/reader-theme';
import { loadSettings, saveSettings } from '../progress';
import { RECITERS } from '../../quran/lib';
import { SOUND_EFFECTS, playSoundEffect, type SoundEffectId } from '../lib/sounds';

const INK = 'var(--reader-ink)';
const MUTED = 'var(--reader-muted)';

export function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" style={{ stroke: INK }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/*  Shared pieces                                                    */
/* ---------------------------------------------------------------- */

/** A sub-screen: back button + title, scrolling content below. */
export function SubScreen({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-1">
        <button
          type="button"
          aria-label="Back to Settings"
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D1D5DB] bg-white"
        >
          <IconChevronLeft />
        </button>
        <h2 className="text-[18px] font-bold leading-none" style={{ color: INK }}>
          {title}
        </h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">{children}</div>
    </div>
  );
}

/** White grouped card. */
export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {children}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 px-1.5 text-[12.5px] leading-snug" style={{ color: MUTED }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div className="ml-12 mr-4 border-t border-[#EFEFEF]" />;
}

/** A label + green switch row. */
export function ToggleRow({
  label,
  sub,
  value,
  onChange,
  testId,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-[14px]">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px]" style={{ color: INK }}>
          {label}
        </span>
        {sub && (
          <span className="mt-0.5 block text-[12.5px] leading-snug" style={{ color: MUTED }}>
            {sub}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        data-testid={testId}
        onClick={() => onChange(!value)}
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{ backgroundColor: value ? '#16A34A' : '#D1D5DB' }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: value ? '22px' : '2px' }}
        />
      </button>
    </div>
  );
}

/** A label + radio row (green check when selected). */
export function RadioRow({
  label,
  sub,
  selected,
  onSelect,
  testId,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onSelect: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-testid={testId}
      className="flex w-full items-center gap-3 px-4 py-[14px] text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px]" style={{ color: INK }}>
          {label}
        </span>
        {sub && (
          <span className="mt-0.5 block text-[12.5px] leading-snug" style={{ color: MUTED }}>
            {sub}
          </span>
        )}
      </span>
      {selected && <IconCheck />}
    </button>
  );
}

/** A label + chevron row that opens something else. */
export function ChevronRow({
  label,
  sub,
  onClick,
  testId,
}: {
  label: string;
  sub?: string;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="flex w-full items-center gap-3 px-4 py-[14px] text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px]" style={{ color: INK }}>
          {label}
        </span>
        {sub && (
          <span className="mt-0.5 block text-[12.5px] leading-snug" style={{ color: MUTED }}>
            {sub}
          </span>
        )}
      </span>
      <IconChevronRight />
    </button>
  );
}

/* ---------------------------------------------------------------- */
/*  Recitation                                                       */
/* ---------------------------------------------------------------- */

export function RecitationScreen({
  onBack,
  detectMistakes,
  onToggleDetectMistakes,
}: {
  onBack: () => void;
  detectMistakes: boolean;
  onToggleDetectMistakes: (v: boolean) => void;
}) {
  return (
    <SubScreen title="Recitation" onBack={onBack}>
      <div className="mt-2 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <p className="text-[14px] font-bold" style={{ color: INK }}>
          Recite with the microphone
        </p>
        <p className="mt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
          Tap the mic button on any page to recite from memory or from the text. To hear the
          passage instead, tap the play button — that is Listening, in the next screen.
        </p>
      </div>
      <div className="mt-4">
        <Card>
          <ToggleRow
            label="Detect mistakes"
            sub="The coach flags words you miss or say differently, shows them in red, and saves them to your mistake history."
            value={detectMistakes}
            onChange={onToggleDetectMistakes}
            testId="settings-detect-mistakes"
          />
        </Card>
        <Note>
          {detectMistakes
            ? 'With detection off, the coach only follows along — it highlights the words as you recite them but never flags a mistake and never saves one.'
            : 'Mistake detection is off. The coach follows along only, and Mistake Feedback has nothing to react to — turn detection back on to flag mistakes again.'}
        </Note>
      </div>
    </SubScreen>
  );
}

/* ---------------------------------------------------------------- */
/*  Listening                                                        */
/* ---------------------------------------------------------------- */

const PLAY_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75];

export function ListeningScreen({
  onBack,
  reciterId,
  onChooseReciter,
  playSpeed,
  onPlaySpeedChange,
  onOpenReciters,
}: {
  onBack: () => void;
  reciterId: number;
  onChooseReciter: (id: number) => void;
  playSpeed: number;
  onPlaySpeedChange: (v: number) => void;
  onOpenReciters: () => void;
}) {
  return (
    <SubScreen title="Listening" onBack={onBack}>
      <div className="mt-2 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <p className="text-[14px] font-bold" style={{ color: INK }}>
          Listen to the passage
        </p>
        <p className="mt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
          Tap the play button on any page to hear it read aloud, with each word lighting up as
          it sounds. Pick the reciter and the speed below.
        </p>
      </div>
      <div className="mt-4">
        <Card>
          <div className="flex w-full items-center gap-3 px-4 py-[14px]">
            <span className="min-w-0 flex-1 truncate text-[15px]" style={{ color: INK }}>
              Reciter
            </span>
            <select
              value={reciterId}
              onChange={(e) => onChooseReciter(Number(e.target.value))}
              aria-label="Reciter for Listen"
              data-testid="settings-listening-reciter"
              className="max-w-[170px] shrink-0 rounded-lg border border-[#D1D5DB] bg-white px-2 py-1.5 text-[14px] outline-none"
              style={{ color: INK }}
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <Divider />
          <ChevronRow label="Manage downloads" sub="See all reciters and pick the Listen voice." onClick={onOpenReciters} />
        </Card>
        <Note>The reciter you pick here is the voice the reader plays.</Note>
      </div>
      <div className="mt-4">
        <Card>
          <div className="px-4 py-[14px]">
            <p className="text-[15px]" style={{ color: INK }}>
              Play speed
            </p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Play speed">
              {PLAY_SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={playSpeed === s}
                  data-testid={`settings-play-speed-${s}`}
                  onClick={() => onPlaySpeedChange(s)}
                  className="h-9 min-w-[52px] rounded-full px-3 text-[13px] font-bold"
                  style={
                    playSpeed === s
                      ? { backgroundColor: '#16A34A', color: '#FFFFFF' }
                      : { backgroundColor: '#F3F4F6', color: INK }
                  }
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </Card>
        <Note>The speed applies to Listen playback in the reader, right away.</Note>
      </div>
    </SubScreen>
  );
}

/* ---------------------------------------------------------------- */
/*  Reciters                                                         */
/* ---------------------------------------------------------------- */

export function RecitersScreen({
  onBack,
  reciterId,
  onChooseReciter,
}: {
  onBack: () => void;
  reciterId: number;
  onChooseReciter: (id: number) => void;
}) {
  return (
    <SubScreen title="Reciters" onBack={onBack}>
      <p className="mt-2 px-1.5 text-[13px] font-bold" style={{ color: INK }}>
        Available Downloads
      </p>
      <div className="mt-2">
        <Card>
          {RECITERS.map((r, i) => (
            <div key={r.id}>
              {i > 0 && <Divider />}
              <RadioRow
                label={r.name}
                selected={reciterId === r.id}
                onSelect={() => onChooseReciter(r.id)}
                testId={`settings-reciter-${r.id}`}
              />
            </div>
          ))}
        </Card>
        <Note>
          Tapping a reciter picks it as the voice for Listen in the reader. {RECITERS.length}{' '}
          recitations — every reciter Quran.com offers for this app. The audio streams when you
          play; it is not stored on the device.
        </Note>
      </div>
    </SubScreen>
  );
}

/* ---------------------------------------------------------------- */
/*  Hidden Verses                                                    */
/* ---------------------------------------------------------------- */

export function HiddenVersesScreen({
  onBack,
  hideVerses,
  onToggleHideVerses,
  hideMarkers,
  onToggleHideMarkers,
}: {
  onBack: () => void;
  hideVerses: boolean;
  onToggleHideVerses: () => void;
  hideMarkers: boolean;
  onToggleHideMarkers: (v: boolean) => void;
}) {
  return (
    <SubScreen title="Hidden Verses" onBack={onBack}>
      <div className="mt-2">
        <Card>
          <ToggleRow
            label="Hide Verses"
            sub="Blurs each ayah until you tap it, so you can test yourself from memory."
            value={hideVerses}
            onChange={() => onToggleHideVerses()}
            testId="settings-hide-verses"
          />
          <Divider />
          <ToggleRow
            label="Hide verse markers"
            sub="Hides the numbered ayah-end markers, so nothing gives away where each ayah ends."
            value={hideMarkers}
            onChange={onToggleHideMarkers}
            testId="settings-hide-markers"
          />
        </Card>
        <Note>
          Hidden verses still count for the mic: the coach follows what you recite and reveals
          the words as you say them.
        </Note>
      </div>
    </SubScreen>
  );
}

/* ---------------------------------------------------------------- */
/*  Marking                                                          */
/* ---------------------------------------------------------------- */

export function MarkingScreen({
  onBack,
  tajweedOn,
  onToggleTajweed,
  highlightMistakes,
  onToggleHighlightMistakes,
  colorSimilar,
  onToggleColorSimilar,
}: {
  onBack: () => void;
  tajweedOn: boolean;
  onToggleTajweed: (v: boolean) => void;
  highlightMistakes: boolean;
  onToggleHighlightMistakes: (v: boolean) => void;
  colorSimilar: boolean;
  onToggleColorSimilar: (v: boolean) => void;
}) {
  return (
    <SubScreen title="Marking" onBack={onBack}>
      <div className="mt-2">
        <p className="px-1.5 text-[13px] font-bold" style={{ color: INK }}>
          Tajweed
        </p>
        <div className="mt-2">
          <Card>
            <ToggleRow
              label="Show Tajweed Colors"
              sub="Colours the words by their tajweed rule. Display only — it never affects detection."
              value={tajweedOn}
              onChange={onToggleTajweed}
              testId="settings-tajweed-colors"
            />
          </Card>
        </div>
        <p className="mt-4 px-1.5 text-[13px] font-bold" style={{ color: INK }}>
          Mistakes
        </p>
        <div className="mt-2">
          <Card>
            <ToggleRow
              label="Highlight mistake history"
              sub="Words you have missed twice or more stay marked in red with a dotted underline, so your weak spots stand out."
              value={highlightMistakes}
              onChange={onToggleHighlightMistakes}
              testId="settings-highlight-mistakes"
            />
          </Card>
        </div>
        <p className="mt-4 px-1.5 text-[13px] font-bold" style={{ color: INK }}>
          Similar Phrases
        </p>
        <div className="mt-2">
          <Card>
            <ToggleRow
              label="Color similar phrases"
              sub="Colours the words this ayah shares with a similar verse, so you can see where the wording repeats."
              value={colorSimilar}
              onChange={onToggleColorSimilar}
              testId="settings-color-similar"
            />
          </Card>
          <Note>
            Similarity comes from the app&apos;s own list of repeated phrases across the Quran —
            verses that share whole phrases, not just single words.
          </Note>
        </div>
      </div>
    </SubScreen>
  );
}

/* ---------------------------------------------------------------- */
/*  Language                                                         */
/* ---------------------------------------------------------------- */

export function LanguageScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState(() => {
    try {
      return loadSettings().language ?? 'en';
    } catch {
      return 'en';
    }
  });
  const choose = (code: string) => {
    setSelected(code);
    setUiLocale(code);
  };
  return (
    <SubScreen title="Language" onBack={onBack}>
      <div className="mt-2">
        <Card>
          {SUPPORTED_LOCALES.map((l, i) => (
            <div key={l.code}>
              {i > 0 && <Divider />}
              <RadioRow
                label={l.name}
                selected={selected === l.code}
                onSelect={() => choose(l.code)}
                testId={`settings-language-${l.code}`}
              />
            </div>
          ))}
        </Card>
        <Note>
          8 languages for now. Turkish, Spanish, German, Hausa and Portuguese are not translated
          yet — each one needs the whole interface translated first.
        </Note>
      </div>
    </SubScreen>
  );
}

/* ---------------------------------------------------------------- */
/*  Theme                                                            */
/* ---------------------------------------------------------------- */

const THEME_OPTIONS: { id: StoredTheme; label: string; sub: string }[] = [
  { id: 'auto', label: 'Auto (Light / Dark)', sub: 'Follows your phone or computer’s setting.' },
  { id: 'light', label: 'Light', sub: 'Always the light theme.' },
  { id: 'dark', label: 'Dark', sub: 'Always the dark theme.' },
];

export function ThemeScreen({ onBack }: { onBack: () => void }) {
  const [stored, setStored] = useState<StoredTheme>(() => getStoredTheme());
  useEffect(() => {
    const sync = () => setStored(getStoredTheme());
    sync();
    window.addEventListener(READER_THEME_EVENT, sync);
    return () => window.removeEventListener(READER_THEME_EVENT, sync);
  }, []);
  const choose = (t: StoredTheme) => {
    // setUiTheme persists + applies to the document + re-renders the
    // translated UI; applyReaderTheme (no persist) dispatches the
    // reader event and arms the system listener for 'auto'. Both
    // write the same document key, so the two theme paths agree.
    setUiTheme(t);
    applyReaderTheme(t, false);
    setStored(t);
  };
  return (
    <SubScreen title="Theme" onBack={onBack}>
      <div className="mt-2">
        <Card>
          {THEME_OPTIONS.map((o, i) => (
            <div key={o.id}>
              {i > 0 && <Divider />}
              <RadioRow
                label={o.label}
                sub={o.sub}
                selected={stored === o.id}
                onSelect={() => choose(o.id)}
                testId={`settings-theme-${o.id}`}
              />
            </div>
          ))}
        </Card>
        <Note>
          {getReaderTheme() === 'dark'
            ? 'The reader is showing the dark theme right now.'
            : 'The reader is showing the light theme right now.'}
        </Note>
      </div>
    </SubScreen>
  );
}

/* ---------------------------------------------------------------- */
/*  Sounds & Haptics                                                 */
/* ---------------------------------------------------------------- */

/** The sound-effect picker: ONLY the app's own synthesised effects
 *  (see lib/sounds.ts) — every row plays for real, and each row has
 *  a Preview button so the user can hear it before picking it. */
export function SoundEffectPicker({
  value,
  onChange,
  testIdPrefix,
}: {
  value: SoundEffectId;
  onChange: (id: SoundEffectId) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="px-4 py-[14px]">
      <p className="text-[15px]" style={{ color: INK }}>
        Sound effect
      </p>
      <div className="mt-2 flex flex-col">
        {SOUND_EFFECTS.map((s, i) => (
          <div key={s.id}>
            {i > 0 && <div className="ml-0 mr-0 border-t border-[#EFEFEF]" />}
            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => onChange(s.id)}
                aria-pressed={value === s.id}
                data-testid={`${testIdPrefix}-${s.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px]" style={{ color: INK }}>
                    {s.name}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug" style={{ color: MUTED }}>
                    {s.blurb}
                  </span>
                </span>
                {value === s.id && <IconCheck />}
              </button>
              <button
                type="button"
                onClick={() => playSoundEffect(s.id)}
                aria-label={`Preview ${s.name}`}
                data-testid={`${testIdPrefix}-preview-${s.id}`}
                className="shrink-0 rounded-full border border-[#D1D5DB] px-3 py-1.5 text-[12px] font-bold"
                style={{ color: INK }}
              >
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function loadSoundPrefs(): {
  mistakeSound: boolean;
  mistakeSoundEffect: SoundEffectId;
  mistakeVibrate: boolean;
  sessionSound: boolean;
  sessionVibrate: boolean;
  droppedSound: boolean;
  droppedVibrate: boolean;
  testSound: boolean;
  testSoundEffect: SoundEffectId;
  testVibrate: boolean;
} {
  try {
    const s = loadSettings();
    return {
      mistakeSound: s.mistakeSound !== false,
      mistakeSoundEffect: s.mistakeSoundEffect ?? 'chime',
      mistakeVibrate: s.mistakeVibrate !== false,
      sessionSound: s.sessionSound !== false,
      sessionVibrate: s.sessionVibrate !== false,
      droppedSound: s.droppedSound !== false,
      droppedVibrate: s.droppedVibrate !== false,
      testSound: s.testSound !== false,
      testSoundEffect: s.testSoundEffect ?? 'chime',
      testVibrate: s.testVibrate !== false,
    };
  } catch {
    return {
      mistakeSound: true,
      mistakeSoundEffect: 'chime',
      mistakeVibrate: true,
      sessionSound: true,
      sessionVibrate: true,
      droppedSound: true,
      droppedVibrate: true,
      testSound: true,
      testSoundEffect: 'chime',
      testVibrate: true,
    };
  }
}

function saveSoundPrefs(patch: Partial<ReturnType<typeof loadSoundPrefs>>): void {
  try {
    saveSettings({ ...loadSettings(), ...patch });
  } catch {
    /* storage unavailable — the choice still applies this session */
  }
}

export function MistakeFeedbackScreen({
  onBack,
  onOpenRecitation,
}: {
  onBack: () => void;
  onOpenRecitation: () => void;
}) {
  const [prefs, setPrefs] = useState(loadSoundPrefs);
  const [detectMistakes, setDetectMistakes] = useState(() => {
    try {
      return loadSettings().detectMistakes !== false;
    } catch {
      return true;
    }
  });
  // Re-read when returning from the Recitation screen (the screen
  // remounts on every push, so this runs on each visit).
  useEffect(() => {
    setDetectMistakes(() => {
      try {
        return loadSettings().detectMistakes !== false;
      } catch {
        return true;
      }
    });
  }, []);
  const patch = (p: Partial<typeof prefs>) => {
    setPrefs((prev) => ({ ...prev, ...p }));
    saveSoundPrefs(p);
  };
  return (
    <SubScreen title="Mistake Feedback" onBack={onBack}>
      {!detectMistakes && (
        <div className="mt-2 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
          <p className="text-[14px] font-bold" style={{ color: '#92400E' }}>
            Mistake Detection Is Disabled
          </p>
          <p className="mt-1 text-[13px] leading-snug" style={{ color: '#92400E' }}>
            Turn mistake detection back on to get sound and vibration when the coach flags a word.
          </p>
          <button
            type="button"
            onClick={onOpenRecitation}
            data-testid="settings-mistake-feedback-open-recitation"
            className="mt-3 h-10 rounded-full bg-[#16A34A] px-5 text-[13px] font-bold text-white"
          >
            Open Recitation Settings
          </button>
        </div>
      )}
      <div className="mt-4">
        <p className="px-1.5 text-[13px] font-bold" style={{ color: INK }}>
          Sound
        </p>
        <div className="mt-2">
          <Card>
            <ToggleRow
              label="Play a sound"
              sub="A short sound each time the coach flags a word you miss or say differently."
              value={prefs.mistakeSound}
              onChange={(v) => patch({ mistakeSound: v })}
              testId="settings-mistake-sound"
            />
            {prefs.mistakeSound && (
              <>
                <Divider />
                <SoundEffectPicker
                  value={prefs.mistakeSoundEffect}
                  onChange={(id) => patch({ mistakeSoundEffect: id })}
                  testIdPrefix="settings-mistake-effect"
                />
              </>
            )}
          </Card>
        </div>
        <p className="mt-4 px-1.5 text-[13px] font-bold" style={{ color: INK }}>
          Haptic
        </p>
        <div className="mt-2">
          <Card>
            <ToggleRow
              label="Vibrate my device"
              sub="A short vibration with the sound when a mistake is flagged. (Android only — iPhones ignore vibration from a web page.)"
              value={prefs.mistakeVibrate}
              onChange={(v) => patch({ mistakeVibrate: v })}
              testId="settings-mistake-vibrate"
            />
          </Card>
        </div>
      </div>
    </SubScreen>
  );
}

export function SessionStartStopScreen({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState(loadSoundPrefs);
  const patch = (p: Partial<typeof prefs>) => {
    setPrefs((prev) => ({ ...prev, ...p }));
    saveSoundPrefs(p);
  };
  return (
    <SubScreen title="Session Start & Stop" onBack={onBack}>
      <div className="mt-2">
        <Card>
          <ToggleRow
            label="Play a sound"
            sub="A short sound when a recitation session starts and when it stops."
            value={prefs.sessionSound}
            onChange={(v) => patch({ sessionSound: v })}
            testId="settings-session-sound"
          />
          <Divider />
          <ToggleRow
            label="Vibrate my device"
            sub="A short vibration with the sound at the start and the end of a session. (Android only — iPhones ignore vibration from a web page.)"
            value={prefs.sessionVibrate}
            onChange={(v) => patch({ sessionVibrate: v })}
            testId="settings-session-vibrate"
          />
        </Card>
        <Note>
          A session is one mic take in the reader or the coach — from the moment you tap the mic
          until you stop it.
        </Note>
      </div>
    </SubScreen>
  );
}

export function DroppedConnectionScreen({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState(loadSoundPrefs);
  const patch = (p: Partial<typeof prefs>) => {
    setPrefs((prev) => ({ ...prev, ...p }));
    saveSoundPrefs(p);
  };
  return (
    <SubScreen title="Dropped Connection" onBack={onBack}>
      <div className="mt-2">
        <Card>
          <ToggleRow
            label="Play a sound"
            sub="A low buzz when the connection drops while you’re reciting, so you know the coach may have lost its place."
            value={prefs.droppedSound}
            onChange={(v) => patch({ droppedSound: v })}
            testId="settings-dropped-sound"
          />
          <Divider />
          <ToggleRow
            label="Vibrate my device"
            sub="A double vibration with the sound when the connection drops. (Android only — iPhones ignore vibration from a web page.)"
            value={prefs.droppedVibrate}
            onChange={(v) => patch({ droppedVibrate: v })}
            testId="settings-dropped-vibrate"
          />
        </Card>
        <Note>
          The recitation coach runs on the device, so a dropped connection doesn’t stop the
          listening itself — this is only a heads-up that the network went away mid-take.
        </Note>
      </div>
    </SubScreen>
  );
}

export function TestingModeScreen({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState(loadSoundPrefs);
  const patch = (p: Partial<typeof prefs>) => {
    setPrefs((prev) => ({ ...prev, ...p }));
    saveSoundPrefs(p);
  };
  return (
    <SubScreen title="Testing Mode" onBack={onBack}>
      <div className="mt-2">
        <p className="px-1.5 text-[13px] font-bold" style={{ color: INK }}>
          Sound
        </p>
        <div className="mt-2">
          <Card>
            <ToggleRow
              label="Play a sound"
              sub="A short sound each time you finish a question in a test."
              value={prefs.testSound}
              onChange={(v) => patch({ testSound: v })}
              testId="settings-test-sound"
            />
            {prefs.testSound && (
              <>
                <Divider />
                <SoundEffectPicker
                  value={prefs.testSoundEffect}
                  onChange={(id) => patch({ testSoundEffect: id })}
                  testIdPrefix="settings-test-effect"
                />
              </>
            )}
          </Card>
        </div>
        <p className="mt-4 px-1.5 text-[13px] font-bold" style={{ color: INK }}>
          Haptic
        </p>
        <div className="mt-2">
          <Card>
            <ToggleRow
              label="Vibrate my device"
              sub="A short vibration with the sound when a question is finished. (Android only — iPhones ignore vibration from a web page.)"
              value={prefs.testVibrate}
              onChange={(v) => patch({ testVibrate: v })}
              testId="settings-test-vibrate"
            />
          </Card>
        </div>
        <Note>
          Start a test from the Testing Mode card at the top of Settings, or the Practice tab in
          the dashboard.
        </Note>
      </div>
    </SubScreen>
  );
}

/* ---------------------------------------------------------------- */
/*  Reminders                                                        */
/* ---------------------------------------------------------------- */

export function RemindersScreen({ onBack }: { onBack: () => void }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return loadSettings().streakReminder === true;
    } catch {
      return false;
    }
  });
  const [time, setTime] = useState(() => {
    try {
      return loadSettings().streakReminderTime ?? '19:00';
    } catch {
      return '19:00';
    }
  });
  const [permission, setPermission] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  );
  const save = (nextEnabled: boolean, nextTime: string) => {
    try {
      const s = loadSettings();
      saveSettings({ ...s, streakReminder: nextEnabled, streakReminderTime: nextTime });
    } catch {
      /* storage unavailable — the choice still applies this session */
    }
    try {
      window.dispatchEvent(new Event('ili-reminders-changed'));
    } catch {
      /* no window */
    }
  };
  const toggle = async (v: boolean) => {
    if (v && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const p = await Notification.requestPermission();
        setPermission(p);
      } catch {
        /* permission prompt unavailable */
      }
    }
    setEnabled(v);
    save(v, time);
  };
  const changeTime = (v: string) => {
    setTime(v);
    save(enabled, v);
  };
  return (
    <SubScreen title="Reminders" onBack={onBack}>
      <div className="mt-2">
        <Card>
          <ToggleRow
            label="Streak Reminder"
            sub="One reminder a day at your chosen time, only on days you haven’t practised yet."
            value={enabled}
            onChange={(v) => void toggle(v)}
            testId="settings-streak-reminder"
          />
          {enabled && (
            <>
              <Divider />
              <div className="flex w-full items-center gap-3 px-4 py-[14px]">
                <span className="min-w-0 flex-1 text-[15px]" style={{ color: INK }}>
                  Remind me at
                </span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => changeTime(e.target.value)}
                  aria-label="Streak reminder time"
                  data-testid="settings-streak-reminder-time"
                  className="shrink-0 rounded-lg border border-[#D1D5DB] bg-white px-2 py-1.5 text-[14px] outline-none"
                  style={{ color: INK }}
                />
              </div>
            </>
          )}
        </Card>
        {enabled && permission === 'denied' && (
          <Note>
            Notifications are blocked for this site, so the reminder can’t reach you. Allow them
            in your browser’s site settings and it will work.
          </Note>
        )}
        {enabled && permission !== 'denied' && (
          <Note>
            The reminder works while the app is open — the app can’t wake itself in the
            background, so keep a tab open around that time.
          </Note>
        )}
        {!enabled && (
          <Note>
            Per-goal reminders live on the Goals page, next to each goal. This one is for your
            streak: a daily nudge to practise, so the streak never slips quietly.
          </Note>
        )}
      </div>
    </SubScreen>
  );
}
