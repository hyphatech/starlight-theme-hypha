// A site's pages as Markdown an agent reads whole, and llms.txt, its index
// (https://llmstxt.org). A page's `?raw` imports are read, so the example a
// page shows by `<Code code={x} />` is in the Markdown as a fenced block, and
// what renders only in a browser -- a live demo, a `not-content` block -- is
// left out. Written two ways: into the built site, its links absolute, and
// into a folder a project commits and installs, its links relative.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { parse as parseYaml } from "yaml";

export interface AgentsOptions {
  // The folder, from the Astro root, the build writes llms.txt and pages/
  // into, for a project to commit and install; none, the site's alone.
  dir?: string;
  // Markdown after llms.txt's summary, before its groups.
  preamble?: string;
  // Markdown under a sidebar group's heading, by its label.
  groups: Record<string, string>;
  // The skill written into the folder, `skills/<name>/SKILL.md`; none where
  // it is `false`.
  skill: SkillOptions | false;
}

export interface SkillOptions {
  // The skill's name, lower case and dashes; the site's title, so made.
  name?: string;
  // The opam package the folder is installed with; the skill's name.
  package?: string;
  // When an agent uses it; by default, before writing code with the library.
  description?: string;
  // What the skill's agent is about to do, ending "Read it before …";
  // by default, writing code with the library.
  before?: string;
  // What is easily written by hand where a part of the library does it.
  instead: string[];
}

export interface Page {
  // Starlight's id: `index`, `guide/routes`; `guide/index.md` is `guide`.
  id: string;
  file: string;
  title: string;
  description?: string;
  order?: number;
  mdx: boolean;
  body: string;
}

export type Alias = { find: string | RegExp; replacement: string };

// How a link reaches a page's Markdown: the site's own URL, or a path in
// the folder, relative to the file linking. `base` is the site's, without
// its trailing slash; `origin` is its `site`, where it has one.
export type Target = { kind: "site" | "folder"; base: string; origin?: string };

const pageExt = /\.mdx?$/;

// A path segment as Astro's glob loader makes it an id: lower case, its
// spaces dashes, its punctuation dropped, as github-slugger does.
const segment = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
    .replace(/\s/g, "-");

export function idOf(path: string): string {
  const id = path.replace(pageExt, "").split(/[\\/]/).map(segment).join("/");
  return id === "index" ? id : id.replace(/\/index$/, "");
}

function frontmatter(text: string): { data: Record<string, any>; body: string } {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text };
  return { data: (parseYaml(m[1]!) as Record<string, any>) ?? {}, body: text.slice(m[0].length) };
}

function walk(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
}

// The docs collection's pages, as Starlight's loader finds them under
// src/content/docs; a draft is left out, as the build leaves it out.
export function readPages(contentDir: string): Page[] {
  if (!existsSync(contentDir)) return [];
  return walk(contentDir)
    .filter((file) => pageExt.test(file))
    .flatMap((file) => {
      const { data, body } = frontmatter(readFileSync(file, "utf-8"));
      if (data.draft === true) return [];
      const id = typeof data.slug === "string" ? data.slug.replace(/^\/|\/$/g, "") || "index" : idOf(relative(contentDir, file));
      return [
        {
          id,
          file,
          title: String(data.title ?? id),
          description: typeof data.description === "string" ? data.description : undefined,
          order: typeof data.sidebar?.order === "number" ? data.sidebar.order : undefined,
          mdx: file.endsWith(".mdx"),
          body,
        },
      ];
    });
}

// Vite's aliases, as `resolve.alias` takes them: an object, or entries.
export function aliasesOf(alias: unknown): Alias[] {
  if (!alias) return [];
  if (Array.isArray(alias)) return alias.filter((a) => a && (typeof a.find === "string" || a.find instanceof RegExp));
  return Object.entries(alias as Record<string, string>).map(([find, replacement]) => ({ find, replacement }));
}

