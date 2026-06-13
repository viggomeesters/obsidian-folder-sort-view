# Folder Sort View

Folder Sort View adds a separate sidebar view with folders sorted Z-to-A using Obsidian public APIs only. It does not patch or copy the native File Explorer.

## Features

- Separate `Folder Sort View` sidebar.
- Folders sorted Z-to-A.
- Files sorted A-to-Z inside each folder.
- Click folders to expand/collapse.
- Click files to open them through Obsidian's normal workspace flow.
- No native File Explorer monkeypatching, no copied Obsidian source, no vault writes, no network, no clipboard.

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
