import assert from "node:assert/strict";
import esbuild from "esbuild";

const output = await esbuild.build({ entryPoints: ["src/main.ts"], bundle: true, format: "cjs", platform: "browser", external: ["obsidian"], write: false, logLevel: "silent" });
class Plugin { constructor(app) { this.app = app; } }
let modernApi = false;
const stubs = { Plugin, ItemView: class {}, requireApiVersion: () => modernApi };
const module = { exports: {} };
new Function("require", "module", "exports", output.outputFiles[0].text)(() => stubs, module, module.exports);
let collapsed = true;
const leftSplit = { expand() { collapsed = false; } };
const leaf = { async setViewState() {}, getRoot() { return leftSplit; } };
let existing = false;
let revealed = null;
const workspace = {
  getLeavesOfType: () => existing ? [leaf] : [],
  getLeftLeaf: () => { existing = true; return leaf; },
  leftSplit,
  rightSplit: { expand() { throw new Error("wrong sidebar"); } },
  revealLeaf: (value) => { collapsed = false; revealed = value; return modernApi ? Promise.resolve() : undefined; },
};
const plugin = new module.exports.default({ workspace });
await plugin.activateView();
assert.equal(revealed, leaf, "first open must reveal the sidebar");
revealed = null;
assert.equal(collapsed, false);
collapsed = true;
await plugin.activateView();
assert.equal(revealed, leaf, "repeated open must reveal the existing sidebar");
assert.equal(collapsed, false);
modernApi = true;
collapsed = true;
await plugin.activateView();
assert.equal(collapsed, false);
assert.equal(revealed, leaf);
console.log("Folder Sort View reveals its sidebar on first and repeated open.");
