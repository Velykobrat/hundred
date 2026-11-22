# Release checklist

This checklist is preparation for a future release; completing it does not itself publish anything.

## Before release

- [x] Confirm `package.json` and `package-lock.json` consistently declare 0.9.0.
- [x] Run `npm test`, `npm run lint`, and `npm run build`, then `npm run test:e2e` against that fresh build.
- [ ] Manually check desktop and mobile, including a real mobile device and light and dark themes.
- [ ] Verify offline/PWA installation and updates using the [PWA guide](pwa.md#manual-qa-production-build).
- [ ] Export a backup and import it in an isolated profile; confirm the contents without disturbing personal data.
- [ ] Check keyboard navigation and, where available, spot-check with NVDA or VoiceOver.

## Git

- [ ] Review the complete working tree and release notes, including any uncommitted work.
- [ ] Commit the intended release changes and confirm the working tree is clean.
- [ ] Create an annotated tag for 0.9.0.

## GitHub and deployment

- [ ] Push `main` and the tag.
- [ ] Create a GitHub Release using the reviewed [release notes](release-notes.md).
- [ ] Verify the deployed app and README screenshots.
