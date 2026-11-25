# Hundred screenshots

The four screenshots below have been captured from the app. They use the included [demo backup](hundred-demo-data.json), with English example names and Ukrainian interface text.

| File | What it demonstrates |
| --- | --- |
| [home-saved-wholes.png](home-saved-wholes.png) | Home with Company, Monthly Budget, and Week. |
| [structural-whole.png](structural-whole.png) | Marketing opened within Company, with structural Parts and level navigation. |
| [measured-whole.png](measured-whole.png) | Monthly Budget, its treemap and Parts, 80% allocated, and 10,000 UAH available. |
| [mobile-whole.png](mobile-whole.png) | The Week Whole, proportional Parts, and remaining hours on a narrow screen. |

For future updates, capture the **actual current app** in a separate browser profile or private window. Do not use personal saved Wholes in repository images.

## Load the demo

1. Start the app with `npm run dev` and open `http://localhost:3000` in a **new, isolated browser profile or private window**. Keep that window open until all captures are finished. Avoid an existing personal browser session or installed app.
2. In **Settings → Language**, choose **English**. Select a consistent theme for the captures.
3. On first launch, Home contains the starter Wholes **Моє життя** and **Місячний бюджет**. In this isolated profile, delete each using **⋯ → Delete whole** and confirm, leaving Home empty. Do not clear site data: that would create the starters again on the next launch.
4. Choose **I have a backup** on the empty Home, or open **Settings → Backups → Import file**. Select `docs/screenshots/hundred-demo-data.json`, verify the preview lists **Company**, **Monthly Budget**, and **Week**, then select **Add wholes**. Return to **Home**.

Import **adds copies**; it does not replace existing Wholes. Importing twice creates duplicates, and the 20-Whole limit still applies. The v3 backup contains root navigation paths, but the app intentionally generates new IDs and resets imported paths to each root. Open a Whole from its Home card after import; there are no fixed deep links to individual Wholes. The example's structural `weight` values are internal v3 fields, not quantities or percentages displayed to users.

## Future capture guidelines

Use a desktop viewport around **1440 × 900** and a mobile viewport around **390 × 844**. Adjust or scroll as needed to keep the relevant content readable. For mobile, resize the same isolated browser window or use device emulation in that profile; a different browser or origin will not share its local data.

Week is an optional second measured example: 168 h total, with 40 h Work, 56 h Sleep, 14 h Study and 21 h Family, leaving 37 h available. Use the same UI language and theme across desktop captures, and avoid browser chrome, personal information, open dialogs, or debug overlays.

## Remove the demo

When finished, close **all** private windows for that browser to discard their session data, or delete the three demo Wholes individually using each Whole's **⋯ → Delete whole** menu in the isolated profile. Keep unrelated browser data intact. In a non-private test profile, those three Wholes remain until deleted; do not clear site data in a personal profile. The JSON file can be removed from the repository when it is no longer needed.

When replacing an image, keep the README links and descriptive alt text current. Prefer compressed PNG or WebP at a readable size.
