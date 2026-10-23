import { expect, test } from "bun:test";
import { $ } from "bun";

// The example built on the theme: the wordmark is the project's title, the
// links and the repository its own, its sections tabs, the night its hue.
test("the example builds in the theme's frame", async () => {
  await $`bun --bun astro build --root example`.quiet();
  const html = await Bun.file(new URL("../_build/example/index.html", import.meta.url)).text();
  expect(html).toContain(":root{--hue:225}");
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
  expect(html).toContain('class="hero');
  expect(html).toContain("Hypha's look for Starlight.</h1>");
  expect(html).toContain('<meta name="theme-color" content="#0B0C0F"');
  // The theme's components in Tailwind's utilities, on hypha.pub's tokens.
  const sheets = await Promise.all(
    [...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"/g)].map(([, href]) => Bun.file(new URL(`../_build/example${href}`, import.meta.url)).text()),
  );
  const css = sheets.join("");
  expect(css).toContain("--color-ink:");
  expect(css).toMatch(/\.max-w-page\{/);
  expect(css).toMatch(/\.row-link\{/);
  // A tab's only page stands where its neighbours do, with no sidebar.
  const lone = await Bun.file(new URL("../_build/example/reference/index.html", import.meta.url)).text();
  expect(lone).not.toContain('id="starlight__sidebar"');
  // Code's styles reach the page: linked, and never left in an attribute.
  const code = await Bun.file(new URL("../_build/example/getting-started/index.html", import.meta.url)).text();
  expect(code).toContain("<pre");
  expect(code).toMatch(/data-pagefind-meta="section"[^>]*>Start here</);
  expect(code).toMatch(/<link[^>]*ec\.[^>]*\.css/);
  expect(code).not.toContain("set:html");
}, 120_000);
