# Archived Studio: project notes

Read this first at the start of any session on this repo.

## What this is
Portfolio for Archived Studio (formerly VANTA): game graphics for Roblox games (mainly RH2: The Journey) plus the 3D websites the studio builds. Static site, no build step, deployed on Vercel from GitHub (`arvchived/archived-studio`, Vercel team `archived-studio`).

## Stack
- Plain `index.html`, `styles.css`, `main.js` (ES modules).
- Three.js 0.169, GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, all loaded from jsDelivr via the import map in `index.html`.
- If you change the import map, recompute its sha256 and update the CSP in `vercel.json`, or the scripts will be blocked.

## Design system
- Colors: ink `#0C1322`, ink-2 `#16203A`, paper `#E8EBF1`, court yellow `#FFC53D`, volt blue `#3D5CFF`, slate `#8B94A7`.
- Type (user likes blackletter like Duc De Berry, set lowercase): Grenze Gotisch for headings/wordmark (all lowercase), Anton for stats and prices, Plus Jakarta Sans body, Space Mono for small lowercase labels and running headers.
- One bold moment: the fixed WebGL canvas. Particles spell ARCHIVED → scatter on scroll → chrome torus knot appears beside the stats → camera flies through 8 work cards. Everything else stays quiet.
- Rendering stops once `.archive` (solid paper) covers the canvas.
- Reduced motion: no Lenis, no flight section, static scene. No WebGL: `.no-webgl` gradient fallback.

## Content
- Prices (USD): thumbnail + icon package $25, thumbnail or icon alone $15 each, graphic designs (posters, POTW, TOTW) $20, flyers $10, website $70 + $25/month (hosting, upkeep, updates), clothing design bundle $40, logo bundle $15. No social/video service (user removed it).
- Stats: 80M+ Roblox visits across games designed for, 20K+ YouTube views.
- Work sorted by size: 16:9 = Game thumbnails, 512x512 = Game icons, 4:5 = Posters. Files in `/work`, each with a full and a `-sm` version (webp).
- Websites section: add each new site as an `<li class="site">` in `#websites`.

## Open items
- Contact: reply card form posts to FormSubmit (`CONTACT_EMAIL` at top of main.js). Email is still a placeholder (user making a business Gmail). First real submission sends a one-time activation email.
- Discord: japanesefriends. Instagram: @noticdyaa.
- Websites entry for this site has a drawn mock; swap in a real screenshot later.

## How to add work
1. Export webp: full (max 1600px) and `-sm` (max 768px) into `/work`.
2. Add a `<li><button class="piece">…</button></li>` in the right grid with real alt text.
3. Optionally add it to `PIECES` in `main.js` to include it in the 3D flight.
