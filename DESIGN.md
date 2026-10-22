# Swamp Signal design system

## Overview

Swamp Signal is an independent reading room for people exploring IdentityMD through its community’s posts on X. The requested dark green palette and Pepes armed with AI are carried by one squad illustration, forest surfaces and lime interaction accents. The feed leads; project context lives alongside it on wide screens and follows it on small screens.

This is a compact editorial tool, not an engagement dashboard. Real author attribution, original dates, clear excerpt labeling and original-post links carry the information hierarchy. There are no fabricated engagement statistics or live indicators. The single page uses `#feed` and `#saved` navigation.

Canonical implementation: `src/styles.css` for tokens and layout, `src/main.tsx` for components and behavior, `src/posts.ts` for content, and `src/Icons.tsx` for icons. The final rendered evidence and coverage limits are in `artifacts/validation.md`.

## Colors

The source uses a consistent hex palette. Primitive `--forest-*` and `--lime-*` values map to semantic `--color-*` roles in `src/styles.css:9`.

| Semantic token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#0b1711` | Page, native select and manual-copy field backgrounds |
| `--color-surface` | `#102219` | Tweet cards, search and dialog |
| `--color-control` | `#1c3225` | Active navigation, hover treatments and field guide |
| `--color-border` | `#2b4031` | Structure, card edges and dividers |
| `--color-control-border` | `#52674f` | Search, secondary controls and empty-state boundary |
| `--color-text` | `#e8eedf` | Main copy and headings |
| `--color-muted` | `#a7b6a4` | Metadata, secondary copy and utility icons |
| `--color-accent` | `#c1ed72` | Primary action fill, selected filter state and saved icon |
| `--color-accent-hover` | `#d0f494` | Primary action hover |
| `--color-on-accent` | `#18250f` | Text on lime fills |
| `--color-focus` | `#d0f494` | Two-pixel keyboard focus outline, four-pixel offset |

The hero uses a `#102017` backdrop and directional green scrim over the local illustration. The first editorial card has `#14271c` fill and `#526644` structural border. Avatar monograms use three fixed decorative pairs: olive `#c9d58d` / `#23351b`, sage `#8ca98b` / `#152b1c`, and sand `#d0c49d` / `#322f1d`; these do not encode status.

The design probe measured a minimum **5.86:1** among its solid-background text pairs; the sage monogram is that minimum. Muted field-guide prose measured **6.44:1** on its actual background. Separate pixel sampling of the composited hero measured at least **10.04:1** at 390px and **11.92:1** across the measured desktop treatments. See `artifacts/hero-contrast.json` for individual selectors, colors, sample counts and thresholds. These measurements apply to the checked final artwork and viewports.

Selected filters use `aria-pressed`; saved posts change both icon fill and visible label. Meaning never depends on green alone. The site deliberately supplies one dark appearance. There is no theme switch or unused status system to reproduce on another page.

## Typography

Use **Manrope, Arial, sans-serif**, as declared in `src/styles.css`. The local `public/assets/manrope-latin.woff2` variable file supplies weights 200–800; the interface uses only **400, 600 and 700**. It loads with `font-display: swap`. The font license ships in the export.

| Token | Default size | Implemented roles |
| --- | --- | --- |
| `--text-xs` | 12px / 0.75rem | Metadata, source disclosures, counts and compact mobile filters |
| `--text-sm` | 14px / 0.875rem | Author names, buttons, navigation and secondary prose |
| `--text-base` | 16px / 1rem | Tweet text, inputs, sidebar and dialog subheadings |
| `--text-lg` | 20px / 1.25rem | Wordmark, feed headings, Saved title and dialog title |
| `--text-title` | 32px / 2rem | Mobile hero heading |
| `--text-display` | 56px / 3.5rem | Desktop hero heading |

Root line height is 1.5. Tweet excerpts use 1.7 on desktop and 1.65 on mobile; context and secondary explanatory copy use 1.7–1.8. The display heading uses 1.04 desktop and 1.12 mobile. Its tracking is −0.055em desktop and −0.045em mobile. Compact headings and the brand use −0.02 to −0.025em; prose and controls use normal tracking. Use tabular numerals for changing bookmark and topic counts. The wordmark has a deliberate break opportunity between “swamp” and “signal” when text grows; the mobile snapshot label uses a relative 35% maximum instead of a fixed pixel width.

Headings balance their lines; paragraphs and excerpts use `text-wrap: pretty`. Tweet measure is capped at 68ch and context at 65ch. Excerpts are deliberately short, marked as excerpts, and linked to the originals; there is no line clamp or hidden continuation of locally available critical text. Metadata wraps, and search and manual-copy inputs stay at 16px. The wordmark and snapshot label can wrap when text is enlarged.

## Layout

`.page-width` supplies a 1240px maximum content width and shared alignment edges. Desktop side margins begin at 40px. The content grid has a flexible feed, a 300px sidebar and a 40px gap. The hero belongs to this page’s introductory arrangement, not to every future view.

The spacing vocabulary in `:root` is 4, 8, 12, 16, 20, 24, 32, 40 and 48px. Component declarations use that cadence: 12px within identity rows, 16px between cards, 24px card padding and 32–40px between major groups. Thin dividers group card utilities and separate supporting sidebar sections without outlining every subsection.

