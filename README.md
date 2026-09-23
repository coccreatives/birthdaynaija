# BirthdayNaija TV — landing page

Custom-coded landing page for BirthdayNaija TV. Built by [Kliko Technology](mailto:contact@klikotechnology.com) from the approved Figma designs.

No framework, no build step. Open `index.html` and it runs.

## Important: open the right file

The page needs the `assets/` folder sitting next to `index.html`. If you open an `index.html` that has no `assets/` beside it, you get a bare page with no styling, no animation and nothing clickable. That is not a bug in the site, it is a missing folder.

The whole folder travels together. Do not move `index.html` on its own.

**Pushing to GitHub:** unzip this archive and commit its contents so that
`index.html`, `assets/` and `.nojekyll` sit directly at the repo root (or
directly inside the folder you point GitHub Pages at). A previous export of
this project went out inside a wrapper folder added by Google Drive's zip
(e.g. `assets-20230101T000000Z-1-001/assets/...`), which puts `assets/` one
level too deep. `index.html` then can't find `assets/css/styles.css` and co,
and the page comes up bare and non-interactive on GitHub Pages, exactly as
described above. If you ever re-export from Drive, always re-flatten before
pushing: `assets/` and `.nojekyll` must be immediate siblings of `index.html`.

## What is in here

```
index.html              the whole page
.nojekyll               tells GitHub Pages not to run Jekyll over this folder
assets/css/styles.css   design system and all section styles
assets/css/forms.css    the submission modal
assets/css/fonts.css    self-hosted Poppins, Inter, Roboto, Mansalva
assets/js/main.js       nav, carousels, reveals, wall, counters, config
assets/js/forms.js      the five submission flows
assets/img/             optimised .webp images + video poster frames
assets/icons/           SVGs exported from Figma
assets/fonts/           woff2 files
assets/video/           looping section videos (H.264 .mp4, faststart)
```

## Running it

Any static server works. Nothing to install.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly from the filesystem works too, as long as `assets/` is beside it.

## Configuration

Both config blocks sit at the top of their file, so prices and copy can change without touching the markup.

**`assets/js/main.js`** — `BN_CONFIG`

| Key | What it does |
|---|---|
| `currency` | Currency symbol used across the page |
| `pricing` | The three plan cards: name, amount, features, summary, CTA label |
| `wallVisible` | How many Birthday Wall entries show before the "See more" button appears. The button is not rendered at all when there are fewer cards than this. |
| `slides` | The three "Celebrate anyone" panel slides |

**`assets/js/forms.js`**

| Constant | What it does |
|---|---|
| `ENDPOINT` | Where submissions POST. Empty today, so submissions log to the console. Set this to the form service or admin API URL to go live. |
| `PAY` | `{ mode: 'demo' }` shows the confirmation screen. Set to `'link'` and give each `PACKAGES` entry a `link` to redirect to Paystack or Flutterwave. |
| `PACKAGES` | The seven purchasable items and their prices |
| `FLOWS` | The five form flows and their steps |

## The five forms

Every CTA opens a modal. No sign in, because there are no user accounts until there is a back end.

| Trigger | Flow | Ends with |
|---|---|---|
| Celebrate someone | `celebrate` | Price summary and payment |
| Join the Club | `club` | Price summary and payment |
| Get a group plan | `group` | Price summary and payment |
| Send a gift | `gift` | Price summary and payment |
| Partner with us | `business` | Request sent, no payment |

## Mobile menu

Tapping the hamburger (shown below 1200px) opens a full-height, full-screen
dark overlay built from the approved Figma hamburger menu design: the
BirthdayNaijatv logo and a close button up top, the nav links staggering in
underneath, and the "Celebrate someone" CTA plus social row pinned to the
bottom. It slides in from the right and fades, respects
`prefers-reduced-motion`, closes on Escape, backdrop tap, link tap or the
close button, and locks page scroll while open. Markup is in the `#mobile-menu`
block in `index.html`; styles are the `.mobile-menu*` rules in `styles.css`;
behaviour is the "Mobile menu" block in `main.js`.

## Section videos

"More ways to celebrate" and "Friday Live" each show a looping video inside
the phone frame instead of a static mockup (`assets/video/`). Both play
muted, autoplay, loop continuously and are cropped to a 32px corner radius
to match the phone frame. `poster` images (`assets/img/poster-*.jpg`) show
instantly while the video buffers. The source files are standard H.264
(yuv420p) MP4s with the `moov` atom moved to the front (`faststart`) so
playback can start before the whole file downloads — this is the same
format GitHub Pages serves fine over plain HTTP, no server config needed.

## Known limits

This is the front end only. There is no back end, so:

- Submissions go wherever `ENDPOINT` points. Someone reads them and replies by hand.
- The Birthday Wall is static markup. Entries are published manually.
- Prices change by editing the config above, not from an admin screen.
- Birthday Wall cards are display only, by client decision. They are not clickable.

## Assets

`assets/source/` is gitignored. It holds the full-size PNG originals exported from Figma; the site serves the `.webp` versions in `assets/img/`. Ask Kliko Technology if you need the originals.

## Browser support

Modern evergreen browsers. Respects `prefers-reduced-motion`.
