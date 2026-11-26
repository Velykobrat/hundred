# Hundred 1.0.0 — release notes

Hundred 1.0.0 is the first stable release of a system for describing a Whole through Parts, where every Part can become a new Whole.

**Whole → Parts → New Whole**

## Highlights

- Create structural Wholes for lists and hierarchies, or measured Wholes with quantities, units, proportional Parts, and a treemap.
- Navigate nested Parts, search across Wholes, switch structural cards and lists, and reorder or lock Parts. Saved Wholes can also be reordered using the keyboard.
- Start with two editable local examples: **Моє життя** and **Місячний бюджет**.
- Use mobile navigation and gestures, Ukrainian or English, and light, dark, or system themes.
- Save locally, export and import JSON backups, and use the PWA offline after a successful initial installation.

## Your data and limitations

No account or backend is required. Data stays in the current browser and origin; export backups before clearing site data or changing devices. Offline availability and installation depend on browser support and a completed online installation.

Open tabs detect stale writes and reload newer local data to reduce accidental overwrites. This is not collaborative editing, and the read/compare/write operation is not fully atomic. Undo history does not survive a reload. See the [README](../README.md) and [PWA guide](pwa.md) for details.

## Verification

The project includes core and PWA tests, Chromium end-to-end tests, Firefox and WebKit smoke coverage, lint, and production build checks. Real-device, screen-reader, offline-installation, and update checks remain part of the [release checklist](release-checklist.md).
