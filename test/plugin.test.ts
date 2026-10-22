import { describe, expect, test } from "bun:test";
import hypha from "../index";
import { nightHex } from "../libs/color";

// The plugin's config:setup, run against a Starlight config, returning what
// it asked Starlight to change.
function setup(options: Parameters<typeof hypha>[0], starlight: Record<string, unknown> = {}) {
  const updates: Record<string, any> = {};
  const plugin = hypha(options);
  (plugin.hooks["config:setup"] as Function)({
    config: { title: "x", ...starlight },
    updateConfig: (u: object) => Object.assign(updates, u),
    addIntegration: () => {},
  });
  return updates;
}

describe("the plugin", () => {
  test("sets the night's hue, 225 unless given", () => {
    expect(setup(undefined).head[0]).toEqual({ tag: "style", content: ":root{--hue:225}" });
    expect(setup({ hue: 35 }).head[0]).toEqual({ tag: "style", content: ":root{--hue:35}" });
  });

  test("gives the browser the night as theme-color, unless the project does", () => {
    const meta = (u: any) => u.head.filter((e: any) => e.attrs?.name === "theme-color");
    expect(meta(setup({ hue: 225 }))).toEqual([{ tag: "meta", attrs: { name: "theme-color", content: "#0B0C0F" } }]);
    const own = { tag: "meta", attrs: { name: "theme-color", content: "#000000" } };
    expect(meta(setup({}, { head: [own] }))).toEqual([own]);
  });

  test("puts its sheet before the project's, and lets the project's components win", () => {
    const u = setup({}, { customCss: ["./own.css"], components: { Header: "./Header.astro" } });
    expect(u.customCss).toEqual(["starlight-theme-hypha/styles/theme.css", "./own.css"]);
    expect(u.components.Header).toBe("./Header.astro");
    expect(u.components.PageFrame).toBe("starlight-theme-hypha/components/PageFrame.astro");
  });

  test("keeps its sheet where the project names it", () => {
    const own = ["./tailwind.css", "starlight-theme-hypha/styles/theme.css", "./own.css"];
    expect(setup({}, { customCss: own }).customCss).toEqual(own);
  });

  test("leaves Expressive Code off when the project turns it off", () => {
    expect(setup({}, { expressiveCode: false }).expressiveCode).toBe(false);
  });

  test("refuses an option it does not know the shape of", () => {
    expect(() => hypha({ hue: 400 })).toThrow(/hue/);
    expect(() => hypha({ links: [{ label: "x", href: "x", icon: "star" as never }] })).toThrow(/links/);
  });
});

// WCAG's contrast of two sRGB hex colours.
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// hsl(h s% l%) as hex, as libs/color writes the night.
function hsl(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

test("the night's text reads at every hue", () => {
  for (let h = 0; h < 360; h += 5) {
    const night = hsl(h, 0.15, 0.05);
    expect(night.toUpperCase()).toBe(nightHex(h));
    expect(contrast(hsl(h, 0.1, 0.58), night)).toBeGreaterThan(5.5);
    expect(contrast(hsl(h, 0.15, 0.9), night)).toBeGreaterThan(14);
  }
});
