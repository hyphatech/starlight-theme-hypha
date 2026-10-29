// "/guides/" under the base "/docs" is "/docs/guides/"; other links as given.
export function withBase(href: string, base: string = import.meta.env?.BASE_URL ?? "/"): string {
  const root = base.replace(/\/$/, "");
  if (!root || !href.startsWith("/") || href.startsWith("//")) return href;
  if (href === root || href.startsWith(`${root}/`)) return href;
  return `${root}${href}`;
}
