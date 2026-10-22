// The night, hsl(hue 15% 5%), as hex: a browser's theme-color, which a
// meta tag cannot give as a CSS function every browser reads.
export function nightHex(hue: number): string {
  const s = 0.15;
  const l = 0.05;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}