// An import's file, as Vite finds it: the first alias that matches, then a
// path from the importing file, or a package's.
export function resolveImport(spec: string, from: string, aliases: Alias[]): string {
  let id = spec;
  for (const { find, replacement } of aliases) {
    if (typeof find === "string" ? id === find || id.startsWith(`${find}/`) : find.test(id)) {
      id = typeof find === "string" ? replacement + id.slice(find.length) : id.replace(find, replacement);
      break;
    }
  }
  if (isAbsolute(id)) return id;
  if (id.startsWith(".")) return resolve(dirname(from), id);
  return createRequire(from).resolve(id);
}

const langs: Record<string, string> = { ml: "ocaml", mli: "ocaml", mlx: "ocaml", mjs: "js", cjs: "js", mts: "ts", cts: "ts", yml: "yaml", md: "markdown" };
export const langOf = (file: string) => {
  const ext = extname(file).slice(1).toLowerCase();
  return langs[ext] ?? ext;
};

// A fence longer than any run of backticks the code starts a line with.
export function fence(code: string, lang: string, title?: string): string {
  const runs = code.match(/^[ \t]*`{3,}/gm) ?? [];
  const ticks = "`".repeat(Math.max(3, ...runs.map((r) => r.trim().length + 1)));
  const info = [lang, title ? `title=${JSON.stringify(title)}` : ""].filter(Boolean).join(" ");
  return `${ticks}${info}\n${code.replace(/\s+$/, "")}\n${ticks}`;
}

type Node = {
  type: string;
  position?: { start: { offset?: number; column: number }; end: { offset?: number } };
  children?: Node[];
  [key: string]: any;
};

interface Context {
  src: string;
  page: Page;
  raws: Map<string, string>;
  values: Map<string, any>;
  link: (url: string) => string | undefined;
  warn: (message: string) => void;
}

const start = (n: Node) => n.position!.start.offset!;
const end = (n: Node) => n.position!.end.offset!;

// The source between two offsets, each node in it replaced by its Markdown.
function emit(ctx: Context, from: number, to: number, nodes: Node[]): string {
  let out = "";
  let at = from;
  // An inline element left out takes a space beside it with it.
  let gone = false;
  const add = (piece: string) => {
    if (!piece) return;
    out += gone && out.endsWith(" ") && piece.startsWith(" ") ? piece.slice(1) : piece;
    gone = false;
  };
  for (const node of nodes) {
    if (!node.position) continue;
    add(ctx.src.slice(at, start(node)));
    const text = render(ctx, node);
    add(text);
    gone = text === "" && node.type === "mdxJsxTextElement";
    at = end(node);
  }
  add(ctx.src.slice(at, to));
  return out;
}

const inner = (ctx: Context, node: Node) =>
  node.children?.length ? emit(ctx, start(node.children[0]!), end(node.children.at(-1)!), node.children) : "";

// Lines after the first moved from one indentation to another: a block's
// children from their own column to the column of the element they replace.
function reindent(text: string, from: number, to: string): string {
  const strip = new RegExp(`^[ \\t]{0,${from}}`);
  return text
    .split("\n")
    .map((line, i) => (i === 0 ? line : line.trim() ? to + line.replace(strip, "") : ""))
    .join("\n");
}

function render(ctx: Context, node: Node): string {
  switch (node.type) {
    case "mdxjsEsm":
      return "";
    case "mdxFlowExpression":
    case "mdxTextExpression":
      return literal(node.data?.estree?.body?.[0]?.expression) ?? "";
    case "mdxJsxFlowElement":
    case "mdxJsxTextElement":
      return element(ctx, node);
    case "link":
    case "definition":
      return link(ctx, node);
    default:
      return node.children?.length ? emit(ctx, start(node), end(node), node.children) : ctx.src.slice(start(node), end(node));
  }
}

function literal(expression: any): string | undefined {
  if (expression?.type === "Literal" && typeof expression.value === "string") return expression.value;
  if (expression?.type === "TemplateLiteral" && expression.expressions.length === 0) return expression.quasis[0].value.cooked;
  return undefined;
}

function link(ctx: Context, node: Node): string {
  const to = ctx.link(node.url);
  const own = node.children?.length ? emit(ctx, start(node), end(node), node.children) : ctx.src.slice(start(node), end(node));
  if (to === undefined) return own;
  // The URL as written, after `](` or `]:`, which may differ from the URL
  // parsed: the last occurrence is the destination's.
  const at = own.lastIndexOf(node.type === "link" ? "](" : "]:");
  if (at < 0) return own;
  return own.slice(0, at + 2) + own.slice(at + 2).replace(/^(\s*<?)[^\s)>]+/, (_, lead: string) => lead + to);
}

