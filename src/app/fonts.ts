import { Geist_Mono, IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";

/** Plus Jakarta Sans for Latin; IBM Plex Sans Arabic takes over for Arabic script. */
export const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
});

export const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  // Loaded when Arabic text appears, so English pages don't download it up front.
  preload: false,
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const fontVariables = `${jakarta.variable} ${plexArabic.variable} ${geistMono.variable}`;
