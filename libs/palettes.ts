// Known palettes, from their published colours, with Shiki's code themes.
// Secondary text and lines are mixed from text and ground. A colour below the
// bar moves in lightness only, as far as it must.

import { contrast, fromHex, groundHex, hex, mix, toward, type Scheme } from "./color";

type Colours = { ivory: string; ink: string; accent: string; tip: string; caution: string; danger: string };
type Palette = { dark: Colours; light: Colours; code: { dark: string; light: string } };

export const named = {
  catppuccin: {
    // Mocha and Latte; the accent, mauve.
    dark: { ivory: "#1e1e2e", ink: "#cdd6f4", accent: "#cba6f7", tip: "#a6e3a1", caution: "#f9e2af", danger: "#f38ba8" },
    light: { ivory: "#eff1f5", ink: "#4c4f69", accent: "#8839ef", tip: "#40a02b", caution: "#df8e1d", danger: "#d20f39" },
    code: { dark: "catppuccin-mocha", light: "catppuccin-latte" },
  },
  "rose-pine": {
    // Rosé Pine and Dawn; the accent, iris.
    dark: { ivory: "#191724", ink: "#e0def4", accent: "#c4a7e7", tip: "#9ccfd8", caution: "#f6c177", danger: "#eb6f92" },
    light: { ivory: "#faf4ed", ink: "#575279", accent: "#907aa9", tip: "#56949f", caution: "#ea9d34", danger: "#b4637a" },
    code: { dark: "rose-pine", light: "rose-pine-dawn" },
  },
  gruvbox: {
    // Medium contrast; the accent, orange.
    dark: { ivory: "#282828", ink: "#ebdbb2", accent: "#fe8019", tip: "#b8bb26", caution: "#fabd2f", danger: "#fb4934" },
    light: { ivory: "#fbf1c7", ink: "#3c3836", accent: "#af3a03", tip: "#79740e", caution: "#b57614", danger: "#9d0006" },
    code: { dark: "gruvbox-dark-medium", light: "gruvbox-light-medium" },
  },
  everforest: {
    // Medium contrast; the accent, green.
    dark: { ivory: "#2d353b", ink: "#d3c6aa", accent: "#a7c080", tip: "#83c092", caution: "#dbbc7f", danger: "#e67e80" },
    light: { ivory: "#fdf6e3", ink: "#5c6a72", accent: "#8da101", tip: "#35a77c", caution: "#dfa000", danger: "#f85552" },
    code: { dark: "everforest-dark", light: "everforest-light" },
  },
  kanagawa: {
    // Wave and Lotus; the accent, crystal blue.
    dark: { ivory: "#1f1f28", ink: "#dcd7ba", accent: "#7e9cd8", tip: "#98bb6c", caution: "#e6c384", danger: "#e46876" },
    light: { ivory: "#f2ecbc", ink: "#545464", accent: "#4d699b", tip: "#6f894e", caution: "#77713f", danger: "#c84053" },
    code: { dark: "kanagawa-wave", light: "kanagawa-lotus" },
  },
  solarized: {
    // base03 and base3 grounds, base1 and base01 text; the accent, blue.
    dark: { ivory: "#002b36", ink: "#93a1a1", accent: "#268bd2", tip: "#859900", caution: "#b58900", danger: "#dc322f" },
    light: { ivory: "#fdf6e3", ink: "#586e75", accent: "#268bd2", tip: "#859900", caution: "#b58900", danger: "#dc322f" },
    code: { dark: "solarized-dark", light: "solarized-light" },
  },
  github: {
    // Primer's default dark and light.
    dark: { ivory: "#0d1117", ink: "#e6edf3", accent: "#4493f8", tip: "#3fb950", caution: "#d29922", danger: "#f85149" },
    light: { ivory: "#ffffff", ink: "#1f2328", accent: "#0969da", tip: "#1a7f37", caution: "#9a6700", danger: "#d1242f" },
    code: { dark: "github-dark", light: "github-light" },
  },
  "night-owl": {
    dark: { ivory: "#011627", ink: "#d6deeb", accent: "#82aaff", tip: "#addb67", caution: "#ecc48d", danger: "#ef5350" },
    light: { ivory: "#fbfbfb", ink: "#403f53", accent: "#4876d6", tip: "#08916a", caution: "#daaa01", danger: "#de3d3b" },
    code: { dark: "night-owl", light: "night-owl-light" },
  },
  vitesse: {
    dark: { ivory: "#121212", ink: "#dbd7ca", accent: "#4d9375", tip: "#4d9375", caution: "#e6cc77", danger: "#cb7676" },
    light: { ivory: "#ffffff", ink: "#393a34", accent: "#1c6b48", tip: "#1e754f", caution: "#bda437", danger: "#ab5959" },
    code: { dark: "vitesse-dark", light: "vitesse-light" },
  },
} as const satisfies Record<string, Palette>;

