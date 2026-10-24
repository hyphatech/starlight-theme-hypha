# starlight-theme-hypha

Hypha's look for [Starlight](https://starlight.astro.build).

## Install

```sh
bun add github:hyphatech/starlight-theme-hypha#v0.4.0
```

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightThemeHypha from "starlight-theme-hypha";

export default defineConfig({
  integrations: [
    starlight({
      title: "Docs",
      plugins: [starlightThemeHypha()],
    }),
  ],
});
```

### Beside a project's own styles

The theme brings its own Tailwind build, every utility and every variable
under its prefix, `hypha:` and `--hypha-`. A project on Tailwind, or with a
design system of its own, needs nothing more: its classes and variables
share no name with the theme's, so neither restyles the other, and the
project's Tailwind plugin builds the theme's sheet beside its own.

All of the theme's styles are in its cascade layer, `hypha`, after
Starlight's and before a project's Tailwind layers, in the order Starlight's
guide to Tailwind gives with the theme's added:

```css
@layer base, starlight, hypha, theme, components, utilities;
```

So the theme restyles Starlight, and a project's styles, layered after it
or unlayered, win over the theme's. A project that states its own order
names `hypha` after `starlight`.

A page's own block marked `not-content` -- a demo of the project's
components, say -- is left alone by the theme's styles for the text, as by
Starlight's.

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
| `hue` | `225` | The hue, in degrees, every colour turns with |
| `brand` | none | A name before the site's title: `brand: "acme"` and `title: "docs"` read "acme.docs" |
| `search` | `true` | Search in the header; `false` also turns off Starlight's Pagefind |
| `github` | none | The repository, `owner/name`, linked with its version, stars and forks. `{ repo, stats: false }` shows the link alone |
| `tabs` | `false` | The sidebar's top-level groups as tabs under the header: `true`, or an icon for each by its label |
| `links` | `[]` | Links in the row under the header, after the tabs: `{ label, href, icon? }`. A link to another site opens in a new tab |

The header's logo and title are Starlight's own `logo` and `title`.

Icons are [Lucide](https://lucide.dev)'s: `archive`, `blocks`, `book-open`,
`boxes`, `braces`, `code-xml`, `compass`, `component`, `file-text`,
`globe`, `graduation-cap`, `house`, `layers`, `library`, `list-checks`,
`map`, `newspaper`, `play`, `puzzle`, `rocket`, `rss`, `scroll-text`,
`settings`, `shield-check`, `sparkles`, `terminal`, `wand-sparkles`,
`waves-horizontal`, `wrench` and `zap`.

The repository's version, stars and forks are fetched from GitHub at build
time and cached for an hour; if GitHub fails, the last fetched values are
used. Set `GITHUB_TOKEN` to raise GitHub's limit.

## Search

Search runs on Starlight's Pagefind index. `⌘K`, `Ctrl+K` or `/` opens it,
the arrow keys choose a result, `Enter` opens it and `Escape` closes.

## Landing page

A page with `template: splash` and a `hero` gets the theme's hero, and
Starlight's `<CardGrid>` and `<Card>` its panels.

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

A splash page without a `hero` opens with its own `<Landing>`, which takes
the hero's props and holds the page's title. What it holds goes under the
tagline, and its `aside` slot beside the text, its code as text on the page
rather than a panel; beside an aside, the image is the mark above the title.
`<Features>` sets `<Feature>`s three to a row, each with an icon from the
list above and a link at its foot.

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

## Code

A `console` block is commands, each after `$ `, and what they print; its
copy button copies the commands alone.

## Customising

The theme's tokens are CSS custom properties, each named under the theme's
prefix. Set any of them on `:root` in a sheet in Starlight's `customCss`:

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

A component set in Starlight's `components` overrides the theme's.

## Licence

MIT, copyright Hypha Technologies Ltd. See [LICENSE](LICENSE).
