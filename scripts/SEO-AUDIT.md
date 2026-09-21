# Technical SEO audit — 2026-09-21

Hosting: GitHub Pages, main branch root; public domain https://rugby2027.ru.
Independent Russian-language fan project, not the official World Rugby website.

## URL policy

Canonical root: `/`. Flat pages use extensionless URLs; their `.html` equivalents
remain reachable with the same canonical and are not listed separately in sitemap.
Directory route `/match-center/` stays the promoted entry point. Its stable generic
title identifies the section; description and SportsEvent identify the current match.
The existing `/match-center/toulouse-bordeaux/` is a one-hop legacy redirect to the
entry point, not a historical event archive. It is excluded from sitemap.
`/contacts`, `/contacts.html`, `/shop` are previously removed pages, returning real
404 responses. Do not redirect unrelated removed pages to the homepage.
Historical `dist` artifacts are retained in Git but excluded from Pages publication;
`/dist/index.html` now returns 404. There is no evidence establishing all historical
backlinks or indexed URLs: those require Search Console / Yandex Webmaster access.

## Sitemap: 34 canonical URLs

`/`, `/about`, `/schedule`, `/participants`, `/stadiums`, `/streams`, `/match-center/`,
`/history`, `/partners`, `/tickets`; and the 24 team pages:
`/argentina`, `/australia`, `/canada`, `/chile`, `/england`, `/fiji`, `/france`,
`/georgia`, `/hong-kong`, `/ireland`, `/italy`, `/japan`, `/new-zealand`, `/portugal`,
`/romania`, `/samoa`, `/scotland`, `/south-africa`, `/spain`, `/tonga`, `/uruguay`,
`/usa`, `/wales`, `/zimbabwe`.

Unfinished `/news` is retained with noindex,follow. Custom 404 also has noindex.
Menu/support fragments are excluded from sitemap and disallowed in robots.

## Implemented

- Unique titles/descriptions, canonical, Russian language, Open Graph, favicon.
- WebSite on homepage, BreadcrumbList on sections/teams, factual SportsEvent.
- Static HTML menu/footer and support; JavaScript only enhances interaction.
- Skip link, visible keyboard focus, Escape-to-close menu and reduced motion.
- Image dimensions, lazy loading of participant flags, preserved SVG quality.
- Font discovery in HTML instead of CSS import, preconnect, display=swap.
- Hidden expired countdown fix; narrow-screen text and lineup readability.
- Complete local build, without publishing old generated copies or source scripts.

No suitable raster social-preview image exists in the repository; do not use invented
logos or unsupported SVG flag previews as og:image. No extra libraries were added.

## Verification and limits

- Local 34-page metadata/link/ID/JSON checks passed; build and JS syntax passed.
- After deployment all 34 canonical URLs returned HTTP 200 with correct canonical.
- robots.txt and sitemap.xml returned 200; removed routes and arbitrary missing URL 404.
- Desktop live browser: home, schedule, participants, Australia, match center; no
  horizontal page overflow at 1363 CSS pixels. Flag loaded; support disclosed the
  correct card; skip link received visible keyboard focus; expired numbers hidden.
- Video source and player permissions, all lineups and Balance URLs unchanged.
- Partner destination returned 200. LNR and official ticket article returned 200.
  `rwc2027.rugbyworldcup.com` returned 403 to automated HTTP checking: retained, not
  declared broken. VK frame failed to play in the cloud browser before and after
  changes; actual playback and Russian-network access remain unverified.
- Mobile CSS reviewed and improved, but the available browser exposed no viewport
  resizing control; full device emulation and real-phone QA remain unverified.
- Search engine indexing, ranking, rich results and social cache refresh cannot be
  guaranteed by source changes. No search-engine account/domain settings changed.

## Maintenance

Run `npm run seo:sync`, `npm test`, `npm run build`, publish, then `npm run check:live`.
Update the explicit SportsEvent record in seo_sync.py when changing the current
match; its guard refuses a mismatched title/date rather than publishing stale data.
Keep match facts in agreement with the visible page; never manufacture an event
archive from the current rotating entry page. Add only substantive pages to sitemap.
Submit sitemap.xml and inspect canonical selection in Yandex Webmaster and Google
Search Console using the owner's verified accounts. Do not mass-remove valid .html
URLs: consolidation is by canonical, sitemap and internal links, not robots blocks.
