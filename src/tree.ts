export type FolderSortEntry = {
  type: "folder" | "file";
  path: string;
  name: string;
};

export type FolderSortNode = FolderSortEntry & {
  children: FolderSortNode[];
};

export type FolderSortRoot = {
  path: "";
  name: "";
  type: "folder";
  children: FolderSortNode[];
};

export function buildFolderSortTree(entries: readonly FolderSortEntry[]): FolderSortRoot {
  const root: FolderSortRoot = { type: "folder", path: "", name: "", children: [] };
  const folders = new Map<string, FolderSortNode>();

  const ensureFolder = (path: string, name: string): FolderSortNode => {
    const existing = folders.get(path);
    if (existing) return existing;
    const node: FolderSortNode = { type: "folder", path, name, children: [] };
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

export function flattenVisibleNodes(root: FolderSortRoot, expandedFolders: ReadonlySet<string>): FolderSortNode[] {
  const visible: FolderSortNode[] = [];
  const visit = (nodes: readonly FolderSortNode[]) => {
    for (const node of nodes) {
      visible.push(node);
      if (node.type === "folder" && expandedFolders.has(node.path)) visit(node.children);
    }
  };
  visit(root.children);
  return visible;
}

function sortTree(node: FolderSortRoot | FolderSortNode): void {
  node.children.sort(compareNodes);
  for (const child of node.children) sortTree(child);
}

function compareNodes(left: FolderSortNode, right: FolderSortNode): number {
  if (left.type !== right.type) return left.type === "folder" ? -1 : 1;
  const direction = left.type === "folder" ? -1 : 1;
  return direction * left.name.localeCompare(right.name, undefined, { sensitivity: "base", numeric: true });
}

function getParentPath(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

function getBaseName(path: string): string {
  return path.split("/").pop() ?? path;
}
