// A console block is commands and what they print, so its copy button
// copies the commands alone, without their `$ ` prompt. The page sets it,
// not an Expressive Code plugin: a plugin in Starlight's options is a
// function, and Expressive Code's <Code> component refuses options that
// are not JSON.

// Expressive Code's copy button holds a block's newlines as U+007F, and
// reads the button's `data-code` when it is clicked.
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
