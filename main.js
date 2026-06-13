var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => FolderSortViewPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/tree.ts
function buildFolderSortTree(entries) {
  const root = { type: "folder", path: "", name: "", children: [] };
  const folders = /* @__PURE__ */ new Map();
  const ensureFolder = (path, name) => {
    const existing = folders.get(path);
    if (existing) return existing;
    const node = { type: "folder", path, name, children: [] };
    folders.set(path, node);
    const parentPath = getParentPath(path);
    const parent = parentPath ? ensureFolder(parentPath, getBaseName(parentPath)) : root;
    parent.children.push(node);
    return node;
  };
  for (const entry of entries) {
    if (entry.type === "folder") {
      ensureFolder(entry.path, entry.name);
      continue;
    }
    const parentPath = getParentPath(entry.path);
    const parent = parentPath ? ensureFolder(parentPath, getBaseName(parentPath)) : root;
    parent.children.push({ ...entry, children: [] });
  }
  sortTree(root);
  return root;
}
function flattenVisibleNodes(root, expandedFolders) {
  const visible = [];
  const visit = (nodes) => {
    for (const node of nodes) {
      visible.push(node);
      if (node.type === "folder" && expandedFolders.has(node.path)) visit(node.children);
    }
  };
  visit(root.children);
  return visible;
}
function sortTree(node) {
  node.children.sort(compareNodes);
  for (const child of node.children) sortTree(child);
}
function compareNodes(left, right) {
  if (left.type !== right.type) return left.type === "folder" ? -1 : 1;
  const direction = left.type === "folder" ? -1 : 1;
  return direction * left.name.localeCompare(right.name, void 0, { sensitivity: "base", numeric: true });
}
function getParentPath(path) {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}
function getBaseName(path) {
  var _a;
  return (_a = path.split("/").pop()) != null ? _a : path;
}

// src/main.ts
var VIEW_TYPE_FOLDER_SORT = "folder-sort-view";
var FolderSortViewPlugin = class extends import_obsidian.Plugin {
  async onload() {
    this.registerView(VIEW_TYPE_FOLDER_SORT, (leaf) => new FolderSortView(leaf, this));
    this.addRibbonIcon("folder-tree", "Open Folder Sort View", () => {
      void this.activateView();
    });
    this.addCommand({ id: "open-folder-sort-view", name: "Open Folder Sort View", callback: () => {
      void this.activateView();
    } });
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_FOLDER_SORT);
  }
  async activateView() {
    var _a, _b;
    const leaf = (_b = (_a = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_SORT)[0]) != null ? _a : this.app.workspace.getLeftLeaf(false)) != null ? _b : this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE_FOLDER_SORT, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
};
var FolderSortView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.expandedFolders = /* @__PURE__ */ new Set();
    this.refreshTimer = null;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_FOLDER_SORT;
  }
  getDisplayText() {
    return "Folder Sort View";
  }
  getIcon() {
    return "folder-tree";
  }
  async onOpen() {
    this.registerVaultEvents();
    this.render();
  }
  async onClose() {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
  }
  registerVaultEvents() {
    this.registerEvent(this.app.vault.on("create", () => this.queueRender()));
    this.registerEvent(this.app.vault.on("delete", () => this.queueRender()));
    this.registerEvent(this.app.vault.on("rename", () => this.queueRender()));
  }
  queueRender() {
    if (this.refreshTimer !== null) return;
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      this.render();
    }, 120);
  }
  render() {
    const container = this.contentEl;
    container.empty();
    container.addClass("folder-sort-view");
    const header = container.createDiv({ cls: "folder-sort-view__header" });
    header.createSpan({ text: "Folder Sort View" });
    const list = container.createDiv({ cls: "folder-sort-view__list" });
    const tree = buildFolderSortTree(this.getEntries());
    for (const node of flattenVisibleNodes(tree, this.expandedFolders)) this.renderNode(list, node);
  }
  getEntries() {
    const entries = [];
    const collect = (folder) => {
      for (const child of folder.children) {
        if (child instanceof import_obsidian.TFolder) {
          entries.push({ type: "folder", path: child.path, name: child.name });
          collect(child);
        } else if (child instanceof import_obsidian.TFile) {
          entries.push({ type: "file", path: child.path, name: child.name });
        }
      }
    };
    collect(this.app.vault.getRoot());
    return entries;
  }
  renderNode(list, node) {
    const depth = node.path.split("/").length - 1;
    const button = list.createEl("button", { cls: `folder-sort-view__item folder-sort-view__${node.type}`, attr: { type: "button", title: node.path } });
    button.style.paddingLeft = `${depth * 14 + 4}px`;
    (0, import_obsidian.setIcon)(button, node.type === "folder" ? this.expandedFolders.has(node.path) ? "chevron-down" : "chevron-right" : "file");
    button.createSpan({ text: node.name });
    button.addEventListener("click", () => {
      if (node.type === "folder") {
        if (this.expandedFolders.has(node.path)) this.expandedFolders.delete(node.path);
        else this.expandedFolders.add(node.path);
        this.render();
      } else {
        const file = this.app.vault.getAbstractFileByPath(node.path);
        if (file instanceof import_obsidian.TFile) void this.app.workspace.getLeaf(false).openFile(file);
      }
    });
  }
};
