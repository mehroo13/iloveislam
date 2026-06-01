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
  const { canInstall, installApp, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isInstalled || !canInstall) return;

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem('pwa_install_dismissed');
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSince < 24) return; // Don't show for 24 hours after dismiss
    }

    // Show after a short delay
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [canInstall, isInstalled]);

  if (!show || dismissed || isInstalled || !canInstall) return null;

  const toolInfo = toolPath ? TOOL_INSTALL_MESSAGES[toolPath] : null;
  const message = toolInfo?.message || 'Install I Love Islam for offline access';
  const emoji = toolInfo?.emoji || '♡';

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    await installApp();
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9998] animate-slide-up w-[calc(100%-2rem)] max-w-sm">
      <div
        className="rounded-2xl p-4 shadow-2xl border border-emerald-700/30 backdrop-blur-sm"
        style={{ background: 'linear-gradient(135deg, #071e14 0%, #0a3d2e 100%)' }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">{message}</p>
            <p className="text-white/50 text-xs mt-0.5">Works without internet • Fast access from home screen</p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white/70 text-lg leading-none flex-shrink-0"
            aria-label="Dismiss install prompt"
          >
            ×
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors active:scale-95"
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 text-white/50 hover:text-white/80 text-xs rounded-xl transition-colors border border-white/10 hover:border-white/20"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
