# iLab redesign — design contract

Version 2, 2026-10-20 (dark technical direction, per client reference). Applies to every mockup in this folder. Build only from these tokens; anything not listed here is not part of the system.

## 1. Thesis

iLab's craft is precision repair. The site reads like the bench: a near-black ground, white type set tight and heavy, hairline rules that frame every section, and a mono "technical label" layer carrying the facts (coordinates, section numbers, status, counts). Brand cyan is the signal colour: the primary button, stars, open status, rulers, and the thin scan line that reveals the hero, images and price rows and wipes between pages.

Three adjectives: precise, honest, technical.
Memorable elements: the scan line, the rails (section counter and scroll ruler), the numbered branch headers.

Off-limits: cyan glows, blurs or gradients on surfaces; rounded card grids; glass; pulsing dots; marquees; emoji; icon-per-bullet; invented numbers, names or coordinates; decorative text that is not a fact.

## 2. Colour

Dark page. Drawers, footer and form panels sit one step lighter (`--counter`). Cyan is used for action and state only, never as a surface or a glow.

```css
:root {
  --paper: #070A0D;  --paper-2: #0C1115;  --paper-3: #131A20;   /* page, surfaces, hover */
  --ink: #F2F5F7;    --ink-2: #AEB8C0;    --ink-3: #6E7A84;     /* text tiers */
  --hairline: #1C242B;                                          /* every border, 1px */
  --counter: #0C1115; --counter-2: #141C23; --counter-hair: #243039; /* drawers, footer, form panel */
  --signal: #47C6E2; --signal-2: #6FD6EC; --on-signal: #061016; /* cyan: primary button, stars, status, rulers, scan line */
  --error: #FF6B62;
}
```

Rules: no gradients or glows on surfaces, no shadows (the drawer scrim is the only translucent layer); cyan fills only the primary button and the 6px status square.

### Light theme (shop)

The shop runs the same components on `html[data-theme="light"]` (`assets/css/theme-light.css`): paper `#F4F6F8`, surfaces `#FFFFFF`, ink `#101418`, hairline `#D3DAE0`; drawers, footer and form panels stay dark (`--counter`), and cyan text on light paper uses `--signal-text #0E7F97`. The header toggle reads "on" inside the shop and links back to the repair service; "off" on the repair site and links to the shop. Shop-specific components (product grid and card, finder tiles, chips, gallery, cart lines, checkout summary) are in `assets/css/shop.css` and follow the same rules: hairline grids instead of cards with shadows, square corners, tech labels for SKU, counts and status, cyan only for the primary action and state.

## 3. Typography

Two families. **Geologica** (variable; Latin Extended + Cyrillic) for everything readable, sharp for display and soft for text. **IBM Plex Mono** (Latin Extended + Cyrillic) only for the `.tech` label role: eyebrows, breadcrumbs, coordinates, section numbers, status, table heads, dates on reviews.

```html
<link href="https://fonts.googleapis.com/css2?family=Geologica:CRSV,SHRP,slnt,wght@0..1,0..100,-12..0,100..900&display=swap" rel="stylesheet">
```

```css
--font: "Geologica", system-ui, sans-serif;
/* display: weight 500, sharp */
--display: 500 1 var(--font); font-variation-settings: "SHRP" 100, "CRSV" 0;
/* text: weight 400, soft */
font-variation-settings: "SHRP" 0;
```

| Role | Size | Line | Tracking | Weight | SHRP |
|---|---|---|---|---|---|
| display-1 (home H1) | clamp(48px, 6.4vw, 108px) | 0.95 | -0.045em | 600 | 100 |
| display-2 (inner H1, drawer titles) | clamp(38px, 4.8vw, 72px) | 0.98 | -0.04em | 600 | 100 |
| tech (mono label) | 11px | 1.5 | 0.14em, uppercase | 400 | – |
| h2 | clamp(30px, 3vw, 44px) | 1.04 | -0.03em | 600 | 100 |
| h3 | 22px | 1.2 | -0.01em | 500 | 60 |
| lead | 20px | 1.45 | 0 | 400 | 0 |
| body | 17px | 1.55 | 0 | 400 | 0 |
| small | 15px | 1.5 | 0 | 400 | 0 |
| micro (captions, labels) | 13px | 1.4 | 0.01em | 400 | 0 |
| price | 17px | 1 | 0 | 500 | 100, `font-variant-numeric: tabular-nums` |

