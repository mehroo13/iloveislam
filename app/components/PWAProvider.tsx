'use client';

import { useEffect, useState, useCallback, useRef, createContext, useContext } from 'react';
import { loadProgress, ayahsPractisedOn, localDateString } from '../hifz/progress';

// ==================== TYPES ====================
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  installApp: () => Promise<void>;
  getToolOfflineStatus: (href: string) => 'full' | 'limited' | 'needs-internet';
}

// ==================== OFFLINE STATUS MAP ====================
// The Hifz app: reading/listening pages work from cache; the coach needs the
// on-device model (downloaded once) and Quran text from the API.
const FULL_OFFLINE_TOOLS = [
  '/hifz',
  '/hifz/plans',
  '/hifz/my-progress',
  '/hifz/juz-amma',
];

const LIMITED_OFFLINE_TOOLS = [
  '/hifz/recite',
  '/hifz/test',
  '/hifz/voice-search',
];

const NEEDS_INTERNET_TOOLS: string[] = [];

// ==================== CONTEXT ====================
const PWAContext = createContext<PWAContextType>({
  isOnline: true,
  isInstalled: false,
  canInstall: false,
  installApp: async () => {},
  getToolOfflineStatus: () => 'needs-internet',
});

export const usePWA = () => useContext(PWAContext);