function element(ctx: Context, node: Node): string {
  const attrs = new Map<string, any>();
  for (const a of node.attributes ?? []) if (a.type === "mdxJsxAttribute") attrs.set(a.name, a.value);
  const text = (name: string) => (typeof attrs.get(name) === "string" ? (attrs.get(name) as string) : undefined);
  const expression = (name: string) => attrs.get(name)?.data?.estree?.body?.[0]?.expression;
  const column = node.position!.start.column - 1;
  const indent = ctx.src.slice(start(node) - column, start(node)).trim() === "" ? " ".repeat(column) : "";
  const name = node.name ?? "";

  // The code a component shows, from `code=`, and from any object of named
  // files, `css={{ "a.css": a }}`; what else it renders, a live demo, is
  // left out.
  if (attrs.has("code")) {
    const blocks: string[] = [];
    const code = codeOf(ctx, expression("code") ?? attrs.get("code"), name);
    if (code !== undefined) blocks.push(fence(code.text, text("lang") ?? langOf(code.file ?? ""), text("title")));
    for (const [key] of attrs) {
      const object = expression(key);
      if (key === "code" || object?.type !== "ObjectExpression") continue;
      for (const p of object.properties) {
        const file = p.key?.type === "Literal" ? String(p.key.value) : p.key?.name;
        const code = p.type === "Property" ? codeOf(ctx, p.value, name) : undefined;
        if (file && code) blocks.push(fence(code.text, langOf(file), file));
      }
    }
    return block(reindent(blocks.join("\n\n"), 0, indent), indent);
  }

  // A block a page keeps from its prose: its own markup, a demo.
  const classes = text("class") ?? text("className") ?? "";
  if (classes.split(/\s+/).includes("not-content")) return "";

  if (!node.children?.length) return "";
  const body = inner(ctx, node);
  if (node.type === "mdxJsxTextElement") return body;
  // A component's children, flattened, under its title or label: a tab's,
  // a card's.
  // A label the page's own title or description repeats is left out.
  const label = /^[A-Z]/.test(name) ? (text("title") ?? text("label")) : undefined;
  const flat = reindent(body, node.children[0]!.position!.start.column - 1, indent);
  const shown = label && label !== ctx.page.title && label !== ctx.page.description;
  return block(shown ? `**${label}**\n\n${indent}${flat}` : flat, indent);
}

// A block in place of an element, a blank line on each side, as an element
// beside another may have none.
const block = (text: string, indent: string) => (text ? `\n\n${indent}${text}\n\n${indent}` : "");

// The text a `code=` is given: a string, or a file the page imports `?raw`.
function codeOf(ctx: Context, value: any, element: string): { text: string; file?: string } | undefined {
  if (typeof value === "string") return { text: value };
  const text = literal(value);
  if (text !== undefined) return { text };
  if (value?.type === "Identifier" && ctx.raws.has(value.name)) {
    const file = ctx.raws.get(value.name)!;
    return { text: readFileSync(file, "utf-8"), file };
  }
  const built = evaluate(ctx.values, value);
  if (typeof built === "string") return { text: built };
  ctx.warn(`${ctx.page.id}: <${element}>'s code is neither text nor a file imported ?raw, and is left out`);
  return undefined;
}

// What an expression of a page's comes to, where it is built of text, the
// page's own constants and the fields of a JSON file it imports, as a
// version read from the package's manifest is; else undefined.
function evaluate(values: Map<string, any>, e: any): any {
  if (e?.type === "Literal") return e.value;
  if (e?.type === "Identifier") return values.get(e.name);
  if (e?.type === "MemberExpression" && !e.computed && e.property.type === "Identifier") {
    const of = evaluate(values, e.object);
    return of !== null && typeof of === "object" ? of[e.property.name] : undefined;
  }
  if (e?.type === "TemplateLiteral") {
    const parts = e.expressions.map((x: any) => evaluate(values, x));
    if (parts.some((p: any) => typeof p !== "string" && typeof p !== "number")) return undefined;
    return e.quasis.map((q: any, i: number) => q.value.cooked + (i < parts.length ? String(parts[i]) : "")).join("");
  }
  return undefined;
}

