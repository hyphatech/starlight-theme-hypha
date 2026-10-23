import { expect, test } from "bun:test";
import { $ } from "bun";

// The example built on the theme: the wordmark is the project's title, the
// links and the repository its own, its sections tabs, the night its hue.
test("the example builds in the theme's frame", async () => {
  await $`bun --bun astro build --root example`.quiet();
  const html = await Bun.file(new URL("../_build/example/index.html", import.meta.url)).text();
  expect(html).toContain(":root{--hypha-hue:225}");
  expect(html).toContain('aria-label="hypha.example, home"');
  expect(html).toContain('class="site-header');
  expect(html).toContain('href="https://github.com/hyphatech/starlight-theme-hypha"');
  // The repository's facts are the build's; the browser asks GitHub nothing.
  expect(html).not.toContain("api.github.com");
  expect(html).toContain('aria-label="Sections"');
  // Search is the theme's, not Pagefind's UI; a page's groups are its trail.
  expect(html).toContain("<hypha-search");
  expect(html).not.toContain("pagefind-ui");
  expect(html).toMatch(/<a href="\/getting-started\/"[^>]*>\s*<svg[^>]*lucide-rocket/);
  expect(html).toContain('class="landing');
  expect(html).toContain("Hypha's look for Starlight.</h1>");
  expect(html).toContain('<meta name="theme-color" content="#0B0C0F"');
  // The theme's components in Tailwind's utilities, on hypha.pub's tokens,
  // all under the theme's prefix: none is a name a project's own can take.
  const sheets = await Promise.all(
    [...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"/g)].map(([, href]) => Bun.file(new URL(`../_build/example${href}`, import.meta.url)).text()),
  );
  const css = sheets.join("");
  expect(css).toContain("--hypha-color-ink:");
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
  const lone = await Bun.file(new URL("../_build/example/getting-started/index.html", import.meta.url)).text();
  expect(lone).not.toContain('id="starlight__sidebar"');
  const two = await Bun.file(new URL("../_build/example/reference/index.html", import.meta.url)).text();
  expect(two).toContain('id="starlight__sidebar"');
  expect(two).toMatch(/<span class="hypha:truncate">Reference<\/span>/);
  // Code's styles reach the page: linked, and never left in an attribute.
  const code = await Bun.file(new URL("../_build/example/getting-started/index.html", import.meta.url)).text();
  expect(code).toContain("<pre");
  expect(code).toMatch(/data-pagefind-meta="section"[^>]*>Start here</);
  expect(code).toMatch(/<link[^>]*ec\.[^>]*\.css/);
  expect(code).not.toContain("set:html");
  // Code's "Copied" is the theme's control, ink on the raised ground.
  const ec = await Promise.all(
    [...code.matchAll(/<link[^>]*href="([^"]*ec\.[^"]+\.css)"/g)].map(([, href]) => Bun.file(new URL(`../_build/example${href}`, import.meta.url)).text()),
  );
  expect(ec.join("")).toMatch(/tooltipSuccessBg:var\(--hypha-color-raised\)/);
  expect(css).toContain(".expressive-code .copy .feedback");
  // A splash page without a hero opens with its own landing: one title,
  // its program beside it, its features three to a row.
  const landing = await Bun.file(new URL("../_build/example/landing/index.html", import.meta.url)).text();
  expect(landing.match(/<h1\b/g)).toHaveLength(1);
  expect(landing).toContain("Widgets, written once.</h1>");
  expect(landing).toContain('class="landing-aside');
  expect(landing).toContain("hypha:lg:grid-cols-3");
  expect(landing).toMatch(/<a href="\/getting-started\/" class="hypha:btn[^"]*">\s*Install/);
  expect(landing).toMatch(/lucide-sparkles/);
  // A row of features lines up on the grid's rows, and the text's own
  // heading sizes stay out of a component's.
  expect(landing).toContain("hypha:grid-rows-subgrid");
  expect(css).toContain(".sl-markdown-content h3:not(:where(.not-content *))");
}, 120_000);
