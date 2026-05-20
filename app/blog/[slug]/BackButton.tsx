'use client';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="group inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-200 text-sm font-medium py-2 px-4 -ml-4 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 active:scale-95"
    >
      <span className="text-lg transition-transform group-hover:-translate-x-1">←</span>
      Back to Blog
    </button>
  );
}