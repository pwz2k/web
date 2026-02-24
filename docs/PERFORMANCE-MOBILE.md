# Mobile performance (Lighthouse)

Quick reference for the main mobile audit items and what’s in place.

## Done in code

- **Cache for static assets**  
  `next.config.mjs` sets long cache for:
  - `/1.png` → `Cache-Control: public, max-age=31536000, immutable`
  - `/images/*` → same  
  This targets the “Use efficient cache lifetimes” suggestion (~323 KiB savings on repeat visits).

## Optional improvements

- **LCP / 1.png**  
  `public/1.png` is ~475 KiB and used as the full-screen background. To improve LCP and First Contentful Paint:
  - Compress it (e.g. TinyPNG, ImageOptim) or convert to WebP and serve with a PNG fallback.
  - Or use a smaller/placeholder image for initial paint and load the full asset after.

- **Render-blocking (CSS)**  
  The audit may report CSS chunks blocking the initial render (~300 ms). Next.js bundles and injects CSS; reducing or deferring it usually needs custom setup (e.g. critical CSS inlining). Keeping global CSS minimal helps.

- **Forced reflow**  
  If the audit reports forced reflows (e.g. from chunk `fd9d1056` or `9280`), they often come from layout reads (`offsetWidth`, `getBoundingClientRect`) right after DOM updates. Fixing them means finding those reads in app or library code and deferring (e.g. `requestAnimationFrame`) or batching.

## After deploy

Redeploy so the new cache headers are active. Re-run Lighthouse on mobile for `https://pyp6.com/` to confirm “efficient cache lifetimes” and any LCP improvement.
