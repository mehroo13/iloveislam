"use client";

import { useEffect } from 'react';

const ADS_CLIENT = 'ca-pub-2264561932019289';
const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

export default function CMPConsent() {
  useEffect(() => {
    try {
      const v = localStorage.getItem('ads_consent');
      if (!v) {
        localStorage.setItem('ads_consent', 'granted');
        loadAds();
        loadAnalytics();
      } else if (v === 'granted') {
        loadAds();
        loadAnalytics();
      }
    } catch {}
  }, []);

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

  return null;
}
