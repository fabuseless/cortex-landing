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

Reference implementation: `index.html` and `assets/intro.js` in this folder (commit `3165066`).

### 1. `scanPage` CSS and markup (`server.mjs`)
- `.intro`: replace `position:relative;flex:1 1 auto;min-height:36vh` with `position:fixed;inset:0;z-index:0;pointer-events:none`. Keep `.intro canvas{position:absolute;inset:0;width:100%;height:100%}`.
- `main`: add `position:relative;z-index:1` and `margin:auto auto 0` (instead of `margin:0 auto`), so it sits at the bottom of the screen above the canvas. No background on `main`: that would bring the band back.
- `<div class="intro" id="intro" data-hold ...>`: add `data-shift="0.16"` (the fraction of the screen height the brain is raised by). The holding page has more text than the landing page (heading, optional note, body, scan button, status), so it may need more: tune by eye at phone size (390×844), probably 0.18–0.22.
- The landing page also fades and raises the text in (`main>*{animation:rise 1.4s .9s both ...}` with `main{overflow:hidden}`, and none under `prefers-reduced-motion`). Optional here; if added, animate `main>*`, not `main`, or the page briefly grows taller than the screen and a scrollbar flashes.

### 2. `intro.js` hold mode
In `resize()`, after `camera.aspect = w / h;` and before `camera.updateProjectionMatrix();`:

```js
// Holding page: the canvas fills the screen behind the text, so raise the
// brain by data-shift (a fraction of the height) and fit it to narrow screens.
if (hold) {
  camera.setViewOffset(w, h, 0, h * (Number(intro.dataset.shift) || 0), w, h);
  camera.zoom = Math.min(1, camera.aspect / 0.8);
}
```

Non-hold (the home page launch animation) is untouched. Update the header comment ("it only assembles and stays, filling its box above the page's text") to say it now fills the screen behind the text.

### 3. Things to check
- The live camera: when "Scan pairing code" opens it, the script sets `#intro` hidden and the `<video>` appears inside `main`. With `main` at the bottom of the screen, check that the video and status line still fit at phone size, and that the page scrolls if they don't (the canvas is fixed, so scrolling is fine).
- `prefers-reduced-motion`: intro.js doesn't start in hold mode, so the screen is plain; check that still looks right with `main` at the bottom.
- Both pages share the template, so check both: `unpairedPage` (open Cortex from another LAN device that isn't paired) and `relinkPage` (e.g. `/hold/` assets on the capture port).

## Verify
Screenshot each page at 1280×800 and 390×844, in light and dark, settled (≈5 s) and mid-assembly (≈1 s). Headless Chromium's `--screenshot` doesn't run the animation; drive it over the DevTools protocol in real time instead, as `shot.mjs` did for the landing page. Expected: points pass behind the text with no visible edge or band, the settled brain sits above the text and isn't cropped at the sides on a phone, and no scrollbar appears.
