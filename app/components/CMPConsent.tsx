'use client';

import { useEffect, useState } from 'react';

const ADS_CLIENT = 'ca-pub-2264561932019289';
const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

// Cookie / ads consent (2026-11-21 SEO + AdSense fix).
//
// The banner is rendered by default (showBanner starts true) so it is
// present in the server-rendered HTML and visible on first paint, and it
// is only hidden after hydration when a stored choice exists. Before,
// it started hidden and only appeared after a client-side effect — so a
// browser that never ran that effect (or already held a stored grant)
// never saw it at all. Declining loads nothing; accepting loads the
// AdSense and Analytics scripts. The choice is stored on the device
// only, and the app works fully either way.
//
// The storage key changed in 2026-11-21 because the version before the
// banner silently wrote `ads_consent=granted` into localStorage on first
// visit and loaded ads without ever asking — that was not a real choice.
// Every stored value under the old key is ignored (and deleted), so
// every visitor is asked once, properly. That old silent grant is also
// why the banner never appeared in the live browser check: the test
// browser already held it.
const CONSENT_KEY = 'ili_ads_consent';
const LEGACY_CONSENT_KEY = 'ads_consent';

export default function CMPConsent() {
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    try {
      // Drop the old silently-written grant: it was never a real choice.
      localStorage.removeItem(LEGACY_CONSENT_KEY);
      const v = localStorage.getItem(CONSENT_KEY);
      if (v === 'granted') {
        loadAds();
        loadAnalytics();
        setShowBanner(false);
      } else if (v === 'denied') {
        setShowBanner(false);
      }
      // No stored choice: keep the banner visible.
    } catch {
      // Storage unavailable: keep the banner visible so the visitor can choose.
    }
  }, []);

  function choose(granted: boolean) {
    try {
      localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
    } catch {}
    setShowBanner(false);
    if (granted) {
      loadAds();
      loadAnalytics();
    }
  }

  function loadAds() {
    if (typeof window === 'undefined') return;
    if ((window as any).adsbygoogleLoaded) return;
    const s = document.createElement('script');
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`;
    s.async = true;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
    (window as any).adsbygoogleLoaded = true;
  }

  function loadAnalytics() {
    if (typeof window === 'undefined') return;
    if ((window as any).gtagLoaded) return;
    const s = document.createElement('script');
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    s.async = true;
    document.head.appendChild(s);

    const inline = document.createElement('script');
    inline.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config','${GA_MEASUREMENT_ID}',{page_path: location.pathname, transport_type:'beacon'});`;
    document.head.appendChild(inline);
    (window as any).gtagLoaded = true;
  }

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e5e0d3] bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-[#1C2420]">
          We use cookies for advertising (Google AdSense) and analytics, so
          the app can stay free. You can accept or decline — the app works
          either way.{' '}
          <a href="/privacy" className="font-semibold text-[#1FA36B] underline">
            Privacy Policy
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className="rounded-full border border-[#e5e0d3] bg-white px-4 py-2 text-sm font-semibold text-[#1C2420] hover:bg-[#FFFBF2]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
