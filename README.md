# starlight-theme-hypha

Hypha's look for [Starlight](https://starlight.astro.build): hypha.pub's grid,
faces and night, for every Hypha project's documentation. The navigation sits
in the page's margin, the text at its measure, the page's contents beside it,
and code on a panel, as a post on [hypha.pub](https://hypha.pub) is set.

## Install

From GitHub, at a tag:

```sh
bun add github:hyphatech/starlight-theme-hypha#v0.1.0
```

To try a change to the theme in a project before it is tagged, link it:

```sh
cd starlight-theme-hypha && bun link
cd <project> && bun link starlight-theme-hypha
```

and, while it is linked, keep Vite on the link's path, which Astro would
otherwise read as a path inside the project:

```js
// astro.config.mjs
export default defineConfig({ vite: { resolve: { preserveSymlinks: true } } });
```

Then add it to Starlight's plugins:

```js
// astro.config.mjs
import starlight from "@astrojs/starlight";
import hypha from "starlight-theme-hypha";

starlight({
  title: "solidtype",
  logo: { src: "starlight-theme-hypha/assets/hypha.webp" },
  plugins: [
    hypha({
      hue: 225,
      brand: "hypha", // the header reads "hypha.solidtype"
      github: "hyphatech/solidtype",
      tabs: { "Start here": "rocket", HeroUI: "component" },
      links: [
        { label: "Hypha Stack", href: "https://hyphatech.io/stack", icon: "layers" },
        { label: "GitHub", href: "https://github.com/hyphatech/solidtype", icon: "code-xml" },
      ],
    }),
  ],
});
```

### Tailwind

The theme is styled as hypha.pub is, with Tailwind 4 on hypha.pub's tokens,
and a page has one Tailwind build. A project without Tailwind needs nothing
more: the plugin adds Tailwind and builds the theme alone. A project on
Tailwind builds the theme in its own sheet, with one import after Tailwind's:

```css
/* src/styles/tailwind.css, in Starlight's customCss */
@layer base, starlight, theme, components, utilities;
@import "@astrojs/starlight-tailwind";
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
@import "starlight-theme-hypha/styles/tailwind.css";
```

That brings hypha.pub's tokens -- `bg-panel`, `text-graphite`,
`rounded-control`, `t-label`, `nav-item` and the rest -- to the project's
own utilities, and the theme's components into its build. Without it the
build warns, and the theme's components go unstyled: two builds on a page
would undo each other's utilities.

## Options

| Option | Default | What it sets |
|---|---|---|
| `hue` | `225` | The night's hue, in degrees: every surface, line and text colour turns with it |
| `brand` | none | A name before Starlight's `title`, which then follows it in graphite after a dot: `brand: "hypha"` and `title: "solidtype"` read "hypha.solidtype" |
| `search` | `true` | Search in the header; `false` turns Starlight's Pagefind off too |
| `github` | none | The repository, as `owner/name`, linked with its latest version, stars and forks; `{ repo: "owner/name", stats: false }` shows GitHub's mark alone and asks GitHub nothing |
| `tabs` | `false` | The sidebar's top-level entries as tabs under the header, the sidebar showing the open tab's pages: `true`, or each tab's icon by its label, `{ "Start here": "rocket", Reference: "book-open" }` |
| `links` | `[]` | Links at the end of the header, on a phone in its second row: `{ label, href, icon? }`. One to another site opens in a new tab |

An icon is lucide's, by its name: `archive`, `blocks`, `book-open`, `boxes`,
`code-xml`, `component`, `compass`, `file-text`, `globe`, `graduation-cap`,
`house`, `layers`, `library`, `list-checks`, `map`, `newspaper`, `play`,
`puzzle`, `rocket`, `rss`, `scroll-text`, `settings`, `terminal` or `wrench`.

The header's mark and title are Starlight's own `logo` and `title`, and
`logo.replacesTitle` hides the title. Hypha's mark comes with the theme:

```js
logo: { src: "starlight-theme-hypha/assets/hypha.webp" },
```

The repository's version, stars and forks are asked of GitHub's API as the
site is built; the reader's browser asks GitHub nothing. The build keeps the
answer in Astro's cache: a build within the hour takes it without asking,
and one GitHub fails takes the last answer, however old. The version is the
latest release's tag, or the newest tag, without a leading `v`. A build with
`GITHUB_TOKEN` set asks with it, past GitHub's sixty requests an hour.

Search is the theme's own panel on Starlight's Pagefind index, each result a
heading under the groups and page it is in. The arrows choose a result,
Enter opens it; ⌘K, Ctrl+K or `/` opens the panel, Escape closes it.

Under tabs, a tab's only page has no sidebar.

## A landing page

Starlight's own: a page with `template: splash` and a `hero` in its
frontmatter, and `<CardGrid>` and `<Card>` beneath. The theme sets the hero as
hyphatech.io opens -- the title in the slab at display size, the tagline as its
lede, `primary` and `secondary` actions as its buttons -- and the cards as
panels on a rule, across the page's width.

```mdx
---
title: solidtype
template: splash
hero:
  title: Solid, typed, for OCaml.
  tagline: Components in OCaml's JSX, compiled as Solid compiles its own.
  actions:
    - { text: Get started, link: /getting-started/, variant: primary, icon: right-arrow }
    - { text: HeroUI's ports, link: /heroui/coverage/, variant: secondary }
---
```

## Changing more

The tokens are hypha.pub's, in `styles/tokens.css`: the roles
`--color-ivory`, `--color-ink`, `--color-graphite`, `--color-rule`,
`--color-accent`, `--color-panel` and `--color-raised`, the faces, the type,
`--radius-control`, `--radius-panel`, the eases, and the grid's
`--container-page`, `--measure`, `--margin` and `--gutter`. The theme's
sheets come before the project's `customCss`, so a project's sheet can set
any of them on `:root`; where the project names the theme's sheet in
`customCss`, the plugin keeps it there.

A component the project overrides in Starlight's
`components` wins over the theme's.

The favicon is the project's: Starlight's `favicon`, from its `public/`.
