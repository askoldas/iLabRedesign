# iLab.lv redesign — HTML mockups

Static, production-grade HTML mockups of the ilab.lv redesign, built to be wired into the existing Next.js App Router site. Every page is assembled from shared partials that map one-to-one onto React components. Design rules live in [DESIGN.md](DESIGN.md) (version 2: dark technical direction set by the client's reference boards); positioning and copy rules in [.agents/product-marketing.md](.agents/product-marketing.md).

## Open the mockups

```bash
node build.mjs && python3 -m http.server 8765 --directory dist
```

Then open http://localhost:8765/. Pages are flat files named after the live slugs:

| Mockup | Live route it stands for | Template type |
|---|---|---|
| `index.html` | `/` | home |
| `ru/index.html` | `/ru` | home (RU) |
| `iphone-remonts.html` | `/iphone-remonts` (+ hubs `/telefonu-remonts`, `/plansetdatoru-remonts`, `/datoru-remonts`) | category hub with model finder |
| `telefonu-remonts-samsung.html` | `/telefonu-remonts/samsung` (+ every brand page) | brand listing, all models |
| `dyson-remonts.html` | `/dyson-remonts` (+ `/fotoaparatu-remonts`) | simple category |
| `iphone-remonts-ekrana-maina.html` | `/iphone-remonts/ekrana-maina` (+ every service page) | service page with per-model price browser |
| `iphone-remonts-iphone-12.html` | `/iphone-remonts/iphone-12` (+ ~420 model pages) | device model page with price table |
| `cenas.html` | `/cenas` | price list |
| `kontakti.html` | `/kontakti` | contacts |
| `pieraksties-remontam.html` | `/pieraksties-remontam` | booking |
| `buj.html` | `/buj` | FAQ hub |
| `par-mums.html` | `/par-mums` | about |
| `noteikumi.html` | `/noteikumi` | terms + privacy |

Links to routes that have no mockup point at the mockup of the same template type and carry `data-template-of="/live/route"` so the wiring is unambiguous.

Query switches for QA: `?motion=off` (final state, no animation), `?open=locator|contact|booking|menu` (opens a drawer on load), `?prices=fail` (price-table error state), `?booking=fail` (form error state), `?brand=samsung` (price browser tab).

## Folder structure

```
build.mjs                 assembles src/pages + src/partials + src/i18n.json → dist/
tools-shot.sh             headless Chromium screenshot helper (review only)
src/
  i18n.json               LV and RU strings for shared chrome ({{t:key}})
  partials/
    head.html             <head>, fonts, CSS, scan line + shutter elements
    header.html           sticky header, desktop nav with dropdowns
    logo.html             inline SVG logo (currentColor + signal dot)
    panels.html           scrim + 4 drawers: mobile menu, contact, locator, booking
    booking-form.html     the one form on the site (include with fid=<prefix>)
    branch-domina.html    branch block: status, hours, phone, links
    branch-spice.html
    bottombar.html        mobile sticky actions
    cookie.html           consent banner
    footer.html
    scripts.html          GSAP (vendored), data, ui, motion
  pages/                  one file per mockup; @meta lines set title, description, page, lang, alt
assets/
  css/tokens.css          design tokens (colour, type, spacing)
  css/base.css            reset, type roles, grid, motion pre-states
  css/components.css      buttons, header, drawers, forms, spec table, accordion, finder, reviews, process, footer
  css/pages.css           page-level layouts (hero, ladder, locations, price layout…)
  js/data.js              window.ILAB_DATA: branches, brands, iPhone/Samsung series, services, prices, reviews, FAQ (all extracted from the live site; stands in for Firestore `modelServices`)
  js/ui.js                behaviour: status, drawers, tabs, finder, price tables, booking form, consent, reviews
  js/motion.js            GSAP: entrance scan, scroll reveals, process track, drawers, page transitions
  js/vendor/              gsap.min.js, ScrollTrigger.min.js (3.15)
  img/                    logo, hero and category photos from the live site
dist/                     build output (open this)
```

## Page template

```html
<!-- @meta title: … -->
<!-- @meta description: … -->
<!-- @meta page: iphone -->            nav item to mark aria-current (iphone|phones|tablets|computers|dyson|cameras)
<!-- @meta lang: lv -->
<!-- @meta alt: ru/index.html -->      the other-language page, relative to root
<!-- @meta altlang: ru -->
<!-- @include partials/head.html -->
<!-- @include partials/header.html -->
<main id="main"> … </main>
<!-- @include partials/footer.html -->
<!-- @include partials/bottombar.html -->
<!-- @include partials/panels.html -->
<!-- @include partials/cookie.html -->
<!-- @include partials/scripts.html -->
```

Inner pages start `<main>` with a breadcrumb: `<nav class="container" aria-label="Breadcrumb"><ol class="crumbs"><li><a href="{{root}}index.html">Sākums</a></li><li>Current</li></ol></nav>` followed by a `.page-hero`.

`{{root}}` is the relative path to dist root ("" or "../"). `{{t:key}}` pulls from i18n.json for the page's lang.

## DOM contracts (what the JS looks for)

| Hook | Behaviour |
|---|---|
| `[data-open="booking|contact|locator|menu"]` (+ `data-branch`, `data-device`, `data-service`) | opens a drawer; booking pre-fills device and fault; contact selects the branch tab |
| `[data-close]` | closes the open drawer (also Escape and the scrim) |
| `[data-status="domina|spice"]`, `[data-status-dot=…]` | live open/closed text and dot from the hours table in ui.js (Europe/Riga) |
| `[data-tabs]` > `[data-tab=k]` / `[data-panel=k]` | tab set; add `data-tabs-from-query` to read `?brand=` |
| `[data-finder="#scope"]` > `input`, `[data-finder-clear]`; in scope: `[data-finder-group]` (details) > `[data-finder-item]`, `[data-finder-empty]` | live model filter |
| `[data-price-table="modelId" data-model-name="…"]` | renders that model's spec table from ILAB_DATA.prices (loading → table / error) |
| `[data-price-browser]` or `[data-price-browser="iphone"]` with children `[data-browser-tabs]`, `[data-browser-list]`, `[data-browser-title]`, `[data-browser-table]` | brand tabs → series accordions → model → table |
| `[data-price-filter="serviceId,serviceId"]` on an ancestor | limits rendered rows (service pages) |
| `[data-reviews="domina|spice"]` | 4 Google reviews for that branch, in the page language |
| `[data-count="826"]` | counts up once on scroll (real numbers only) |
| `[data-scan]`, `[data-scan="x"]` | entrance/scroll unmask (vertical / horizontal wipe with riding line) |
| `[data-rise]` (children = lines) | headline lines rise on entrance |
| `[data-stagger]` | children fade in staggered |
| `[data-rows]` | table rows / list items stagger when rendered |
| `[data-process]` with `.process__track > .process__seg` and `.process__step` | pinned step track on desktop |
| `a[href]` internal | scan-line page transition; add `data-no-transition` to opt out |
| `[data-consent="accepted|rejected"]` | cookie choice; analytics load only after accept |
| `[data-rail-current]`, `[data-rail-total]`, `[data-rail-marker]`, `[data-rail-ticks]` | rails: section counter from `main > section`, scroll-progress marker |

## Wiring notes for the Next.js site

- Partials → components: `header.html` → NavBar, `panels.html` → MobileDrawer, ContactPanel, LocatorPanel, BookingPanel, `booking-form.html` → BookingForm (same field names and `POST /api/booking`; replace the simulated submit in ui.js with `fetch`), `branch-*.html` → BranchCard, `footer.html` → Footer, `cookie.html` → CookieConsent (now gates GTM/GA4 too).
- `ILAB_DATA.prices[modelId]` has the same shape as Firestore `modelServices` rows (`service`, `price`, `time`); `services[serviceId].name` is the display label. Replace the 450 ms timeout in `renderTable` with the Firestore query and keep the three states.
- Motion: wrap `motion.js` in `useGSAP` with a `gsap.context` scoped to the page root; `ILAB_MOTION.drawerOpen/drawerClose/revealRows` are the only cross-component calls. The page transition becomes a route-change effect (same timeline, run on `router.push`).
- i18n: `src/i18n.json` holds the chrome strings for LV and RU; page copy is in the page files.
- Metadata: canonical, hreflang and JSON-LD are intentionally not in the mockups; keep them in the Next.js metadata layer. Fix the broken RU hreflang and `/ru/kontakti` redirect listed in the inventory.
- Fonts: Geologica (variable, `CRSV,SHRP,slnt,wght`) and IBM Plex Mono 400/500 from Google Fonts; self-host both via `next/font` in production.
- Rails and section corner marks are presentational; render them once in the root layout (desktop only, `aria-hidden`).
- Branch coordinates in the markup are geocoded from the street addresses (OpenStreetMap Nominatim, 2026-10-20): Domina 56.9664° N 24.1660° E, Spice Life 56.9313° N 24.0393° E. Replace with the Google place coordinates if the client has them.

## Rights and AI opt-out

`LICENSE` (repo) and `src/public/` (`LICENSE.txt`, `robots.txt`, `llms.txt`, `humans.txt`, copied to the dist root) state that the design and code are proprietary and not licensed for reproduction or as training material. Every page carries the same notice as an HTML comment, `<meta name="robots" content="noai, noimageai">`, a copyright meta and `rel="license"`/`rel="author"` links. In Next.js, keep the meta in the metadata layer and serve `src/public/*` from `public/`; merge `robots.txt` with the existing one.

## Copy decisions baked in

Warranty "līdz 1 gadam", founded 2013, branch "Spice Life" (the live site contradicts itself; see `.agents/product-marketing.md`). Every number shown is from the live site. No invented reviews, staff or certificates; missing photos are labelled placeholders.

## Shop (light theme)

The shop mockups live in `src/pages/shop/` and build to `dist/shop/`. They run `data-theme="light"` (see `assets/css/theme-light.css`), English chrome (`en` block in `src/i18n.json`), their own header, dock, footer and drawers (`partials/header-shop.html`, `dock-shop.html`, `footer-shop.html`, `panels-shop.html`) and the data in `assets/js/shop-data.js` (605 products, brands with series and models, part types, delivery settings, all extracted from the live shop). Behaviour is in `assets/js/shop.js`; it reuses the drawer system in `ui.js`.

| Mockup | Live route | Template |
|---|---|---|
| `shop/index.html` | `/shop` | home: hero, trust strip, device directory, part finder, catalogue |
| `shop/iphone.html` | `/shop/<brand>` | brand directory with model search and series groups |
| `shop/iphone-14.html` | `/shop/<brand>/<model>` | model listing with type chips |
| `shop/product.html?slug=…` | `/shop/product/<slug>` | product page rendered from data (default `display-for-iphone-16`) |
| `shop/checkout.html?state=auth|empty|form|done` | `/shop/checkout` | auth gate, empty cart, form, confirmation |
| `shop/account.html` | `/shop/account` | orders, invoices, profile |

The Veikals/Shop toggle in the header is "off" on the service site (links to the shop) and "on" inside the shop (links back to the service home).

Shop DOM contract (what `shop.js` looks for):

| Hook | Behaviour |
|---|---|
| `[data-cart-count]` | item count, "· N" when > 0 |
| `[data-open="cart"]` / drawer `cart` with `[data-cart-lines]`, `[data-cart-empty]`, `[data-cart-foot]`, `[data-cart-total]`, `[data-cart-status]`, `[data-cart-checkout]` | localStorage cart `ilab_shop_cart`, quantity ± limited by stock, remove, per-line validity, total, checkout disabled when invalid |
| `[data-add-to-cart="productId"]` (+ optional `[data-qty]` input nearby) | adds a line and opens the cart |
| `[data-open="search"]` / drawer `search` with `[data-search] input`, `[data-search-clear]`, `[data-search-models]`, `[data-search-results]`, `[data-search-count]`, `[data-search-more]`, `[data-search-inquiry]` | catalogue search by name, SKU or model; model suggestions; 30 results then "Show more"; empty state with inquiry |
| `[data-open="login"]` / drawer `login` with `form[data-login]`, `form[data-register]`, `[data-wholesale]`, `[data-company]`, `[data-company-fields]` | mock auth in localStorage `ilab_shop_user`; wholesale registration ends in the "awaiting approval" state; `[data-account-btn]` shows Login / My account |
| `[data-open="inquiry"]` with `data-source="brand|model|search|product"`, `data-product="id"`, `data-model="name"`, `data-brand="name"` | inquiry drawer with context rows, fields per source, honeypot, success state |
| `[data-finder-shop]` with `[data-combo="device"]`, `[data-combo="model"]`, `[data-finder-stage]`, `[data-type-tiles]`, `[data-clear-type]` | finder: keyboard comboboxes, tiles with available / selected / unavailable states, URL `?device&model&type` synced |
| `[data-catalog]` (`data-brand`, optional `data-model`, `data-type`) with `[data-catalog-title]`, `[data-catalog-count]`, `[data-catalog-grid]`, `[data-catalog-empty]`, `[data-catalog-more]`, `[data-catalog-end]` | catalogue grid, 48 per page, "Load more", type pill on a card filters by type |
| `[data-model-products="modelId"]` with `[data-type-chips]`, `[data-model-count]`, `[data-model-grid]`, `[data-model-empty]` | model page listing with type chips |
| `[data-model-search]` input + `[data-model-groups]` groups of `[data-model-item]`, `[data-model-search-empty]` | brand page model search |
| `[data-product-page]` (optional `data-product-page="slug"`; `?slug=` overrides) with `[data-product-gallery]`, `[data-product-crumb]`, `[data-product-title]`, `[data-product-sku]`, `[data-product-type]`, `[data-product-price]`, `[data-product-availability]`, `[data-product-buy]`, `[data-product-desc]`, `[data-product-compat]`, `[data-product-repair]` | product page rendered from data; gallery with arrows and dots |
| `form[data-checkout]` with `[data-checkout-state]` panels `auth|empty|form|done`, fulfilment and payment radios, `[data-summary-lines]`, `[data-summary-delivery]`, `[data-summary-total]`, `[data-place-order]` | checkout: login gate, delivery fees (courier €5.00, Omniva €2.93, pickup free), order summary, confirmation |
| `[data-account]` with `[data-account-orders]`, `[data-account-profile]`, `[data-logout]` | account from the mock user and localStorage orders `ilab_shop_orders` |
| `data-shop-price` formatting | `€900.00` (en-IE) |

Product images: 20 products have local photos (`assets/img/shop/products/`); the rest try the live Firebase URL and fall back to a "No image" placeholder.
