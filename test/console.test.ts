import { expect, test } from "bun:test";
import { commands, copyCommands } from "../libs/console";

const nl = "\u007f";

test("the commands alone", () => {
  expect(commands(["$ npm install widgets", "Done.", "$ npm run build"].join(nl))).toBe(["npm install widgets", "npm run build"].join(nl));
});

test("a console block's copy button", () => {
  const button = { dataset: { code: ["$ make docs", "built"].join(nl) } };
  const shell = { pre: { closest: () => ({ querySelector: () => button }) }, button };
  const root = { querySelectorAll: () => [shell.pre] } as unknown as ParentNode;
  copyCommands(root);
  expect(shell.button.dataset.code).toBe("make docs");
});
