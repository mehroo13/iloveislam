import type { Metadata } from "next";
import HalalScanner from "./components/HalalScanner";

export const metadata: Metadata = {
  title: "HalalScan — Free Halal Food Scanner | I Love Islam",
  description:
    "Scan any product barcode, QR code, or upload a photo to instantly find out if it's Halal, Haram, or Mashbooh. Free Islamic food scanner with ingredient-by-ingredient analysis.",
  keywords: [
    "halal scanner",
    "halal food checker",
    "haram ingredients",
    "halal barcode scanner",
    "is it halal",
    "mashbooh",
    "E numbers halal",
    "halal product checker",
    "Islamic food guide",
  ],
  openGraph: {
    title: "HalalScan — Free Halal Food Scanner",
    description:
      "Scan barcodes, QR codes, or upload product photos to instantly check if a product is Halal, Haram, or Mashbooh.",
    url: "https://www.iloveislam.life/halal-scanner",
    siteName: "I Love Islam",
    type: "website",
  },
};

export default function HalalScannerPage() {
  return <HalalScanner />;
}