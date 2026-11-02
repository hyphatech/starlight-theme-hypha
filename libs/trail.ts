import type { StarlightRouteData } from "@astrojs/starlight/route-data";

type Entry = StarlightRouteData["sidebar"][number];

// For search's result trail, outermost group first.
export function trail(entries: Entry[]): string[] {
  for (const entry of entries) {
    if (entry.type !== "group") continue;
    const within = trail(entry.entries);
    if (within.length > 0 || entry.entries.some((e) => e.type === "link" && e.isCurrent)) return [entry.label, ...within];
  }
  return [];
}
