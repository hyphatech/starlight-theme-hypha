import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ExpressiveCodeTheme } from "@astrojs/starlight/expressive-code";
import tailwindcss from "@tailwindcss/vite";
import type { StarlightPlugin } from "@astrojs/starlight/types";
import { nightHex } from "./libs/color";
import { configSchema, type HyphaThemeUserConfig } from "./libs/config";
import { vitePluginHyphaTheme } from "./libs/vite";

export type { HyphaThemeUserConfig };

const sheet = "starlight-theme-hypha/styles/theme.css";
// The theme's own Tailwind build, prefixed, on every page: a project's build
// beside it shares no name with it.
const standalone = "starlight-theme-hypha/styles/standalone.css";

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
    borderRadius: "var(--hypha-radius-panel)",
    borderColor: "var(--hypha-color-rule)",
    codeBackground: "var(--hypha-color-panel)",
    codeFontFamily: "var(--hypha-font-mono)",
    codeFontSize: "0.875rem",
    codeLineHeight: "1.65",
    uiFontFamily: "var(--hypha-font-sans)",
    frames: {
      shadowColor: "transparent",
      editorTabBarBackground: "var(--hypha-color-panel)",
      editorActiveTabBackground: "var(--hypha-color-panel)",
      editorActiveTabIndicatorTopColor: "transparent",
      editorActiveTabIndicatorBottomColor: "var(--hypha-color-ink)",
      editorActiveTabForeground: "var(--hypha-color-graphite)",
      editorTabBarBorderBottomColor: "var(--hypha-color-rule)",
      terminalTitlebarBackground: "var(--hypha-color-panel)",
      terminalTitlebarBorderBottomColor: "var(--hypha-color-rule)",
      terminalBackground: "var(--hypha-color-panel)",
      tooltipSuccessBackground: "var(--hypha-color-raised)",
      tooltipSuccessForeground: "var(--hypha-color-ink)",
    },
  },
};

// Whether Vite's plugins, nested as a config may nest them, hold Tailwind's.
function hasTailwind(plugins: unknown): boolean {
  if (Array.isArray(plugins)) return plugins.some(hasTailwind);
  const name = (plugins as { name?: unknown } | null)?.name;
  return typeof name === "string" && name.startsWith("@tailwindcss/vite");
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
      "config:setup"({ config: starlight, astroConfig, updateConfig, addIntegration, addRouteMiddleware }) {
        if (config.tabs) addRouteMiddleware({ entrypoint: "starlight-theme-hypha/route-middleware" });
        // A project on Tailwind builds the theme's sheet with its own plugin.
        const onTailwind = hasTailwind(astroConfig.vite?.plugins);
        const own = starlight.customCss ?? [];
        const sheets = [standalone, sheet];
        const head = starlight.head ?? [];
        const hasThemeColor = head.some((entry) => entry.tag === "meta" && entry.attrs?.name === "theme-color");
        updateConfig({
          // The theme's first, so the project's can change its tokens, or
          // where the project names it.
          customCss: own.includes(sheet) ? own.flatMap((path) => (path === sheet ? sheets : [path])) : [...sheets, ...own],
          components: { ...components, ...starlight.components },
          ...(config.search ? {} : { pagefind: false }),
          head: [
            { tag: "style", content: `:root{--hypha-hue:${config.hue}}` },
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
