import type { CSSProperties } from "react";

type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHex = (rgb: RGB) =>
  "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");

const luminance = ([r, g, b]: RGB) => {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** The accent every restaurant page uses while restaurant colors are off. */
const NEUTRAL_ACCENT = "#1a1917";

const WHITE: RGB = [255, 255, 255];
const INK: RGB = [23, 20, 15];
const DARK_BG: RGB = [23, 22, 20];

const onColor = (bg: RGB) => (contrast(bg, WHITE) >= 3.4 ? "#ffffff" : "#17140f");

/**
 * Turns one brand hex into light/dark-mode accent tokens that stay legible:
 * near-black brands get lifted in dark mode, and button text flips between
 * white and ink depending on contrast.
 */
export function accentStyle(hex: string): CSSProperties {
  // Per-restaurant colors are switched off for now: every page uses the neutral
  // ink accent. To bring them back, delete this line (and the editor field's removal).
  const base = hexToRgb(NEUTRAL_ACCENT);
  void hex;
  let dark = base;
  for (let t = 0.12; contrast(dark, DARK_BG) < 4.5 && t <= 0.9; t += 0.06) {
    dark = mix(base, WHITE, t);
  }
  // Keep light-mode text readable on white surfaces.
  let light = base;
  for (let t = 0.08; contrast(light, WHITE) < 3.2 && t <= 0.6; t += 0.06) {
    light = mix(base, INK, t);
  }
  return {
    "--accent-light": rgbToHex(light),
    "--accent-dark": rgbToHex(dark),
    "--on-accent-light": onColor(light),
    "--on-accent-dark": onColor(dark),
  } as CSSProperties;
}
