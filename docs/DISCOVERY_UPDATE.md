# Discovery and driver guidance update · 2 November 2026

## Delivered

- Homepage discovery entry: native HTML form selects a connector and opens the email-authenticated app with that preference. Unsupported connector query values fall back to All; the selected filter is not vehicle approval. Existing Find, List, host cost guide, fleet planning and enquiry journeys remain.
- App: nearest, lowest listed rate and highest advertised power sorting; Available now only; map and list share the refined set. Hiding a selected item also hides its request panel. Changes refine a maximum of 50 returned listings, not a national/network-wide comparison. Current availability remains host/booking state, not telemetry or a guarantee of a future slot.
- Selected charger: connector, power, rate and address appear with the pilot verification scope. No fabricated community score.
- Public charging guide: connector checks, site access, status provenance, distance limits, charging-time caveats, estimated costs, direct UPI/manual receipt, support and honest community-feature roadmap. Canonical URL, sitemap entry and homepage links included.
- Reference decisions and deferred features documented in [COMPETITOR_RESEARCH.md](COMPETITOR_RESEARCH.md). No competitor data, images, reviews, network access or copyrighted copy was imported.

## Verification

TypeScript checks and 56 unit/database tests passed. Full desktop/mobile browser suite: **82 passed**. Web build and Android/iOS bundle exports succeeded; exports are not signed native builds or store submissions. Screenshots visually reviewed for the discovery section at mobile and desktop sizes; page overflow checks passed at widths 320, 390 and 1440.

Production browser checks: **10 passed** on the public website, covering the connector entry, guide, fixture-backed app filters and map/list selection, Dubai partnership enquiry/app gate and Dubai fleet exports. Backend requests were denied or explicitly mocked by test fixtures; these are not real account, bank, charger-hardware or physical session acceptance tests.

## Deployment

Dedicated `plugnear-web` project `prj_meecuEpYoXLlnlDD7GOIXaXAu8xe`, existing authorised team only. Production deployment `dpl_EfUmyCX8UNbA3527ZTPRcEyzfAgS` reports **READY**, aliases including www.plugnear.in, app.plugnear.in and plugnear.in. Implementation commit `9f05694090b4f441765aa2ea3e713abe47f936bf`. Static Vercel build completed in 65 ms after local Expo/static export; inspected build events show successful completion. Runtime telemetry/drains were not audited; this is not a claim of complete production monitoring.

Public links: [Homepage](https://www.plugnear.in/), [Charging guide](https://www.plugnear.in/charging-guide/), [App](https://app.plugnear.in/app/), [Dubai partnerships](https://www.plugnear.in/dubai/).

The deployment also publishes the previously pending Dubai preparation. Dubai enquiries/planning are available; UAE bookings, listing and payment UI remain on hold. This is not server-side country isolation: the backend still needs the market/currency work in [DUBAI_LAUNCH.md](DUBAI_LAUNCH.md) before UAE operational inventory can be approved.

GitHub's first run failed at browser dependency installation because ubuntu-latest selected Ubuntu 26.04, unsupported by pinned Playwright 1.58.2. A follow-up pins the CI runner to Ubuntu 24.04 (`e0650e6`); final run status is recorded below when known. No dependency downgrade, credentials, schema, merchant integration, admin roles or Claim360 resources were changed.

Final CI result: [Validate PlugNear run 41401850015](https://github.com/Puneetjaiswal01/plugnear/actions/runs/41401850015) completed **successfully** for `e0650e6cc6c0ecc2eaf22d3f407bf86ed3e4a953`, including browser tests. Direct HTTPS checks returned 200 for homepage, charging guide, sitemap, app entry (redirects to /app/) and Dubai page; the sitemap includes the charging guide. Native signed builds/store releases and real charging/payment acceptance remain outside this result.
