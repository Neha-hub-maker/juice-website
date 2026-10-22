import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/config/site";
import { MotionProvider } from "@/components/MotionProvider";
import { SmoothScroll } from "@/components/SmoothScroll";
import { assets } from "@/data/assets";
import "./globals.css";

const display = localFont({
  src: "./fonts/fraunces-latin.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});
const sans = localFont({
  src: "./fonts/dm-sans-latin.woff2",
  variable: "--font-dm-sans",
  weight: "100 1000",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  ...(site.url ? { metadataBase: new URL(site.url) } : {}),
  title: `${site.name} | ${site.tagline}`,
  description: site.description,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    ...(site.url ? { url: site.url } : {}),
    images: [{ url: assets.splashTeal.path, width: assets.splashTeal.width, height: assets.splashTeal.height, alt: `${site.name}: a vibrant orange juice splash` }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: [assets.splashTeal.path],
  },
};

export const viewport: Viewport = { themeColor: "#10140f", colorScheme: "dark light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${display.variable} ${sans.variable}`}>
    <body><MotionProvider><SmoothScroll>{children}</SmoothScroll></MotionProvider></body>
  </html>;
}
