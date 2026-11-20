# starlight-theme-hypha

[![Release](https://img.shields.io/github/v/tag/hyphatech/starlight-theme-hypha?label=release&sort=semver)](https://github.com/hyphatech/starlight-theme-hypha/tags)
[![Docs](https://github.com/hyphatech/starlight-theme-hypha/actions/workflows/docs.yml/badge.svg)](https://github.com/hyphatech/starlight-theme-hypha/actions/workflows/docs.yml)
[![Starlight](https://img.shields.io/badge/Starlight-0.42-8b5cf6?logo=astro&logoColor=white)](https://starlight.astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Licence: MIT](https://img.shields.io/github/license/hyphatech/starlight-theme-hypha)](LICENSE)

Hypha's look for [Starlight](https://starlight.astro.build).

- **Light and dark**, following the visitor's system or set by you
- **Ten palettes**, each with its own code themes, readable in both schemes
- **Clear of your own styles**: prefixed classes and variables in their own
  cascade layer
- **Tabs, search and repository stats** included
- **Pages for agents**: each page as Markdown, its examples read in, and
  `llms.txt`

📖 **[Documentation and live demo](https://hyphatech.github.io/starlight-theme-hypha/)**

![The theme in dark and light, with its palettes, its search and its own styles kept apart](.github/preview.png)

## Getting started

1. Install the theme:

   ```sh
   bun add github:hyphatech/starlight-theme-hypha#v0.7.0
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
         logo: { dark: "./src/assets/mark.svg", light: "./src/assets/mark-dark.svg" },
         plugins: [starlightThemeHypha({ palette: "catppuccin", brand: "acme" })],
       }),
     ],
   });
   ```

3. Run `bun run dev` and open <http://localhost:4321>.

## Options

| Option | Default | Description |
|---|---|---|
| `palette` | `"hypha"` | `hypha`, `catppuccin`, `rose-pine`, `gruvbox`, `everforest`, `kanagawa`, `solarized`, `github`, `night-owl` or `vitesse`, each with its own code themes. [Try them](https://hyphatech.github.io/starlight-theme-hypha/colours/) |
| `scheme` | `"auto"` | The scheme a visit starts in: `"auto"` follows the visitor's system, or `"dark"` or `"light"` |
| `themeSelect` | `true` | The header's control for changing the scheme; `false` hides it |
| `brand` | none | Shown before the title: `"acme"` with the title `"docs"` reads `acme.docs` |
| `search` | `true` | Search in the header; `false` also turns off Pagefind |
| `github` | none | `owner/name`, linked with its version, stars and forks; `{ repo, stats: false }` for the link alone |
| `tabs` | `false` | The sidebar's top-level groups as tabs: `true`, or an icon per group label |
| `links` | `[]` | Links beside the tabs: `{ label, href, icon? }` |
| `agents` | `true` | Each page as Markdown, and `llms.txt`, for agents, in the built site; `{ dir, preamble?, groups?, skill? }` also into a folder you commit and install, with a skill; `false` none |

The docs cover [colours](https://hyphatech.github.io/starlight-theme-hypha/colours/),
[the header](https://hyphatech.github.io/starlight-theme-hypha/header/),
[landing pages](https://hyphatech.github.io/starlight-theme-hypha/landing-pages/),
[pages for agents](https://hyphatech.github.io/starlight-theme-hypha/agents/)
and [customising](https://hyphatech.github.io/starlight-theme-hypha/customising/)
in full.

## Pages for agents

An agent reads a page's source, where an MDX page's examples are imports and
its demos are components. `agents` writes each page as plain Markdown, its
`?raw` imports read into fenced blocks and its live demos left out, with an
[`llms.txt`](https://llmstxt.org) index from your sidebar. With `dir`, the
build writes them into a folder too, links relative, with a skill in the
[Agent Skills](https://agentskills.io) format that sends an agent to them, for
your package to install where an agent working offline reads it:

```js
starlightThemeHypha({
  agents: {
    dir: "../agents", // from the Astro root: llms.txt, pages/<page>.md, skills/<name>/SKILL.md
    preamble: "What to know before any page, in Markdown.",
    groups: { Reference: "Markdown under a sidebar group's heading." },
    skill: { package: "widgets", instead: ["a raw `<button>`, where `Widgets.Button` is one"] },
  },
});
```

```lisp
; dune: the folder's files in $(opam var widgets:doc)
(install (package widgets) (section doc) (source_trees (agents as .)))
```

The folder is generated, so check it by generating it again, without building
the site:

```sh
HYPHA_AGENTS=write bunx astro sync   # write the folder
HYPHA_AGENTS=check bunx astro sync   # fail, naming each file, where it differs
```

## With your own styles

Classes and variables are prefixed, `hypha:` and `--hypha-`, and the styles
sit in the `hypha` cascade layer, after Starlight's and before yours, so your
Tailwind or design system is left alone. If you declare your own layer order,
put `hypha` after `starlight`:

```css
@layer base, starlight, hypha, theme, components, utilities;
```

## Contributing

See [AGENTS.md](AGENTS.md) for the commands, the layout and the rules the
code keeps.

## Licence

MIT. Copyright Hypha Technologies Ltd. See [LICENSE](LICENSE).
