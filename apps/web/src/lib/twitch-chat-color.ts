const DEFAULT_COLORS = [
  "#FF0000",
  "#0000FF",
  "#008000",
  "#B22222",
  "#FF7F50",
  "#9ACD32",
  "#FF4500",
  "#2E8B57",
  "#DAA520",
  "#D2691E",
  "#5F9EA0",
  "#1E90FF",
  "#FF69B4",
  "#8A2BE2",
  "#00FF7F",
];

function hash(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + (char.codePointAt(0) ?? 0)) | 0;
  return Math.abs(value);
}

function toRgb(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) return null;
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function mix(rgb: [number, number, number], target: number, amount: number): string {
  const out = rgb.map((v) => Math.round(v + (target - v) * amount));
  return `rgb(${out.join(", ")})`;
}

export function chatNameColor(
  color: string | undefined,
  login: string,
  theme: "dark" | "light",
): string {
  const rgb = toRgb(color || DEFAULT_COLORS[hash(login) % DEFAULT_COLORS.length] || "#9146FF");
  if (!rgb) return "inherit";
  const lum = luminance(rgb);
  if (theme === "dark" && lum < 0.18) return mix(rgb, 255, Math.min(0.75, (0.18 - lum) * 4 + 0.25));
  if (theme === "light" && lum > 0.45) return mix(rgb, 0, Math.min(0.6, (lum - 0.45) * 2 + 0.2));
  return `rgb(${rgb.join(", ")})`;
}