// A page's constants and the JSON files it imports, by name, in the order
// they are written, so a constant may be built of those before it.
function pageValues(page: Page, tree: Node, aliases: Alias[]): Map<string, any> {
  const values = new Map<string, any>();
  for (const node of tree.children ?? []) {
    if (node.type !== "mdxjsEsm") continue;
    for (const statement of node.data?.estree?.body ?? []) {
      if (statement.type === "ImportDeclaration") {
        const spec = String(statement.source.value);
        const local = statement.specifiers.find((s: any) => s.type === "ImportDefaultSpecifier")?.local.name;
        if (!local || spec.includes("?") || extname(spec) !== ".json") continue;
        const file = resolveImport(spec, page.file, aliases);
        if (existsSync(file)) values.set(local, JSON.parse(readFileSync(file, "utf-8")));
        continue;
      }
      const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
      if (declaration?.type !== "VariableDeclaration" || declaration.kind !== "const") continue;
      for (const d of declaration.declarations) {
        if (d.id.type !== "Identifier") continue;
        const v = evaluate(values, d.init);
        if (v !== undefined) values.set(d.id.name, v);
      }
    }
  }
  return values;
}

// What a page imports `?raw`, by the name it gives it.
function rawImports(page: Page, tree: Node, aliases: Alias[]): Map<string, string> {
  const raws = new Map<string, string>();
  for (const node of tree.children ?? []) {
    if (node.type !== "mdxjsEsm") continue;
    for (const statement of node.data?.estree?.body ?? []) {
      if (statement.type !== "ImportDeclaration") continue;
      const [spec, query = ""] = String(statement.source.value).split("?");
      if (!new URLSearchParams(query).has("raw")) continue;
      const local = statement.specifiers.find((s: any) => s.type === "ImportDefaultSpecifier")?.local.name;
      if (!local) continue;
      const file = resolveImport(spec!, page.file, aliases);
      if (!existsSync(file)) throw new Error(`starlight-theme-hypha: ${page.id} imports ${statement.source.value}, and ${file} is not there`);
      raws.set(local, file);
    }
  }
  return raws;
}

// Blank lines outside fenced code at most one in a row, and none at the ends.
export function tidy(text: string): string {
  const out: string[] = [];
  let open: string | undefined;
  for (const line of text.split("\n")) {
    const mark = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
    const inside = open !== undefined;
    if (inside) {
      if (mark && mark[0] === open![0] && mark.length >= open!.length && line.trim() === mark) open = undefined;
    } else if (mark) open = mark;
    else if (line.trim() === "" && (out.length === 0 || out.at(-1)!.trim() === "")) continue;
    out.push(inside || mark ? line : line.replace(/\s+$/, ""));
  }
  while (out.length && out.at(-1)!.trim() === "") out.pop();
  return `${out.join("\n")}\n`;
}

// One page as Markdown: its title, its description, and its body, the
// imports read and the components flattened to what an agent can read.
export function pageMarkdown(page: Page, aliases: Alias[], link: (url: string) => string | undefined, warn: (m: string) => void = () => {}): string {
  const src = page.body;
  const tree = fromMarkdown(src, page.mdx ? { extensions: [mdxjs()], mdastExtensions: [mdxFromMarkdown()] } : {}) as Node;
  const ctx: Context = { src, page, link, warn, raws: rawImports(page, tree, aliases), values: pageValues(page, tree, aliases) };
  const body = emit(ctx, 0, src.length, tree.children ?? []);
  return tidy([`# ${page.title}`, page.description ?? "", body].join("\n\n"));
}

type Entry = { page: Page } | { label: string; link: string };
type Group = { label?: string; entries: Entry[] };

