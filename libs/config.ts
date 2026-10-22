import { z } from "astro/zod";

// The icons a link may take, by lucide's name for each. A link names one
// rather than passing a component, so the options stay plain data that
// reaches the components through a virtual module.
export const icons = ["archive", "book-open", "code-xml", "globe", "layers", "rss"] as const;

export const configSchema = z
  .object({
    // The night's hue, in degrees: every surface, line and text colour of the
    // theme turns with it. 225 is a reference's blue, told from a post's warm
    // ground at a glance.
    hue: z.number().min(0).max(360).default(225),
    // The links at the end of the header, at the foot of a phone's menu and
    // in the footer. Another site opens in a tab of its own.
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
