import { expect, test } from "bun:test";
import { $ } from "bun";

// The docs built on the theme: the wordmark is the project's title, the
// links and the repository its own, its sections tabs, its palette hypha's,
// in either scheme.
// A file of the build by its href, under the site's base.
const built = (href: string) => Bun.file(new URL(`../_build/docs${href.replace(/^\/starlight-theme-hypha/, "")}`, import.meta.url)).text();

test("the docs build in the theme's frame", async () => {
  // As a host builds it: under `bun test`, NODE_ENV is `test`, which Vite
  // builds as development, search disabled.
  await $`bun --bun astro build --root docs`.env({ ...process.env, NODE_ENV: "production" }).quiet();
  const html = await Bun.file(new URL("../_build/docs/index.html", import.meta.url)).text();
  expect(html).toContain(":root{--hypha-hue:225;--hypha-accent-hue:231;--hypha-tint:1}");
  expect(html).toContain('aria-label="hypha.starlight, home"');
  expect(html).toContain('class="site-header');
  expect(html).toContain('href="https://github.com/hyphatech/starlight-theme-hypha"');
  // The repository's facts are the build's; the browser asks GitHub nothing.
  expect(html).not.toContain("api.github.com");
  expect(html).toContain('aria-label="Sections"');
  // Search is the theme's, not Pagefind's UI; a page's groups are its trail.
  expect(html).toContain("<hypha-search");
  // Its script works: a development build keeps the branch that disables it.
  const search = html.match(/<script type="module" src="([^"]*Search[^"]+\.js)"/)![1]!;
  expect(await built(search)).not.toMatch(/\.dev,\w+\.disabled=!0/);
  expect(html).not.toContain("pagefind-ui");
  expect(html).toMatch(/<a href="\/starlight-theme-hypha\/getting-started\/"[^>]*>\s*<svg[^>]*lucide-rocket/);
  expect(html).toContain('class="landing');
  expect(html).toContain("Hypha's look for Starlight.</h1>");
  expect(html).toContain('<meta name="theme-color" content="#0B0C0F" media="(prefers-color-scheme: dark)"');
  // The scheme's control, and the mark for each scheme.
  expect(html).toContain("<hypha-theme-select");
  expect(html).toMatch(/<img src="[^"]*hypha\.[^"]*webp"[^>]*data-theme=light/);
  expect(html).toMatch(/<img src="[^"]*hypha-day\.[^"]*webp"[^>]*data-theme=dark/);
  // The theme's components in Tailwind's utilities, on Hypha's tokens,
  // all under the theme's prefix: none is a name a project's own can take.
  const sheets = await Promise.all(
    [...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"/g)].map(([, href]) => built(href!)),
  );
  const css = sheets.join("");
  expect(css).toContain("--hypha-color-ink:");
  // The day, the theme's own, turns the same roles.
  expect(css).toMatch(/\[data-theme=light\]\{--hypha-color-ivory:/);
  expect(css).toMatch(/\.hypha\\:max-w-page\{/);
  expect(css).toMatch(/\.hypha\\:row-link\{/);
  expect(css).not.toContain("--color-ink:");
  // The theme's layer above Starlight's and below a project's, and its
  // header's height known to Starlight's anchors.
  const layers = [...css.matchAll(/@layer ([\w.,\s-]+)[;{]/g)].flatMap((m) => m[1]!.split(",").map((l) => l.trim().split(".")[0]!));
  const order = layers.filter((l, i) => layers.indexOf(l) === i && l !== "properties");
  expect(order).toEqual(["base", "starlight", "hypha", "theme", "components", "utilities"]);
  expect(css).toContain(":root:has(.site-header .site-tabs){--sl-nav-height:calc(4rem + 1px + 3rem)}");
  expect(css).not.toMatch(/[^:]\.(max-w-page|row-link|text-ink|bg-panel)\{/);
  // A tab's only page has no sidebar; a tab of two has one, named in the
  // phone's sheet by the tab's name.
  const lone = await Bun.file(new URL("../_build/docs/getting-started/index.html", import.meta.url)).text();
  expect(lone).not.toContain('id="starlight__sidebar"');
  const two = await Bun.file(new URL("../_build/docs/options/index.html", import.meta.url)).text();
  expect(two).toContain('id="starlight__sidebar"');
  expect(two).toMatch(/<span class="hypha:truncate">Reference<\/span>/);
  // Code's styles reach the page: linked, and never left in an attribute.
  const code = await Bun.file(new URL("../_build/docs/markdown/index.html", import.meta.url)).text();
  expect(code).toContain("<pre");
  expect(code).toMatch(/data-pagefind-meta="section"[^>]*>Reference</);
  expect(code).toMatch(/<link[^>]*ec\.[^>]*\.css/);
  expect(code).not.toContain("set:html");
  // Expressive Code's <Code> renders beside the theme's options: they stay
  // JSON, as it asks. A console block's copy text is set by the page.
  expect(code).toContain('data-code="export const widget = () => &#x27;one&#x27;;"');
  expect(code).toContain('querySelectorAll(`pre[data-language="console"]`)');
  // Code's "Copied" is the theme's control, ink on the raised ground.
  const ec = await Promise.all(
    [...code.matchAll(/<link[^>]*href="([^"]*ec\.[^"]+\.css)"/g)].map(([, href]) => built(href!)),
  );
  expect(ec.join("")).toMatch(/tooltipSuccessBg:var\(--hypha-color-raised\)/);
  expect(css).toContain(".expressive-code .copy .feedback");
  // A splash page without a hero opens with its own landing: one title,
  // its program beside it, its features three to a row.
  const landing = await Bun.file(new URL("../_build/docs/landing/index.html", import.meta.url)).text();
  expect(landing.match(/<h1\b/g)).toHaveLength(1);
  expect(landing).toContain("Widgets, written once.</h1>");
  expect(landing).toContain('class="landing-aside');
  expect(landing).toContain("hypha:lg:grid-cols-3");
  // Its links, written from the root, under the site's base.
  expect(landing).toMatch(/<a href="\/starlight-theme-hypha\/getting-started\/" class="hypha:btn[^"]*">\s*Install/);
  const markdown = await Bun.file(new URL("../_build/docs/markdown/index.html", import.meta.url)).text();
  expect(markdown).toContain('<a href="/starlight-theme-hypha/colours/">try a palette</a>');
  expect(markdown).toMatch(/href="\/starlight-theme-hypha\/getting-started\/"[^>]*>[\s\S]{0,200}Getting started/);
  expect(landing).toMatch(/lucide-sparkles/);
  // A row of features lines up on the grid's rows, and the text's own
  // heading sizes stay out of a component's.
  expect(landing).toContain("hypha:grid-rows-subgrid");
  expect(css).toContain(".sl-markdown-content h3:not(:where(.not-content *))");
}, 120_000);
