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
- The brain is `assets/intro.js`: `cortex/app/public/intro.js` run in hold mode (`data-hold`), as on Cortex's "not paired" page, plus a few lines in `resize()` for this page. Its canvas fills the screen behind the text (one surface, so the points gather behind the copy); `data-shift` raises the brain above the text and narrow screens zoom out to fit; it also sets `--brain-bottom` (where the brainstem ends) so the text sits in the gap below, slightly above its middle (4:5 spacers). Keep those lines when copying the file again.
- Look is Cortex's default **Blueprint** style: `assets/themes.css` is its rules cut from Cortex's compiled `/static/themes.css` (font paths pointed at `assets/fonts/`). Follows the visitor's light/dark setting.
- three.js 0.186.1 and the fonts (Geist, Geist Mono, Instrument Serif; OFL, licences in `assets/fonts/licenses/`) are vendored, so the page needs no CDN.
- Copy must not name Claude (other models may come later). Headline: "Thinking, connected." (chosen 2026-10-26). "Coming soon" is still a placeholder.

## Status

- Current focus: Stages 1 and 2 done: live at https://cortex.fabuseless.dev/ (HTTPS enforced; the github.io address redirects there) (repo https://github.com/fabuseless/cortex-landing, Pages from `main`, root).
- Stage 2: `CNAME` file added; public DNS already resolves `cortex.fabuseless.dev` → `pulse.fabuseless.dev` → `fabuseless.github.io` (Cloudflare). On the tailnet the same name resolves to Cortex itself (`lan_names`), so from home you see Cortex, elsewhere this page.
- Next: replace "Coming soon" when there's something to link to.
- Blocked on:

## Log

Newest first. Claude adds entries here with the `cortex` skill ("log progress").

### 2026-10-26

- Text block now centred (optically, a little high) in the gap between the brain and the bottom of the screen.
- Wrote [[handover-holding-pages]]: the same full-screen canvas for Cortex's holding pages (not paired, Spark not connected), to be done outside Cortex.
- Headline now "Thinking, connected.", copy no longer names Claude. Brain canvas made full-screen behind the text, so the points gather behind the copy instead of in a separate band.
- HTTPS certificate live for cortex.fabuseless.dev; turned on Enforce HTTPS. Checked the page over HTTPS with the internal DNS redirect off.
- Added `CNAME` for cortex.fabuseless.dev; Pages serves it over HTTP, certificate approved but not yet deployed.
- Published: repo `fabuseless/cortex-landing` (public), branch renamed to `main`, GitHub Pages on; checked the live page loads and renders.
- Built the landing page: Cortex's brain point cloud over a short pitch, in the Blueprint style; checked in light/dark at desktop and phone sizes (headless Chromium).
- Created hub note.
