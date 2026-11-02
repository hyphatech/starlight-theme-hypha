// Shared with the browser; the Node-only cache is in github-build.ts.
import { type Forms, fill } from "./words";

export interface Facts {
  version?: string;
  stars: number;
  forks: number;
}

// A token lifts GitHub's limit of 60 unauthenticated requests an hour.
export async function ask(repo: string, token?: string): Promise<Facts | undefined> {
  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const get = (path: string) => fetch(`https://api.github.com/repos/${repo}${path}`, { headers, signal: AbortSignal.timeout(5000) });
  try {
    const [found, release] = await Promise.all([get(""), get("/releases/latest")]);
    if (!found.ok) return undefined;
    const { stargazers_count: stars, forks_count: forks } = await found.json();
    // Without a release, the latest tag.
    let tag: string | undefined = release.ok ? (await release.json()).tag_name : undefined;
    if (!tag) {
      const tags = await get("/tags?per_page=1");
      if (tags.ok) tag = (await tags.json())[0]?.name;
    }
    return { version: tag?.replace(/^v(?=\d)/, ""), stars, forks };
  } catch {
    return undefined;
  }
}

// Once a session, as Material for MkDocs does, to stay under the rate limit.
const asked = new Map<string, Promise<Facts | undefined>>();
export function inBrowser(repo: string): Promise<Facts | undefined> {
  if (!asked.has(repo)) {
    const key = `hypha.github:${repo}`;
    let kept: Facts | undefined;
    try {
      kept = JSON.parse(sessionStorage.getItem(key) ?? "null") ?? undefined;
    } catch {}
    const facts = kept
      ? Promise.resolve(kept)
      : ask(repo).then((facts) => {
          try {
            if (facts) sessionStorage.setItem(key, JSON.stringify(facts));
          } catch {}
          return facts;
        });
    asked.set(repo, facts);
  }
  return asked.get(repo)!;
}

export type Fact = "version" | "stars" | "forks";

export function shown(facts: Facts | undefined, lang = "en"): { name: Fact; text: string }[] {
  if (!facts) return [];
  const count = new Intl.NumberFormat(lang, { notation: "compact" });
  const items = [
    { name: "version" as const, text: facts.version },
    { name: "stars" as const, text: count.format(facts.stars) },
    { name: "forks" as const, text: count.format(facts.forks) },
  ];
  return items.filter((item): item is { name: Fact; text: string } => item.text !== undefined);
}

export interface Words {
  label: string;
  version: string;
  stars: Forms;
  forks: Forms;
}

export function described(words: Words, facts: Facts | undefined): string {
  if (!facts) return words.label;
  return [
    words.label,
    ...(facts.version === undefined ? [] : [fill(words.version, { version: facts.version })]),
    fill(words.stars, { count: facts.stars }),
    fill(words.forks, { count: facts.forks }),
  ].join(", ");
}
