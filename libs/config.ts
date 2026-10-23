import { z } from "astro/zod";

// Plain data: the options reach the components as JSON through a virtual
// module, so a link names its icon rather than passing a component.
export const icons = ["archive", "blocks", "book-open", "boxes", "code-xml", "component", "compass", "file-text", "globe", "graduation-cap", "house", "layers", "library", "list-checks", "map", "newspaper", "play", "puzzle", "rocket", "rss", "scroll-text", "settings", "terminal", "wrench"] as const;
export type IconName = (typeof icons)[number];

const repo = z.string().regex(/^[\w.-]+\/[\w.-]+$/, "owner/name");

export const configSchema = z.object({
  // Every surface, line and text colour turns with it, in degrees.
  hue: z.number().min(0).max(360).default(225),
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
});

export type HyphaThemeUserConfig = z.input<typeof configSchema>;
export type HyphaThemeConfig = z.output<typeof configSchema>;
