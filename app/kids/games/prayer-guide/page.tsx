'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

const PRAYER_STEPS = [
  { id: 1, name: 'Takbir', arabic: 'الله أكبر', meaning: 'Allah is the Greatest', image: '🙌', description: 'Raise your hands to your ears and say "Allahu Akbar"' },
  { id: 2, name: 'Qiyam', arabic: 'القيام', meaning: 'Standing', image: '🧍', description: 'Stand with your hands folded over your chest' },
  { id: 3, name: 'Ruku', arabic: 'الركوع', meaning: 'Bowing', image: '🙇', description: 'Bow down with your hands on your knees, back straight' },
  { id: 4, name: 'Sujood', arabic: 'السجود', meaning: 'Prostration', image: '🕌', description: 'Place your forehead, nose, hands, knees, and toes on the ground' },
  { id: 5, name: 'Jalsa', arabic: 'الجلسة', meaning: 'Sitting', image: '🧎', description: 'Sit up straight after prostration' },
  { id: 6, name: 'Salam', arabic: 'السلام', meaning: 'Greeting', image: '👋', description: 'Turn your head right and left saying "Assalamu alaykum wa rahmatullah"' },
];

export default function PrayerGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    // Check if already completed
    const saved = localStorage.getItem('kids_completed_games');
    if (saved) {
      const completed = JSON.parse(saved);
      if (completed.includes('prayer-guide')) {
        setCompleted(true);
      }
    }
  }, []);

  const completeGame = () => {
    setCompleted(true);
    setShowCelebration(true);
    
    // Save completion
    const saved = localStorage.getItem('kids_completed_games');
    let completedGames = saved ? JSON.parse(saved) : [];
    if (!completedGames.includes('prayer-guide')) {
      completedGames.push('prayer-guide');
      localStorage.setItem('kids_completed_games', JSON.stringify(completedGames));
      setPointsEarned(100);
    }
    
    // Track in GA
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'game_completed', {
        event_category: 'kids_game',
        event_label: 'prayer_guide',
      });
    }
    
    setTimeout(() => setShowCelebration(false), 5000);
  };

  const nextStep = () => {
    if (currentStep < PRAYER_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeGame();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = PRAYER_STEPS[currentStep];

  if (completed) {
    return (
      <>
        <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <Script id="google-analytics" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_MEASUREMENT_ID}');` }} />
        
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-4 animate-bounce">🕌</div>
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">Masha'Allah! 🎉</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">You've learned how to pray!</p>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-lg font-bold text-emerald-600">+100 Points</p>
              <p className="text-sm text-gray-500">Prayer Guide Completed</p>
            </div>
            <Link href="/kids" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition">
              Back to Games 🎮
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script id="google-analytics" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_MEASUREMENT_ID}');` }} />

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <header className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/kids" className="text-white/80 hover:text-white text-sm">← Back</Link>
            <h1 className="font-bold">🕌 Learn to Pray</h1>
            <div className="text-sm">Step {currentStep + 1}/{PRAYER_STEPS.length}</div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          {/* Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
            <div className="text-center mb-4">
              <div className="text-8xl mb-3">{step.image}</div>
              <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{step.name}</h2>
              <p className="text-2xl font-arabic mt-2">{step.arabic}</p>
              <p className="text-sm text-gray-500 italic">{step.meaning}</p>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-6">
              <p className="text-center text-gray-700 dark:text-gray-300">{step.description}</p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex-1 py-3 rounded-xl font-medium transition ${
                  currentStep === 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                }`}
              >
                ← Previous
              </button>
              <button
                onClick={nextStep}
                className="flex-1 py-3 rounded-xl font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
              >
                {currentStep === PRAYER_STEPS.length - 1 ? '🎉 Complete! 🎉' : 'Next →'}
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-1">💡 Tip for Parents</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">Practice each step with your child. Repeat the Arabic words together.</p>
          </div>
        </main>

        {/* Celebration Overlay */}
        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/95 rounded-2xl p-6 text-center shadow-2xl animate-bounce pointer-events-auto">
              <div className="text-6xl mb-3">🎉🌟🕌</div>
              <h3 className="text-2xl font-bold text-emerald-600">Masha'Allah!</h3>
              <p>You completed the prayer guide!</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}