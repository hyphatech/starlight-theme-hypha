import { z } from "astro/zod";

// The icons a link may take, by lucide's name for each. A link names one
// rather than passing a component, so the options stay plain data that
// reaches the components through a virtual module.
export const icons = ["archive", "blocks", "book-open", "boxes", "code-xml", "component", "compass", "file-text", "globe", "graduation-cap", "house", "layers", "library", "list-checks", "map", "newspaper", "play", "puzzle", "rocket", "rss", "scroll-text", "settings", "terminal", "wrench"] as const;
export type IconName = (typeof icons)[number];

export const configSchema = z
  .object({
    // The night's hue, in degrees: every surface, line and text colour of the
    // theme turns with it. 225 is a reference's blue, told from a post's warm
    // ground at a glance.
    hue: z.number().min(0).max(360).default(225),
    // The project's repository on GitHub, as `owner/name`: the header links to
    // it with its latest version, its stars and its forks.
    github: z
      .string()
      .regex(/^[\w.-]+\/[\w.-]+$/, "owner/name")
      .optional(),
    // Each top-level entry of the sidebar a tab under the header, the sidebar
    // then showing the open tab's pages alone: `true`, or each tab's icon by
    // its entry's label.
    tabs: z.union([z.boolean(), z.record(z.string(), z.enum(icons))]).default(false),
    // The links at the end of the header, on a phone in its second row.
    // Another site opens in a tab of its own.
    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.string().url(),
          icon: z.enum(icons).optional(),
        }),
      )
      .default([]),
  });

export type HyphaThemeUserConfig = z.input<typeof configSchema>;
export type HyphaThemeConfig = z.output<typeof configSchema>;
