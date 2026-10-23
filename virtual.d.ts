declare module "virtual:starlight-theme-hypha/config" {
  const config: import("./libs/config").HyphaThemeConfig;
  export default config;
  export const cacheDir: string;
}

declare namespace App {
  interface Locals {
    // The tabs, where the theme's `tabs` is on.
    hyphaTabs?: { label: string; href: string; isCurrent: boolean }[];
    // The groups the page is in, where the tabs have cut the sidebar down.
    hyphaTrail?: string[];
  }
}
