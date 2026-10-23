# starlight-theme-hypha

Hypha's look for [Starlight](https://starlight.astro.build).

## Install

```sh
bun add github:hyphatech/starlight-theme-hypha#v0.1.0
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

### With Tailwind

A project without Tailwind needs nothing more. A project on Tailwind 4
imports the theme into its own Tailwind sheet, so the page has one Tailwind
build:

```css
@layer base, starlight, theme, components, utilities;
@import "@astrojs/starlight-tailwind";
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
@import "starlight-theme-hypha/styles/tailwind.css";
```

Without that import the build warns, and the theme's components go unstyled.

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
| `links` | `[]` | Links in the header: `{ label, href, icon? }`. A link to another site opens in a new tab |

The header's logo and title are Starlight's own `logo` and `title`.

Icons are [Lucide](https://lucide.dev)'s: `archive`, `blocks`, `book-open`,
`boxes`, `code-xml`, `component`, `compass`, `file-text`, `globe`,
`graduation-cap`, `house`, `layers`, `library`, `list-checks`, `map`,
`newspaper`, `play`, `puzzle`, `rocket`, `rss`, `scroll-text`, `settings`,
`terminal` and `wrench`.

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

## Customising

The theme's tokens are CSS custom properties. Set any of them on `:root` in
a sheet in Starlight's `customCss`:

| Token | Default | Used for |
|---|---|---|
| `--color-ivory` | `hsl(hue 15% 5%)` | The background |
| `--color-ink` | `hsl(hue 15% 90%)` | Text |
| `--color-graphite` | `hsl(hue 10% 58%)` | Secondary text and icons |
| `--color-rule` | `hsl(hue 14% 17%)` | Lines and borders |
| `--color-accent` | `hsl(hue+6 72% 72%)` | Focus, selection and search matches |
| `--color-panel` | ink 4% over ivory | Code, cards and controls |
| `--color-raised` | ink 7% over ivory | Inline code and the current item |
| `--font-sans` | Inter Tight | Text |
| `--font-serif` | Roboto Slab | Headings |
| `--font-mono` | the system's | Code |
| `--radius-control` | `4px` | Buttons and fields |
| `--radius-panel` | `10px` | Panels |
| `--container-page` | `72rem` | The page's width |
| `--measure` | `42rem` | The text's width |
| `--margin` | `11.5rem`, a sixth of the page from `64rem` | The navigation's column |
| `--gutter` | `1rem`, `1.5rem` from `40rem` | The page's side padding |

A component set in Starlight's `components` overrides the theme's.

## Licence

MIT, copyright Hypha Technologies Ltd. See [LICENSE](LICENSE).
