# Hundred 0.9.0 — release notes

Hundred is a system for describing a Whole through Parts, where every Part can become a new Whole. Break a whole into parts, then open any part as a new whole.

## In this release

- Create a **Structural Whole** for a team, project structure, or list without assigning quantities. Its Parts may themselves be structural or measured.
- Create a **Measured Whole** with a quantity and unit, divide it into proportional Parts, and see the remaining capacity.
- Navigate nested Parts, search, reorder, edit, duplicate a Whole, and undo or redo changes. Choose optional colors and icons.
- Use Hundred in Ukrainian or English with light, dark, or system theme. The interface includes introductory guidance and keyboard and dialog improvements.

## Your data

No account or backend is required. Wholes and preferences are stored locally in the browser on the current device and origin; there is no cloud sync. The production app can work offline after its service worker and assets have completed an initial online installation, subject to browser support. Export JSON backups regularly and before clearing browser data or changing devices. A backup reminder helps, but an initiated download does not guarantee that a file was saved.

## Current limitations

Data is not automatically synchronized or backed up. Offline availability and installation depend on the browser, and clearing site data or browser storage eviction can remove local data. Undo history does not survive a reload. A measured Part uses its parent's unit, and editing an existing node cannot change its type or unit. See the [README](../README.md) and [PWA guide](pwa.md) for limits and details.

## Validation

The project has core and mocked PWA tests, Chromium Playwright end-to-end tests including accessibility-oriented checks, lint, and a production build. Run the [release checklist](release-checklist.md) for the final result; manual real-device, screen-reader, offline-installation, and update checks remain necessary. These checks do not establish full accessibility or cross-browser compliance.
