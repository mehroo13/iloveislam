'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  fallbackHref: string;
  label: string;
}

export default function BackButton({ fallbackHref, label }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // If there's history to go back to, use it — otherwise fall back to the href
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleBack}
      style={{
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        cursor: 'pointer',
        padding: 0,
        display: 'inline-block',
        marginBottom: 20,
        fontFamily: 'Georgia, serif',
      }}
    >
      {label}
    </button>
  );
}