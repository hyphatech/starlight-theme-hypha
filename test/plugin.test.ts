import { describe, expect, test } from "bun:test";
import hypha from "../index";
import { onRequest } from "../libs/route-middleware";
import { nightHex } from "../libs/color";
import { atBuild } from "../libs/github";
import { configSchema } from "../libs/config";

// The plugin's config:setup, run against a Starlight config, returning what
// it asked Starlight to change.
function setup(options: Parameters<typeof hypha>[0], starlight: Record<string, unknown> = {}, vite: object = {}) {
  const updates: Record<string, any> = { middleware: [], warnings: [] };
  const plugin = hypha(options);
  (plugin.hooks["config:setup"] as Function)({
    config: { title: "x", ...starlight },
    astroConfig: { root: new URL("file:///nowhere/"), vite },
    logger: { warn: (m: string) => updates.warnings.push(m) },
    updateConfig: (u: object) => Object.assign(updates, u),
    addIntegration: () => {},
    addRouteMiddleware: (m: { entrypoint: string }) => updates.middleware.push(m.entrypoint),
  });
  return updates;
}

describe("the plugin", () => {
  test("sets the night's hue, 225 unless given", () => {
    expect(setup(undefined).head[0]).toEqual({ tag: "style", content: ":root{--hypha-hue:225}" });
    expect(setup({ hue: 35 }).head[0]).toEqual({ tag: "style", content: ":root{--hypha-hue:35}" });
  });

  test("gives the browser the night as theme-color, unless the project does", () => {
    const meta = (u: any) => u.head.filter((e: any) => e.attrs?.name === "theme-color");
    expect(meta(setup({ hue: 225 }))).toEqual([{ tag: "meta", attrs: { name: "theme-color", content: "#0B0C0F" } }]);
    const own = { tag: "meta", attrs: { name: "theme-color", content: "#000000" } };
    expect(meta(setup({}, { head: [own] }))).toEqual([own]);
  });

  test("puts its sheet before the project's, and lets the project's components win", () => {
    const u = setup({}, { customCss: ["./own.css"], components: { Header: "./Header.astro" } });
    expect(u.customCss).toEqual(["starlight-theme-hypha/styles/standalone.css", "starlight-theme-hypha/styles/theme.css", "./own.css"]);
    expect(u.components.Header).toBe("./Header.astro");
    expect(u.components.PageFrame).toBe("starlight-theme-hypha/components/PageFrame.astro");
  });

  test("keeps its sheet where the project names it", () => {
    const own = ["./tailwind.css", "starlight-theme-hypha/styles/theme.css", "./own.css"];
    const tailwind = { plugins: [{ name: "@tailwindcss/vite:scan" }] };
    const sheets = ["./tailwind.css", "starlight-theme-hypha/styles/standalone.css", "starlight-theme-hypha/styles/theme.css", "./own.css"];
    expect(setup({}, { customCss: own }, tailwind).customCss).toEqual(sheets);
    expect(setup({}, { customCss: own }).customCss).toEqual(sheets);
  });

  test("builds the theme's own sheet, with the project's Tailwind where it has one", () => {
    // The Vite plugins the theme's integration adds to the project's.
    const plugins = (vite: object) => {
      let integration: any;
      (hypha({}).hooks["config:setup"] as Function)({
        config: { title: "x" },
        astroConfig: { root: new URL("file:///nowhere/"), vite },
        logger: { warn: () => {} },
        updateConfig: () => {},
        addIntegration: (i: unknown) => (integration = i),
        addRouteMiddleware: () => {},
      });
      let added: any[] = [];
      integration.hooks["astro:config:setup"]({ updateConfig: (u: any) => (added = u.vite.plugins.flat()) });
      return added.map((p) => p.name as string);
    };
    const tailwind = { plugins: [[{ name: "@tailwindcss/vite:scan" }], { name: "other" }] };
    expect(plugins({})).toContain("@tailwindcss/vite:scan");
    expect(plugins(tailwind)).not.toContain("@tailwindcss/vite:scan");
    // The theme's build is its own, prefixed, beside the project's.
    const u = setup({}, {}, tailwind);
    expect(u.customCss).toEqual(["starlight-theme-hypha/styles/standalone.css", "starlight-theme-hypha/styles/theme.css"]);
    expect(u.warnings).toEqual([]);
  });

  test("turns Pagefind off with search", () => {
    expect(setup({ search: false }).pagefind).toBe(false);
    expect(setup({}).pagefind).toBeUndefined();
  });

  test("reads the repository as a name, or with its stats off", () => {
    expect(configSchema.parse({ github: "o/r" }).github).toEqual({ repo: "o/r", stats: true });
    expect(configSchema.parse({ github: { repo: "o/r", stats: false } }).github).toEqual({ repo: "o/r", stats: false });
    expect(configSchema.parse({}).github).toBeUndefined();
  });

  test("takes a link to this site or another", () => {
    expect(configSchema.parse({ links: [{ label: "Changes", href: "/changes/" }] }).links[0].href).toBe("/changes/");
  });

  test("leaves Expressive Code off when the project turns it off", () => {
    expect(setup({}, { expressiveCode: false }).expressiveCode).toBe(false);
  });

  test("splits the sidebar into tabs only when asked", () => {
    expect(setup({}).middleware).toEqual([]);
    expect(setup({ tabs: true }).middleware).toEqual(["starlight-theme-hypha/route-middleware"]);
    expect(setup({ tabs: { Reference: "book-open" } }).middleware).toEqual(["starlight-theme-hypha/route-middleware"]);
  });

  test("refuses an option it does not know the shape of", () => {
    expect(() => hypha({ github: "https://github.com/hyphatech/x" })).toThrow(/github/);
    expect(() => hypha({ tabs: { Reference: "star" as never } })).toThrow(/tabs/);
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

// A selector of theme.css that reaches into a page's content below its own
// children -- `.sl-markdown-content .card`, not `.sl-markdown-content > p` --
// skips what a page marks `not-content`, as Starlight's own rules do: there a
// project shows its own components, whose classes, `.card` among them, the
// theme's would otherwise restyle.
test("the sheet leaves a page's not-content alone", async () => {
  const sheet = await Bun.file(new URL("../styles/theme.css", import.meta.url)).text();
  // A selector list split at its top-level commas, never one inside `:is()`.
  const split = (list: string) => {
    const parts = [""];
    let depth = 0;
    for (const c of list) {
      if (c === "(") depth++;
      if (c === ")") depth--;
      if (c === "," && depth === 0) parts.push("");
      else parts[parts.length - 1] += c;
    }
    return parts.map((s) => s.trim());
  };
  const selectors = [...sheet.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{/g)].flatMap((m) => split(m[1]!));
  const reaching = selectors.filter((s) => /\.sl-markdown-content\s+[^>\s]/.test(s));
  expect(reaching.length).toBeGreaterThan(0);
  expect(reaching.filter((s) => !s.includes(":where(.not-content *)"))).toEqual([]);
});

// Every variable the theme's sheets declare by hand is its own, `--hypha-`,
// or one of Starlight's it sets, `--sl-`; its Tailwind tokens are prefixed by
// the build. A project's design system, or a palette of the theme's, then
// changes one without the other.
test("the sheets declare only the theme's own variables", async () => {
  for (const name of ["theme.css", "tokens.css"]) {
    const sheet = await Bun.file(new URL(`../styles/${name}`, import.meta.url)).text();
    const outsideTheme = sheet.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@theme[^{]*\{[^}]*\}/g, "");
    const declared = [...outsideTheme.matchAll(/(?:^|[;{\s])(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]!);
    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter((v) => !/^--(hypha|sl)-/.test(v))).toEqual([]);
  }
});

// Every rule of the theme's sheets is in its layer, `hypha`, so a project's
// styles win over it; what stands outside is Tailwind's own, which the build
// places in `hypha.theme` and `hypha.utilities`.
test("the sheets keep their rules in the theme's layer", async () => {
  for (const name of ["theme.css", "tokens.css", "standalone.css"]) {
    const sheet = (await Bun.file(new URL(`../styles/${name}`, import.meta.url)).text()).replace(/\/\*[\s\S]*?\*\//g, "");
    // The sheet's top-level statements and blocks, each by its prelude.
    const top: string[] = [];
    let depth = 0;
    let prelude = "";
    for (const c of sheet) {
      if (c === "{") {
        if (depth === 0) top.push(prelude.trim());
        depth++;
      } else if (c === "}") {
        depth--;
        prelude = "";
      } else if (depth === 0) {
        if (c === ";") {
          top.push(prelude.trim());
          prelude = "";
        } else prelude += c;
      }
    }
    const outside = top.filter((p) => p && !/^@(layer hypha$|layer [\w.,\s]+$|theme\b|utility\b|import\b|source\b)/.test(p));
    expect(outside).toEqual([]);
  }
});

// A sidebar of two groups and a page, with the current page in the second.
const link = (label: string, href: string, isCurrent = false) => ({ type: "link", label, href, isCurrent, badge: undefined, attrs: {} });
const group = (label: string, entries: unknown[]) => ({ type: "group", label, entries, collapsed: true, badge: undefined });

describe("the tabs", () => {
  test("are the sidebar's top-level entries, the sidebar the open tab's group alone", () => {
    const locals: any = {
      starlightRoute: {
        sidebar: [
          group("Start here", [link("Getting Started", "/")]),
          group("Reference", [group("Options", [link("Hue", "/hue/"), link("Tabs", "/tabs/", true)])]),
          link("Changes", "/changes/"),
        ],
      },
    };
    onRequest({ locals } as never, async () => {});
    expect(locals.hyphaTabs).toEqual([
      { label: "Start here", href: "/", isCurrent: false },
      { label: "Reference", href: "/hue/", isCurrent: true },
      { label: "Changes", href: "/changes/", isCurrent: false },
    ]);
    expect(locals.starlightRoute.sidebar.map((e: any) => [e.label, e.collapsed])).toEqual([["Reference", false]]);
  });

  test("leave the only page of its tab without a sidebar", () => {
    const locals: any = {
      starlightRoute: {
        sidebar: [group("Start here", [link("Getting Started", "/")]), group("Reference", [link("Options", "/options/", true)])],
      },
    };
    onRequest({ locals } as never, async () => {});
    expect(locals.starlightRoute.sidebar).toEqual([]);
  });
});

describe("the repository's facts", () => {
  const dir = () => `${process.env.TMPDIR ?? "/tmp"}/hypha-github-${crypto.randomUUID()}`;
  const keep = async (cacheDir: string, repo: string, at: number) =>
    Bun.write(`${cacheDir}/github.json`, JSON.stringify({ [repo]: { at, facts: { version: "1.0.0", stars: 7, forks: 2 } } }));

  test("are the last build's when GitHub fails", async () => {
    const cacheDir = dir();
    await keep(cacheDir, "o/stale", 0);
    const real = globalThis.fetch;
    globalThis.fetch = (async () => new Response("rate limited", { status: 403 })) as unknown as typeof fetch;
    try {
      expect(await atBuild("o/stale", cacheDir)).toEqual({ version: "1.0.0", stars: 7, forks: 2 });
    } finally {
      globalThis.fetch = real;
    }
  });

  test("are not asked again within the hour", async () => {
    const cacheDir = dir();
    await keep(cacheDir, "o/fresh", Date.now());
    let asked = 0;
    const real = globalThis.fetch;
    globalThis.fetch = (async () => (asked++, new Response("{}"))) as unknown as typeof fetch;
    try {
      expect((await atBuild("o/fresh", cacheDir))?.stars).toBe(7);
      expect(asked).toBe(0);
    } finally {
      globalThis.fetch = real;
    }
  });
});
