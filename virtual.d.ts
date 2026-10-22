declare module "virtual:starlight-theme-hypha/config" {
  const config: import("./libs/config").HyphaThemeConfig;
  export default config;
}

declare namespace App {
  interface Locals {
    // The tabs, where the theme's `tabs` is on.
    hyphaTabs?: { label: string; href: string; isCurrent: boolean }[];
  }
}