// The sidebar's top-level groups, each with its pages in order, nested
// groups flattened into the one they are in; top-level links and pages are
// a group with no label, first, and pages the sidebar does not list one
// last.
export function groupsOf(sidebar: unknown, pages: Page[], base: string): Group[] {
  const byId = new Map(pages.map((p) => [p.id, p]));
  const auto = (directory: string) =>
    pages
      .filter((p) => directory === "" || p.id === directory || p.id.startsWith(`${directory.replace(/\/$/, "")}/`))
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.id.localeCompare(b.id));
  const page = (id: string): Entry[] => (byId.has(id) ? [{ page: byId.get(id)! }] : []);
  const entries = (item: any): Entry[] => {
    if (typeof item === "string") return page(item);
    if (Array.isArray(item?.items)) return item.items.flatMap(entries);
    if (item?.autogenerate) return auto(item.autogenerate.directory).map((p) => ({ page: p }));
    if (typeof item?.slug === "string") return page(item.slug);
    if (typeof item?.link === "string") {
      const id = idFromUrl(item.link, base);
      return id !== undefined && byId.has(id) ? page(id) : [{ label: item.label, link: item.link }];
    }
    return [];
  };
  if (!Array.isArray(sidebar)) return [{ entries: auto("").map((p) => ({ page: p })) }];
  const loose: Entry[] = [];
  const groups: Group[] = [];
  for (const item of sidebar) {
    if (typeof item?.label === "string" && (Array.isArray(item.items) || item.autogenerate)) groups.push({ label: item.label, entries: entries(item) });
    else loose.push(...entries(item));
  }
  const listed = new Set([...loose, ...groups.flatMap((g) => g.entries)].flatMap((e) => ("page" in e ? [e.page.id] : [])));
  const rest = pages.filter((p) => !listed.has(p.id));
  return [
    ...(loose.length ? [{ entries: loose }] : []),
    ...groups,
    ...(rest.length ? [{ label: "Other pages", entries: rest.map((p) => ({ page: p })) }] : []),
  ];
}