Rules: sentence case for everything except the `.tech` role, which is uppercase mono; display weight 600, text 400; emphasis by size, not bold; no italic accent words; headings `text-wrap: balance`, body `text-wrap: pretty`; measure 60 to 72 characters; Latvian and Russian share every role, with one exception: Cyrillic display-1 is set 10% smaller (`:lang(ru)`) so headlines keep the same line count.

## 4. Layout

- Grid: 12 columns, gutter 24px, container max 1360px, page margin 20px (mobile), 40px (≥768), 64px (≥1280).
- Spacing scale (px): 4 8 12 16 24 32 48 64 96 128 192. Section padding 96 to 128 desktop, 64 mobile. Sections are separated by a 1px hairline or by a dark counter surface, never by cards or background bands.
- Radius: 0 everywhere. Hairline 1px `--hairline`.
- Asymmetry is the default: headline on columns 1 to 7, supporting column on 9 to 12. Full-bleed image rows between narrow text blocks. Do not centre anything except the cookie banner buttons.
- Nesting: at most two levels of container.
- Breakpoints: 480, 768, 1024, 1280. Touch targets ≥ 48px. Mobile is a different layout, not a squeezed desktop: tables become rows, the branch board stacks, the drawer is full-screen.

## 5. Components

Buttons (height 52px, padding 0 24px, radius 0, font 17/500 SHRP 60):
- `btn-primary`: cyan fill, `--on-signal` text; hover brightens to `--signal-2` and a 2px ink line sweeps along the bottom edge (320ms expo.out).
- `btn-secondary`: 1px `--ink-2` border, transparent, ink text; hover: border `--ink`.
- `btn-text`: ink text, 1px underline, offset 4px; hover: underline becomes `--signal`.
- Never "Get started / Learn more" pairs. Labels say what happens: "Pieteikt remontu", "Zvanīt", "Skatīt cenas".

Links: ink, underline 1px, offset 4px, hover underline `--signal`. External links show no icon.

Focus: 2px `--signal` outline with 2px offset on every interactive element.

Header: 72px, hairline bottom. Logo, a hairline divider, then nav: iPhone remonts · Telefonu remonts · Planšetdatoru remonts · Datoru remonts · Dyson remonts · Vairāk (14px; brand dropdowns on the three device hubs, Vairāk holds Fotoaparāti, Cenas, BUJ, Par mums, Kontakti). Right: search icon (opens the model finder), language switch, outlined "Servisa centri" with pin icon (locator drawer), cyan "Sazināties" (contact drawer). Sticky, always visible. Mobile: logo, map-pin, "Cenas", hamburger. Desktop also has a fixed bottom-right pair: cyan "Pieteikt remontu" (booking drawer) and outlined "Cenas".

Mobile bottom bar (<1024): counter surface, three equal cells: Sazināties · Pieteikt remontu · Cenas.

