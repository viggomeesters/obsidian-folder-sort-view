# Changelog

## 0.1.1

- Render children lazily from public `TFolder.children` instead of rebuilding a full vault tree every render.
- Reduced bundle size by keeping recursive tree construction out of runtime view rendering.
- Added one-level sort coverage for the lazy runtime path.

## 0.1.0

- Initial public-API-only Folder Sort View.
- Added custom sidebar view, Z-to-A folder ordering, A-to-Z file ordering, tests, smoke tooling, and community review scaffold.
