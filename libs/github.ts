// A repository's latest version, stars and forks, from GitHub's API.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Facts {
  version?: string;
  stars: number;
  forks: number;
}

// A token, where the build has one, lifts GitHub's limit of sixty
// unauthenticated requests an hour.
async function ask(repo: string, token?: string): Promise<Facts | undefined> {
  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const get = (path: string) => fetch(`https://api.github.com/repos/${repo}${path}`, { headers, signal: AbortSignal.timeout(5000) });
  try {
    const [found, release] = await Promise.all([get(""), get("/releases/latest")]);
    if (!found.ok) return undefined;
    const { stargazers_count: stars, forks_count: forks } = await found.json();
    // A repository with tags and no release names its version by its tag.
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

// The last answer, kept in Astro's cache: a build within the hour takes it
// without asking, and one GitHub fails takes it however old.
const FRESH_MS = 60 * 60 * 1000;
type Kept = Record<string, { at: number; facts: Facts }>;

function kept(file: string): Kept {
  try {
    return JSON.parse(readFileSync(file, "utf-8")) as Kept;
  } catch {
    return {};
  }
}

async function remembered(repo: string, cacheDir: string): Promise<Facts | undefined> {
  const file = join(cacheDir, "github.json");
  const last = kept(file)[repo];
  if (last && Date.now() - last.at < FRESH_MS) return last.facts;
  const facts = await ask(repo, process.env.GITHUB_TOKEN);
  if (!facts) return last?.facts;
  try {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(file, JSON.stringify({ ...kept(file), [repo]: { at: Date.now(), facts } }));
  } catch {}
  return facts;
}

// At build time, once per repository however many pages show it.
const built = new Map<string, Promise<Facts | undefined>>();
export function atBuild(repo: string, cacheDir: string): Promise<Facts | undefined> {
  if (!built.has(repo)) built.set(repo, remembered(repo, cacheDir));
  return built.get(repo)!;
}

const count = new Intl.NumberFormat("en", { notation: "compact" });

// Each fact as it is shown, and as it is read aloud.
export function shown(repo: string, facts: Facts | undefined) {
  const items = facts
    ? [
        { name: "version" as const, text: facts.version, spoken: `version ${facts.version}` },
        { name: "stars" as const, text: count.format(facts.stars), spoken: `${facts.stars} stars` },
        { name: "forks" as const, text: count.format(facts.forks), spoken: `${facts.forks} forks` },
      ].filter((item) => item.text !== undefined)
    : [];
  return { items, label: [`${repo} on GitHub`, ...items.map((item) => item.spoken)].join(", ") };
}
