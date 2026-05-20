'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      style={{
        background: 'none',
        border: 'none',
        fontSize: '1rem',
        cursor: 'pointer',
        color: '#2b8c4a',
        marginBottom: '1rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      ← Back to Blog
    </button>
  );
}