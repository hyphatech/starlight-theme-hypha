// Starlight gives a plugin's words only to the languages a site names, so a
// missing word falls back to English here rather than showing its key.

export const en = {
  "hypha.menu.close": "Close the menu",
  "hypha.nav.sections": "Sections",
  "hypha.nav.site": "Site",
  "hypha.siteTitle.home": "{{title}}, home",
  "hypha.feature.readMore": "Read more",
  "hypha.notFound.title": "Nothing is written here.",
  "hypha.notFound.home": "Back to the start",
  "hypha.search.choose": "to choose",
  "hypha.search.open": "to open",
  "hypha.search.close": "to close",
  "hypha.search.failed": "Search could not load. Check your connection, then type again.",
  "hypha.github.label": "{{repo}} on GitHub",
  "hypha.github.version": "version {{version}}",
  "hypha.github.stars_one": "{{count}} star",
  "hypha.github.stars_other": "{{count}} stars",
  "hypha.github.forks_one": "{{count}} fork",
  "hypha.github.forks_other": "{{count}} forks",
};

// Plural keys (`_one`, `_other`) are named by their stem.
export type Word = keyof typeof en extends infer K ? (K extends `${infer Stem}_${"one" | "other"}` ? Stem : K) : never;

export interface Translate {
  (key: string, options?: Record<string, unknown>): string;
  exists(key: string, options?: Record<string, unknown>): boolean;
}

// Values are not escaped here: Astro escapes them on output.
export function say(t: Translate, key: Word, values: Record<string, string | number> = {}): string {
  const options = { ...values, interpolation: { escapeValue: false } };
  if (t.exists(key, options)) return t(key, options);
  const words = en as Record<string, string>;
  return fill("count" in values && `${key}_other` in words ? english(key) : (words[key] ?? key), values);
}

// A plural word's forms, for the browser; English unless all are translated.
export interface Forms {
  lang: string;
  forms: Record<string, string>;
}

function english(key: Word): Forms {
  const words = en as Record<string, string>;
  return { lang: "en", forms: { one: words[`${key}_one`]!, other: words[`${key}_other`]! } };
}

export function forms(t: Translate, key: Word, lang: string): Forms {
  const categories = new Intl.PluralRules(lang).resolvedOptions().pluralCategories;
  if (!categories.every((category) => t.exists(`${key}_${category}`))) return english(key);
  return { lang, forms: Object.fromEntries(categories.map((category) => [category, t(`${key}_${category}`)])) };
}

export function fill(word: string | Forms, values: Record<string, string | number>): string {
  const template = typeof word === "string" ? word : (word.forms[new Intl.PluralRules(word.lang).select(Number(values.count))] ?? word.forms.other!);
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(values[name] ?? ""));
}
