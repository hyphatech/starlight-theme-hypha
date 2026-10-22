import { expect, test } from "bun:test";
import { $ } from "bun";

// The example built on the theme: the wordmark is the project's title, the
// links its own, the night its hue.
test("the example builds in the theme's frame", async () => {
  await $`bun --bun astro build --root example`.quiet();
  const html = await Bun.file(new URL("../_build/example/index.html", import.meta.url)).text();
  expect(html).toContain(":root{--hue:225}");
  expect(html).toContain('aria-label="hypha.example, home"');
  expect(html).toContain('class="site-header');
  expect(html).toContain("https://github.com/hyphatech/starlight-theme-hypha");
  expect(html).toContain('<meta name="theme-color" content="#0B0C0F"');
}, 120_000);
