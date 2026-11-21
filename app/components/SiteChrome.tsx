'use client';
// app/components/SiteChrome.tsx — decides which chrome a route gets.
//
// App routes (the homepage hub `/` and every `/hifz/*` page) are the app:
// no website header/footer, bottom tabs instead (the Tarteel look — the
// user sees the app, not a website, on every screen). Every other page
// (About, Contact, Privacy, Terms) keeps the site header and footer.
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { BottomTabs } from '../hifz/components/AppShell';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isApp = pathname === '/' || pathname.startsWith('/hifz');
  if (isApp) {
    return (
      <>
        <div className="flex-1 pb-20">{children}</div>
        <BottomTabs />
      </>
    );
  }
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
