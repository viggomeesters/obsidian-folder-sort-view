# Folder Sort View

Folder Sort View is a read-only alternate navigation pane for Obsidian folders and files with custom sorting. It uses Obsidian public APIs only and does not replace, patch, or copy the native File Explorer.

## Scope

Folder Sort View is intentionally a viewer, not a file manager:

- It does not rename, move, delete, or create vault files.
- It does not implement drag-and-drop or context-menu file operations.
- It does not monkeypatch Obsidian's native File Explorer.
- It does not write vault content, use the network, or touch the clipboard.

Use Obsidian's native File Explorer for file-management actions. Use Folder Sort View when you want a safe navigation-only sidebar with the sorting below.

## Features

- Separate read-only `Folder Sort View` sidebar.
- Folders sorted Z-to-A.
- Files sorted A-to-Z inside each folder.
- Click folders to expand/collapse. Descendants are rendered lazily only when their folder is expanded.
- Click files to open them through Obsidian's normal workspace flow.
- Public-API-only implementation.

## Development

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run sync:test-vault
npm run smoke:cdp
npm run community:check
```

## Release

Create a GitHub release whose tag exactly matches `manifest.json.version` and attach `main.js`, `manifest.json`, and `styles.css`.
