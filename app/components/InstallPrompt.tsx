'use client';

import { useState, useEffect } from 'react';
import { usePWA } from './PWAProvider';

// Install prompt for the Hifz app (single message — the whole site is one app).
const TOOL_INSTALL_MESSAGES: Record<string, { message: string; emoji: string }> = {
  '/hifz': { message: 'Install the Hifz coach for offline use', emoji: '' },
  '/hifz/recite': { message: 'Install the Hifz coach for offline use', emoji: '' },
  '/hifz/test': { message: 'Install the Hifz coach for offline use', emoji: '' },
  '/hifz/voice-search': { message: 'Install the Hifz coach for offline use', emoji: '' },
  '/hifz/plans': { message: 'Install the Hifz coach for offline use', emoji: '' },
  '/hifz/my-progress': { message: 'Install the Hifz coach for offline use', emoji: '' },
};

interface InstallPromptProps {
  toolPath?: string;
}

export default function InstallPrompt({ toolPath }: InstallPromptProps) {
  // DISABLED - User reported this blocks functionality
  return null;
}
