# Public website release · 19 October 2026

- **URL:** https://www.plugnear.in/
- **Project:** plugnear-web (`prj_meecuEpYoXLlnlDD7GOIXaXAu8xe`)
- **Team:** existing approved team `team_1u7aw5W8QOE1jWcv6odxACAV`; no Claim360 project was changed.
- **Deployment:** `dpl_3Qi5qjg1rwC9xhSbkBVqS7UZeje4`, production target, **READY**.
- **Source commit:** `32ef83f2359c797c53b32235b62a94a5285b3cf4`.
- **Build:** `npm run build:website` exports the Expo web app and builds the static landing site. Compiled files were uploaded by content hash to Vercel; no credentials or environment files were uploaded.

## Included

Approved smiling-plug logo; blue/lime/ivory visual identity; illustrative neighbourhood charging hero image; driver and host journeys; process, trust and FAQ sections; accessible navigation and privacy/website notices; social metadata, canonical URL, sitemap and robots directives.

The Expo web app remains at `/app/`. Find links select the driver journey and host links preserve host intent through sign-in. Early-access status is visible in the app and website. The dashboard and mobile source now also contain the approved logo; the admin preview has not been redeployed as part of this website release.

## Verification

- Mobile/admin TypeScript checks and admin build pass.
- 24 desktop/mobile browser tests pass: existing access tests plus public website assets/layout, FAQ disclosure, keyboard-dismissible privacy dialog, responsive navigation and app journey links.
- Deployed https://www.plugnear.in/ returns HTTP 200. Desktop and mobile browser checks found no broken images or JavaScript page errors; privacy dialog and `/app/?mode=host` navigation worked.
- https://plugnear.in redirects to https://www.plugnear.in/.
- HTTPS requests used the environment's trusted CA. Chromium tests pinned the known environment-proxy certificate key because its default browser trust store does not include the managed proxy CA.

This is a verified public marketing website release, not a completed charging-marketplace launch. Live database migration, full booking/payment verification, payment-provider onboarding and signed app-store builds remain outstanding. No live charger inventory, customers, testimonials or earnings claims were fabricated.

## Strategy revision

The public site covers private cars, taxis, bikes and scooters, three-wheelers, vans and commercial EVs, and mixed fleets. Homes, shops, hotels, offices, parking operators and depots are included in host positioning. The hero combines car and scooter imagery.

`/fleet-pilot/` provides editable examples for bikes, three-wheelers, cars, taxis, vans and buses, with a locally downloaded planning brief. It does not submit an enquiry or book charging. Presets are illustrative; mixed fleets are planned one group at a time. Charging compatibility, electrical capacity and service availability require verification; vehicle categories do not establish universal support.

30 domain/PostgreSQL/planner tests and 24 desktop/mobile browser tests pass, alongside TypeScript checks and the website/Expo web export. The production deployment is READY. Deployed desktop and mobile checks verified all six audience sections, intact images, no horizontal overflow, four car/taxi/van/bus calculations, downloaded brief contents and no JavaScript page errors. No live Supabase schema was changed.

See [strategy](STRATEGY.md), [next-stage requirements](MICROHOST_REQUIREMENTS.md) and [revised roadmap](ROADMAP.md).

## Combined website revision

Merged the original neighbourhood identity, “Just around the corner” hero and simpler three-step journey with the newer all-EV coverage and fleet planning sections. Added prominent Find / Rent a Charger and List a Charger entry cards; retained both car and scooter imagery, approved branding, host onboarding and early-access disclosures.

Static website build and all 24 desktop/mobile browser tests pass. Production deployment READY. Live desktop (1440px) and mobile (390px) checks returned HTTP 200, verified both new journey cards route to app sign-in with the correct mode, and confirmed the fleet planner works. No broken images, horizontal overflow or JavaScript page errors were found. Booking/payment end-to-end verification remains pending; these checks verify the public site and early-access entry points.

## Unified platform revision

Homepage now leads with “Every EV. Every journey. One PlugNear.” A six-part platform overview connects charging discovery, charger hosting, fleet planning, destination businesses, societies/workplaces and depot operations. All sections remain on the same public website; each offering links to its relevant driver, host or fleet section. Availability labels distinguish the early-access prototype, functioning local planner and planned operations. No live-service claims, backend changes or Claim360 changes were introduced. Website build and all 24 desktop/mobile browser tests pass; production deployment READY.

## Simplified journeys and product previews

Consolidated overlapping journey, service and vehicle grids into three entry cards: drivers/riders, charging hosts and fleets/businesses. The hero retains the two primary actions and adds a dedicated business link. All vehicle and host audiences remain represented. Added clearly labelled illustrations of map filters, charger details and the request/confirmation journey; they are not live inventory or transactions. Removed obsolete grid CSS.

Static website build passed; all 24 browser tests passed, followed by 8 website checks after the final style adjustment. Reviewed the desktop screenshot. Production READY; deployed desktop/mobile checks verified HTTP 200, three cards, three previews, no overflow or broken images, working find/host sign-in routes, business anchor and fleet planner, with zero page errors. Full booking/payment end-to-end launch remains pending the backend migration, payment provider setup and verification documented in STATUS.md.

