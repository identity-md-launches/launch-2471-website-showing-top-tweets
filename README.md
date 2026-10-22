# Swamp Signal

A dark green reading room for **IdentityMD community tweets**, with an AI-equipped Pepe squad, source-linked excerpts, search, topic filters, sorting and browser-local bookmarks.

The finished static website is in **`dist/`**, alongside the React/TypeScript source and `package-lock.json`. All runtime assets are local. Vite uses `base: './'`; navigation uses hashes, so a static host needs no route rewrites.

## Install, build and preview

Use Node.js **22.12 or newer** (validated with Node 24.22).

```sh
npm ci
npm run typecheck
npm run build
npm run preview
```

Open the local URL printed by Vite. `npm run dev` starts the development server. `npm run build` replaces `dist/` with the complete production export, including the illustration, font, font license, favicon and share image. No API key, wallet, backend or image generation service is needed to build or use it.

## What the feed contains

“Top picks” is an **editorial collection of six historical posts**, not a live feed or engagement leaderboard. Posts date from May to August 2026; indexed source material was checked on 22 October 2026. Each card identifies its author, excerpt and date, opens the original on X, and provides context and a third-party source preview. X may require sign-in and preview services may be unavailable. See [source provenance](artifacts/SOURCES.md).

Search covers the full collection, including posts below “Show more.” Filters and search combine. “Newest first” sorts by original UTC date. Saved posts stay in this browser’s local storage and synchronize between tabs. If storage is unavailable, saving still works for the visit. If clipboard access fails, the site offers a focused, selectable link field.

To update the collection, edit `src/posts.ts`, preserve accurate attribution, then rebuild. Counts derive from the dataset; no engagement numbers are invented.

## Validation

```sh
npx playwright install chromium webkit
npm run validate -- --webkit
npm run measure-contrast
```

Playwright needs the native libraries for the selected browsers. Validation owns its local `/preview/` server and closes it when finished. Temporary results go under `test/scratch/`; retained results are under `artifacts/`.

Actual final worker results:

| Check | Result |
| --- | --- |
| Clean dependency install, production build and TypeScript check | Passed; the isolated clean rebuild produced a byte-identical `dist/` |
| Browser interaction validation | **45/45 passed**: 23 Chromium, 22 WebKit |
| Pinned taste@1 design probe | **16/16 passed** |
| axe WCAG A/AA checks, feed and About dialog | No detected violations in either engine |
| Rendered hero contrast | All six measured text treatments passed at 390 and 1440px |
| Responsive reflow | Passed at 320, 390, 560, 760, 900, 1100 and 1440px |
| First screen at 390 × 844 | First post and its 44px “Read on X” action are visible |

The [validation record](artifacts/validation.md) documents findings, fixes, commands, all six Better Interface domains and limitations. Automated scans are not a screen-reader session or a claim of full accessibility compliance. Physical devices, native browser zoom and public social unfurling were not tested. The supplied browser tool could not start, so rendered validation used independently installed Playwright Chromium and WebKit.

## Design and assets

- [DESIGN.md](DESIGN.md): implemented tokens, typography, components and responsive behavior.
- [Screenshots](artifacts/screenshots/): final mobile, desktop, WebKit and keyboard-focus evidence.
- [Artwork and attribution](artifacts/ARTWORK.md): generated illustration prompt and asset paths, font and design-guidance credits.

The share image is already delivered. To regenerate its HTML/CSS composition with the local artwork and font, run `npm run build`, `npm run social-card`, then `npm run build` again. The illustration itself does not need regeneration.

Dependencies and browser binaries are development tools, not runtime assets. No dependency directories, caches, package archives, submodules or vendored registry are included in the delivery. No ignore file was created or modified.
