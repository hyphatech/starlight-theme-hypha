import { readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "astro/zod";
import { hypha, paletteNames } from "./palettes";

// Options reach the components as JSON, so icons are named, not passed: any
// of Lucide's, by its file's name, or `starlight`, Starlight's own mark.
const lucide = dirname(fileURLToPath(import.meta.resolve("@lucide/astro/icons/zap")));
export const icons = ["starlight", ...readdirSync(lucide).flatMap((file) => (file.endsWith(".ts") && file !== "index.ts" ? [file.slice(0, -3)] : []))];
export type IconName = string;

// The name Lucide exports an icon's component by: "book-open" is BookOpen.
export const componentName = (icon: string) => icon.replace(/(?:^|-)(\w)/g, (_, c: string) => c.toUpperCase());

const known = new Set(icons);
const icon = z.string().refine((name) => known.has(name), "a Lucide icon's name, as lucide.dev shows it, or starlight");

const degrees = z.number().min(0).max(360);

const repo = z.string().regex(/^[\w.-]+\/[\w.-]+$/, "owner/name");

export const configSchema = z
  .object({
    palette: z.enum(paletteNames).default("hypha"),
    // `hypha` only. Greys' hue; the accent follows unless set.
    hue: degrees.optional(),
    // `hypha` only.
    accent: degrees.optional(),
    // `hypha` only. Greys' saturation, as a share of the default.
    tint: z.number().min(0).max(2).optional(),
    scheme: z.enum(["auto", "dark", "light"]).default("auto"),
    themeSelect: z.boolean().default(true),
    // Shown before the title: "hypha" + "solidtype" reads "hypha.solidtype".
    brand: z.string().optional(),
    // `false` also turns off Pagefind.
    search: z.boolean().default(true),
    // `stats: false` hides version, stars and forks.
    github: z
      .union([repo, z.object({ repo, stats: z.boolean().default(true) })])
      .optional()
      .transform((github) => (typeof github === "string" ? { repo: github, stats: true } : github)),
    // Top-level sidebar entries as tabs: `true`, or an icon per label.
    tabs: z.union([z.boolean(), z.record(z.string(), icon)]).default(false),
    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
          icon: icon.optional(),
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
    // Both, unless one is fixed and there is no control.
    schemes: (rest.themeSelect || rest.scheme === "auto" ? ["dark", "light"] : [rest.scheme]) as ("dark" | "light")[],
    palette,
    hue: hue ?? hypha.hue,
    accent: accent ?? (hue === undefined ? hypha.accent : (hue + 6) % 360),
    tint: tint ?? hypha.tint,
  }));

export type HyphaThemeUserConfig = z.input<typeof configSchema>;
export type HyphaThemeConfig = z.output<typeof configSchema>;
