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
  title: "solidtype", // the header reads "hypha.solidtype"
  plugins: [
    hypha({
      hue: 225,
      github: "hyphatech/solidtype",
      tabs: true,
      links: [
        { label: "Hypha Stack", href: "https://hyphatech.io/stack", icon: "layers" },
        { label: "GitHub", href: "https://github.com/hyphatech/solidtype", icon: "code-xml" },
      ],
    }),
  ],
});
```

## Options

| Option | Default | What it sets |
|---|---|---|
| `hue` | `225` | The night's hue, in degrees: every surface, line and text colour turns with it |
| `github` | none | The repository, as `owner/name`: the header links to it with its latest version, its stars and its forks |
| `tabs` | `false` | Each top-level entry of the sidebar a tab under the header; the sidebar shows the open tab's pages |
| `links` | `[]` | The links in the header, on a phone in its second row |

A link's `icon` is one of `archive`, `book-open`, `code-xml`, `globe`,
`layers` and `rss`, or none.

The header's wordmark is "hypha." and Starlight's own `title`.

The repository's version, stars and forks are asked of GitHub's API as the
site is built, so the header is drawn with them, and again by the reader's
browser, once a session, so they stay current between builds; its version is
the latest release's tag, or its newest tag, without a leading `v`. A build
with `GITHUB_TOKEN` set asks with it, past GitHub's limit of sixty
unauthenticated requests an hour.

Under tabs, the only page of its tab has no sidebar, and stands where its
neighbours do.

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

The theme's sheet comes before the project's `customCss`, so a project's sheet
can set any of its tokens -- `--night`, `--paper`, `--graphite`, `--rule`,
`--accent-mark`, `--panel`, `--raised`, the grid's `--page`, `--measure` and
`--margin` -- on `:root`. A sheet that would undo the theme's -- Tailwind's, through
`@astrojs/starlight-tailwind`, defines its own `--font-sans` -- goes before
it: name the theme's sheet in `customCss` after it, and the plugin keeps that
order.

```js
customCss: ["./src/tailwind.css", "starlight-theme-hypha/styles/theme.css", "./src/own.css"],
```

A component the project overrides in Starlight's
`components` wins over the theme's.

The favicon is the project's: Starlight's `favicon`, from its `public/`.
