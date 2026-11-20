import { afterAll, afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroConfig, AstroIntegrationLogger } from "astro";
import { agentFiles, fence, idFromUrl, readPages, type Alias, type Target } from "../libs/agents";
import { agentsBuild, modeVariable } from "../libs/agents-build";
import { configSchema } from "../libs/config";

// A site of its own: pages that import their examples `?raw`, by an alias
// and by a path, beside a live demo, tabs, an aside and links.
const root = new URL("./fixtures/agents/", import.meta.url);
const at = (path: string) => fileURLToPath(new URL(path, root));
const aliases: Alias[] = [
  // As solidtype's: the compiled demo first, by a pattern, then the sources.
  { find: /^@examples\/(.+)\.jsx$/, replacement: at("_build/$1.jsx") },
  { find: "@examples", replacement: at("examples") },
];
const sidebar = [
  { label: "Start", items: ["index"] },
  { label: "Guides", items: [{ label: "Nested", items: [{ autogenerate: { directory: "guide" } }] }] },
  { label: "Elsewhere", link: "https://example.com/elsewhere" },
];
const pages = readPages(at("src/content/docs"));

function generate(target: Target, warn: (m: string) => void = () => {}) {
  return agentFiles({
    pages,
    aliases,
    sidebar,
    title: "widgets",
    description: "Widgets for everyone.",
    options: {
      preamble: "## Writing it\n\nA widget is named for what it does.",
      groups: { Guides: "Each guide shows a widget's code." },
      skill: { package: "widgets-core", instead: ["a raw `<button>`, where Widgets.Button is one"] },
    },
    target,
    warn,
  });
}

const folder = (warn?: (m: string) => void) => generate({ kind: "folder", base: "/widgets", origin: "https://example.com" }, warn);
const site = () => generate({ kind: "site", base: "/widgets", origin: "https://example.com" });

