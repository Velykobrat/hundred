# Offline / PWA foundation

Hundred remains local-first. Node types, storage v3, localStorage keys, history,
migrations, cross-tab storage events and backup/import logic are unchanged.
There is no backend or synchronization service.

## Build and caching

Use `npm run build`, then `npm run start`, or the existing Vercel build pipeline.
The build runs `scripts/build-pwa.mjs` after Next.js finishes. It reads the
prerendered `/` HTML, all emitted JS/CSS/font files under `.next/static`, the
manifest and the two install icons. It hashes their contents together with the
worker template and writes **generated, git-ignored** `public/sw.js`.
Do not invoke `next build` directly for a release: that skips worker generation.
The generator fails if the expected prerendered root is missing or a referenced
shell asset is absent. Revisit it if Next.js changes its build output structure.

The worker atomically precaches this shell and its explicit local assets during
installation. All emitted runtime chunks are included, so a screen does not
need to have been opened online individually. Fonts from `next/font/google`
are served locally by Next; Google Fonts is a build-time dependency, not an
offline runtime dependency.

Controlled navigations to `/` (including query strings and existing hash screens)
use that worker version's actual cached app HTML. Assets use the matching cache
first. This intentionally keeps HTML and runtime assets on the same build.
Cache misses can use the network but do not populate an unrestricted runtime cache.
Failed/redirected asset fetches prevent installation; failed updates leave the
previous installed worker/cache available.

The worker ignores non-GET requests, external origins, other paths, RSC requests,
API requests, blob URLs, downloaded backups and imported files. It deletes only
older `hundred-pwa-*` CacheStorage entries when a new worker activates.
It never reads, writes or clears localStorage.

## Updates

Registration uses `/sw.js`, root scope, `updateViaCache: "none"`, and a no-store
response header configured in `next.config.ts`. The generated script changes
when the shell, assets, manifest or worker changes. Update checks run on app
registration, returning to a visible tab, going online and hourly while open.
Browsers also perform their standard service-worker update checks.

A new worker installs fully and **waits**. No forced reload or `skipWaiting` is
used, so open forms and multiple tabs are not interrupted. A small translated
status message asks the user to close **all** Hundred browser tabs and installed
windows, then reopen. Once the old worker has no clients, the new worker can
activate and delete old shell caches. Reloading one of several open tabs alone
does not apply a waiting update. A successfully installed waiting update can
activate without another download, including offline.

## Installation and limitations

`app/manifest.webmanifest` provides Hundred's name, stable root id/scope/start URL,
standalone display and colors matching the default dark UI. Two plain local PNG
icons (192 and 512 pixels) exist solely for installation. There is no new visual
customization, install dialog or custom install prompt. Use the browser's install
menu where offered, or Safari's Add to Home Screen where supported.

Offline support requires HTTPS (or localhost), service-worker/CacheStorage support,
and **one completed online worker installation**. A first page paint is not proof
that all offline assets have finished downloading. Check the browser Application
panel for an activated worker before disconnecting. If the initial installation
fails, stay online and reload to retry. Closing a first visit too early, private
mode restrictions, storage quota/eviction, clearing site data or changing origins
can make offline use unavailable. An HTTP LAN address is not a secure context.
Browser/OS installation availability varies. Backups remain essential: caching
the app is not a backup of user data. Undo history remains in-memory as before;
saved trees/preferences/path persist across reloads, undo stacks do not.

Registration is disabled under `npm run dev`. Test production on a separate port
or origin from development, since an existing production worker can still control
that origin until its tabs close/unregister. DevTools **Bypass for network** and
**Update on reload** should both be off for realistic lifecycle/offline testing.

## Manual QA (production build)

Use `npm run build` and `npm run start -- --port 3100`, or an HTTPS Vercel preview.
Use a dedicated test origin/profile so existing personal data is unaffected.

A. Load Hundred online. In Application → Service Workers, wait for the root worker
   to activate. Check Cache Storage for `hundred-pwa-*`, `/` and JS/CSS/fonts.
   Confirm the manifest and local icons load and the browser offers installation
   where supported. Open Home, Whole and Settings.
B. Create a structural whole with no quantity; add nested structural parts.
C. Create a measured whole with a custom unit; add amount and percentage parts.
   Also add a measured child inside the structural tree.
D. Reload. Confirm both wholes, their values/units, active path, language and theme
   persist. Check undo/redo before reloading; history is intentionally transient.
E. Enable the browser's offline mode without enabling service-worker bypass.
F. Reload normally at `/`, `/#home`, `/#resource` and `/#settings`. Confirm the
   actual app opens and has working controls, not a browser offline/error page.
G. Offline, add/edit/delete structural and measured parts, navigate ancestors and
   siblings, use undo/redo, and switch whole/theme/language. Verify measured limits
   and same-unit allocation still apply. Export a backup and import a local JSON
   file. Exercise v1/v2/v3 imports using existing fixtures/backups.
H. Reload again while offline; also close/reopen the installed app if available.
I. Confirm all saved local data and preferences remain. In two open tabs, verify a
   saved edit updates the other tab through the existing storage-event behavior.
   Check that Cache Storage contains only the shell and allowlisted assets, with
   no backup names, imported JSON or external URLs.
J. Restore internet.
K. Return to the visible app. Confirm editing, navigation and persistence continue
   normally without duplicate wholes or changes to the storage format.
L. Serve/deploy a second build **on the same origin**, with a harmless UI text
   change. Return to a tab or click Application → Service Workers → Update.
   Verify the new worker waits and the update notice appears, while the old tabs
   remain usable. Close every Hundred tab and installed window, then reopen.
   Confirm the new build is active, old Hundred shell caches are removed and all
   local trees/preferences remain. Go offline and reload the new build too.
   Repeat with a failed asset fetch during update: the previous offline app must
   continue working and the incomplete update must not activate.

Automated coverage: `node tests/core.mjs` runs all existing product scenarios plus
`tests/pwa.mjs` lifecycle/request-policy/offline-response/manifest-icon checks in a
mock worker environment. Browser installation, storage eviction and lifecycle UI
need the manual steps above; the mock tests do not replace browser QA.

With the production server running on port 3100, `node tests/pwa.mjs --production`
also verifies the served worker's MIME/no-store headers, generated shell, manifest
link and successful delivery of every asset in the real build's precache list.
