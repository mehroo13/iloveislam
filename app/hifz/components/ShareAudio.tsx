'use client';

/**
 * app/hifz/components/ShareAudio.tsx — share your own recitation audio
 * with a teacher (research report §9 row 26 / §10 P3: "share audio").
 *
 * PRIVACY DESIGN — decided deliberately, not copied from the reference app:
 *  - Nothing is uploaded anywhere, ever. There is no server endpoint for
 *    audio, no account to send it to, and no background transfer. The app
 *    only ever hands the file to the user or to the share target the user
 *    picks.
 *  - Sharing is an explicit, per-recitation, user-initiated action: the
 *    user taps "Share with your teacher" (or "Download audio") after a
 *    session. There is no default-on toggle, no auto-share, no silent
 *    upload. The on-device default is unchanged — audio is processed on
 *    the device and stays there unless the user chooses otherwise.
 *  - Two ways out, both user-controlled: the Web Share API
 *    (`navigator.share` with files) hands the file to the app the user
 *    picks (e.g. WhatsApp) — the file leaves the device only through
 *    the channel the user chose; or a plain download, so the user can
 *    send the file themselves.
 *  - Recordings live as an in-memory blob for the current browser
 *    session — and, when the user has "Save session audio on this
 *    device" on, ALSO as a persisted blob in the IndexedDB
 *    `session-audio` store (see lib/store.ts: saveSessionAudio), so a
 *    past session's recording can still be shared or downloaded from
 *    session history. A past session with no persisted audio still has
 *    nothing to share — the UI says so instead of pretending otherwise.
 *    Nothing is ever uploaded by the app; sharing hands the file to the
 *    app the user picks, downloading saves it to their device.
 *
 * Everything is free; no account, no Premium tier.
 */

import { useState } from 'react';
import { useT } from '../lib/i18n';

/** One recorded recitation, held in memory only. */
export interface SharedRecording {
  blob: Blob;
  fileName: string;
}

/**
 * Build a SharedRecording from a PERSISTED session-audio blob (loaded
 * from the IndexedDB `session-audio` store via loadSessionAudio /
 * listSessionAudios) so share/download can be offered from session
 * history rows, not just for the just-finished session. The blob is
 * used as-is — shareRecording / downloadRecording never care whether
 * it came from memory or from storage.
 */
export function sharedRecordingFromStored(
  blob: Blob,
  fileName: string,
): SharedRecording {
  return { blob, fileName };
}

/**
 * File name for a stored recording, from its stored meta (date +
 * range label, e.g. "67:1–5"). Falls back to a dated generic name when
 * the range label cannot be parsed — never throws.
 */
export function fileNameForStoredAudio(
  meta: { date: string; rangeLabel: string },
  ext: string,
): string {
  const stamp = (() => {
    const d = new Date(meta.date);
    if (Number.isNaN(d.getTime())) return 'undated';
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  })();
  const m = meta.rangeLabel.match(/(\d+):(\d+)(?:[–-](\d+))?/);
  if (!m) return `hifz-recitation-${stamp}.${ext}`;
  const toAyah = m[3] ?? m[2];
  return `hifz-recitation-s${m[1]}-${m[2]}-${toAyah}-${stamp}.${ext}`;
}

/** File extension for a MediaRecorder mime type (WebM is the usual case). */
export function audioExtension(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

/** Stable, descriptive file name, e.g. hifz-recitation-s67-1-5-20261122-0930.webm */
export function recordingFileName(surah: number, fromAyah: number, toAyah: number, ext: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  return `hifz-recitation-s${surah}-${fromAyah}-${toAyah}-${stamp}.${ext}`;
}

/** True only when this browser can share this file via the Web Share API. */
export function canShareFiles(recording: SharedRecording | null): boolean {
  if (!recording) return false;
  if (typeof navigator === 'undefined') return false;
  if (!('share' in navigator) || !('canShare' in navigator)) return false;
  try {
    const file = new File([recording.blob], recording.fileName, { type: recording.blob.type });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Hand the recording to the Web Share sheet. The user picks the app
 * (e.g. WhatsApp) — the file leaves the device only through the channel
 * they chose. Returns 'cancelled' when the user backs out of the sheet.
 */
export async function shareRecording(
  recording: SharedRecording,
): Promise<'shared' | 'cancelled' | 'unsupported' | 'failed'> {
  if (typeof navigator === 'undefined' || !('share' in navigator)) return 'unsupported';
  if (!canShareFiles(recording)) return 'unsupported';
  const file = new File([recording.blob], recording.fileName, { type: recording.blob.type });
  try {
    await navigator.share({
      files: [file],
      title: 'My Quran recitation',
      text: 'My recitation — please listen and correct me.',
    });
    return 'shared';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    return 'failed';
  }
}

/** Download the recording as a file, so the user can send it themselves. */
export function downloadRecording(recording: SharedRecording): void {
  const url = URL.createObjectURL(recording.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = recording.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/*  Buttons — one place, used from the coach feedback step and from    */
/*  session history (SessionAnalyticsSheet).                           */
/* ------------------------------------------------------------------ */

export function ShareAudioButtons({
  recording,
  noRecordingReason,
  note,
}: {
  /** The recording to share, or null when this session has no audio. */
  recording: SharedRecording | null;
  /** Shown (with a disabled button) when there is no recording. */
  noRecordingReason?: string;
  /** Overrides the default privacy note — history rows pass the
   *  saved-on-device wording, because a persisted recording IS kept
   *  past this browser session (unlike the just-finished take). */
  note?: string;
}) {
  const t = useT();
  const [status, setStatus] = useState<string | null>(null);
  const shareSupported = canShareFiles(recording);

  if (!recording) {
    return (
      <div>
        <button
          type="button"
          disabled
          title={noRecordingReason ?? t('share.noRecording')}
          className="rounded-full bg-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#5b6b62] disabled:cursor-not-allowed focus:outline-none"
        >
          {t('share.shareTeacher')}
        </button>
        <p className="mt-1 text-xs text-[#5b6b62]">
          {noRecordingReason ?? t('share.noRecordingNote')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {shareSupported && (
          <button
            type="button"
            onClick={() => {
              void (async () => {
                setStatus(null);
                const outcome = await shareRecording(recording);
                if (outcome === 'shared') {
                  setStatus(t('share.shared'));
                } else if (outcome === 'failed' || outcome === 'unsupported') {
                  setStatus(t('share.failed'));
                }
                // 'cancelled': the user backed out of the share sheet — stay silent.
              })();
            }}
            className="rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
          >
            {t('share.shareTeacher')}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            downloadRecording(recording);
            setStatus(t('share.downloaded').replace('{file}', recording.fileName));
          }}
          className="rounded-full border border-[#102E26] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
        >
          {t('share.download')}
        </button>
      </div>
      {!shareSupported && (
        <p className="mt-1 text-xs text-[#5b6b62]">
          {t('share.cantShare')}
        </p>
      )}
      <p className="mt-1 text-xs text-[#5b6b62]">
        {note ?? t('share.note')}
      </p>
      {status && (
        <p role="status" className="mt-1 text-sm font-semibold text-[#1FA36B]">{status}</p>
      )}
    </div>
  );
}
