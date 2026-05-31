import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kids Islamic Games — Fun & Educational | I Love Islam",
  description:
    "Free Islamic games for kids! Memory match, prayer guide, Arabic letters, dua learning, and 5 pillars quiz. 100% free, no ads, no sign-up. Help your children learn about Islam through play.",
  keywords: [
    "Islamic games for kids",
    "kids Islamic learning",
    "Islamic memory game",
    "learn prayer for kids",
    "Arabic letters for kids",
    "Islamic quiz",
    "5 pillars of Islam game",
    "free Islamic games",
    "children Islamic education",
  ],
  openGraph: {
    title: "Kids Islamic Games — Fun & Educational | I Love Islam",
    description:
      "Free Islamic games for kids! Memory match, prayer guide, Arabic letters, and more. 100% free, no ads.",
    url: "https://www.iloveislam.life/kids",
    siteName: "I Love Islam",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kids Islamic Games — Fun & Educational | I Love Islam",
    description: "Free Islamic games for kids! Memory match, prayer guide, Arabic letters, and more.",
  },
};

export default function KidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Islamic Education Through Play</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Teaching children about Islam from a young age is one of the most important responsibilities of Muslim parents. The Prophet Muhammad (peace be upon him) said: &quot;Every one of you is a shepherd and is responsible for his flock&quot; (Bukhari and Muslim). Our Kids Islamic Games Hub makes learning about Islam fun, engaging, and interactive for children of all ages.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Research shows that children learn best through play and interactive experiences. Our games are designed by educators to combine entertainment with meaningful Islamic education. Each game teaches fundamental concepts of Islam — from the five pillars to Arabic letters, from prayer movements to essential duas — in a way that children find enjoyable and memorable.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            All games are completely free, contain no advertisements, require no registration, and are safe for children to use independently. The content is age-appropriate and focuses on building a positive, loving relationship with Islam from childhood.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Games Available</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Islamic Memory Match:</strong> A classic memory card game featuring Islamic symbols, mosque images, and Arabic letters. Improves memory while familiarizing children with Islamic imagery.</p>
            <p><strong className="text-gray-800">Learn to Pray:</strong> An interactive step-by-step guide teaching children the movements and words of salah (prayer) in a visual, easy-to-follow format.</p>
            <p><strong className="text-gray-800">Arabic Letters:</strong> Learn the Arabic alphabet through interactive exercises. Each letter is presented with its name, sound, and position forms.</p>
            <p><strong className="text-gray-800">Dua Learning:</strong> Essential daily duas presented in a child-friendly format with Arabic text, transliteration, and simple English meanings.</p>
            <p><strong className="text-gray-800">Five Pillars Quiz:</strong> A fun quiz game testing knowledge of the five pillars of Islam with multiple-choice questions and instant feedback.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">For Parents</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• All games are ad-free and safe for unsupervised use</li>
            <li>• No personal data is collected from children</li>
            <li>• Content is reviewed for Islamic accuracy and age-appropriateness</li>
            <li>• Games work on tablets and phones — perfect for on-the-go learning</li>
            <li>• Consider playing together with your children to reinforce learning</li>
            <li>• New games and content are added regularly based on community feedback</li>
          </ul>
        </div>
      </section>
    </>
  );
}