Branch board (the hero's supporting column; dark counter surface): for each branch a row: name, status "Atvērts līdz 21:00" with a 6px static `--signal` square, address, phone; links Zvanīt · WhatsApp · Waze · Google Maps as btn-text in counter-ink. Status computed from the real weekly hours.

Spec table (prices): hairline rows 56px; columns Pakalpojums | Laiks | Cena (tabular, right) | Pieraksties (btn-text). Hover row: `--paper-3`. Price "no 110 €" or "pēc pieprasījuma". Mobile: each row becomes a two-line block, price right.

Series accordion: hairline rows, title left, count right, a 1px plus that rotates 45° to a cross (200ms). Opens to a model list in up to 4 columns of btn-text links. Every model is listed (fixes the live site's 4-per-series limit).

Model finder: an underline-only search input (no box) with clear button; filters the series lists live; empty state text "Nav atrasts neviens modelis".

Drawers (booking, contact, locator): slide from right, 560px desktop, full-screen mobile, counter surface, 400ms expo.out, scrim behind, Escape closes, focus trapped, title display-2. The scan line sweeps across the drawer once as it opens.

Booking form: fields exactly as the live site (name, phone, device, date min tomorrow, fault ≤600 chars, branch radio, time radio, honeypot). Inputs on counter: transparent, 1px bottom hairline `--counter-hair`, focus bottom line `--signal`. Radios drawn as 16px squares. States: default, focus, error (message under field in `--error` tint `#F2B8B5` on counter), submitting "Sūtām…", success panel "Paldies, pieraksts saņemts!" Pre-fill `device` from the model page and `fault` from the service row that opened it.

Reviews: per branch a numbered header row (01 / name / "iLab servisa centrs" / coordinates in `.tech`), a rating head (display number with "/ 5", five cyan SVG stars, count, "Google atsauksmes"), review rows (quote left; author, stars, date right), and a "Skatīt visas N atsauksmes" arrow link in `.tech`. Counters count up once on scroll. Real reviews only; emoji stripped.

FAQ: `details`/`summary` with hairlines; the plus rotates; first item open.

Cookie banner: bottom-left, paper, 1px ink border, 360px, two buttons Noraidīt · Pieņemt. Gates GTM/GA4 and the OpenAI pixel.

Breadcrumb: `.tech` mono uppercase with "/" separators, like the hero eyebrow ("iLab / Precīzs remonts / Rīga").

Rails (≥1280): a fixed 96px rail on each side with hairline edges; left shows the current section number over the total with a tick ruler, right shows a scroll-progress ruler (100 / 50 / 0) with a cyan 48px marker. Sections carry a mono "+" mark at each top corner.

Footer: counter surface; company + reg. no.; both branches; Pakalpojumi (6 incl. Fotoaparāti); Noderīgas saites; social as text links; copyright.

Images: real photos from the live site; art-direct with hard crops and a slight desaturation (`filter: saturate(.85)`); never scale on hover. Placeholders are labelled "Foto: …" blocks in `--paper-3`, never drawn illustrations.

## 6. Motion (GSAP 3.13+ via CDN, ScrollTrigger)

Mode: precise. Easings `expo.out` for reveals, `power2.inOut` for the line's travel, `power1.out` 150 to 250ms for state changes. Nothing bounces, nothing floats, nothing loops.

1. **Entrance (once per load, ≤1.2s total).** A fixed 1px `--signal` line with a 24px fading trail travels top to bottom in 900ms. Elements marked `data-scan` unmask (`clip-path: inset(0 0 100% 0)` → `inset(0)`) as the line passes their top; hero headline lines rise from `yPercent: 100` inside `overflow: hidden`, stagger 0.08s. Header fades in last.
2. **Scroll reveal.** `data-scan="x"` images and panels wipe `clip-path: inset(0 100% 0 0)` → `inset(0)` over 0.9s with a vertical 1px signal line riding the edge, once, triggered at 80% viewport. Spec-table rows and model lists stagger 0.04s under a horizontal pass. Never fade-and-slide-up.
3. **Process track ("Kā notiek remonts").** Desktop ≥1024: section pinned for 5 steps; a vertical hairline on the left carries a 48px signal segment that moves step to step with scroll (scrub 0.6); the active step's title goes ink, others ink-3. Mobile: not pinned, the segment still follows scroll.
4. **Page transition.** On click of an internal link to another mockup page: the line sweeps down 450ms while a paper shutter follows it (`clip-path` from top); then navigate. The next page plays its entrance.
5. **Drawer open.** Slide + scrim 400ms, line sweeps once across the drawer 600ms.
6. **Hover.** Button bottom line sweep 320ms; underline colour change; model link text shifts 4px right 200ms; spec row background 150ms.
7. **Counters.** Review totals count up over 1.2s, tabular-nums, real values only.

`prefers-reduced-motion: reduce`: no line, no pins, no shutters; everything visible immediately; drawers fade 150ms. Use `gsap.matchMedia()`. Elements animated by GSAP carry no CSS `transition`.

## 7. Copy rules

Latvian verbatim from the live site unless fixing an inconsistency listed in `.agents/product-marketing.md`. Use warranty "līdz 1 gadam", founded 2013, branch "Spice Life". Real numbers only: 826, 373, 1199, 4.9, 5.0, 2013, 10:00–21:00. No invented reviews, staff, or certificates. Where a photo is missing, a labelled placeholder.

## 8. Finish gate (per page)

- Purpose obvious in 5 seconds; one primary action leads.
- Every control has a real outcome (anchor, page, drawer, tel, wa.me, Waze, Maps).
- States present and reachable: loading (prices "Ielādē cenas…"), empty (finder), error (prices, form), success (form), open/closed (branches), consent.
- Works at 375, 768, 1280, 1600. No horizontal scroll.
- Keyboard: tab order, focus visible, Escape closes drawers, skip link.
- Reduced motion verified.
- Would pass as a different product? Then it fails.
