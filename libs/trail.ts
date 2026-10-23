import type { StarlightRouteData } from "@astrojs/starlight/route-data";

type Entry = StarlightRouteData["sidebar"][number];

// The labels of the sidebar's groups the current page is in, outermost
// first: the trail search shows above the page's results.
export function trail(entries: Entry[]): string[] {
  for (const entry of entries) {
    if (entry.type !== "group") continue;
    const within = trail(entry.entries);
    if (within.length > 0 || entry.entries.some((e) => e.type === "link" && e.isCurrent)) return [entry.label, ...within];
  }
  return [];
}
