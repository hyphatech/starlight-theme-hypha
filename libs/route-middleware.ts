import { defineRouteMiddleware, type StarlightRouteData } from "@astrojs/starlight/route-data";
import { trail } from "./trail";

type Entry = StarlightRouteData["sidebar"][number];

const firstHref = (entry: Entry): string | undefined =>
  entry.type === "link" ? entry.href : entry.entries.map(firstHref).find((href) => href !== undefined);

const holdsCurrent = (entry: Entry): boolean =>
  entry.type === "link" ? entry.isCurrent : entry.entries.some(holdsCurrent);

const pages = (entry: Entry): number => (entry.type === "link" ? 1 : entry.entries.reduce((n, e) => n + pages(e), 0));

// A tab with a single page gets no sidebar: one link to itself says nothing.
export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  // Before the sidebar is narrowed to one tab.
  context.locals.hyphaTrail = trail(route.sidebar);
  context.locals.hyphaTabs = route.sidebar.flatMap((entry: Entry) => {
    const href = firstHref(entry);
    return href === undefined ? [] : [{ label: entry.label, href, isCurrent: holdsCurrent(entry) }];
  });
  const open = route.sidebar.find(holdsCurrent);
  route.sidebar = open?.type === "group" && pages(open) > 1 ? [{ ...open, collapsed: false }] : [];
});
