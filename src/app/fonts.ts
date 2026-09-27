import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";

/**
 * IBM Plex has Latin and Arabic cuts drawn as one family, so bilingual menus
 * (and "AED 25" inside Arabic text) keep a single voice.
 */
export const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
});

export const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  // Loaded when Arabic text appears, so English pages don't download it up front.
  preload: false,
});

export const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  preload: false,
});

export const fontVariables = `${plex.variable} ${plexArabic.variable} ${plexMono.variable}`;
