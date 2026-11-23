# Release checklist

This checklist is preparation for a future release; completing it does not itself publish anything.

## Before release

- [ ] Run `npm run check:release` to check package, lockfile, changelog, and release notes.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`, then `npm run test:e2e` against that fresh build.
- [ ] Confirm GitHub Actions validation and Chromium E2E jobs pass for the release changes.
- [ ] Manually check desktop and mobile, including a real mobile device and light and dark themes.
- [ ] Verify offline/PWA installation and updates using the [PWA guide](pwa.md#manual-qa-production-build).
- [ ] Export a backup and import it in an isolated profile; confirm the contents without disturbing personal data.
- [ ] Check keyboard navigation and, where available, spot-check with NVDA or VoiceOver.

## Git

- [ ] Review the complete working tree and release notes, including any uncommitted work.
- [ ] Commit the intended release changes and confirm the working tree is clean.
- [ ] Create an annotated `vX.Y.Z` tag matching the package version.

## GitHub and deployment

- [ ] Push `main` and the tag.
- [ ] Confirm the tag's GitHub Actions release-check workflow passes before publishing the release.
- [ ] Create a GitHub Release using the reviewed [release notes](release-notes.md).
- [ ] Verify the deployed app and README screenshots.