| Breakpoint | Implemented behavior |
| --- | --- |
| Above 1100px | 1240px container maximum; 300px sidebar, 40px grid gap; full navigation and X utility link |
| At 1100px | 24px side margins; sidebar 260px, grid gap 28px; tighter hero and header padding |
| At 850px | One feed column; sidebar becomes two columns below it; header X link disappears |
| At 560px | 16px margins; 68px minimum header; saved/about utilities become icons; compact 168px minimum hero; hero jump action and editorial badge disappear; first editorial “Read on X” gains lime fill; sidebar stacks; redundant topic directory disappears |
| At 360px | Smaller brand, dates move to their own line, secondary snapshot/excerpt labels disappear; source context and actions remain reachable |

Topic buttons wrap instead of scrolling sideways. Containers have minimum rather than fixed text heights. The search input can shrink within its labeled row. At 390 × 844, the first post begins at 534.44px and its primary action ends at 840.39px in both tested engines. Reflow was checked from 320 through 1440px, plus 200% root text enlargement at 390px. Native browser zoom and physical-device behavior remain unverified.

## Elevation & Depth

The interface is flat: tonal surfaces and structural one-pixel borders, with no card shadows. Tweet cards are siblings, not cards nested inside another card. The hero clips decorative art to its outer shape. A transparent green scrim maintains readable hero text while retaining the AI squad.

The native About dialog is the only modal layer. Its backdrop uses `#030b07cc` and 4px blur. The dialog caps its height to `calc(100dvh - 48px)`, scrolls internally, contains overscroll and locks background body scrolling. Browser-native modal behavior makes the background inert. The skip link alone uses a fixed position and becomes visible on focus; ordinary navigation does not cover content.

## Shapes

`--radius-sm` is **6px** for controls and icon surfaces; `--radius-md` is **10px** for cards and the mobile hero; `--radius-lg` is **16px** for the desktop hero and dialog. Author monograms and the field-guide icon are circular. Tiny count marks use 4px corners. Avoid adding heavy shadows, extra pill badges or ornamental panels around these existing surfaces.

## Components

| Pattern / source | Reuse and behavior |
| --- | --- |
| `App`, `src/main.tsx:198` | Owns feed/Saved navigation, filters, sorting, pagination, bookmarks, announcements and About state. Uses native buttons and hash routes. |
| `PostCard`, `src/main.tsx:51` | Private component accepting `post`, `saved`, `featured`, `onSave` and `announce`. Renders author/date, excerpt, topics, original link, bookmark, copy action and expandable context. It is the reusable feed pattern, not a separately exported library. |
| `.primary-button`, `.secondary-button`, `.text-button`, `.icon-button` | Lime primary action; outlined secondary; compact text/icon utilities. Main actions and navigation have 44px minimum height. Mobile topic buttons are 36px and spaced; all measured controls meet the 24px baseline. |
| Search, `src/main.tsx:421` | A wrapping label with persistent visible “Search” text, decorative icon, named `type="search"` input and example placeholder. Search covers authors, handles, excerpts, context and topics, ignoring accents and combining words. |
| Topic group, `src/main.tsx:442` | Native pressed buttons in a named `role="group"`. Tab reaches each button; Enter/Space activate. These are filters, not ARIA tabs or radio inputs. |
| Sort and results | Native select with accessible “Sort posts” name. A polite result count reports filtering; “Clear filters” resets query and topic and returns focus to Search. “Show more” reveals the remaining real records. |
| `details.post-context`, `src/main.tsx:182` | Native expandable summary, context paragraph and source-preview link. Enter/Space operate the native disclosure. Every external link opens a new tab and identifies its destination. |
| Bookmark state | `aria-pressed`, filled icon and “Saved” label; IDs stored under `swamp-signal:saved:v1`. Invalid records are filtered out, and storage events synchronize tabs. A persistent inline message explains session-only saving if storage fails. |
| Copy state | Clipboard success changes the icon and announces success. Failure reveals a readonly URL input, focuses it and selects its contents for manual copying. There is no fake success state. |
| Empty state | Explains either an empty saved collection or the unmatched query/topic and offers one recovery action. No artificial loading state is needed for synchronous local data. |
| About dialog, `src/main.tsx:697` | Native modal, named heading, two buttons, Escape/backdrop dismissal, explicit Tab/Shift-Tab cycle and focus return to the opener. Its current focus cycle covers its two buttons; update the cycle if new interactive content is introduced. |
| `Icon` / `XMark`, `src/Icons.tsx` | One local SVG set, mostly 1.7px stroke and `currentColor`. Icons are decorative inside named controls. Saved bookmarks fill the same SVG. |

Hover styles are gated by `(hover: hover)`. Named color/background/border transitions last 150ms with `cubic-bezier(.2,0,0,1)`. Pressed primary/secondary actions use scale 0.96 only when reduced motion is not requested. There are no entrance animations, timers, autoplay or infinite motion. Forced-color styles preserve system borders and selected navigation, but that mode has not been rendered manually.

## Do’s and Don’ts

- Start another view with `.page-width`, the existing header and feed-sized hierarchy. Reuse source components before adding a new surface treatment.
- Use the semantic color roles; keep lime reserved for primary emphasis and selected/saved interaction state. Preserve visible focus and text labels.
- Keep the product and a useful action visible on the first mobile screen. Do not reintroduce a tall mobile hero or a duplicate mobile jump button.
- Add real post records with source links and original dates. Let counts derive from data; keep “Top picks” explicitly editorial.
- Use the existing six-size type scale, three weights and local font. Keep metadata readable and wrapping, rather than truncating authors or hiding controls.
- Preserve the local-asset and hash-navigation model. The site has nothing to sign, so it has no wallet infrastructure.

Design guidance and documentation attribution are retained in `artifacts/ARTWORK.md` and `artifacts/DESIGN-GUIDANCE-LICENSE.txt`.
