import { z } from "astro/zod";
import { hypha, paletteNames } from "./palettes";

// Plain data: the options reach the components as JSON through a virtual
// module, so a link names its icon rather than passing a component. Each is
// Lucide's, but `starlight`, Starlight's own mark.
export const icons = ["archive", "blocks", "book-open", "boxes", "braces", "code-xml", "compass", "component", "file-text", "globe", "graduation-cap", "house", "layers", "library", "list-checks", "map", "newspaper", "play", "puzzle", "rocket", "rss", "scroll-text", "settings", "shield-check", "sparkles", "starlight", "terminal", "wand-sparkles", "waves-horizontal", "wrench", "zap"] as const;
export type IconName = (typeof icons)[number];

const degrees = z.number().min(0).max(360);

const repo = z.string().regex(/^[\w.-]+\/[\w.-]+$/, "owner/name");

export const configSchema = z
  .object({
    // The theme's own palette, or a known one.
    palette: z.enum(paletteNames).default("hypha"),
    // `hypha` only: the greys' hue, in degrees; alone, the accent follows.
    hue: degrees.optional(),
    // `hypha` only: the accent's hue.
    accent: degrees.optional(),
    // `hypha` only: the greys' saturation, as a share of the default.
    tint: z.number().min(0).max(2).optional(),
    // The scheme a visit starts in: `auto` follows the visitor's system.
    scheme: z.enum(["auto", "dark", "light"]).default("auto"),
    // The header's control, for the visitor to change the scheme.
    themeSelect: z.boolean().default(true),
    // A name before Starlight's title, which then follows it in graphite after
    // a dot: "hypha" and "solidtype" read "hypha.solidtype".
    brand: z.string().optional(),
    // Starlight's search in the header; `false` turns off Pagefind too.
    search: z.boolean().default(true),
    // The repository, linked from the header with its version, stars and
    // forks, asked of GitHub at build time unless `stats` is off.
    github: z
      .union([repo, z.object({ repo, stats: z.boolean().default(true) })])
      .optional()
      .transform((github) => (typeof github === "string" ? { repo: github, stats: true } : github)),
    // The sidebar's top-level entries as tabs under the header: `true`, or
    // each tab's icon by its entry's label.
    tabs: z.union([z.boolean(), z.record(z.string(), z.enum(icons))]).default(false),
    // Links in the row under the header, after the tabs. One to another site
    // opens in a new tab.
    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
          icon: z.enum(icons).optional(),
        }),
      )
      .default([]),
  })
  .refine(({ palette, hue, accent, tint }) => palette === "hypha" || [hue, accent, tint].every((v) => v === undefined), {
    message: "hue, accent and tint turn the theme's own palette, hypha; a named palette has its own colours",
    path: ["palette"],
  })
  .transform(({ palette, hue, accent, tint, ...rest }) => ({
    ...rest,
    // The schemes a page can show: both, unless one is fixed without a control.
    schemes: (rest.themeSelect || rest.scheme === "auto" ? ["dark", "light"] : [rest.scheme]) as ("dark" | "light")[],
    palette,
    hue: hue ?? hypha.hue,
    accent: accent ?? (hue === undefined ? hypha.accent : (hue + 6) % 360),
    tint: tint ?? hypha.tint,
  }));

export type HyphaThemeUserConfig = z.input<typeof configSchema>;
export type HyphaThemeConfig = z.output<typeof configSchema>;
