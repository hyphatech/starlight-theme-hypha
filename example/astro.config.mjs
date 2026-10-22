import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import hypha from "starlight-theme-hypha";

// A site on the theme, for its test and a look at a change: a landing page,
// then two sections, as tabs, of pages with what a reference holds -- headings, a table, code,
// a list -- and the theme's repository in the header.
const repository = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  outDir: `${repository}_build/example`,
  integrations: [
    starlight({
      title: "example",
      favicon: "/favicon-32.png",
      plugins: [
        hypha({
          github: "hyphatech/starlight-theme-hypha",
          tabs: true,
          links: [{ label: "Hypha Stack", href: "https://hyphatech.io/stack", icon: "layers" }],
        }),
      ],
      sidebar: [
        { label: "Start here", items: ["getting-started"] },
        { label: "Reference", items: ["reference"] },
      ],
    }),
  ],
});
