# iLab redesign — hero prototype

A standalone **Next.js 16** visual prototype for the iLab service homepage. This repository is independent from the existing production website.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The project is configured for static export (`npm run build` emits `out/`), suitable for Vercel.

## Art-direction decisions

- Preserve dark service identity; the separate iLab parts shop remains light.
- Full-width header: logo and main navigation on the left; language, `Servisa centri`, `Sazināties` on the right. No search.
- Full-bleed dark technical photography, with the hardware frame cropped inside the editorial grid.
- Thin, precise structural lines and a single measurement ruler at the far left.
- One consistent H1, with subtle *silver* typography. Keep semantic SEO text in HTML, not baked into imagery.
- `Pieteikt remontu` and `Cenas` sit left-aligned below the copy in the desktop hero (not repeated in the header).
- A compact bottom dock on mobile; the two-branch contact panel is accessible from the header/mobile navigation.
- Reviews and subsequent sections will be developed only after the hero is reviewed.

## Assets

- `public/images/hero-repair.webp` is the approved hero artwork (AI-assisted, visually approved reference asset).
- The logo currently references the official `https://ilab.lv/brand/logo.svg` file to avoid recreating the brand mark; a local copy can replace it later.

## Notes

- **Prototype only:** `robots` is `noindex,nofollow` to avoid competition with the live site's SEO pages.
- The booking modal is a visual prototype and does not submit data. Pricing links currently lead to the live iPhone repair page; these will be wired to the existing logic when integrated.
- AI-assisted product photography should not be treated as a verified teardown or a technical diagram.