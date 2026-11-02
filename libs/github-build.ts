import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ask, type Facts } from "./github";

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
