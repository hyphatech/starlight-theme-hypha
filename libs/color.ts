// The theme's own roles as styles/tokens.css computes them, in sRGB, for
// theme-color and the tests. Change both together.

export type Scheme = "dark" | "light";
type Rgb = [number, number, number];

// hsl(h s l), s and l in 0..1.
export function hsl(h: number, s: number, l: number): Rgb {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function oklab([r, g, b]: Rgb): Rgb {
  const [lr, lg, lb] = [r, g, b].map(linear) as Rgb;
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgb.map((c) => Math.min(1, Math.max(0, gamma(c)))) as Rgb;
}

// `color-mix(in oklab, a p, b)`.
export function mix(a: Rgb, p: number, b: Rgb): Rgb {
  const [x, y] = [oklab(a), oklab(b)];
  return fromOklab(x.map((v, i) => v * p + y[i]! * (1 - p)) as Rgb);
}

// `oklch(from c L C h)`: an even lightness at every hue.
function oklchFrom(c: Rgb, L: number, C: number): Rgb {
  const [, a, b] = oklab(c);
  const h = Math.atan2(b, a);
  return fromOklab([L, C * Math.cos(h), C * Math.sin(h)]);
}

export function fromHex(h: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as Rgb;
}

// A colour's OKLab lightness moved away from its ground until `ok`.
export function toward(c: Rgb, ok: (c: Rgb) => boolean, ground: Rgb): Rgb {
  const [L, a, b] = oklab(c);
  const step = oklab(ground)[0] > 0.6 ? -0.005 : 0.005;
  let moved = c;
  for (let i = 0; i <= 200 && !ok(moved); i++) moved = fromOklab([Math.min(1, Math.max(0, L + step * i)), a, b]);
  return moved;
}

export function hex(c: Rgb): string {
  return `#${c.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

// WCAG's contrast.
export function contrast(a: Rgb, b: Rgb): number {
  const lum = (c: Rgb) => {
    const [r, g, bl] = c.map(linear) as Rgb;
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// The theme's own roles in a scheme.
export function roles(scheme: Scheme, hue: number, accent: number, tint: number) {
  const night = scheme === "dark";
  const ivory = night ? hsl(hue, 0.15 * tint, 0.05) : hsl(hue, 0.2 * tint, 0.975);
  const ink = night ? hsl(hue, 0.15 * tint, 0.9) : hsl(hue, 0.15 * tint, 0.12);
  return {
    ivory,
    ink,
    graphite: night ? hsl(hue, 0.1 * tint, 0.58) : hsl(hue, 0.08 * tint, 0.36),
    rule: night ? hsl(hue, 0.14 * tint, 0.17) : hsl(hue, 0.14 * tint, 0.87),
    accent: night ? hsl(accent, 0.72, 0.72) : oklchFrom(hsl(accent, 0.72, 0.5), 0.5, 0.13),
    panel: mix(ink, 0.04, ivory),
    raised: mix(ink, 0.07, ivory),
  };
}

// The ground as hex, for the browser's theme-color.
export function groundHex(scheme: Scheme, hue: number, tint = 1): string {
  return hex(roles(scheme, hue, hue, tint).ivory);
}
