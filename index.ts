import { readFileSync } from "node:fs";
import { ExpressiveCodeTheme } from "@astrojs/starlight/expressive-code";
import type { StarlightPlugin } from "@astrojs/starlight/types";
import { nightHex } from "./libs/color";
import { configSchema, type HyphaThemeUserConfig } from "./libs/config";
import { vitePluginHyphaTheme } from "./libs/vite";

export type { HyphaThemeUserConfig };

// The parts of Starlight's page the theme takes over: the page's frame is
// hypha.pub's grid, not Starlight's. A project's own override of one wins.
const components = {
  ContentPanel: "starlight-theme-hypha/components/ContentPanel.astro",
  Footer: "starlight-theme-hypha/components/Footer.astro",
  Header: "starlight-theme-hypha/components/Header.astro",
  MobileMenuFooter: "starlight-theme-hypha/components/MobileMenuFooter.astro",
  PageFrame: "starlight-theme-hypha/components/PageFrame.astro",
  PageSidebar: "starlight-theme-hypha/components/PageSidebar.astro",
  PageTitle: "starlight-theme-hypha/components/PageTitle.astro",
  SiteTitle: "starlight-theme-hypha/components/SiteTitle.astro",
  ThemeProvider: "starlight-theme-hypha/components/ThemeProvider.astro",
  ThemeSelect: "starlight-theme-hypha/components/ThemeSelect.astro",
  TwoColumnContent: "starlight-theme-hypha/components/TwoColumnContent.astro",
};

// hypha.pub's code theme, read as its palette is.
const codeTheme = () =>
  ExpressiveCodeTheme.fromJSONString(readFileSync(new URL("./styles/code-theme.json", import.meta.url), "utf-8"));

// Code as hypha.pub sets it: a panel on a rule, no shadow.
const expressiveCode = {
  useStarlightUiThemeColors: false,
  styleOverrides: {
    borderRadius: "var(--radius-panel)",
    borderColor: "var(--rule)",
    codeBackground: "var(--panel)",
    codeFontFamily: "var(--font-mono)",
    codeFontSize: "0.875rem",
    codeLineHeight: "1.65",
    uiFontFamily: "var(--font-sans)",
    frames: {
      shadowColor: "transparent",
      editorTabBarBackground: "var(--panel)",
      editorActiveTabBackground: "var(--panel)",
      editorActiveTabIndicatorTopColor: "transparent",
      editorActiveTabIndicatorBottomColor: "var(--paper)",
      editorActiveTabForeground: "var(--graphite)",
      editorTabBarBorderBottomColor: "var(--rule)",
      terminalTitlebarBackground: "var(--panel)",
      terminalTitlebarBorderBottomColor: "var(--rule)",
      terminalBackground: "var(--panel)",
    },
  },
};

export default function starlightThemeHypha(userConfig?: HyphaThemeUserConfig): StarlightPlugin {
  const parsed = configSchema.safeParse(userConfig ?? {});
  if (!parsed.success) {
    throw new Error(`starlight-theme-hypha: invalid options.\n${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n")}`);
  }
  const config = parsed.data;

  return {
    name: "starlight-theme-hypha",
    hooks: {
      "config:setup"({ config: starlight, updateConfig, addIntegration }) {
        const head = starlight.head ?? [];
        const hasThemeColor = head.some((entry) => entry.tag === "meta" && entry.attrs?.name === "theme-color");
        updateConfig({
          // The theme's first, so a project's own sheet can change any of its
          // tokens after it.
          customCss: ["starlight-theme-hypha/styles/theme.css", ...(starlight.customCss ?? [])],
          components: { ...components, ...starlight.components },
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
              updateConfig({ vite: { plugins: [vitePluginHyphaTheme(config)] } });
            },
          },
        });
      },
    },
  };
}
