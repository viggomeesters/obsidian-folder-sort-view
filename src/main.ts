import { ItemView, Plugin, TAbstractFile, TFile, TFolder, WorkspaceLeaf, setIcon } from "obsidian";
import { sortFolderEntries, type FolderSortEntry } from "./tree";

const VIEW_TYPE_FOLDER_SORT = "folder-sort-view";
const REFRESH_DELAY_MS = 120;

type FolderSortChild = FolderSortEntry & { file: TAbstractFile };

export default class FolderSortViewPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_FOLDER_SORT, (leaf) => new FolderSortView(leaf, this));
    this.addRibbonIcon("folder-tree", "Open Folder Sort View", () => { void this.activateView(); });
    this.addCommand({ id: "open-folder-sort-view", name: "Open Folder Sort View", callback: () => { void this.activateView(); } });
  }

  async activateView(): Promise<void> {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_SORT)[0] ?? this.app.workspace.getLeftLeaf(false) ?? this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE_FOLDER_SORT, active: true });
  }
}

class FolderSortView extends ItemView {
  private readonly plugin: FolderSortViewPlugin;
  private readonly expandedFolders = new Set<string>();
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
    }, REFRESH_DELAY_MS);
  }

  private render(): void {
    this.pruneExpandedFolders();
    const container = this.contentEl;
    container.empty();
    container.addClass("folder-sort-view");
    const header = container.createDiv({ cls: "folder-sort-view__header" });
    header.createSpan({ text: "Folder Sort View" });
    const list = container.createDiv({ cls: "folder-sort-view__list" });
    this.renderChildren(list, this.app.vault.getRoot(), 0);
  }

  private renderChildren(list: HTMLElement, folder: TFolder, depth: number): void {
    for (const child of this.getSortedChildren(folder)) {
      this.renderChild(list, child, depth);
      if (child.file instanceof TFolder && this.expandedFolders.has(child.path)) {
        this.renderChildren(list, child.file, depth + 1);
      }
    }
  }

  private pruneExpandedFolders(): void {
    for (const path of this.expandedFolders) {
      if (!(this.app.vault.getAbstractFileByPath(path) instanceof TFolder)) this.expandedFolders.delete(path);
    }
  }

  private getSortedChildren(folder: TFolder): FolderSortChild[] {
    const children: FolderSortChild[] = [];
    for (const child of folder.children) {
      if (child instanceof TFolder) children.push({ type: "folder", path: child.path, name: child.name, file: child });
      else if (child instanceof TFile) children.push({ type: "file", path: child.path, name: child.name, file: child });
    }
    return sortFolderEntries(children);
  }

  private renderChild(list: HTMLElement, child: FolderSortChild, depth: number): void {
    const button = list.createEl("button", { cls: `folder-sort-view__item folder-sort-view__${child.type}`, attr: { type: "button", title: child.path } });
    button.style.paddingLeft = `${depth * 14 + 4}px`;
    setIcon(button, child.type === "folder" ? (this.expandedFolders.has(child.path) ? "chevron-down" : "chevron-right") : "file");
    button.createSpan({ text: child.name });
    button.addEventListener("click", () => {
      if (child.file instanceof TFolder) {
        if (this.expandedFolders.has(child.path)) this.expandedFolders.delete(child.path);
        else this.expandedFolders.add(child.path);
        this.render();
      } else if (child.file instanceof TFile) {
        const file = this.app.vault.getAbstractFileByPath(child.path);
        if (file instanceof TFile) void this.app.workspace.getLeaf(false).openFile(file);
      }
    });
  }
}
