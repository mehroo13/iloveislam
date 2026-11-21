// app/hifz/layout.tsx — hub wrapper. Shared treatment for /hifz/*:
// warm paper background, centred reading column.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.iloveislam.life'),
};

export default function HifzLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F7F5EF] text-[#1C2420]">{children}</div>;
}
