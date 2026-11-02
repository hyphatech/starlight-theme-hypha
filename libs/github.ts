import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Facts {
  version?: string;
  stars: number;
  forks: number;
}

// A token lifts GitHub's limit of 60 unauthenticated requests an hour.
async function ask(repo: string, token?: string): Promise<Facts | undefined> {
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

// Cached for an hour; when GitHub fails, the last answer is used however old.
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

// Once per repository per build.
const built = new Map<string, Promise<Facts | undefined>>();
export function atBuild(repo: string, cacheDir: string): Promise<Facts | undefined> {
  if (!built.has(repo)) built.set(repo, remembered(repo, cacheDir));
  return built.get(repo)!;
}

export function shown(facts: Facts | undefined, lang = "en") {
  const count = new Intl.NumberFormat(lang, { notation: "compact" });
  const items = facts
    ? [
        { name: "version" as const, text: facts.version, word: "hypha.github.version" as const, values: { version: facts.version ?? "" } },
        { name: "stars" as const, text: count.format(facts.stars), word: "hypha.github.stars" as const, values: { count: facts.stars } },
        { name: "forks" as const, text: count.format(facts.forks), word: "hypha.github.forks" as const, values: { count: facts.forks } },
      ].filter((item) => item.text !== undefined)
    : [];
  return items;
}
