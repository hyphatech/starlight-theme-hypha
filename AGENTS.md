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
make preview  # the built example, served as a host would, search included
make serve    # the example, served as it changes, without search
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
styles/tailwind.css the tokens and the components, for a project's own
                    Tailwind build
styles/standalone.css
                    the theme's own Tailwind build, for a project without one
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
- **A page has one Tailwind build.** The project's, which imports
  `styles/tailwind.css`, or, where it has none, the theme's own. Why: two
  builds each declare `hidden` again after the other's `md:flex`, and undo
  each other.
- **A project chooses its hue, its mark, its title and what its header
  holds, and nothing in the theme names a project.** Why: the theme is open
  to any Starlight site, Hypha's among them; one that needs more overrides
  a token in its own sheet or a component in Starlight's `components`, both
  of which win over the theme's. Symptom:
  `rg -n -i 'solidtype|heroui' index.ts libs components styles` finds a
  project's name outside a comment's example.
- **Every colour turns on `--hue`, and its text reads at every hue.** Why: a
  project picks the hue, so no hue may make the page unreadable. Test:
  `test/plugin.test.ts` checks graphite and ink on ivory across the circle.
- **The options are plain data.** A link names its icon from a fixed set
  rather than passing a component, since the options reach the components
  through a virtual module as JSON. Adding an icon is a name in
  `libs/config.ts` and an import in `components/NamedIcon.astro`.

## Releases

A release is a tag, `v<version>`, matching `package.json`; a project installs
the theme by that tag.
