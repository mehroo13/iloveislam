"use client";

import { useEffect, useState } from 'react';

const ADS_CLIENT = 'ca-pub-2264561932019289';
const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

export default function CMPConsent() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem('ads_consent');
      setConsent(v);
      if (v === 'granted') {
        loadAds();
        loadAnalytics();
      }
    } catch {}
  }, []);

  function accept() {
    try { localStorage.setItem('ads_consent', 'granted'); setConsent('granted'); loadAds(); loadAnalytics(); } catch {}
  }

  function decline() {
    try { localStorage.setItem('ads_consent', 'declined'); setConsent('declined'); } catch {}
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

  if (consent === 'granted' || consent === 'declined') return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 z-50">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center justify-between gap-3 border shadow-lg">
        <div className="text-sm text-gray-700 dark:text-gray-200">We use ads to support the site. May we show personalized ads?</div>
        <div className="flex items-center gap-2">
          <button onClick={decline} aria-label="Decline personalized ads" className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm">No thanks</button>
          <button onClick={accept} aria-label="Accept personalized ads" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm">Yes, show ads</button>
        </div>
      </div>
    </div>
  );
}
