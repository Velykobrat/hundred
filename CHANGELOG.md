# Changelog

Meaningful changes to Hundred are recorded here. Earlier release history has not been reconstructed.

## [Unreleased]

## [1.1.0] - 2026-11-26

### Changed

- Added segmented language and theme controls and simplified the Settings hierarchy and guide accordion.
- Improved title readability with fixed-height cards, title clamps, character counters, and optional guidance for longer names.
- Refined structural Part cards with a utility bar, a more readable responsive grid, and a compact Add Part and Cards/List toolbar.
- Made routine status notices temporary and floating, without shifting the page layout.
- Harmonized the Hundred mark and category colors across light and dark themes.

## [1.0.0] - 2026-11-26

### Added

- Two editable structural and measured starter Wholes on first launch when no Hundred storage exists.
- GitHub Actions validation, Chromium end-to-end testing, and release consistency checks.
- Stale-write detection and safer reloads for edits in multiple tabs.
- Part locking, structural Part and saved Whole reordering, and mobile long-press reorder mode.
- Keyboard-accessible saved Whole reordering through the actions menu.
- Mobile Add Part floating action and sticky mobile header.
- BeBetter product signature and updated Hundred favicon and PWA icons.
- Firefox and WebKit browser smoke coverage in CI and release checks.

### Changed

- Extracted Workspace screen composition and improved mobile navigation and header consistency.
- Made structural Cards and List mutually exclusive and added compact two-column mobile cards.
- Standardized card interaction: tap to open, long press to reorder, and Part actions via ⋯.
- Simplified Settings and aligned documentation with current behavior.

### Fixed

- Added secure ID generation fallback for non-secure local network contexts.
- Prevented outside taps on open panels from activating underlying controls.
- Prevented automatic text-field focus on touch devices when opening create or edit forms.

## [0.9.0] - 2026-11-22

This section describes the first formal Hundred release.

### Added

- Structural and measured Wholes, including mixed hierarchies under structural Wholes and proportional measured Parts.
- Local-first saving, offline PWA support, JSON backup and import, and an optional backup reminder.
- Nested navigation, search, editing, reordering, duplication, and undo/redo.
- Ukrainian and English, light and dark themes, onboarding, screenshots, and product documentation.
- Core and PWA tests, Playwright browser coverage, and accessibility-oriented keyboard and dialog checks.

### Changed

- Clarified Whole and Parts terminology, structural metadata, and delete confirmations.
- Improved keyboard focus, form descriptions, dialog behavior, and the textual alternative to the treemap.
- Upgraded Next.js from 16.4.0 to 16.4.6 for security.

### Fixed

- Corrected offline PWA shell lookup for deployment-adapter builds.
- Improved contrast for treemap text and destructive actions, and restored focus after closing dialogs.