// A page's id from a link to it on the site: `/solidtype/heroui/button/#usage`
// is `heroui/button`; none for a link elsewhere.
export function idFromUrl(url: string, base: string): string | undefined {
  if (!url.startsWith("/") || url.startsWith("//")) return undefined;
  const path = url.split(/[?#]/)[0]!;
  if (base && path !== base && !path.startsWith(`${base}/`)) return undefined;
  const id = path
    .slice(base.length)
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.(md|html)$/, "")
    .replace(/(^|\/)index$/, "");
  return id === "" ? "index" : id;
}

// Every file of the target, by its path in it: llms.txt, and a page's
// Markdown at `<id>.md` in the site, `pages/<id>.md` in the folder.
export function agentFiles(input: {
  pages: Page[];
  aliases: Alias[];
  sidebar: unknown;
  title: string;
  description?: string;
  options: Pick<AgentsOptions, "preamble" | "groups"> & { skill?: SkillOptions | false };
  target: Target;
  warn?: (m: string) => void;
}): Map<string, string> {
  const { pages, aliases, target, options } = input;
  const ids = new Set(pages.map((p) => p.id));
  const files = new Map<string, string>();
  const path = (id: string) => (target.kind === "site" ? `${id}.md` : `pages/${id}.md`);
  const href = (id: string, from: string) =>
    target.kind === "site" ? `${target.origin ?? ""}${target.base}/${id}.md` : posix.relative(posix.dirname(from), path(id));
  // A link in a page: to another page's Markdown, or to the site, whole.
  const linker = (from: string) => (url: string) => {
    const id = idFromUrl(url, target.base);
    if (id === undefined) return undefined;
    const hash = url.includes("#") ? url.slice(url.indexOf("#")) : "";
    if (ids.has(id)) return href(id, from) + hash;
    return target.origin ? target.origin + url : undefined;
  };

  for (const page of pages) files.set(path(page.id), pageMarkdown(page, aliases, linker(path(page.id)), input.warn));

  const line = (e: Entry) => {
    if (!("page" in e)) return `- [${e.label}](${e.link})`;
    return `- [${e.page.title}](${href(e.page.id, "llms.txt")})${e.page.description ? `: ${e.page.description}` : ""}`;
  };
  const sections = groupsOf(input.sidebar, pages, target.base).map((g) =>
    [g.label ? `## ${g.label}` : "", g.label ? (options.groups[g.label] ?? "") : "", g.entries.map(line).join("\n")].filter(Boolean).join("\n\n"),
  );
  files.set(
    "llms.txt",
    tidy([`# ${input.title}`, input.description ? `> ${input.description}` : "", options.preamble ?? "", ...sections].filter(Boolean).join("\n\n")),
  );
  if (target.kind === "folder" && options.skill) {
    const skill = skillFile(options.skill, input.title, input.description, target.origin ? `${target.origin}${target.base}/llms.txt` : undefined);
    files.set(`skills/${skill.name}/SKILL.md`, skill.text);
  }
  return files;
}

// A skill's name as Agent Skills takes it: lower case letters, digits and
// single dashes, at most 64 characters.
export const skillName = /^(?=.{1,64}$)[a-z0-9]+(-[a-z0-9]+)*$/;

// The skill an agent is given, in the Agent Skills format
// (https://agentskills.io): not the docs again, but when to read them, where
// the release's are installed, and to build from the library's parts.
export function skillFile(
  options: SkillOptions,
  title: string,
  description: string | undefined,
  online: string | undefined,
): { name: string; text: string } {
  const name =
    options.name ??
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  if (!skillName.test(name)) throw new Error(`starlight-theme-hypha: the skill's name, ${JSON.stringify(name)}, is not lower case letters, digits and dashes; give agents.skill.name`);
  const pkg = options.package ?? name;
  const when = (options.description ?? `Use before writing or changing OCaml code that uses ${name}${description ? `: ${description}` : "."}`).replace(/\s+/g, " ").trim();
  if (when.length > 1024) throw new Error("starlight-theme-hypha: the skill's description is longer than Agent Skills' 1024 characters");
  const doc = `$(opam var ${pkg}:doc)`;
  const text = [
    "---",
    `name: ${name}`,
    // A JSON string is a YAML string, its colons and quotes escaped.
    `description: ${JSON.stringify(when)}`,
    "---",
    "",
    `# ${name}`,
    "",
    `${name}'s documentation is installed with its opam package, \`${pkg}\`, at the release the code builds against. Read it before ${options.before ?? `writing code with ${name}`}, and build from the parts it gives.`,
    "",
    `1. Read the catalogue, \`${doc}/llms.txt\`: every page, a line each, by what it is for.${online ? ` Only where it is not installed, read ${online}, which may document a newer release than the code builds against.` : ""}`,
    `2. Read the page of each part the work needs, \`${doc}/pages/<page>.md\`, its examples among them.`,
    "3. Build from those parts, and write by hand only what none of them does.",
    ...(options.instead.length
      ? ["", `## Written by hand instead of a part`, "", `Each of these is easily written by hand where ${name} has a part; look for the part first:`, "", ...options.instead.map((i) => `- ${i}`)]
      : []),
    "",
  ].join("\n");
  return { name, text };
}

// The folders the build owns in a folder it writes, beside its llms.txt.
export const owned = ["pages", "skills"];

// What is in a folder the build writes: its llms.txt, pages/ and skills/.
export function readFolder(dir: string): Map<string, string> {
  const files = new Map<string, string>();
  const llms = join(dir, "llms.txt");
  if (existsSync(llms)) files.set("llms.txt", readFileSync(llms, "utf-8"));
  for (const sub of owned) {
    const path = join(dir, sub);
    if (existsSync(path)) for (const file of walk(path)) files.set(relative(dir, file).split(sep).join("/"), readFileSync(file, "utf-8"));
  }
  return files;
}

// How a folder differs from what the pages generate, a line a file; none
// where it is the same.
export function differences(written: Map<string, string>, generated: Map<string, string>): string[] {
  const out: [string, string][] = [];
  for (const [path, text] of generated) {
    if (!written.has(path)) out.push([path, "missing"]);
    else if (written.get(path) !== text) out.push([path, "changed"]);
  }
  for (const path of written.keys()) if (!generated.has(path)) out.push([path, "not generated"]);
  return out.sort(([a], [b]) => a.localeCompare(b)).map(([path, how]) => `${path}: ${how}`);
}
