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
| `links` | `[]` | The links in the header and at the foot of a phone's menu |

A link's `icon` is one of `archive`, `book-open`, `code-xml`, `globe`,
`layers` and `rss`, or none.

The header's wordmark is "hypha." and Starlight's own `title`.

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
