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
  expect(html).toContain('data-github="hyphatech/starlight-theme-hypha"');
  expect(html).toContain('aria-label="Sections"');
  expect(html).toContain('class="hero');
  expect(html).toContain("Every Hypha project's documentation");
  expect(html).toContain('<meta name="theme-color" content="#0B0C0F"');
  // A tab's only page stands where its neighbours do, with no sidebar.
  const lone = await Bun.file(new URL("../_build/example/reference/index.html", import.meta.url)).text();
  expect(lone).not.toContain('id="starlight__sidebar"');
  // Code's styles are in the page, never a stylesheet a browser may draw past.
  const code = await Bun.file(new URL("../_build/example/getting-started/index.html", import.meta.url)).text();
  expect(code).toContain("<pre");
  expect(code).not.toMatch(/<link[^>]*ec\.[^>]*\.css/);
}, 120_000);
