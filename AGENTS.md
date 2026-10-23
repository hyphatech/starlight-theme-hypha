# AGENTS.md

starlight-theme-hypha is a Starlight plugin, Hypha's look for any Starlight
site, installed from GitHub at a tag. This file is for anyone changing it, human or agent. Users
start at [README.md](README.md).

## Commands

```sh
make setup    # the dependencies, by Bun
make test     # the plugin's options, the night's contrast at every hue, and
              # the example's build
make lint     # the plugin's types
make build    # the example site, built into _build/example
make serve    # the built example, served as a host would, search included
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
libs/color          the night as hex, for the browser's theme-color
libs/github         a repository's version, stars and forks, asked at build
                    time
libs/trail          the sidebar's groups a page is in, for search's results
components/         the parts of Starlight's page the theme takes over, and
                    its own: Links, GitHub, Tabs, PhoneNav, Icon, NamedIcon;
                    Search, on Pagefind's index rather than its UI;
                    Landing, a landing page's opening, and Hero, one
                    from the frontmatter; Features and Feature, its cards
styles/tokens.css   hypha.pub's system as Tailwind's theme: its roles, faces,
                    type, grid and utilities
styles/standalone.css
                    the theme's Tailwind build, its own on every page, each
                    utility `hypha:` and each variable `--hypha-`
styles/theme.css    Starlight's tokens from the roles, and the parts of its
                    page the theme does not render, in plain CSS
styles/code-theme   hypha.pub's code theme
assets/hypha.webp   Hypha's mark, for a project's Starlight `logo`
example/            a site on the theme, for the test and a look at a change
test/               the plugin's config, contrast, and the example's build
```

## Rules that must hold

- **The look is hypha.pub's, copied, not imported.** Its tokens, type,
  grid and utilities come from hypha.pub's `src/styles/site.css`, into
  `styles/tokens.css`; a change to the system belongs there first, then
  here. Why: one system across Hypha's sites, with hypha.pub the one that
  leads, on its way to a Hypha UI Kit.
- **The theme is styled with Tailwind 4, as every Hypha project is.** A
  component the theme renders takes utilities on hypha.pub's tokens, never
  a `<style>` block; plain CSS, in `styles/theme.css`, is for the markup
  Starlight renders itself. Why: one way of styling across the projects.
  Symptom: `rg -l '<style' components` finds a component.
- **The theme's Tailwind is its own, under the prefix `hypha`.** Its build
  is `styles/standalone.css`, `prefix(hypha)`: a component's utility is
  `hypha:flex`, a token `--hypha-color-ink`, and every variable the sheets
  declare by hand is `--hypha-` too, or one of Starlight's, `--sl-`. The
  copy of hypha.pub's system names a token by `--theme()` and applies a
  utility by its prefixed name, which hypha.pub's build has no need of; the
  system itself is copied unchanged. Why: a project's own Tailwind build or
  design system then shares no class and no variable with the theme -- in
  one build, a design system's own `--color-accent` or `--font-sans` would
  override the theme's -- and a palette of the theme's changes the theme
  alone.
  Tests: `test/plugin.test.ts` reads the sheets' variables, and
  `test/example.test.ts` finds no unprefixed utility or token in the build.
- **The theme's styles are in its layer, `hypha`, above Starlight's and
  below a project's.** `styles/standalone.css` states the order, `base,
  starlight, hypha, theme, components, utilities`, as Starlight's guide to
  Tailwind states it with the theme's layer inserted, and its Tailwind is
  `hypha.theme` and `hypha.utilities`; `styles/theme.css` and the grid in
  `styles/tokens.css` are in `hypha` itself. Why: as Starlight's own themes
  do, the theme wins over Starlight's layers and a project's styles win over
  the theme's, so a project's design system is never restyled by the
  theme's rules for a property it sets. Starlight leaves one style of its
  own unlayered, its page's: what it sets there the theme sets through
  Starlight's variables, `--sl-nav-height` the header's height, never by an
  important declaration. Tests: `test/plugin.test.ts` finds no rule
  outside the layer, and `test/example.test.ts` the order in the build.
- **A project chooses its hue, its mark, its title and what its header
  holds, and nothing in the theme names a project.** Why: the theme is open
  to any Starlight site, Hypha's among them; one that needs more overrides
  a token in its own sheet or a component in Starlight's `components`, both
  of which win over the theme's. Symptom:
  `rg -n -i 'solidtype|heroui' index.ts libs components styles` finds a
  project's name outside a comment's example.
- **The page's content is styled, and `not-content` left alone.** A rule
  in `styles/theme.css` that reaches into `.sl-markdown-content` below its
  own children skips what a page marks `not-content`,
  `:not(:where(.not-content *))`, as Starlight's own rules do. Why: there a
  project shows its own components, a demo or a design system, whose class
  names -- `.card`, `.title` -- the theme's rules would otherwise match; the
  layers settle only a property both set, and the theme's border on a card
  that sets none would stay.
  Test: `test/plugin.test.ts` reads the sheet's selectors.
- **Every colour turns on `--hypha-hue`, and its text reads at every hue.** Why: a
  project picks the hue, so no hue may make the page unreadable. Test:
  `test/plugin.test.ts` checks graphite and ink on ivory across the circle.
- **The options are plain data.** A link names its icon from a fixed set
  rather than passing a component, since the options reach the components
  through a virtual module as JSON. Adding an icon is a name in
  `libs/config.ts` and an import in `components/NamedIcon.astro`.

## Releases

A release is a tag, `v<version>`, matching `package.json`; a project installs
the theme by that tag.
