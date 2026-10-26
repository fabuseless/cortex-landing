---
type: project
repo: /mnt/data/Developer/cortex/projects/cortex landing page
status: active
created: 2026-10-26
tags: [project]
---

# cortex landing page

create a cortex landing page on github pages

## Goal

### Stage 1
a working github pages site with the cortex point cloud holding page. 

### Stage 2
have it accessible from https://cortex.fabuseless.dev/

## Design

- Plain static site, no build step: `index.html` + `assets/`, served from the repo root (`.nojekyll` so GitHub Pages serves it as is).
- The brain is `assets/intro.js`, an unchanged copy of `cortex/app/public/intro.js` run in hold mode (`data-hold`), as on Cortex's "not paired" page. To update it, copy the file again.
- Look is Cortex's default **Blueprint** style: `assets/themes.css` is its rules cut from Cortex's compiled `/static/themes.css` (font paths pointed at `assets/fonts/`). Follows the visitor's light/dark setting.
- three.js 0.186.1 and the fonts (Geist, Geist Mono, Instrument Serif; OFL, licences in `assets/fonts/licenses/`) are vendored, so the page needs no CDN.
- Copy ("A second brain for you and Claude", "Coming soon") is a placeholder for the advertising wording.

## Status

- Current focus: Stage 1, page built and checked locally.
- Next: create the GitHub repo, push, turn on Pages; then Stage 2 (custom domain).
- Blocked on:

## Log

Newest first. Claude adds entries here with the `cortex` skill ("log progress").

### 2026-10-26

- Built the landing page: Cortex's brain point cloud over a short pitch, in the Blueprint style; checked in light/dark at desktop and phone sizes (headless Chromium).
- Created hub note.
