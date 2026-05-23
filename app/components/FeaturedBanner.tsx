'use client';
// app/components/FeaturedBanner.tsx
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface FeaturedTool {
  href: string;
  badge: string;
  title: string;
  desc: string;
  icon: string;
  gradient: string;
  accent: string;
}

interface Props {
  allTools: FeaturedTool[];
  onToolClick: (title: string) => void;
}

export default function FeaturedBanner({ allTools, onToolClick }: Props) {
  const dayIndex = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);

  const total = allTools.length;
  const currentIdx = (dayIndex + offset) % total;
  const tool = allTools[currentIdx];

  useEffect(() => {
    const timer = setInterval(() => advance('left'), 5000);
    return () => clearInterval(timer);
  }, [offset]);

  const advance = (dir: 'left' | 'right') => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setOffset(prev => dir === 'left' ? prev + 1 : (prev - 1 + total) % total);
      setAnimating(false);
    }, 220);
  };

  const dotsCount = Math.min(total, 7);
  const activeDot = currentIdx % dotsCount;

  return (
    <div className="mb-3 sm:mb-5 relative">
      <div className="rounded-2xl overflow-hidden" style={{ background: tool.gradient }}>
        <Link href={tool.href} onClick={() => onToolClick(tool.title)} className="block p-3 sm:p-4 group">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={{ background: `${tool.accent}18`, border: `1px solid ${tool.accent}30` }}
            >
              {tool.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold tracking-[0.18em] uppercase mb-0.5" style={{ color: tool.accent }}>{tool.badge}</p>
              <p className="text-white font-semibold text-sm leading-tight mb-0.5 truncate">{tool.title}</p>
              <p className="text-white/40 text-xs leading-tight truncate">{tool.desc}</p>
            </div>
            <div className="flex-shrink-0 text-sm transition-transform duration-200 group-hover:translate-x-1" style={{ color: tool.accent }}>→</div>
          </div>
        </Link>
        <div className="px-3 sm:px-4 pb-2.5 sm:pb-3 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: dotsCount }).map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-300"
                style={{ width: i === activeDot ? 16 : 6, height: 6, background: i === activeDot ? tool.accent : `${tool.accent}30` }} />
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={() => advance('right')} className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all active:scale-90" style={{ background: `${tool.accent}20`, color: tool.accent }} aria-label="Previous">‹</button>
            <button onClick={() => advance('left')} className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all active:scale-90" style={{ background: `${tool.accent}20`, color: tool.accent }} aria-label="Next">›</button>
          </div>
        </div>
      </div>
      <div className="absolute -top-2 -right-1 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: tool.accent, color: '#000' }}>
        {currentIdx + 1}/{total}
      </div>
    </div>
  );
}