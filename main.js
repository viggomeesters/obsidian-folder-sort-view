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
function sortFolderEntries(entries) {
  return [...entries].sort(compareEntries);
}
function compareEntries(left, right) {
  if (left.type !== right.type) return left.type === "folder" ? -1 : 1;
  const direction = left.type === "folder" ? -1 : 1;
  return direction * left.name.localeCompare(right.name, void 0, { sensitivity: "base", numeric: true });
}

// src/main.ts
var VIEW_TYPE_FOLDER_SORT = "folder-sort-view";
var REFRESH_DELAY_MS = 120;
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
  async activateView() {
    var _a, _b;
    const leaf = (_b = (_a = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_SORT)[0]) != null ? _a : this.app.workspace.getLeftLeaf(false)) != null ? _b : this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE_FOLDER_SORT, active: true });
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
    }, REFRESH_DELAY_MS);
  }
  render() {
    this.pruneExpandedFolders();
    const container = this.contentEl;
    container.empty();
    container.addClass("folder-sort-view");
    const header = container.createDiv({ cls: "folder-sort-view__header" });
    header.createSpan({ text: "Folder Sort View" });
    const list = container.createDiv({ cls: "folder-sort-view__list" });
    this.renderChildren(list, this.app.vault.getRoot(), 0);
  }
  renderChildren(list, folder, depth) {
    for (const child of this.getSortedChildren(folder)) {
      this.renderChild(list, child, depth);
      if (child.file instanceof import_obsidian.TFolder && this.expandedFolders.has(child.path)) {
        this.renderChildren(list, child.file, depth + 1);
      }
    }
  }
  pruneExpandedFolders() {
    for (const path of this.expandedFolders) {
      if (!(this.app.vault.getAbstractFileByPath(path) instanceof import_obsidian.TFolder)) this.expandedFolders.delete(path);
    }
  }
  getSortedChildren(folder) {
    const children = [];
    for (const child of folder.children) {
      if (child instanceof import_obsidian.TFolder) children.push({ type: "folder", path: child.path, name: child.name, file: child });
      else if (child instanceof import_obsidian.TFile) children.push({ type: "file", path: child.path, name: child.name, file: child });
    }
    return sortFolderEntries(children);
  }
  renderChild(list, child, depth) {
    const button = list.createEl("button", { cls: `folder-sort-view__item folder-sort-view__${child.type}`, attr: { type: "button", title: child.path } });
    button.style.paddingLeft = `${depth * 14 + 4}px`;
    (0, import_obsidian.setIcon)(button, child.type === "folder" ? this.expandedFolders.has(child.path) ? "chevron-down" : "chevron-right" : "file");
    button.createSpan({ text: child.name });
    button.addEventListener("click", () => {
      if (child.file instanceof import_obsidian.TFolder) {
        if (this.expandedFolders.has(child.path)) this.expandedFolders.delete(child.path);
        else this.expandedFolders.add(child.path);
        this.render();
      } else if (child.file instanceof import_obsidian.TFile) {
        const file = this.app.vault.getAbstractFileByPath(child.path);
        if (file instanceof import_obsidian.TFile) void this.app.workspace.getLeaf(false).openFile(file);
      }
    });
  }
};
