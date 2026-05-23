'use client';
// app/components/BackToTop.tsx
import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-4 z-50 w-10 h-10 rounded-full text-white shadow-xl flex items-center justify-center text-base transition-all hover:scale-110 active:scale-95"
      style={{ background: 'linear-gradient(135deg, #0a3d2e, #0d5238)' }}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}