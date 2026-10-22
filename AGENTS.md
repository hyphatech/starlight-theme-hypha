# AGENTS.md

starlight-theme-hypha is a Starlight plugin: Hypha's look -- hypha.pub's grid,
faces and night -- for every Hypha project's documentation, installed from
GitHub at a tag. This file is for anyone changing it, human or agent. Users
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

## Layout

```
index.ts            the plugin: its options read, Starlight's config changed
libs/config         the options and their defaults
libs/vite           the options, as a virtual module the components import
libs/route-middleware
                    the sidebar split into tabs, where `tabs` is on
libs/color          the night as hex, for the browser's theme-color
libs/github         a repository's version, stars and forks, asked at build
                    time and again in the browser
components/         the parts of Starlight's page the theme takes over, and
                    its own: Links, GitHub, Tabs, PhoneNav, Icon, NamedIcon;
                    Hero, a landing page's opening
styles/theme.css    the look: hypha.pub's tokens and roles on Starlight's
styles/code-theme   hypha.pub's code theme
assets/hypha.webp   Hypha's mark, in the wordmark
example/            a site on the theme, for the test and a look at a change
test/               the plugin's config, contrast, and the example's build
```

## Rules that must hold

- **The look is hypha.pub's, copied, not imported.** Its tokens, type and
  grid come from hypha.pub's `src/styles/site.css`; a change to the system
  belongs there first, then here. Why: one system across Hypha's sites,
  with hypha.pub the one that leads.
- **A project chooses its hue, its links and its title, and nothing in the
  theme names a project.** Why: the theme serves every project; one that
  needs more overrides a token in its own sheet or a component in
  Starlight's `components`, both of which win over the theme's. Symptom:
  `rg -n -i 'solidtype|heroui' index.ts libs components styles` finds a
  project's name outside a comment's example.
- **Every colour turns on `--hue`, and its text reads at every hue.** Why: a
  project picks the hue, so no hue may make the page unreadable. Test:
  `test/plugin.test.ts` checks graphite and paper on night across the
  circle.
- **The options are plain data.** A link names its icon from a fixed set
  rather than passing a component, since the options reach the components
  through a virtual module as JSON. Adding an icon is a name in
  `libs/config.ts` and an import in `components/NamedIcon.astro`.

## Releases

A release is a tag, `v<version>`, matching `package.json`; a project installs
the theme by that tag.
