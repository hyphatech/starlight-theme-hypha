# AGENTS.md

starlight-theme-hypha is a Starlight plugin, Hypha's look for any Starlight
site, installed from GitHub at a tag. This file is for anyone changing it,
human or agent. Users start at [README.md](README.md).

## Commands

```sh
make setup    # the dependencies, by Bun
make test     # the plugin's options, the contrast in both schemes at every
              # palette, and the docs' build
make lint     # the plugin's types
make build    # the docs site, built into _build/docs
make serve    # the built docs, served as a host would, search included
```

To try a change in a project before it is tagged, link it, and keep Vite on
the link's path, which Astro would otherwise read as inside the project:

```sh
cd starlight-theme-hypha && bun link
cd <project> && bun link starlight-theme-hypha
```

```js
// the project's astro.config.mjs, while linked
export default defineConfig({ vite: { resolve: { preserveSymlinks: true } } });
```

## Layout

```
index.ts            the plugin: its options read, Starlight's config changed
libs/config         the options and their defaults
libs/vite           the options, as a virtual module the components import
libs/route-middleware
                    the sidebar split into tabs, where `tabs` is on
libs/color          the roles as the sheets compute them, for the browser's
                    theme-color and the tests' contrast
libs/palettes       the theme's own palette's defaults, and known palettes,
                    adopted: their colours met to the bar, as CSS for the
                    head, and their code themes
libs/link           a link from the root put under the site's base
libs/console        a console block's copy button, copying its commands alone
libs/github         a repository's version, stars and forks, from GitHub
libs/github-build   their cache at build time
libs/trail          the sidebar's groups a page is in, for search's results
libs/words          the theme's own words, in English, for a site's
                    translations to override; English where they do not
components/         the parts of Starlight's page the theme takes over, and
                    its own: Links, GitHub, Tabs, PhoneNav, Icon, NamedIcon;
                    Search, on Pagefind's index rather than its UI;
                    Landing, a landing page's opening, and Hero, one
                    from the frontmatter, or NotFound on the 404 page;
                    Actions, their buttons; Features and Feature, its cards
styles/tokens.css   Hypha's design system as Tailwind's theme: its roles,
                    faces, type, grid and utilities
styles/standalone.css
                    the theme's Tailwind build, its own on every page, each
                    utility `hypha:` and each variable `--hypha-`
styles/theme.css    Starlight's tokens from the roles, and the parts of its
                    page the theme does not render, in plain CSS
styles/code-theme.json
                    the night's code theme; code-theme-day.json, the day's
assets/hypha.webp   Hypha's mark, for a project's Starlight `logo`, and
                    hypha-day.webp, the mark for a light ground
docs/               the theme's documentation, on the theme: published to
                    GitHub Pages from main, built by the test, and a look at
                    a change. `~/` is its `src/`; it imports the theme by
                    the package's name. Its Markdown links name the base
.github/            the docs' Pages workflow, and the README's image
test/               the plugin's config, contrast, and the docs' build
```

## Rules that must hold

Each says what to keep, why, and what catches a breach; the detail is in
the code and the tests it names.

- **The look is Hypha's design system**, `styles/tokens.css`, the same on
  every Hypha site.
- **A component is styled with Tailwind's utilities on Hypha's tokens,
  never a `<style>` block**; plain CSS, in `styles/theme.css`, is for the
  markup Starlight renders. Symptom: `rg -l '<style' components`.
- **The theme's Tailwind is prefixed `hypha`**, `hypha:flex`,
  `--hypha-color-ink`, and every variable declared by hand is `--hypha-`
  or Starlight's `--sl-`. Why: a project's own Tailwind or design system
  then shares no class or variable with the theme. Tests:
  `test/plugin.test.ts`, `test/docs.test.ts`.
- **The theme's styles are in the layer `hypha`, above Starlight's and
  below a project's**, never `!important`. Why: the theme wins over
  Starlight, and a project over the theme. Tests: the same.
- **Nothing in the theme names a project**; a project chooses its
  palette, schemes, mark, title and header. Symptom: a project's name in
  `index.ts`, `libs`, `components` or `styles`.
- **The page's content is styled, and `not-content` left alone**, as
  Starlight's own rules do. Why: a project shows its own components there.
  Test: `test/plugin.test.ts`.
- **Every palette reads in both schemes**: text 7:1, secondary text 4.5:1,
  a mark 3:1, the theme's own computed alike in the sheets and
  `libs/color.ts`. Test: `test/plugin.test.ts`.
- **A link a component takes from the root goes under the site's base**,
  through `withBase`. Tests: `test/plugin.test.ts`, `test/docs.test.ts`.
- **The options are plain data**: a link names its icon, Lucide's or
  `starlight`, since the options reach the components as JSON. Test:
  `test/plugin.test.ts`.

## Releases

A release is a tag, `v<version>`, matching `package.json`; a project installs
the theme by that tag, and the README's install line names it by hand. The
package's exports, `./config` and `./palettes` among them, are its API: a
name renamed or removed there is a breaking change.
