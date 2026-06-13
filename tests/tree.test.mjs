import test from "node:test";
import assert from "node:assert/strict";
import { buildFolderSortTree, flattenVisibleNodes } from "../dist/tree.mjs";

const folder = (path, name) => ({ type: "folder", path, name });
const file = (path, name) => ({ type: "file", path, name });

test("builds a public-api tree with folders sorted Z-to-A before files", () => {
  const tree = buildFolderSortTree([
    folder("Alpha", "Alpha"),
    folder("zeta", "zeta"),
    file("root.md", "root.md"),
    folder("Beta", "Beta"),
    file("zeta/b.md", "b.md"),
    folder("zeta/inner", "inner"),
    file("Alpha/a.md", "a.md"),
  ]);
  assert.deepEqual(tree.children.map((node) => node.name), ["zeta", "Beta", "Alpha", "root.md"]);
  assert.deepEqual(tree.children[0].children.map((node) => node.name), ["inner", "b.md"]);
});

test("flattenVisibleNodes only includes descendants of expanded folders", () => {
  const tree = buildFolderSortTree([
    folder("zeta", "zeta"),
    file("zeta/b.md", "b.md"),
    folder("Alpha", "Alpha"),
    file("Alpha/a.md", "a.md"),
  ]);
  assert.deepEqual(flattenVisibleNodes(tree, new Set()).map((node) => node.path), ["zeta", "Alpha"]);
  assert.deepEqual(flattenVisibleNodes(tree, new Set(["zeta"])).map((node) => node.path), ["zeta", "zeta/b.md", "Alpha"]);
});

test("handles numeric folder names in descending natural order", () => {
  const tree = buildFolderSortTree([folder("2-folder", "2-folder"), folder("10-folder", "10-folder")]);
  assert.deepEqual(tree.children.map((node) => node.name), ["10-folder", "2-folder"]);
});
