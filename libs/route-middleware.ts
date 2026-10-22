import { defineRouteMiddleware, type StarlightRouteData } from "@astrojs/starlight/route-data";

type Entry = StarlightRouteData["sidebar"][number];

// A tab's link is its entry's first page.
const firstHref = (entry: Entry): string | undefined =>
  entry.type === "link" ? entry.href : entry.entries.map(firstHref).find((href) => href !== undefined);

const holdsCurrent = (entry: Entry): boolean =>
  entry.type === "link" ? entry.isCurrent : entry.entries.some(holdsCurrent);

const pages = (entry: Entry): number => (entry.type === "link" ? 1 : entry.entries.reduce((n, e) => n + pages(e), 0));

// The sidebar's top-level entries become the tabs, and the sidebar keeps the
// open one's group alone, open, its label the tab's. A page in no tab, or the
// only page of its tab, keeps no sidebar: as Zensical's, one link to the page
// the reader is on says nothing.
export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  context.locals.hyphaTabs = route.sidebar.flatMap((entry: Entry) => {
    const href = firstHref(entry);
    return href === undefined ? [] : [{ label: entry.label, href, isCurrent: holdsCurrent(entry) }];
  });
  const open = route.sidebar.find(holdsCurrent);
  route.sidebar = open?.type === "group" && pages(open) > 1 ? [{ ...open, collapsed: false }] : [];
});
