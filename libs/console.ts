// A console block's copy button copies only the commands, without `$ `.
// Done in the page, not an Expressive Code plugin: <Code> refuses options
// that aren't JSON, and a plugin is a function.

// Expressive Code stores newlines in `data-code` as U+007F and reads it on click.
const newline = "\u007f";

export const commands = (code: string) =>
  code
    .split(newline)
    .filter((l) => l.startsWith("$ "))
    .map((l) => l.slice(2))
    .join(newline);

export const copyCommands = (root: ParentNode) => {
  for (const pre of root.querySelectorAll('pre[data-language="console"]')) {
    const button = pre.closest("figure")?.querySelector<HTMLElement>("button[data-code]");
    if (button?.dataset.code) button.dataset.code = commands(button.dataset.code);
  }
};