// ==================== PROVIDER ====================
export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  // Guard so a worker takeover reloads the page exactly once.
  const reloadingRef = useRef(false);
  const reloadOnce = useCallback(() => {
    if (reloadingRef.current) return;
    reloadingRef.current = true;
    window.location.reload();
  }, []);

  // Refresh to the new build: tell a waiting worker to take over now
  // (otherwise a plain reload can leave it waiting and the old build
  // stays). The controllerchange listener reloads once it takes over;
  // the timeout is a fallback if that event never fires.
  const refreshToUpdate = useCallback(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      window.location.reload();
      return;
    }
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => reloadOnce(), 2000);
      } else {
        reloadOnce();
      }
    }).catch(() => reloadOnce());
  }, [reloadOnce]);

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // When a new worker takes control, reload once so the new build shows.
    // The banner is vestigial at that point — the new worker is already
    // active (skipWaiting + clients.claim) and the reload follows — so
    // hide it rather than letting it linger on the upgraded page.
    const onControllerChange = () => {
      setShowUpdateBanner(false);
      reloadOnce();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // A new worker can sit "waiting" (installed on an earlier visit but
    // never activated) with no message ever fired — the old code only
    // listened for SW_UPDATED (posted on activate), so a waiting worker
    // never prompted and the phone stayed on the old build. Prompt now
    // when one is already waiting, and when one finishes installing.
    const watchForUpdate = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) setShowUpdateBanner(true);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          // A new worker finished installing while an old one controls
          // the page — prompt to refresh so the new build loads.
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdateBanner(true);
          }
        });
      });
    };

    // Register SW
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered:', registration.scope);
      watchForUpdate(registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour
    }).catch((err) => {
      console.log('SW registration failed:', err);
    });

    // Listen for SW messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        // The worker posts this on activate — it has ALREADY taken
        // over (skipWaiting + clients.claim), and the controllerchange
        // reload follows, so a banner here only lingers on the
        // upgraded page. Show it only if a worker is still waiting
        // to take over (the one case the banner is actually for).
        navigator.serviceWorker
          .getRegistration()
          .then((registration) => {
            if (registration?.waiting) setShowUpdateBanner(true);
          })
          .catch(() => {});
      }
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, [reloadOnce]);

  // Local reminders — OPT-IN only, no push, no server.
  // The user turns a reminder on per goal in Settings (or on the Goals
  // page); permission is requested only at that moment. This scheduler
  // runs while the app is open: once a minute it checks the stored goals
  // ('ili_goals_v1', same key/shape GoalsClient uses) and, for a reminded
  // goal whose time has arrived today, asks the service worker to show
  // the notification (SHOW_REMINDER → registration.showNotification).
  // Each goal fires at most once a day ('ili_reminders_fired_v1'), and
  // never on a day the user has already practised — the same rule as the
  // Goals page in-app banner. A service worker cannot wake itself at a
  // future time, so reminders fire while the app (or its tab) is open;
  // nothing is promised beyond that.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const GOALS_KEY = 'ili_goals_v1';
    const FIRED_KEY = 'ili_reminders_fired_v1';

    const checkReminders = () => {
      try {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
        const raw = localStorage.getItem(GOALS_KEY);
        if (!raw) return;
        const goals = JSON.parse(raw) as { id: string; name: string; remind?: boolean; remindTime?: string }[];
        if (!Array.isArray(goals)) return;
        const now = new Date();
        const today = localDateString(now);
        const nowMin = now.getHours() * 60 + now.getMinutes();
        // Don't nag after today's practice — same rule as the Goals banner.
        let practised = false;
        try {
          const progress = loadProgress();
          practised =
            ayahsPractisedOn(progress, today) > 0 ||
            (progress.minutesToday.date === today && progress.minutesToday.minutes > 0);
        } catch {
          /* practice check unavailable — still remind */
        }
        if (practised) return;
        const firedRaw = localStorage.getItem(FIRED_KEY);
        const fired = (firedRaw ? JSON.parse(firedRaw) : {}) as Record<string, string>;
        let changed = false;
        for (const g of goals) {
          if (!g.remind || !g.remindTime) continue;
          const [h, m] = g.remindTime.split(':').map(Number);
          if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
          if (h * 60 + m > nowMin) continue; // not due yet
          if (fired[g.id] === today) continue; // already shown today
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_REMINDER',
            goalId: g.id,
            title: 'Time to practise your Hifz',
            body: `${g.name} — open the app to keep your streak going.`,
            url: '/hifz/goals',
          });
          fired[g.id] = today;
          changed = true;
        }
        /* Streak reminder (Settings → Reminders): one a day at the
         * chosen time, only on days not yet practised (the practised
         * check above already returned early). Same fired-once-a-day
         * map, key 'streak'. Fires while the app (or its tab) is open,
         * like the per-goal reminders — the service worker cannot
         * wake itself at a future time. */
        try {
          const sRaw = localStorage.getItem('ili_hifz_settings_v1');
          const s = sRaw ? (JSON.parse(sRaw) as { streakReminder?: boolean; streakReminderTime?: string }) : null;
          if (s?.streakReminder && typeof s.streakReminderTime === 'string') {
            const [h, m] = s.streakReminderTime.split(':').map(Number);
            if (
              Number.isFinite(h) &&
              Number.isFinite(m) &&
              h * 60 + m <= nowMin &&
              fired.streak !== today
            ) {
              navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_REMINDER',
                goalId: 'streak',
                title: 'Time to practise your Hifz',
                body: 'Keep your streak going — open the app and recite a little today.',
                url: '/hifz',
              });
              fired.streak = today;
              changed = true;
            }
          }
        } catch {
          /* streak reminder must never break the goal reminders */
        }
        if (changed) localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
      } catch {
        /* reminders must never break the app */
      }
    };

    checkReminders();
    const timer = setInterval(checkReminders, 60 * 1000);
    const onChange = () => checkReminders();
    window.addEventListener('ili-reminders-changed', onChange);
    window.addEventListener('focus', onChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener('ili-reminders-changed', onChange);
      window.removeEventListener('focus', onChange);
    };
  }, []);

  // Online/Offline detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);

      // Trigger background sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          (registration as any).sync?.register('sync-data');
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install prompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const getToolOfflineStatus = useCallback((href: string): 'full' | 'limited' | 'needs-internet' => {
    if (FULL_OFFLINE_TOOLS.includes(href)) return 'full';
    if (LIMITED_OFFLINE_TOOLS.includes(href)) return 'limited';
    if (NEEDS_INTERNET_TOOLS.includes(href)) return 'needs-internet';
    return 'limited'; // default for unknown tools
  }, []);

  return (
    <PWAContext.Provider value={{ isOnline, isInstalled, canInstall, installApp, getToolOfflineStatus }}>
      {/* Update notice — a slim banner in normal page flow at the very
        top, NOT a fixed/overlay toast: the old floating toast covered
        content and buttons, so it was disabled. In-flow it pushes
        content down instead of covering anything, and it never blocks
        interaction. Refresh loads the new service-worker version. */}
      {showUpdateBanner && (
        <div role="status" className="flex items-center justify-center gap-3 bg-[#102E26] px-4 py-2 text-white">
          <p className="min-w-0 truncate text-xs font-semibold sm:text-sm">
            Update available
          </p>
          <button
            type="button"
            onClick={refreshToUpdate}
            className="shrink-0 rounded-full bg-[#57D798] px-3 py-1 text-xs font-bold text-[#102E26] hover:brightness-110"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowUpdateBanner(false)}
            aria-label="Dismiss update notice"
            className="shrink-0 rounded-full px-2 py-1 text-xs font-bold text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </PWAContext.Provider>
  );
}
