import { expect, test } from "bun:test";
import { $ } from "bun";

const built = (href: string) => Bun.file(new URL(`../_build/docs${href.replace(/^\/starlight-theme-hypha/, "")}`, import.meta.url)).text();

test("the docs build in the theme's frame", async () => {
  // Under `bun test`, NODE_ENV is `test`: Vite would build for development,
  // without search.
  await $`bun --bun astro build --root docs`.env({ ...process.env, NODE_ENV: "production" }).quiet();
  const html = await Bun.file(new URL("../_build/docs/index.html", import.meta.url)).text();
  expect(html).toContain(":root{--hypha-hue:225;--hypha-accent-hue:231;--hypha-tint:1}");
  expect(html).toContain('aria-label="hypha.starlight, home"');
  expect(html).toContain('class="site-header');
  expect(html).toContain('href="https://github.com/hyphatech/starlight-theme-hypha"');
  expect(html).toMatch(/<a href="https:\/\/github\.com\/hyphatech\/starlight-theme-hypha"[^>]*class="hypha:tab-link"/);
  // The build's facts, then the browser's, from the component's own script,
  // inlined.
  expect(html).toContain('<hypha-github class="hypha:contents" data-repo="hyphatech/starlight-theme-hypha"');
  expect(html).toMatch(/customElements\.define\(.hypha-github./);
  expect(html).toContain("api.github.com");
  expect(html).toContain('aria-label="Sections"');
  expect(html).toContain("<hypha-search");
  // A development build would keep the branch that disables search.
  const search = html.match(/<script type="module" src="([^"]*Search[^"]+\.js)"/)![1]!;
  expect(await built(search)).not.toMatch(/\.dev,\w+\.disabled=!0/);
  expect(html).not.toContain("pagefind-ui");
  expect(html).toMatch(/<a href="\/starlight-theme-hypha\/getting-started\/"[^>]*>\s*<svg[^>]*lucide-rocket/);
  expect(html).toContain('class="landing');
  expect(html).toContain("Hypha's look for Starlight.</h1>");
  expect(html).toContain('<meta name="theme-color" content="#0B0C0F" media="(prefers-color-scheme: dark)"');
  expect(html).toContain("data-pill");
  expect(html).toMatch(/<img src="[^"]*hypha\.[^"]*webp"[^>]*data-theme=light/);
  expect(html).toMatch(/<img src="[^"]*hypha-day\.[^"]*webp"[^>]*data-theme=dark/);
  const sheets = await Promise.all(
    [...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"/g)].map(([, href]) => built(href!)),
  );
  const css = sheets.join("");
  expect(css).toContain("--hypha-color-ink:");
  expect(css).toMatch(/\[data-theme=light\]\{--hypha-color-ivory:/);
  expect(css).toMatch(/\.hypha\\:max-w-page\{/);
  expect(css).toMatch(/\.hypha\\:row-link\{/);
  expect(css).not.toContain("--color-ink:");
  const layers = [...css.matchAll(/@layer ([\w.,\s-]+)[;{]/g)].flatMap((m) => m[1]!.split(",").map((l) => l.trim().split(".")[0]!));
  const order = layers.filter((l, i) => layers.indexOf(l) === i && l !== "properties");
  expect(order).toEqual(["base", "starlight", "hypha", "theme", "components", "utilities"]);
  expect(css).toContain(":root:has(.site-header .site-tabs){--sl-nav-height:calc(4rem + 1px + 3rem)}");
  expect(css).not.toMatch(/[^:]\.(max-w-page|row-link|text-ink|bg-panel)\{/);
  const lone = await Bun.file(new URL("../_build/docs/getting-started/index.html", import.meta.url)).text();
  expect(lone).not.toContain('id="starlight__sidebar"');
  const two = await Bun.file(new URL("../_build/docs/options/index.html", import.meta.url)).text();
  expect(two).toContain('id="starlight__sidebar"');
  expect(two).toMatch(/<span class="hypha:truncate">Reference<\/span>/);
  // MDX's static optimisation can leave inlined styles in an attribute.
  const code = await Bun.file(new URL("../_build/docs/markdown/index.html", import.meta.url)).text();
  expect(code).toContain("<pre");
  expect(code).toMatch(/data-pagefind-meta="section"[^>]*>Reference</);
  expect(code).toMatch(/<link[^>]*ec\.[^>]*\.css/);
  expect(code).not.toContain("set:html");
  expect(code).toContain('data-code="export const widget = () => &#x27;one&#x27;;"');
  expect(code).toContain('querySelectorAll(`pre[data-language="console"]`)');
  const ec = await Promise.all(
    [...code.matchAll(/<link[^>]*href="([^"]*ec\.[^"]+\.css)"/g)].map(([, href]) => built(href!)),
  );
  expect(ec.join("")).toMatch(/tooltipSuccessBg:var\(--hypha-color-raised\)/);
  expect(css).toContain(".expressive-code .copy .feedback");
  const landing = await Bun.file(new URL("../_build/docs/landing/index.html", import.meta.url)).text();
  expect(landing.match(/<h1\b/g)).toHaveLength(1);
  expect(landing).toContain("Widgets, written once.</h1>");
  expect(landing).toContain('class="landing-aside');
  expect(landing).toContain("hypha:lg:grid-cols-3");
  expect(landing).toMatch(/<a href="\/starlight-theme-hypha\/getting-started\/" class="hypha:btn[^"]*">\s*Install/);
  const markdown = await Bun.file(new URL("../_build/docs/markdown/index.html", import.meta.url)).text();
  expect(markdown).toContain('<a href="/starlight-theme-hypha/colours/">try a palette</a>');
  expect(markdown).toMatch(/href="\/starlight-theme-hypha\/getting-started\/"[^>]*>[\s\S]{0,200}Getting started/);
  expect(landing).toMatch(/lucide-sparkles/);
  expect(landing).toContain("hypha:grid-rows-subgrid");
  expect(css).toContain(".sl-markdown-content h3:not(:where(.not-content *))");
}, 120_000);

test("a landing page's features are second level headings", async () => {
  const html = await built("/landing/index.html");
  expect(html).toMatch(/<h2 class="[^"]*hypha:font-serif[^"]*">[\s\S]*?One plugin\s*<\/h2>/);
  expect(html).not.toMatch(/<h3[^>]*>[\s\S]*?One plugin/);
});

test("the 404 page is the theme's own", async () => {
  const html = await built("/404.html");
  expect(html).toMatch(/<h1 id="_top"[^>]*>Nothing is written here\.<\/h1>/);
  expect(html).toContain("Back to the start");
});
