import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import hypha from "starlight-theme-hypha";

// A site on the theme, for its test and a look at a change: two pages
// with what a reference holds -- headings, a table, code, a list.
const repository = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  outDir: `${repository}_build/example`,
  integrations: [
    starlight({
      title: "example",
      favicon: "/favicon-32.png",
      plugins: [
        hypha({
          links: [
            { label: "Hypha Stack", href: "https://hyphatech.io/stack", icon: "layers" },
            { label: "GitHub", href: "https://github.com/hyphatech/starlight-theme-hypha", icon: "code-xml" },
          ],
        }),
      ],
      sidebar: [
        { label: "Start here", items: ["index"] },
        { label: "Reference", items: ["reference"] },
      ],
    }),
  ],
});
