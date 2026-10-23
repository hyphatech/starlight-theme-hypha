import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightThemeHypha from "starlight-theme-hypha";

// A site on the theme, for its test and a look at a change: a landing page,
// then two sections, as tabs, of pages with what a reference holds -- headings, a table, code,
// a list -- and the theme's repository in the header.
const repository = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  outDir: `${repository}_build/example`,
  integrations: [
    starlight({
      title: "example",
      logo: { src: "starlight-theme-hypha/assets/hypha.webp" },
      favicon: "/favicon-32.png",
      plugins: [
        starlightThemeHypha({
          brand: "hypha",
          github: "hyphatech/starlight-theme-hypha",
          tabs: { "Start here": "rocket", Reference: "book-open" },
          links: [{ label: "Starlight", href: "https://starlight.astro.build", icon: "book-open" }],
        }),
      ],
      sidebar: [
        { label: "Start here", items: ["getting-started"] },
        { label: "Reference", items: ["reference"] },
      ],
    }),
  ],
});
