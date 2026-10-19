# Public website release · 19 October 2026

- **URL:** https://www.plugnear.in/
- **Project:** plugnear-web (`prj_meecuEpYoXLlnlDD7GOIXaXAu8xe`)
- **Team:** existing approved team `team_1u7aw5W8QOE1jWcv6odxACAV`; no Claim360 project was changed.
- **Deployment:** `dpl_BekQLzNVjepWVW1eekuFWUHzSMoS`, production target, **READY**.
- **Source commit:** `35f694f43df31fa469cd89fd6e57e48e9e178d77`.
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
