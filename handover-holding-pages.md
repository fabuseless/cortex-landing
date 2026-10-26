---
type: handover
project: "[[cortex landing page]]"
target: cortex/app
created: 2026-10-26
status: open
tags: [handover]
---

# Handover: point cloud behind the text on the holding pages

For an agent working on Cortex itself (`/mnt/data/Developer/cortex/app`), not from inside this project.

## Why

The landing page (https://cortex.fabuseless.dev/, this folder) started from Cortex's holding page. There, the brain's canvas only fills the box above the text (`.intro`, `flex:1 1 auto; min-height:36vh`). While the brain assembles, its points fly in from far outside and get clipped at that box's bottom edge, so the text looks like it sits on a separate grey band in front of or below the cloud. On the landing page the canvas now fills the whole screen behind the text: the points gather behind the copy and the brain settles above it. The user wants the same on Cortex's holding pages.

## Where

One template covers both pages: `scanPage` in `app/server.mjs` (around line 1575), used by
- `unpairedPage`: "Cortex: not paired", for LAN devices that aren't paired.
- `relinkPage`: "Spark · not connected", for phones whose Spark link no longer works.

Plus the brain script, `app/public/intro.js`, in hold mode (`data-hold`, only set by `scanPage`).

## Changes

Revised 2026-10-26: the user preferred the home page's launch-screen layout (brain centred and full size, text overlaid bottom-left), so the holding pages should match that, as the landing page now does. Reference implementation: `index.html` and `assets/intro.js` in this folder (the commit after `f193538`).

### 1. `scanPage` CSS and markup (`server.mjs`)
- `.intro`: replace `position:relative;flex:1 1 auto;min-height:36vh` with `position:fixed;inset:0;pointer-events:none`; keep the canvas rule.
- `main`: lay it out like `.intro-copy` in `app/public/app.css`: `position:absolute;left:clamp(16px,6vw,96px);right:16px;bottom:clamp(32px,9vh,96px);max-width:34rem`, on a `body` with `position:relative;min-height:100dvh` (drop the flex column). No background on `main`.
- `.mark` and `.logo`: use `.intro-mark` / `.intro-mark .logo` sizes (`clamp(44px,7vw,88px)`, gap 18px, logo 2.2em with .3em type and a 2px border); body text in `var(--font-ui)` 15px/1.5 as `.intro-copy p`.
- Optionally fade the text in with `intro-in 1.4s .9s both`, none under `prefers-reduced-motion`.
- The holding page has more in `main` than the home page (heading, optional note, body, scan button, status, and the camera `<video>` when open). Check it still fits under the brain at phone size; if it doesn't, let `main` flow at the bottom of the page instead of being absolutely placed, so the page scrolls.

### 2. `intro.js` hold mode
In `resize()`, after `camera.aspect = w / h;` and before `camera.updateProjectionMatrix();`. Desktop framing is the home page's own; only narrow screens change:

```js
// Holding page: framed like the launch screen; on narrow screens the brain
// is fitted to the width and raised clear of the text.
if (hold && camera.aspect < 0.8) {
  camera.setViewOffset(w, h, 0, h * 0.14, w, h);
  camera.zoom = camera.aspect / 0.8;
} else if (hold) {
  camera.clearViewOffset();
  camera.zoom = 1;
}
```

Non-hold (the home page launch animation) is untouched. Update the header comment ("it only assembles and stays, filling its box above the page's text") to say it now fills the screen behind the text.

### 3. Things to check
- The live camera: "Scan pairing code" hides `#intro` and shows the `<video>` inside `main`. Check the video and status still fit at phone size and the page scrolls if not.
- `prefers-reduced-motion`: intro.js doesn't start in hold mode, so the screen is plain; check the text still looks placed, not stranded.
- Both pages share the template, so check both: `unpairedPage` (open Cortex from a LAN device that isn't paired) and `relinkPage` (the capture port's `/hold/` page).

## Verify
Screenshot each page at 1280×800 and 390×844, in light and dark, settled (≈5 s) and mid-assembly (≈1 s). Headless Chromium's `--screenshot` doesn't run the animation; drive it over the DevTools protocol in real time instead, as `shot.mjs` did for the landing page. Expected: matches the home page's launch screen on desktop (compare side by side); points pass behind the text with no band; on a phone the brain sits above the text and isn't cropped at the sides.
