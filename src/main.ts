import { ItemView, Plugin, TFile, TFolder, WorkspaceLeaf, setIcon } from "obsidian";
import { buildFolderSortTree, flattenVisibleNodes, type FolderSortEntry, type FolderSortNode } from "./tree";

const VIEW_TYPE_FOLDER_SORT = "folder-sort-view";

export default class FolderSortViewPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_FOLDER_SORT, (leaf) => new FolderSortView(leaf, this));
    this.addRibbonIcon("folder-tree", "Open Folder Sort View", () => { void this.activateView(); });
    this.addCommand({ id: "open-folder-sort-view", name: "Open Folder Sort View", callback: () => { void this.activateView(); } });
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_FOLDER_SORT);
  }

  async activateView(): Promise<void> {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_SORT)[0] ?? this.app.workspace.getLeftLeaf(false) ?? this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE_FOLDER_SORT, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
}

class FolderSortView extends ItemView {
  private readonly plugin: FolderSortViewPlugin;
  private expandedFolders = new Set<string>();
  private refreshTimer: number | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: FolderSortViewPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE_FOLDER_SORT; }
  getDisplayText(): string { return "Folder Sort View"; }
  getIcon(): string { return "folder-tree"; }

  async onOpen(): Promise<void> {
    this.registerVaultEvents();
    this.render();
  }

  async onClose(): Promise<void> {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
  }

  private registerVaultEvents(): void {
    this.registerEvent(this.app.vault.on("create", () => this.queueRender()));
    this.registerEvent(this.app.vault.on("delete", () => this.queueRender()));
    this.registerEvent(this.app.vault.on("rename", () => this.queueRender()));
  }

  private queueRender(): void {
    if (this.refreshTimer !== null) return;
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      this.render();
    }, 120);
  }

  private render(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass("folder-sort-view");
    const header = container.createDiv({ cls: "folder-sort-view__header" });
    header.createSpan({ text: "Folder Sort View" });
    const list = container.createDiv({ cls: "folder-sort-view__list" });
    const tree = buildFolderSortTree(this.getEntries());
    for (const node of flattenVisibleNodes(tree, this.expandedFolders)) this.renderNode(list, node);
  }

  private getEntries(): FolderSortEntry[] {
    const entries: FolderSortEntry[] = [];
    const collect = (folder: TFolder) => {
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          entries.push({ type: "folder", path: child.path, name: child.name });
          collect(child);
        } else if (child instanceof TFile) {
          entries.push({ type: "file", path: child.path, name: child.name });
        }
      }
    };
    collect(this.app.vault.getRoot());
    return entries;
  }

  private renderNode(list: HTMLElement, node: FolderSortNode): void {
    const depth = node.path.split("/").length - 1;
    const button = list.createEl("button", { cls: `folder-sort-view__item folder-sort-view__${node.type}`, attr: { type: "button", title: node.path } });
    button.style.paddingLeft = `${depth * 14 + 4}px`;
    setIcon(button, node.type === "folder" ? (this.expandedFolders.has(node.path) ? "chevron-down" : "chevron-right") : "file");
    button.createSpan({ text: node.name });
    button.addEventListener("click", () => {
      if (node.type === "folder") {
        if (this.expandedFolders.has(node.path)) this.expandedFolders.delete(node.path);
        else this.expandedFolders.add(node.path);
        this.render();
      } else {
        const file = this.app.vault.getAbstractFileByPath(node.path);
        if (file instanceof TFile) void this.app.workspace.getLeaf(false).openFile(file);
      }
    });
  }
}
