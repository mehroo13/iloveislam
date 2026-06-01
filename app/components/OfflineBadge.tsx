'use client';

import { usePWA } from './PWAProvider';

interface OfflineBadgeProps {
  href: string;
  compact?: boolean;
}

export default function OfflineBadge({ href, compact = true }: OfflineBadgeProps) {
  const { getToolOfflineStatus, isOnline } = usePWA();
  const status = getToolOfflineStatus(href);

  if (compact) {
    // Small dot badge for tool cards
    const config = {
      full: { dot: 'bg-emerald-400', title: 'Works Offline' },
      limited: { dot: 'bg-amber-400', title: 'Limited Offline' },
      'needs-internet': { dot: 'bg-red-400', title: 'Needs Internet' },
    };

    const { dot, title } = config[status];

    return (
      <span
        className={`absolute top-1 left-1 w-2 h-2 rounded-full ${dot} ${!isOnline && status === 'needs-internet' ? 'animate-pulse' : ''}`}
        title={title}
        aria-label={title}
      />
    );
  }

  // Full badge with text (for tool pages)
  const config = {
    full: { emoji: '🟢', text: 'Works Offline', bg: 'bg-emerald-50 dark:bg-emerald-900/30', textColor: 'text-emerald-700 dark:text-emerald-400' },
    limited: { emoji: '🟡', text: 'Limited Offline', bg: 'bg-amber-50 dark:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-400' },
    'needs-internet': { emoji: '🔴', text: 'Needs Internet', bg: 'bg-red-50 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-400' },
  };

  const { emoji, text, bg, textColor } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${bg} ${textColor}`}>
      <span>{emoji}</span>
      <span>{text}</span>
    </span>
  );
}
