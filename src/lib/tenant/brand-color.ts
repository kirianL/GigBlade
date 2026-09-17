import { normalizeBrandColor } from "@/domain/site-color";

export { normalizeBrandColor };

export type SiteBrandCssVars = {
  "--site-bg": string;
  "--site-nav-bg": string;
  "--site-surface": string;
  "--site-fg": string;
  "--site-muted": string;
  "--site-accent": string;
  "--site-card-border": string;
  "--site-card-hover": string;
};

function parseRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channelLuminance(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseRgb(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isLightBrandColor(hex: string): boolean {
  const luminance = relativeLuminance(hex);
  return contrastRatio(luminance, 0) >= contrastRatio(1, luminance);
}

export function mixHex(hex: string, toward: string, amount: number): string {
  const [r, g, b] = parseRgb(hex);
  const [tr, tg, tb] = parseRgb(toward);
  const mix = (from: number, to: number) =>
    Math.round(from + (to - from) * amount);
  return `#${[mix(r, tr), mix(g, tg), mix(b, tb)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function brandColorCssVars(hex: string): SiteBrandCssVars {
  const light = isLightBrandColor(hex);
  const fg = light ? "#000000" : "#ffffff";
  return {
    "--site-bg": hex,
    "--site-nav-bg": hex,
    "--site-surface": mixHex(hex, "#000000", 0.12),
    "--site-fg": fg,
    "--site-muted": light ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)",
    "--site-accent": fg,
    "--site-card-border": light
      ? "rgba(0, 0, 0, 0.2)"
      : "rgba(255, 255, 255, 0.15)",
    "--site-card-hover": light
      ? "rgba(0, 0, 0, 0.1)"
      : "rgba(255, 255, 255, 0.05)",
  };
}
