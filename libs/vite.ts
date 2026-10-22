import type { ViteUserConfig } from "astro";
import type { HyphaThemeConfig } from "./config";

const moduleId = "virtual:starlight-theme-hypha/config";
const resolvedModuleId = `\0${moduleId}`;

// The theme's options, for its components to import.
export function vitePluginHyphaTheme(config: HyphaThemeConfig): NonNullable<ViteUserConfig["plugins"]>[number] {
  return {
    name: "vite-plugin-starlight-theme-hypha",
    resolveId(id) {
      return id === moduleId ? resolvedModuleId : undefined;
    },
    load(id) {
      return id === resolvedModuleId ? `export default ${JSON.stringify(config)};` : undefined;
    },
  };
}
