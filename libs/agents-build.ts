// `agents` in the build: the site's Markdown and llms.txt written into the
// built site, and the folder a project commits written beside it, or, under
// `HYPHA_AGENTS=check`, compared with what the pages generate.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroConfig, AstroIntegrationLogger } from "astro";
import { agentFiles, aliasesOf, differences, owned, readFolder, readPages, type AgentsOptions, type Target } from "./agents";

export interface Site {
  title: string | Record<string, string>;
  description?: string;
  sidebar?: unknown;
}

// The variable a check or a write without a build is asked for by.
export const modeVariable = "HYPHA_AGENTS";

function write(dir: string, files: Map<string, string>) {
  for (const [path, text] of files) {
    const file = join(dir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
}

export function agentsBuild(options: AgentsOptions, site: Site, astro: AstroConfig) {
  const base = astro.base.replace(/\/+$/, "");
  const origin = astro.site?.replace(/\/+$/, "");
  const title = typeof site.title === "string" ? site.title : (site.title.en ?? Object.values(site.title)[0] ?? "");
  const folder = options.dir ? fileURLToPath(new URL(options.dir.replace(/\/*$/, "/"), astro.root)) : undefined;

  const generate = (kind: Target["kind"], logger?: AstroIntegrationLogger) =>
    agentFiles({
      pages: readPages(fileURLToPath(new URL("content/docs/", astro.srcDir))),
      aliases: aliasesOf(astro.vite?.resolve?.alias),
      sidebar: site.sidebar,
      title,
      description: site.description,
      options,
      target: { kind, base, origin },
      warn: (m) => logger?.warn(m),
    });

  const writeFolder = (logger: AstroIntegrationLogger, quiet = false) => {
    if (!folder) return;
    for (const sub of owned) rmSync(join(folder, sub), { recursive: true, force: true });
    write(folder, generate("folder", quiet ? undefined : logger));
    logger.info(`agents' Markdown written to ${folder}`);
  };

  return {
    "astro:config:setup"({ logger }: { logger: AstroIntegrationLogger }) {
      const mode = process.env[modeVariable];
      if (!mode) return;
      if (!folder) throw new Error(`starlight-theme-hypha: ${modeVariable}=${mode}, and agents names no dir`);
      if (mode === "write") return writeFolder(logger);
      if (mode !== "check") throw new Error(`starlight-theme-hypha: ${modeVariable} is check or write, not ${mode}`);
      const differ = differences(readFolder(folder), generate("folder", logger));
      if (differ.length)
        throw new Error(
          `starlight-theme-hypha: ${folder} is not what the pages generate:\n${differ.map((d) => `  ${d}`).join("\n")}\nWrite it again with ${modeVariable}=write astro sync, or the docs' build.`,
        );
      logger.info(`agents' Markdown in ${folder} is what the pages generate`);
    },
    "astro:build:done"({ dir, logger }: { dir: URL; logger: AstroIntegrationLogger }) {
      write(fileURLToPath(dir), generate("site", logger));
      writeFolder(logger, true);
    },
  };
}