describe("a page as Markdown", () => {
  const page = folder().get("pages/guide/example.md")!;

  test("opens with its title and its description", () => {
    expect(page.startsWith("# An example\n\nA widget, its code shown from the files it is built from.\n\n")).toBe(true);
  });

  test("drops the page's imports and exports, and keeps those its code shows", () => {
    expect(page).not.toContain("@astrojs/starlight/components");
    expect(page).not.toContain("?raw");
    expect(page).not.toContain("export const");
    expect(page).toContain('```js\nimport widget from "widgets";\n<Button>Not a component</Button>\n```');
  });

  test("shows a file imported ?raw through an alias as a fenced block, its language and title the component's", () => {
    expect(page).toContain('```ocaml title="hello.ml"\nlet () = print_endline "hello"\n```');
  });

  test("shows a file imported ?raw by a relative path, its language from its extension", () => {
    expect(page).toContain("   ```css\n   .note {\n     color: red;\n   }\n   ```");
  });

  test("shows an example's code and its named files, and leaves its live demo out", () => {
    expect(page.match(/```ocaml title="hello\.ml"/g)).toHaveLength(2);
    expect(page).toContain('```css title="note.css"\n.note {\n  color: red;\n}\n```');
    expect(page).not.toContain("Hello.make");
    expect(page).not.toContain("client:");
  });

  test("leaves a not-content block and an inline component with no text out", () => {
    expect(page).not.toContain("not-content");
    expect(page).toContain("A widget says hello.");
  });

  test("flattens tabs to their text, each under its label", () => {
    expect(page).toContain("**One**\n\nThe first tab.\n\n**Two**\n\nThe second tab.");
    expect(page).not.toMatch(/<\/?Tab/);
  });

  test("keeps an aside as it is written", () => {
    expect(page).toContain(":::note\nAn aside stays as it is written.\n:::");
  });

  test("fences a file that holds a fence with a longer one", () => {
    expect(page).toContain("````md\n# A file of Markdown\n\n```sh\necho inside\n```\n````");
  });

  test("leaves out code it cannot read, and says so", () => {
    const warnings: string[] = [];
    folder((m) => warnings.push(m));
    expect(warnings).toEqual(["guide/example: <Code>'s code is neither text nor a file imported ?raw, and is left out"]);
  });

  test("has no run of blank lines", () => {
    expect(page).not.toContain("\n\n\n");
    expect(page.endsWith("\n")).toBe(true);
    expect(page.endsWith("\n\n")).toBe(false);
  });

  test("shows code a page builds of its own constants and a JSON file it imports", () => {
    const [example] = pages.filter((p) => p.id === "guide/example");
    const warnings: string[] = [];
    const built = {
      ...example!,
      body: 'import pkg from "@examples/meta.json";\n\nexport const at = "#v";\nexport const install = `$ bun add widgets${at}${pkg.version}`;\n\n<Code lang="console" code={install} />\n',
    };
    const files = agentFiles({ pages: [built], aliases, sidebar, title: "w", options: { groups: {} }, target: { kind: "folder", base: "/widgets" }, warn: (m) => warnings.push(m) });
    expect(files.get("pages/guide/example.md")).toContain("```console\n$ bun add widgets#v1.2.3\n```");
    expect(warnings).toEqual([]);
  });

  test("refuses a ?raw import of a file that is not there", () => {
    const [example] = pages.filter((p) => p.id === "guide/example");
    const broken = { ...example!, body: `import gone from "@examples/gone.ml?raw";\n\n<Code code={gone} />\n` };
    expect(() =>
      agentFiles({ pages: [broken], aliases, sidebar, title: "w", options: { groups: {} }, target: { kind: "folder", base: "/widgets" } }),
    ).toThrow(/guide\/example imports @examples\/gone\.ml\?raw/);
  });
});

describe("links", () => {
  test("in the folder, to another page's Markdown, relative, its fragment kept", () => {
    const page = folder().get("pages/guide/example.md")!;
    expect(page).toContain("[the plain page](plain.md#usage)");
    expect(page).toContain("[the start](../index.md)");
    expect(folder().get("pages/index.md")).toContain("[example](guide/example.md)");
    expect(folder().get("pages/guide/plain.md")).toContain("[ref]: example.md");
  });

  test("in the site, to another page's Markdown, absolute", () => {
    const page = site().get("guide/example.md")!;
    expect(page).toContain("[the plain page](https://example.com/widgets/guide/plain.md#usage)");
    expect(page).toContain("[the start](https://example.com/widgets/index.md)");
  });

  test("to the site, whole, where no page is", () => {
    expect(folder().get("pages/guide/example.md")).toContain("[the reference](https://example.com/widgets/reference/widgets/index.html)");
  });

  test("a link's page", () => {
    expect(idFromUrl("/widgets/guide/plain/#usage", "/widgets")).toBe("guide/plain");
    expect(idFromUrl("/widgets/", "/widgets")).toBe("index");
    expect(idFromUrl("/elsewhere/", "/widgets")).toBeUndefined();
    expect(idFromUrl("https://example.com/widgets/", "/widgets")).toBeUndefined();
    expect(idFromUrl("/guide/", "")).toBe("guide");
  });
});

describe("llms.txt", () => {
  const llms = folder().get("llms.txt")!;

  test("is the site's title, its description, the preamble, then the sidebar's groups", () => {
    expect(llms).toBe(
      [
        "# widgets",
        "",
        "> Widgets for everyone.",
        "",
        "## Writing it",
        "",
        "A widget is named for what it does.",
        "",
        "- [Elsewhere](https://example.com/elsewhere)",
        "",
        "## Start",
        "",
        "- [Widgets](pages/index.md): Widgets for everyone.",
        "",
        "## Guides",
        "",
        "Each guide shows a widget's code.",
        "",
        "- [An example](pages/guide/example.md): A widget, its code shown from the files it is built from.",
        "- [Plain](pages/guide/plain.md)",
        "",
        "## Other pages",
        "",
        "- [Elsewhere](pages/hidden.md): A page no sidebar lists.",
        "",
      ].join("\n"),
    );
  });

  test("in the site, links each page's Markdown absolutely", () => {
    expect(site().get("llms.txt")).toContain("- [Plain](https://example.com/widgets/guide/plain.md)");
  });

  test("leaves a draft out, as the build does", () => {
    expect([...folder().keys()].sort()).toEqual([
      "llms.txt",
      "pages/guide/example.md",
      "pages/guide/plain.md",
      "pages/hidden.md",
      "pages/index.md",
      "skills/widgets/SKILL.md",
    ]);
  });

  test("with no sidebar, lists every page", () => {
    const files = agentFiles({ pages, aliases, sidebar: undefined, title: "w", options: { groups: {} }, target: { kind: "folder", base: "/widgets" } });
    expect(files.get("llms.txt")).toBe(
      "# w\n\n- [An example](pages/guide/example.md): A widget, its code shown from the files it is built from.\n- [Plain](pages/guide/plain.md)\n- [Elsewhere](pages/hidden.md): A page no sidebar lists.\n- [Widgets](pages/index.md): Widgets for everyone.\n",
    );
  });
});

describe("the skill", () => {
  const skill = folder().get("skills/widgets/SKILL.md")!;

  test("is named for the site, and says when to use it", () => {
    expect(skill.startsWith('---\nname: widgets\ndescription: "Use before writing or changing OCaml code that uses widgets: Widgets for everyone."\n---\n')).toBe(
      true,
    );
  });

  test("sends an agent to the catalogue installed with the package, the site's only where none is", () => {
    expect(skill).toContain("`$(opam var widgets-core:doc)/llms.txt`");
    expect(skill).toContain("read https://example.com/widgets/llms.txt, which may document a newer release");
    expect(skill).toContain("`$(opam var widgets-core:doc)/pages/<page>.md`");
    expect(skill).toContain("write by hand only what none of them does");
  });

  test("copies no page", () => {
    expect(skill).not.toContain("print_endline");
    expect(skill).not.toContain("An example");
  });

  test("lists what is written by hand instead of a part", () => {
    expect(skill).toContain("- a raw `<button>`, where Widgets.Button is one\n");
    expect(skill).not.toContain("have been seen");
  });

  test("says what the agent is about to do, where given", () => {
    const files = agentFiles({
      pages: [],
      aliases,
      sidebar,
      title: "Lint",
      options: { groups: {}, skill: { before: "acting on a finding", instead: [] } },
      target: { kind: "folder", base: "" },
    });
    expect(files.get("skills/lint/SKILL.md")).toContain("Read it before acting on a finding, and build");
  });

  test("is the folder's alone, and its description given where one is", () => {
    expect([...site().keys()].some((k) => k.startsWith("skills/"))).toBe(false);
    const files = agentFiles({
      pages: [],
      aliases,
      sidebar,
      title: "Widgets Kit",
      options: { groups: {}, skill: { description: "Use for widgets: a: b.", instead: [] } },
      target: { kind: "folder", base: "" },
    });
    const own = files.get("skills/widgets-kit/SKILL.md")!;
    expect(own).toContain('description: "Use for widgets: a: b."');
    expect(own).not.toContain("Only where it is not installed");
    expect(own).not.toContain("by hand instead");
  });

  test("refuses a name Agent Skills does not take", () => {
    expect(() =>
      agentFiles({ pages: [], aliases, sidebar, title: "!!!", options: { groups: {}, skill: { instead: [] } }, target: { kind: "folder", base: "" } }),
    ).toThrow(/give agents\.skill\.name/);
  });
});

test("a fence outlasts the backticks inside it", () => {
  expect(fence("a", "ocaml", "a.ml")).toBe('```ocaml title="a.ml"\na\n```');
  expect(fence("````\nx\n````", "md")).toBe("`````md\n````\nx\n````\n`````");
});

describe("the build", () => {
  const out = mkdtempSync(join(tmpdir(), "hypha-agents-"));
  const logs: string[] = [];
  const logger = { info: (m: string) => logs.push(m), warn: (m: string) => logs.push(m) } as unknown as AstroIntegrationLogger;
  const astro = {
    root,
    srcDir: new URL("src/", root),
    base: "/widgets/",
    site: "https://example.com/",
    vite: { resolve: { alias: aliases } },
  } as unknown as AstroConfig;
  const build = agentsBuild({ dir: `${out}/agents`, groups: {}, skill: { instead: [] } }, { title: "widgets", sidebar }, astro);
  const run = (mode?: string) => {
    if (mode) process.env[modeVariable] = mode;
    try {
      build["astro:config:setup"]({ logger });
    } finally {
      delete process.env[modeVariable];
    }
  };
  afterEach(() => delete process.env[modeVariable]);
  afterAll(() => rmSync(out, { recursive: true, force: true }));

  test("writes the site's Markdown and llms.txt, and the folder", () => {
    build["astro:build:done"]({ dir: new URL(`file://${out}/site/`), logger });
    expect(readFileSync(join(out, "site/llms.txt"), "utf-8")).toContain("(https://example.com/widgets/guide/plain.md)");
    expect(readFileSync(join(out, "site/guide/example.md"), "utf-8")).toContain('```ocaml title="hello.ml"');
    expect(readFileSync(join(out, "agents/llms.txt"), "utf-8")).toContain("(pages/guide/plain.md)");
    expect(readFileSync(join(out, "agents/pages/guide/example.md"), "utf-8")).toContain('```ocaml title="hello.ml"');
  });

  test("does nothing more without the variable, as on `astro dev`", () => {
    rmSync(join(out, "agents"), { recursive: true, force: true });
    run();
    expect(() => readFileSync(join(out, "agents/llms.txt"))).toThrow();
  });

  test("checks the folder against what the pages generate, and names each file that differs", () => {
    run("write");
    expect(() => run("check")).not.toThrow();
    writeFileSync(join(out, "agents/pages/guide/plain.md"), "# Plain, by hand\n");
    writeFileSync(join(out, "agents/pages/stale.md"), "# A page since removed\n");
    writeFileSync(join(out, "agents/skills/widgets/SKILL.md"), "---\nname: widgets\n---\n");
    rmSync(join(out, "agents/pages/hidden.md"));
    expect(() => run("check")).toThrow(
      /pages\/guide\/plain\.md: changed\n {2}pages\/hidden\.md: missing\n {2}pages\/stale\.md: not generated\n {2}skills\/widgets\/SKILL\.md: changed/,
    );
    run("write");
    expect(() => run("check")).not.toThrow();
  });

  test("refuses a mode it does not know, and a check with no folder", () => {
    expect(() => run("compare")).toThrow(/is check or write/);
    const siteOnly = agentsBuild({ groups: {}, skill: false }, { title: "widgets" }, astro);
    process.env[modeVariable] = "check";
    expect(() => siteOnly["astro:config:setup"]({ logger })).toThrow(/names no dir/);
  });
});

test("the option: the site's alone by default, `false` none", () => {
  expect(configSchema.parse({}).agents).toEqual({ groups: {}, skill: { instead: [] } });
  expect(configSchema.parse({ agents: false }).agents).toBe(false);
  expect(configSchema.parse({ agents: true }).agents).toEqual({ groups: {}, skill: { instead: [] } });
  expect(configSchema.parse({ agents: { dir: "../agents" } }).agents).toEqual({ dir: "../agents", groups: {}, skill: { instead: [] } });
  expect(configSchema.parse({ agents: { dir: "../agents", skill: false } }).agents).toEqual({ dir: "../agents", groups: {}, skill: false });
  expect(configSchema.safeParse({ agents: { skill: { name: "Widgets" } } }).success).toBe(false);
  expect(configSchema.safeParse({ agents: { dir: 1 } }).success).toBe(false);
});