export type NamedPalette = keyof typeof named;

// The theme's own palette's defaults.
export const hypha = { hue: 225, accent: 231, tint: 1 } as const;
export const paletteNames = ["hypha", ...(Object.keys(named) as NamedPalette[])] as ["hypha", ...NamedPalette[]];
export type PaletteName = (typeof paletteNames)[number];

// The layer order, as in styles/standalone.css.
export const layers = "base, starlight, hypha, theme, components, utilities";

// Least contrast on the ground and surfaces: text, secondary text, marks.
export const bar = { ink: 7, graphite: 4.5, mark: 3 };

// A named palette's roles in a scheme, as hex, met to the bar.
export function adopt(name: NamedPalette, scheme: Scheme) {
  const c = named[name][scheme];
  const ivory = fromHex(c.ivory);
  // The ground, panel and raised surface, as the theme mixes them.
  const surfaces = (ink: ReturnType<typeof fromHex>) => [ivory, mix(ink, 0.04, ivory), mix(ink, 0.07, ivory)];
  const ink = toward(fromHex(c.ink), (x) => Math.min(...surfaces(x).map((s) => contrast(x, s))) >= bar.ink + 0.02, ivory);
  const grounds = surfaces(ink);
  // A hair over the bar survives rounding to hex.
  const meets = (target: number) => (x: ReturnType<typeof fromHex>) => Math.min(...grounds.map((s) => contrast(x, s))) >= target + 0.02;
  return {
    ivory: hex(ivory),
    ink: hex(ink),
    graphite: hex(toward(mix(ink, 0.72, ivory), meets(bar.graphite), ivory)),
    rule: hex(mix(ink, 0.16, ivory)),
    accent: hex(toward(fromHex(c.accent), meets(bar.mark), ivory)),
    tip: hex(toward(fromHex(c.tip), meets(bar.mark), ivory)),
    caution: hex(toward(fromHex(c.caution), meets(bar.mark), ivory)),
    danger: hex(toward(fromHex(c.danger), meets(bar.mark), ivory)),
  };
}

// A named palette as CSS for the head. It states the layer order first: it
// comes before the sheets, and a layer first named here would rank lowest.
export function paletteCss(name: NamedPalette): string {
  const block = (scheme: Scheme) => {
    const r = adopt(name, scheme);
    return [
      `--hypha-color-ivory:${r.ivory}`,
      `--hypha-color-ink:${r.ink}`,
      `--hypha-color-graphite:${r.graphite}`,
      `--hypha-color-rule:${r.rule}`,
      `--hypha-color-accent:${r.accent}`,
      `--hypha-tone-tip:${r.tip}`,
      `--hypha-tone-caution:${r.caution}`,
      `--hypha-tone-danger:${r.danger}`,
    ].join(";");
  };
  return `@layer ${layers};@layer hypha{:root:root{${block("dark")}}:root:root[data-theme=light]{${block("light")}}}`;
}

// A palette at a glance: its dark ground, its light ground, its accent.
export function swatch(name: PaletteName) {
  if (name === "hypha") return { night: groundHex("dark", hypha.hue), day: groundHex("light", hypha.hue), accent: `hsl(${hypha.accent} 72% 72%)` };
  return { night: adopt(name, "dark").ivory, day: adopt(name, "light").ivory, accent: adopt(name, "dark").accent };
}
