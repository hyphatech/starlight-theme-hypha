import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ExpressiveCodeTheme } from "@astrojs/starlight/expressive-code";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import starlightThemeHypha from "starlight-theme-hypha";
import { named } from "starlight-theme-hypha/palettes";

// The theme's docs, on GitHub Pages and built by the test. Markdown links
// name the base, which Starlight doesn't add. Its own Tailwind sits beside
// the theme's, as a project's would.
const repository = fileURLToPath(new URL("..", import.meta.url));
const base = "/starlight-theme-hypha";

// Every palette's code themes, for the Colours page's picker. The head script
// names each block's theme in `data-theme`. A selector function would be
// cleaner, but <Code> needs JSON options here, and an ec.config.mjs beside
// the theme's options links a stylesheet that is never written.
const own = (file) => ExpressiveCodeTheme.fromJSONString(readFileSync(new URL(`../styles/${file}`, import.meta.url), "utf-8"));
const codes = {
  hypha: ["hypha-night", "hypha-day"],
  ...Object.fromEntries(Object.entries(named).map(([name, { code }]) => [name, [code.dark, code.light]])),
};

export default defineConfig({
  site: "https://hyphatech.github.io",
  base,
  outDir: `${repository}_build/docs`,
  vite: { plugins: [tailwindcss()] },
  integrations: [
    starlight({
      title: "starlight",
      description: "Hypha's look for Starlight: readable at any hue, in light and dark, and clear of your own styles.",
      logo: { dark: "starlight-theme-hypha/assets/hypha.webp", light: "starlight-theme-hypha/assets/hypha-day.webp" },
      favicon: "/favicon-32.png",
      customCss: ["./src/styles/site.css"],
      expressiveCode: { themes: [own("code-theme.json"), own("code-theme-day.json"), ...Object.values(codes).slice(1).flat()], useStarlightDarkModeSwitch: false },
      head: [
        // The visit's palette, before paint, and each code block's theme.
        {
          tag: "script",
          content: `(()=>{const r=document.documentElement,codes=${JSON.stringify(codes)};try{const k=JSON.parse(sessionStorage.getItem("hypha-docs-palette"));if(k){if(k.css){const s=document.createElement("style");s.id="hypha-docs-palette";s.textContent=k.css;document.head.append(s);r.dataset.palette=k.palette}for(const[n,v]of Object.entries(k.vars??{}))r.style.setProperty(n,v)}}catch{}const code=()=>{const n=codes[r.dataset.palette??"hypha"][r.dataset.theme==="light"?1:0];for(const e of document.querySelectorAll(".expressive-code"))if(e.dataset.theme!==n)e.dataset.theme=n};const parse=new MutationObserver(code);parse.observe(document,{subtree:true,childList:true});document.addEventListener("DOMContentLoaded",()=>{parse.disconnect();code()});new MutationObserver(code).observe(r,{attributes:true,attributeFilter:["data-theme","data-palette"]})})()`,
        },
      ],
      plugins: [
        starlightThemeHypha({
          brand: "hypha",
          github: "hyphatech/starlight-theme-hypha",
          tabs: { "Start here": "rocket", Guides: "compass", Reference: "book-open" },
          links: [{ label: "Starlight", href: "https://starlight.astro.build", icon: "starlight" }],
        }),
      ],
      sidebar: [
        { label: "Start here", items: ["getting-started"] },
        { label: "Guides", items: ["colours", "header", "landing-pages", "customising"] },
        { label: "Reference", items: ["options", "tokens", "markdown"] },
      ],
    }),
  ],
});
