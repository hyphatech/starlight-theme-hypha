import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ExpressiveCodeTheme } from "@astrojs/starlight/expressive-code";
import tailwindcss from "@tailwindcss/vite";
import type { StarlightPlugin } from "@astrojs/starlight/types";
import { nightHex } from "./libs/color";
import { configSchema, type HyphaThemeUserConfig } from "./libs/config";
import { vitePluginHyphaTheme } from "./libs/vite";

export type { HyphaThemeUserConfig };

const sheet = "starlight-theme-hypha/styles/theme.css";
// A project on Tailwind imports `tailwindSheet` into its own build; one
// without gets `standalone`.
const standalone = "starlight-theme-hypha/styles/standalone.css";
const tailwindSheet = "starlight-theme-hypha/styles/tailwind.css";

// A project's own override of one wins.
const components = {
  ContentPanel: "starlight-theme-hypha/components/ContentPanel.astro",
  Footer: "starlight-theme-hypha/components/Footer.astro",
  Head: "starlight-theme-hypha/components/Head.astro",
  Header: "starlight-theme-hypha/components/Header.astro",
  Hero: "starlight-theme-hypha/components/Hero.astro",
  MobileMenuFooter: "starlight-theme-hypha/components/MobileMenuFooter.astro",
  PageFrame: "starlight-theme-hypha/components/PageFrame.astro",
  PageSidebar: "starlight-theme-hypha/components/PageSidebar.astro",
  PageTitle: "starlight-theme-hypha/components/PageTitle.astro",
  Search: "starlight-theme-hypha/components/Search.astro",
  SiteTitle: "starlight-theme-hypha/components/SiteTitle.astro",
  ThemeProvider: "starlight-theme-hypha/components/ThemeProvider.astro",
  ThemeSelect: "starlight-theme-hypha/components/ThemeSelect.astro",
  TwoColumnContent: "starlight-theme-hypha/components/TwoColumnContent.astro",
};

const codeTheme = () =>
  ExpressiveCodeTheme.fromJSONString(readFileSync(new URL("./styles/code-theme.json", import.meta.url), "utf-8"));

// Code as hypha.pub sets it: a panel on a rule, no shadow. Its styles stay
// linked: inlined, MDX's static optimisation leaves the `<style>` empty, its
// CSS in a literal `set:html` attribute.
const expressiveCode = {
  useStarlightUiThemeColors: false,
  styleOverrides: {
    borderRadius: "var(--radius-panel)",
    borderColor: "var(--color-rule)",
    codeBackground: "var(--color-panel)",
    codeFontFamily: "var(--font-mono)",
    codeFontSize: "0.875rem",
    codeLineHeight: "1.65",
    uiFontFamily: "var(--font-sans)",
    frames: {
      shadowColor: "transparent",
      editorTabBarBackground: "var(--color-panel)",
      editorActiveTabBackground: "var(--color-panel)",
      editorActiveTabIndicatorTopColor: "transparent",
      editorActiveTabIndicatorBottomColor: "var(--color-ink)",
      editorActiveTabForeground: "var(--color-graphite)",
      editorTabBarBorderBottomColor: "var(--color-rule)",
      terminalTitlebarBackground: "var(--color-panel)",
      terminalTitlebarBorderBottomColor: "var(--color-rule)",
      terminalBackground: "var(--color-panel)",
    },
  },
};

// Whether Vite's plugins, nested as a config may nest them, hold Tailwind's.
function hasTailwind(plugins: unknown): boolean {
  if (Array.isArray(plugins)) return plugins.some(hasTailwind);
  const name = (plugins as { name?: unknown } | null)?.name;
  return typeof name === "string" && name.startsWith("@tailwindcss/vite");
}

// Only the sheets the project names, not what they import in turn.
function importsTheme(customCss: string[], root: URL): boolean {
  return customCss.some((path) => {
    const file = new URL(path, root);
    return path.startsWith(".") && existsSync(file) && readFileSync(file, "utf-8").includes(tailwindSheet);
  });
}

export default function starlightThemeHypha(userConfig?: HyphaThemeUserConfig): StarlightPlugin {
  const parsed = configSchema.safeParse(userConfig ?? {});
  if (!parsed.success) {
    throw new Error(`starlight-theme-hypha: invalid options.\n${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n")}`);
  }
  const config = parsed.data;

  return {
    name: "starlight-theme-hypha",
    hooks: {
      "config:setup"({ config: starlight, astroConfig, logger, updateConfig, addIntegration, addRouteMiddleware }) {
        if (config.tabs) addRouteMiddleware({ entrypoint: "starlight-theme-hypha/route-middleware" });
        // One Tailwind build on a page: two undo each other's utilities.
        const onTailwind = hasTailwind(astroConfig.vite?.plugins);
        const own = starlight.customCss ?? [];
        if (onTailwind && !importsTheme(own, astroConfig.root)) {
          logger.warn(`The project builds with Tailwind: import "${tailwindSheet}" into its Tailwind sheet, or the theme's components go unstyled.`);
        }
        const sheets = onTailwind ? [sheet] : [standalone, sheet];
        const head = starlight.head ?? [];
        const hasThemeColor = head.some((entry) => entry.tag === "meta" && entry.attrs?.name === "theme-color");
        updateConfig({
          // The theme's first, so the project's can change its tokens, or
          // where the project names it.
          customCss: own.includes(sheet) ? own.flatMap((path) => (path === sheet ? sheets : [path])) : [...sheets, ...own],
          components: { ...components, ...starlight.components },
          ...(config.search ? {} : { pagefind: false }),
          head: [
            { tag: "style", content: `:root{--hue:${config.hue}}` },
            ...(hasThemeColor ? [] : [{ tag: "meta" as const, attrs: { name: "theme-color", content: nightHex(config.hue) } }]),
            ...head,
          ],
          expressiveCode:
            starlight.expressiveCode === false
              ? false
              : {
                  themes: [codeTheme()],
                  ...expressiveCode,
                  ...(typeof starlight.expressiveCode === "object" ? starlight.expressiveCode : {}),
                },
        });
        addIntegration({
          name: "starlight-theme-hypha-integration",
          hooks: {
            "astro:config:setup"({ updateConfig }) {
              const cacheDir = fileURLToPath(new URL("starlight-theme-hypha/", astroConfig.cacheDir ?? new URL("node_modules/.astro/", astroConfig.root)));
              updateConfig({ vite: { plugins: [onTailwind ? [] : tailwindcss(), vitePluginHyphaTheme(config, cacheDir)] } });
            },
          },
        });
      },
    },
  };
}
