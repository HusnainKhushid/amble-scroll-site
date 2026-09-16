# Amble — Unhurried essentials

Warm editorial knitwear brand; scroll-frame sloth hero, then a generated Collection and Footer. Built for the Scroll Sites marketplace, iframe-ready.

- `npm run dev` / `npm run build` → `dist/` (`BASE=/repo-name/` for GitHub Pages)

## Live URLs
- Vercel (primary): https://amble-scroll-site.vercel.app
- GitHub Pages (mirror): https://husnainkhushid.github.io/amble-scroll-site/

Both deploy on push to `main`. Vercel uses the Vite preset with no config; the Pages workflow sets `BASE`.

## For the coding agent
Section resources live in the marketplace workspace under `02-sections/amble/`. Section ids: `00-nav 01-hero 02-collection 03-footer` (`data-section` attributes). The page posts `{ source:'scroll-site', type:'sections'|'section' }` to a parent frame and accepts `{ type:'scrollTo', id }`.
