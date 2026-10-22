import { defineRouteMiddleware, type StarlightRouteData } from "@astrojs/starlight/route-data";

type Entry = StarlightRouteData["sidebar"][number];

// A tab's link is its entry's first page.
const firstHref = (entry: Entry): string | undefined =>
  entry.type === "link" ? entry.href : entry.entries.map(firstHref).find((href) => href !== undefined);

const holdsCurrent = (entry: Entry): boolean =>
  entry.type === "link" ? entry.isCurrent : entry.entries.some(holdsCurrent);

// The sidebar's top-level entries become the tabs, and the sidebar keeps the
// open one's group alone, open, its label the tab's. A page in no tab keeps
// no sidebar.
export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  context.locals.hyphaTabs = route.sidebar.flatMap((entry: Entry) => {
    const href = firstHref(entry);
    return href === undefined ? [] : [{ label: entry.label, href, isCurrent: holdsCurrent(entry) }];
  });
  const open = route.sidebar.find(holdsCurrent);
  route.sidebar = open?.type === "group" ? [{ ...open, collapsed: false }] : [];
});
