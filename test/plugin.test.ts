import { describe, expect, test } from "bun:test";
import hypha from "../index";
import { onRequest } from "../libs/route-middleware";
import { contrast, groundHex, roles } from "../libs/color";
import { atBuild } from "../libs/github";
import { configSchema } from "../libs/config";
import { adopt, bar, layers, named, paletteCss } from "../libs/palettes";
import { fromHex, mix } from "../libs/color";
import { withBase } from "../libs/link";

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
  test("sets the theme's own palette's hue, accent and tint, hypha's unless given", () => {
    const vars = (o: Parameters<typeof hypha>[0]) => setup(o).head[0];
    expect(vars(undefined)).toEqual({ tag: "style", content: ":root{--hypha-hue:225;--hypha-accent-hue:231;--hypha-tint:1}" });
    // A hue alone takes its accent with it, as before palettes.
    expect(vars({ hue: 35 }).content).toBe(":root{--hypha-hue:35;--hypha-accent-hue:41;--hypha-tint:1}");
    expect(vars({ hue: 358 }).content).toContain("--hypha-accent-hue:4;");
    expect(vars({ accent: 200, tint: 0.5 }).content).toBe(":root{--hypha-hue:225;--hypha-accent-hue:200;--hypha-tint:0.5}");
  });

  test("gives a named palette's colours, in the theme's layer, and its code themes", () => {
    const u = setup({ palette: "gruvbox" });
    expect(u.head[1]).toEqual({ tag: "style", content: paletteCss("gruvbox") });
    // The layers' order first, as the theme's sheet states it, or the
    // theme's layer, named here before any sheet, would sit below Starlight's.
    expect(u.head[1].content).toStartWith("@layer base, starlight, hypha, theme, components, utilities;@layer hypha{:root:root{--hypha-color-ivory:#282828;--hypha-color-ink:#EBDBB2;");
    expect(u.head[1].content).toContain(":root:root[data-theme=light]{--hypha-color-ivory:#FBF1C7;");
    expect(u.expressiveCode.themes).toEqual(["gruvbox-dark-medium", "gruvbox-light-medium"]);
    expect(setup({ palette: "gruvbox", scheme: "light", themeSelect: false }).expressiveCode.themes).toEqual(["gruvbox-light-medium"]);
    const meta = u.head.filter((e: any) => e.attrs?.name === "theme-color").map((m: any) => m.attrs.content);
    expect(meta).toEqual(["#282828", "#FBF1C7"]);
    expect(setup({}).head.filter((e: any) => e.tag === "style")).toHaveLength(1);
  });

  test("gives the browser its scheme's ground as theme-color, unless the project does", () => {
    const meta = (u: any) => u.head.filter((e: any) => e.attrs?.name === "theme-color");
    expect(meta(setup({ hue: 225, scheme: "dark" }))).toEqual([{ tag: "meta", attrs: { name: "theme-color", content: "#0B0C0F" } }]);
    expect(meta(setup({ hue: 225 })).map((m: any) => m.attrs.media)).toEqual(["(prefers-color-scheme: dark)", "(prefers-color-scheme: light)"]);
    expect(meta(setup({ scheme: "light" }))[0].attrs.content).toBe(groundHex("light", 225));
    const own = { tag: "meta", attrs: { name: "theme-color", content: "#000000" } };
    expect(meta(setup({}, { head: [own] }))).toEqual([own]);
  });

  test("gives code a theme for each scheme the site has", () => {
    const names = (o: Parameters<typeof hypha>[0]) => setup(o).expressiveCode.themes.map((t: any) => t.name);
    expect(names({})).toEqual(["hypha-night", "hypha-day"]);
    // A default scheme with the control still shows both.
    expect(names({ scheme: "dark" })).toEqual(["hypha-night", "hypha-day"]);
    expect(names({ scheme: "dark", themeSelect: false })).toEqual(["hypha-night"]);
    expect(names({ scheme: "light", themeSelect: false })).toEqual(["hypha-day"]);
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

  test("starts in its scheme, and shows both where a visitor can change it or the system can", () => {
    const schemes = (o: object) => configSchema.parse(o).schemes;
    expect(configSchema.parse({}).themeSelect).toBe(true);
    expect(schemes({})).toEqual(["dark", "light"]);
    expect(schemes({ scheme: "dark" })).toEqual(["dark", "light"]);
    expect(schemes({ themeSelect: false })).toEqual(["dark", "light"]);
    expect(schemes({ scheme: "light", themeSelect: false })).toEqual(["light"]);
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
    expect(() => hypha({ palette: "neon" as never })).toThrow(/palette/);
    expect(() => hypha({ palette: "nord" as never })).toThrow(/palette/);
    expect(() => hypha({ palette: "catppuccin", hue: 30 })).toThrow(/named palette has its own colours/);
    expect(() => hypha({ tint: 2.5 })).toThrow(/tint/);
    expect(() => hypha({ scheme: "dim" as never })).toThrow(/scheme/);
    expect(() => hypha({ links: [{ label: "x", href: "x", icon: "star" as never }] })).toThrow(/links/);
  });
});

