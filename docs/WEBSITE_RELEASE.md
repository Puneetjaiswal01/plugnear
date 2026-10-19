# Public website release · 19 October 2026

- **URL:** https://www.plugnear.in/
- **Project:** plugnear-web (`prj_meecuEpYoXLlnlDD7GOIXaXAu8xe`)
- **Team:** existing approved team `team_1u7aw5W8QOE1jWcv6odxACAV`; no Claim360 project was changed.
- **Deployment:** `dpl_5ombHsMzjRMxQhjrjtLpUWrA9FpK`, production target, **READY**.
- **Source commit:** `9a5000e144f437dd8c4350ddb3d0058b825d3b3d`.
- **Build:** `npm run build:website` exports the Expo web app and builds the static landing site. Compiled files were uploaded by content hash to Vercel; no credentials or environment files were uploaded.

## Included

Approved smiling-plug logo; blue/lime/ivory visual identity; illustrative neighbourhood charging hero image; driver and host journeys; process, trust and FAQ sections; accessible navigation and privacy/website notices; social metadata, canonical URL, sitemap and robots directives.

The Expo web app remains at `/app/`. Find links select the driver journey and host links preserve host intent through sign-in. Early-access status is visible in the app and website. The dashboard and mobile source now also contain the approved logo; the admin preview has not been redeployed as part of this website release.

## Verification

- Mobile/admin TypeScript checks and admin build pass.
- 18 desktop/mobile browser tests pass: existing access tests plus public website assets/layout, FAQ disclosure, keyboard-dismissible privacy dialog, responsive navigation and app journey links.
- Deployed https://www.plugnear.in/ returns HTTP 200. Desktop and mobile browser checks found no broken images or JavaScript page errors; privacy dialog and `/app/?mode=host` navigation worked.
- https://plugnear.in redirects to https://www.plugnear.in/.
- HTTPS requests used the environment's trusted CA. Chromium tests pinned the known environment-proxy certificate key because its default browser trust store does not include the managed proxy CA.

This is a verified public marketing website release, not a completed charging-marketplace launch. Live database migration, full booking/payment verification, payment-provider onboarding and signed app-store builds remain outstanding. No live charger inventory, customers, testimonials or earnings claims were fabricated.
