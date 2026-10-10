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
- Type: Grenze Gotisch (blackletter, lowercase) for headings/wordmark, the user's stand-in for Duc De Berry. Montserrat for ALL information text, labels, prices and stats (user wants Gotham family; Gotham has no free web license, Montserrat is the stand-in, 900 = Gotham Black). Anton/Plus Jakarta/Space Mono removed.
- Hero: full-screen, the particle word 'archived' is fitted to the measured ink bounds of the `.hero-word` box (user wants it BIG). Tagline, intro copy and buttons live in the `.intro` section right under the hero, before the stats/chrome logo.
- Header: minimalist floating pill (cheat-sheet style #2): links left (work, websites, rates), wordmark centered, contact + 'start a project' CTA right. Hides on scroll down; under 860px it collapses to logo + CTA.
- Stats: 80M+ / 20K+ stacked on the left (max 46%). The chrome 3D logo (blackletter 'a', extruded in three.js from `fonts/grenze-a.ttf`, a 1.5KB subset of Grenze Gotisch 800) spins on the right and follows the cursor; hidden under 720px. Blender isn't available in the container, so the logo is built from the font at runtime.
- Flight: full-res images baked with a corner 'archived' signature + shader holographic tiled watermark with a sweeping gold/blue sheen. Textures load lazily (when `.proof` is within 600px, or on idle) so they don't compete with first paint.
- Rate card: the 'menu' version (commit 0fb33e4): header line, 3 numbered steps on a dashed line, three menu columns (game graphics, design, websites) with the $25 package flagged best value. Other versions (ruled steps, influencer poster sheet) were rejected; don't bring them back.
- Brand assets: favicon.ico + icons/ (yellow blackletter 'a' on an ink rounded square), site.webmanifest, icons/og-image.jpg (1200x630 share preview). Vercel Web Analytics is on (`/_vercel/insights/script.js`).
- Grid/lightbox images: `.frame` overlay with tiled watermark (canvas-generated `--wm`) + animated corner signature. Right-click disabled on images.
- Custom scrollbar (court-yellow thumb on ink).
- Footer: site/contact columns + policies accordion (DRAFT policies, need owner confirmation: payment, revisions (2 rounds), refunds, usage & credit, privacy).
- Rendering stops once `.archive` (solid paper) covers the canvas.
- Reduced motion: no Lenis, no flight section, static scene. No WebGL: `.no-webgl` gradient fallback.

## Content
- Prices (USD): thumbnail + icon package $25, thumbnail or icon alone $15 each, graphic designs $20 (no POTW/TOTW wording; clients send details), flyers $10, standard website $50 + $25/month, 3D website $70 + $25/month (upkeep is $25/month for either: hosting, updates, fixes), clothing design bundle $40, logo bundle $15. No social/video service (user removed it).
- Stats: 80M+ Roblox visits across games designed for, 20K+ YouTube views.
- Work sorted by size: 16:9 = Game thumbnails, 512x512 = Game icons, 4:5 = Posters. Files in `/work`, each with a full and a `-sm` version (webp).
- Websites section: add each new site as an `<li class="site">` in `#websites`.

## Open items
- Contact: business email archivedstudio.mke@gmail.com. Reply card posts to FormSubmit ajax (`CONTACT_EMAIL` in main.js) with `_autoresponse` (automatic confirmation email to the client) and shows an on-site 'message sent.' panel. Clients pick email or phone/text; autoresponse only goes out when they chose email. First real submission sends a one-time FormSubmit activation email that must be clicked. Notifications arrive from FormSubmit (submissions@formsubmit.co).
- Discord: japanesefriends. Instagram: @noticedyaa.
- Websites entry for this site uses a real screenshot (`work/site-archived-studio.webp`).
- Gmail (archivedstudio.mke@gmail.com): 'Archived Studio' signature is the default; filter from:(formsubmit.co) stars, labels 'Client requests' and never spams. Reply templates saved: 'Quote' (price + how it works), 'Payment' (total + [PAYMENT METHOD] placeholder, final files after payment), 'Files delivered' (final files + tag @noticedyaa). Insert via compose > More options > Templates.
- Testimonials (#6 on the header cheat sheet) deferred: owner is asking 'rel' first.
- Waiting on owner: click the FormSubmit activation email, confirm the draft policies, give a payment method for the payment template, optional custom domain.
- Live: https://archived-studio.vercel.app (Vercel project archived-studio, auto-deploys from GitHub main).
- Claude is connected to GitHub as arvchived and pushes directly to `main`; Vercel auto-deploys every push (~1 min). Images live in `work/`. Cache for /work is 1 day (not immutable) because filenames get reused when art is re-exported.

## How to add work
1. Export webp: full (max 1600px) and `-sm` (max 768px) into `/work`.
2. Add a `<li><button class="piece">…</button></li>` in the right grid with real alt text.
3. Optionally add it to `PIECES` in `main.js` to include it in the 3D flight.