## Responsive release verification

Checked the deployed homepage at 320, 375, 390, 430, 768, 820, 1024, 1280, 1440 and 1920 CSS pixels. Every width returned HTTP 200 with no horizontal overflow, broken images, out-of-bounds headings/cards/actions or JavaScript page errors. Visually inspected full-page phone, tablet and desktop screenshots. At 320, 390 and 768px the mobile navigation opens and closes on selection. At 820 and 1440px desktop navigation does not overlap the logo or app action. FAQ disclosure, privacy dialog dismissal, fleet planner layout and taxi calculation passed at 320, 390, 768, 820 and 1440px. No website code changes or redeployment were needed. These are Chromium viewport checks; physical-device Safari/Android browser verification remains outstanding.

## Registration entry-point release

Updated `/app/` to the website-aligned mobile brand and provider-aware Google/email/phone registration UI. Production deployment READY. Live public Auth settings confirm only email is enabled; Google, Apple and phone are disabled pending setup. No provider secrets or environment files were uploaded. Local validation: 32 tests and 32 browser tests; native Android/iOS bundle exports and isolated prebuild passed. External Google/SMS authentication and real registrations were not exercised. See AUTHENTICATION_SETUP.md and STORE_UPLOAD.md.

Deployed registration controls were checked at 320, 390 and 1440px: HTTP 200, email signup form reachable, Google/phone correctly disabled with setup messages, no horizontal overflow or JavaScript errors. No live accounts or SMS requests were created.

## Business contacts · 20 October 2026

Added business enquiry mailto link `puneetjaiswal@zohomail.in` and contacts Puneet Jaiswal (`+91 96502 38165`) and Shani Kumar (`+91 82781 36027`) with tel links. The footer links to `/#contact`. Owner expressly supplied these details for public display. Eight local website browser tests passed after installing the missing Chromium executable. Production deployment READY; live checks at 320, 390 and 1440px verified HTTP 200, correct mailto/tel targets, contact navigation, no horizontal overflow and no JavaScript errors. GitHub main was pushed and verified separately; a successful push is not a Codex cloud-environment setup or automatic Vercel Git deployment integration.

## Recovery, support and live backend rollout · 20 October 2026

Web production `dpl_3Qi5qjg1rwC9xhSbkBVqS7UZeje4` READY. Admin production `dpl_HqPreUJi1VeziQb8YXh6auWLiUz7` READY at https://admin.plugnear.in, showing the login gate; no initial admin assignment was made. Public privacy, terms, support and email-based account-deletion initiation pages are deployed. Password-reset requests and recovery-session password replacement UI are implemented. SMTP delivery, real recovery links and native device flows still need verification; deletion requests require manual verification/processing and are not a deployed automatic deletion API.

38 browser tests, 32 unit/database/input tests, TypeScript, web/admin builds and latest native exports passed. GitHub CI on source `973849c41a1debee98b0bc5cc63bdfdd9031b8a3` passed: https://github.com/Puneetjaiswal01/plugnear/actions/runs/39390477645 . CI uses invalid public fixture keys and blocks unmocked backend network requests.

The owner-approved marketplace schema migration was applied and live RLS/grants/overlap constraints verified, including a rolled-back SQL reservation/overlap/admin-denial smoke test. Paid booking/payment end-to-end launch remains incomplete. Google/Apple/SMS provider setup, first-admin verification, merchant approval, signed builds and physical-device testing remain pending.

Live checks at 390 and 1440px confirmed all five public pages returned 200 without overflow, recovery/deletion controls were visible, and the admin login gate exposed no approval controls to anonymous users. No JavaScript page errors were observed. These checks did not send email or mutate accounts.

## Web-first PWA MVP · 20 October 2026

The latest production deployment is `dpl_3Qi5qjg1rwC9xhSbkBVqS7UZeje4`, READY. Source: `32ef83f2359c797c53b32235b62a94a5285b3cf4`. PWA at https://www.plugnear.in/app/ verified on mobile/desktop, including service worker and offline fallback. app.plugnear.in is attached but DNS remains pending. 41 unit/database/input tests and the full 44 browser tests passed; the clean-URL offline fix also passed 14 targeted tests with production-like redirects. Latest native exports passed; no signed store build exists.

PostGIS nearby search, indexed geography, realtime publication/revision updates, verified-host-only editing and guarded direct-UPI request/receipt/session lifecycle are applied to the dedicated backend. Live SQL smoke was rolled back; no real money was sent. No SMS provider is configured, phone auth is disabled, and real host/charger inventory is zero. See WEB_FIRST_MVP.md for manual-payment semantics, deployment-specific offline fix, deferred features and exact launch gates. Earlier gateway/pending-state notes above are historical; this release deliberately uses direct-to-host manual UPI rather than a verified payment gateway.