// Text is ink and graphite, on the ground and on the surfaces; the accent
// marks the ground as a focus ring, and the ground is selected text on it.
// Every hue, accent and tint a project can choose, in either scheme.
test("the text reads in both schemes, at every hue and tint", () => {
  for (const scheme of ["dark", "light"] as const) {
    for (const tint of [0, 0.5, 1, 1.5, 2]) {
      for (let hue = 0; hue < 360; hue += 5) {
        const r = roles(scheme, hue, hue, tint);
        for (const ground of [r.ivory, r.panel, r.raised]) {
          expect(contrast(r.ink, ground)).toBeGreaterThan(12);
          expect(contrast(r.graphite, ground)).toBeGreaterThan(4.5);
        }
        expect(contrast(r.rule, r.ivory)).toBeGreaterThan(1.15);
      }
    }
    for (let accent = 0; accent < 360; accent += 3) {
      const r = roles(scheme, 225, accent, 1);
      expect(contrast(r.accent, r.ivory)).toBeGreaterThan(4.5);
    }
  }
});

test("puts a root-relative link under the site's base, and no other", () => {
  expect(withBase("/guides/", "/docs/")).toBe("/docs/guides/");
  expect(withBase("/guides/", "/docs")).toBe("/docs/guides/");
  expect(withBase("/docs/guides/", "/docs/")).toBe("/docs/guides/");
  expect(withBase("/docs", "/docs/")).toBe("/docs");
  expect(withBase("/documents/", "/docs/")).toBe("/docs/documents/");
  expect(withBase("/guides/", "/")).toBe("/guides/");
  for (const other of ["guides/", "../guides/", "https://x.dev/", "//x.dev/", "#top", "mailto:a@b.c"]) expect(withBase(other, "/docs/")).toBe(other);
});

// The tones of asides, badges and changed lines are the accent's colour at
// hues of their own, in theme.css: each marks the ground and the panel it
// sits on, in either scheme, at every hue and tint around it.
test("the tones mark their panels in both schemes", async () => {
  const sheet = await Bun.file(new URL("../styles/theme.css", import.meta.url)).text();
  const hues = [...sheet.matchAll(/--hypha-tone-\w+: hsl\((\d+) 72% 72%\)/g)].map((m) => Number(m[1]));
  expect(hues).toEqual([150, 40, 5]);
  for (const scheme of ["dark", "light"] as const) {
    for (const tint of [0, 1, 2]) {
      for (let hue = 0; hue < 360; hue += 15) {
        for (const tone of hues) {
          const r = roles(scheme, hue, tone, tint);
          expect(contrast(r.accent, r.panel)).toBeGreaterThan(3);
        }
      }
    }
  }
});

// A named palette, adopted, meets the same bar in both schemes: its text on
// the ground and the surfaces, its secondary text, and its marks -- the
// accent, the tones -- on the ground and the panel; its lines still show.
test("every named palette reads in both schemes", () => {
  for (const name of Object.keys(named) as (keyof typeof named)[]) {
    for (const scheme of ["dark", "light"] as const) {
      const r = adopt(name, scheme);
      const ivory = fromHex(r.ivory);
      const ink = fromHex(r.ink);
      const grounds = [ivory, mix(ink, 0.04, ivory), mix(ink, 0.07, ivory)];
      const least = (c: string) => Math.min(...grounds.map((g) => contrast(fromHex(c), g)));
      expect([name, scheme, least(r.ink) >= bar.ink]).toEqual([name, scheme, true]);
      expect([name, scheme, least(r.graphite) >= bar.graphite]).toEqual([name, scheme, true]);
      for (const mark of [r.accent, r.tip, r.caution, r.danger]) expect([name, scheme, mark, least(mark) >= bar.mark]).toEqual([name, scheme, mark, true]);
      expect(contrast(fromHex(r.rule), ivory)).toBeGreaterThan(1.15);
    }
  }
});

// Adopted, not redrawn: a palette's published colours stand where they meet
// the bar, and a moved one keeps its hue.
test("a named palette keeps its published colours where they read", () => {
  expect(adopt("github", "dark")).toMatchObject({ ivory: "#0D1117", ink: "#E6EDF3", accent: "#4493F8" });
  expect(adopt("catppuccin", "dark")).toMatchObject({ ivory: "#1E1E2E", ink: "#CDD6F4", accent: "#CBA6F7" });
  expect(adopt("gruvbox", "light")).toMatchObject({ ivory: "#FBF1C7", ink: "#3C3836", accent: "#AF3A03" });
});

test("the night at hypha's hue is the night it was", () => {
  expect(groundHex("dark", 225)).toBe("#0B0C0F");
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
test("a palette's sheet orders the layers as the theme's sheet does", async () => {
  const standalone = await Bun.file(new URL("../styles/standalone.css", import.meta.url)).text();
  expect(standalone).toContain(`@layer ${layers};`);
});

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
