# starlight-theme-hypha

Hypha's look for [Starlight](https://starlight.astro.build).

Readable at any hue, and clear of your own styles. Tabs, search and
repository stats included.

## Getting started

1. Install the theme:

   ```sh
   bun add github:hyphatech/starlight-theme-hypha#v0.4.0
   ```

2. Add it to `plugins` in your `astro.config.mjs`:

   ```js
   import { defineConfig } from "astro/config";
   import starlight from "@astrojs/starlight";
   import starlightThemeHypha from "starlight-theme-hypha";

   export default defineConfig({
     integrations: [
       starlight({
         title: "docs",
         logo: { src: "./src/assets/mark.svg" },
         plugins: [starlightThemeHypha({ hue: 30, brand: "acme" })],
       }),
     ],
   });
   ```

3. Run `bun run dev` and open <http://localhost:4321>.

Next, pick your [options](#options), add a [landing page](#landing-page), or
[customise](#customising) the styles.

## Options

```js
starlightThemeHypha({
  hue: 30,
  brand: "acme",
  github: "acme/widgets",
  tabs: { Guides: "book-open", Reference: "file-text" },
  links: [{ label: "Changelog", href: "/changelog/", icon: "scroll-text" }],
});
```

| Option | Default | Description |
|---|---|---|
| `hue` | `225` | Colour hue, in degrees. All colours are based on it |
| `brand` | none | Shown before the title: `brand: "acme"` with `title: "docs"` shows "acme.docs" |
| `search` | `true` | Search in the header. `false` also turns off Pagefind |
| `github` | none | Your repository, `owner/name`, shown with its version, stars and forks. Use `{ repo, stats: false }` for the link only |
| `tabs` | `false` | Show the sidebar's top-level groups as tabs. `true`, or an icon for each group by its label |
| `links` | `[]` | Extra links next to the tabs: `{ label, href, icon? }`. External links open in a new tab |

Set the logo and title with Starlight's `logo` and `title`. Icons are
[Lucide](https://lucide.dev) names, plus `starlight` for Starlight's own mark;
see [`libs/config.ts`](libs/config.ts) for the list.

GitHub stats are fetched at build time and cached for an hour. Set
`GITHUB_TOKEN` to avoid GitHub's rate limit.

Open search with `⌘K`, `Ctrl+K` or `/`. In a `console` code block, the copy
button copies only the commands, not their output.

## Landing page

A page with `template: splash` and a `hero` uses the theme's hero. Starlight's
`<CardGrid>` and `<Card>` are styled too.

```mdx
---
title: Acme
template: splash
hero:
  title: Widgets, documented.
  tagline: Everything about Acme's widgets.
  actions:
    - { text: Get started, link: /guides/, variant: primary, icon: right-arrow }
    - { text: Reference, link: /reference/, variant: secondary }
---
```

For more control, skip `hero` and use `<Landing>`. It takes the same props,
plus an `aside` slot for code next to the text. `<Features>` shows
`<Feature>` cards three per row, each with an icon and a link.

````mdx
---
title: Acme
template: splash
---

import Landing from "starlight-theme-hypha/components/Landing.astro";
import Features from "starlight-theme-hypha/components/Features.astro";
import Feature from "starlight-theme-hypha/components/Feature.astro";
import mark from "../../assets/mark.svg";

<Landing
  title="Widgets, written once."
  tagline="Everything about Acme's widgets."
  image={{ file: mark, alt: "Acme" }}
  actions={[{ text: "Get started", link: "/guides/", icon: "right-arrow" }]}
>

```sh
bun add widgets
```

<Fragment slot="aside">

```js
export const widget = () => "one";
```

</Fragment>
</Landing>

<Features>
  <Feature title="Fast" icon="zap" href="/guides/speed/" linkText="Speed">
    Nothing runs in the browser but search.
  </Feature>
</Features>
````

## Customising

Override any token on `:root` in a CSS file listed in Starlight's `customCss`:

| Token | Default | Used for |
|---|---|---|
| `--hypha-color-ivory` | `hsl(hue 15% 5%)` | The background |
| `--hypha-color-ink` | `hsl(hue 15% 90%)` | Text |
| `--hypha-color-graphite` | `hsl(hue 10% 58%)` | Secondary text and icons |
| `--hypha-color-rule` | `hsl(hue 14% 17%)` | Lines and borders |
| `--hypha-color-accent` | `hsl(hue+6 72% 72%)` | Focus, selection and search matches |
| `--hypha-color-panel` | ink 4% over ivory | Code, cards and controls |
| `--hypha-color-raised` | ink 7% over ivory | Inline code and the current item |
| `--hypha-font-sans` | Inter Tight | Text |
| `--hypha-font-serif` | Roboto Slab | Headings |
| `--hypha-font-mono` | the system's | Code |
| `--hypha-radius-control` | `4px` | Buttons and fields |
| `--hypha-radius-panel` | `10px` | Panels |
| `--hypha-container-page` | `72rem` | The page's width |
| `--hypha-measure` | `42rem` | The text's width |
| `--hypha-margin` | `11.5rem`, a sixth of the page from `64rem` | The navigation's column |
| `--hypha-gutter` | `1rem`, `1.5rem` from `40rem` | The page's side padding |

To replace a component, use Starlight's `components` option.

### With your own styles

CSS classes and variables are prefixed, `hypha:` and `--hypha-`, so they
won't clash with your design system. The theme's styles are in the `hypha`
cascade layer, which comes after Starlight's and before your own styles. If
you declare your own layer order, put `hypha` after `starlight`:

```css
@layer base, starlight, hypha, theme, components, utilities;
```

Anything inside `not-content` is left unstyled, like a demo of your own
components.

## Licence

MIT. Copyright Hypha Technologies Ltd. See [LICENSE](LICENSE).
