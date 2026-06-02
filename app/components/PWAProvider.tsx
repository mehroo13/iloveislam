'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';

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
const FULL_OFFLINE_TOOLS = [
  '/dhikr', '/zakat', '/names', '/hijri', '/dua', '/kids',
  '/ramadan', '/sadaqah', '/will', '/inheritance', '/halal-finance',
  '/kaffarah', '/names-finder', '/eid', '/eid-adha', '/hadith',
  '/night', '/mizan',
];

const LIMITED_OFFLINE_TOOLS = [
  '/prayer-times', '/qibla', '/halal-scanner', '/quran',
];

const NEEDS_INTERNET_TOOLS = [
  '/mosque', '/travel', '/hajj',
];

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
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Register SW
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered:', registration.scope);

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
        setShowUpdateToast(true);
        setTimeout(() => setShowUpdateToast(false), 5000);
      }
    });
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
      {children}




      {/* Update Available Toast */}
      {showUpdateToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up">
          <div className="bg-blue-800 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
            <span className="text-lg">🔄</span>
            <div>
              <p className="text-sm font-semibold">App updated</p>
              <p className="text-xs text-blue-200">Refresh for the latest version</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}
