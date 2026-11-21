'use client';

import { useEffect, useState } from 'react';

const ADS_CLIENT = 'ca-pub-2264561932019289';
const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

// Cookie / ads consent (2026-11-21 SEO + AdSense fix).
//
// Before this change the component silently wrote `granted` into
// localStorage on first visit and loaded the AdSense script and Google
// Analytics without asking — that is not valid consent for personalised
// advertising under Google's EU user-consent policy, and AdSense
// reviewers look for a real choice. Now the visitor gets a small,
// non-intrusive banner and the scripts load only after they accept.
// Declining loads nothing. The choice is stored on the device only.
export default function CMPConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('ads_consent');
      if (v === 'granted') {
        loadAds();
        loadAnalytics();
      } else if (v !== 'denied') {
        // No choice stored yet — ask. Nothing loads until they accept.
        setShowBanner(true);
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  function choose(granted: boolean) {
    try {
      localStorage.setItem('ads_consent', granted ? 'granted' : 'denied');
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
          <a href="/privacy" className="font-semibold text-[#146B4D] underline">
            Privacy Policy
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className="rounded-full border border-[#e5e0d3] bg-white px-4 py-2 text-sm font-semibold text-[#1C2420] hover:bg-[#F7F5EF]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="rounded-full bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
