# Preview deployment and migration notes

This is the user's uploaded static redesign in its original source form, with only deployment configuration and verification added.

## Vercel
- Import `askoldas/iLabRedesign`, root directory `./`.
- Framework: Other; `vercel.json` runs `node build.mjs` and publishes `dist`. No package installation required.
- Preview responses include `X-Robots-Tag: noindex, nofollow, noarchive` to prevent competing with production SEO.
- Do not point `ilab.lv` at this preview. The service/store backend is simulated.

## Migrating into existing Next.js app
- Keep original App Router routes and URLs, metadata/canonicals/hreflang/JSON-LD, price and product sources, authentication and order infrastructure.
- Extract shared visual components from `src/partials/` (`header`, `panels`, `booking-form`, `footer`, `bottombar`, `header-shop`).
- Convert `src/pages/` markup into page templates rather than duplicating content across 400+ models.
- Move stylesheet tokens, typography, grids and motion into Next.js shared styling.
- Replace static `assets/js/data.js` pricing/reviews and `assets/js/shop-data.js` catalog with live data sources.
- Replace mock booking, cart, checkout, login and order states with existing backend APIs; never treat localStorage or static demo checkout as production orders.
- Validate repair assertions, photos, opening hours, warranties and review counts before production.
- The generated device/model links currently route to representative example templates. Replace with real Next.js routes during integration.
