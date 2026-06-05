'use client';

import { useState, useEffect } from 'react';
import { usePWA } from './PWAProvider';

// Tool-specific install messages
const TOOL_INSTALL_MESSAGES: Record<string, { message: string; emoji: string }> = {
  '/dhikr': { message: 'Install Dhikr Counter for offline use', emoji: '📿' },
  '/zakat': { message: 'Install Zakat Calculator for offline use', emoji: '💰' },
  '/prayer-times': { message: 'Install Prayer Times for quick access', emoji: '🕐' },
  '/qibla': { message: 'Install Qibla Finder for instant access', emoji: '🧭' },
  '/quran': { message: 'Install Quran Reader for offline reading', emoji: '📖' },
  '/names': { message: 'Install 99 Names of Allah offline', emoji: '⭐' },
  '/hijri': { message: 'Install Hijri Calendar for offline use', emoji: '🌙' },
  '/dua': { message: 'Install Dua Generator for offline access', emoji: '🤲' },
  '/kids': { message: 'Install Islamic Games for your kids', emoji: '🎮' },
  '/ramadan': { message: 'Install Ramadan Planner for offline use', emoji: '🌙' },
  '/halal-scanner': { message: 'Install HalalScan for quick scanning', emoji: '📷' },
  '/hadith': { message: 'Install Hadith Search for offline access', emoji: '🔍' },
  '/night': { message: 'Install Night Recitation for bedtime', emoji: '🌙' },
  '/sadaqah': { message: 'Install Sadaqah Tracker offline', emoji: '❤️' },
  '/mosque': { message: 'Install Mosque Finder for quick access', emoji: '🕌' },
};

interface InstallPromptProps {
  toolPath?: string;
}

export default function InstallPrompt({ toolPath }: InstallPromptProps) {
  // DISABLED - User reported this blocks functionality
  return null;
}
